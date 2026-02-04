/**
 * Refund Transfer Center Routes
 * Transparency around refund-related services
 * 
 * CRITICAL DISCLAIMERS:
 * - "Processed through partner financial institutions"
 * - No language implying Ross Tax & Bookkeeping holds funds
 * - Clear fee disclosures upfront
 */

import { Router } from 'itty-router';
import { D1Database } from '@cloudflare/workers-types';
import { hasPermission, createAuditLogEntry, logAccessAttempt } from '../utils/iam';

export function createRefundTransferRouter(db: D1Database) {
  const router = Router({ base: '/api/refund-transfer' });

  /**
   * GET /api/refund-transfer/status/:returnId
   * Refund transfer status tracking (read-only for clients)
   * Permission: client:view_refund_status
   */
  router.get('/status/:returnId', async (req: any, env: any) => {
    try {
      const { returnId } = req.params;
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'client';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const canView = await hasPermission(db, userId, userType, 'client:view_refund_status');
      
      if (!canView) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify ownership (clients can only view their own returns)
      const taxReturn = await db
        .prepare('SELECT client_id FROM tax_returns WHERE return_id = ? LIMIT 1')
        .bind(returnId)
        .first();

      if (!taxReturn || (userType === 'client' && taxReturn.client_id !== userId)) {
        return new Response(JSON.stringify({ error: 'Return not found or access denied' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get refund transfer details
      const transfer = await db
        .prepare(
          `SELECT transfer_id, status, amount, fee, partner_bank, expected_date, irs_acknowledgment_date, created_at, updated_at
           FROM refund_transfers
           WHERE return_id = ?
           ORDER BY created_at DESC
           LIMIT 1`
        )
        .bind(returnId)
        .first();

      if (!transfer) {
        return new Response(
          JSON.stringify({
            message: 'No refund transfer initiated for this return',
            disclaimers: {
              notABank: 'Ross Tax & Bookkeeping is not a bank.',
              partnerProcessed: 'Refund transfers are processed through partner financial institutions.',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Get timeline/history
      const timeline = await db
        .prepare(
          `SELECT event_id, event_type, description, created_at
           FROM transfer_timeline
           WHERE transfer_id = ?
           ORDER BY created_at ASC`
        )
        .bind(transfer.transfer_id)
        .all();

      return new Response(
        JSON.stringify({
          transfer: {
            transferId: transfer.transfer_id,
            status: transfer.status,
            statusDescription: getStatusDescription(transfer.status),
            amount: transfer.amount,
            fee: transfer.fee,
            netAmount: parseFloat(transfer.amount) - parseFloat(transfer.fee),
            partnerBank: transfer.partner_bank,
            expectedDate: transfer.expected_date,
            irsAcknowledgmentDate: transfer.irs_acknowledgment_date,
            timeline: timeline.results || [],
          },
          disclaimers: {
            notABank: 'Ross Tax & Bookkeeping is not a bank.',
            partnerProcessed: 'Refund transfers are processed through partner financial institutions.',
            fundsNotHeld: 'Funds are not held by Ross Tax & Bookkeeping.',
            estimatesOnly: 'Expected timelines are estimates and subject to IRS processing.',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('GET /status/:returnId error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * POST /api/refund-transfer/request
   * Submit refund transfer request (internal staff only)
   * Permission: preparer:submit_refund_transfer
   */
  router.post('/request', async (req: any, env: any) => {
    try {
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'staff';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Only staff can submit refund transfer requests
      const canSubmit = await hasPermission(db, userId, userType, 'preparer:submit_refund_transfer');
      
      if (!canSubmit) {
        return new Response(JSON.stringify({ error: 'Access denied. Only staff can submit refund transfers.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { returnId, amount, fee, partnerBank, clientConsent } = await req.json();

      // Validate required fields
      if (!returnId || !amount || !fee || !partnerBank || !clientConsent) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: returnId, amount, fee, partnerBank, clientConsent' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Verify return exists
      const taxReturn = await db
        .prepare('SELECT return_id, client_id FROM tax_returns WHERE return_id = ? LIMIT 1')
        .bind(returnId)
        .first();

      if (!taxReturn) {
        return new Response(JSON.stringify({ error: 'Return not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check for existing transfer
      const existingTransfer = await db
        .prepare('SELECT transfer_id FROM refund_transfers WHERE return_id = ? LIMIT 1')
        .bind(returnId)
        .first();

      if (existingTransfer) {
        return new Response(
          JSON.stringify({ error: 'Refund transfer already exists for this return' }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create transfer record
      const transferId = `rt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db
        .prepare(
          `INSERT INTO refund_transfers (transfer_id, return_id, amount, fee, partner_bank, status, submitted_by, client_consent)
           VALUES (?, ?, ?, ?, ?, 'pending_supervisor_approval', ?, ?)`
        )
        .bind(transferId, returnId, amount, fee, partnerBank, userId, clientConsent ? 1 : 0)
        .run();

      // Add timeline event
      await db
        .prepare(
          `INSERT INTO transfer_timeline (event_id, transfer_id, event_type, description)
           VALUES (?, ?, 'submitted', 'Refund transfer request submitted by preparer')`
        )
        .bind(`evt-${Date.now()}`, transferId)
        .run();

      // Log audit trail
      const auditEntry = createAuditLogEntry(
        userId,
        userType,
        'refund_transfer:submit',
        'refund_transfer',
        'success',
        {
          resourceId: transferId,
          entity: 'refund_transfer',
          entityId: transferId,
          details: `Submitted refund transfer for return ${returnId}`,
        }
      );
      await logAccessAttempt(db, auditEntry);

      return new Response(
        JSON.stringify({
          success: true,
          transferId,
          status: 'pending_supervisor_approval',
          message: 'Refund transfer submitted for supervisor approval',
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('POST /request error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * POST /api/refund-transfer/approve/:transferId
   * Approve refund transfer (supervisor only)
   * Permission: supervisor:approve_refund_transfer
   * Enforces Segregation of Duties (SoD) - submitter cannot approve
   */
  router.post('/approve/:transferId', async (req: any, env: any) => {
    try {
      const { transferId } = req.params;
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'staff';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const canApprove = await hasPermission(db, userId, userType, 'supervisor:approve_refund_transfer');
      
      if (!canApprove) {
        return new Response(JSON.stringify({ error: 'Access denied. Only supervisors can approve.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get transfer details
      const transfer = await db
        .prepare('SELECT transfer_id, submitted_by, status FROM refund_transfers WHERE transfer_id = ? LIMIT 1')
        .bind(transferId)
        .first();

      if (!transfer) {
        return new Response(JSON.stringify({ error: 'Transfer not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Enforce SoD: submitter cannot approve
      if (transfer.submitted_by === userId) {
        return new Response(
          JSON.stringify({ error: 'Segregation of Duties violation: You cannot approve your own submission' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (transfer.status !== 'pending_supervisor_approval') {
        return new Response(
          JSON.stringify({ error: `Cannot approve transfer in status: ${transfer.status}` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const { notes } = await req.json();

      // Update transfer status
      await db
        .prepare(
          `UPDATE refund_transfers
           SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, approval_notes = ?
           WHERE transfer_id = ?`
        )
        .bind(userId, notes || null, transferId)
        .run();

      // Add timeline event
      await db
        .prepare(
          `INSERT INTO transfer_timeline (event_id, transfer_id, event_type, description)
           VALUES (?, ?, 'approved', 'Approved by supervisor')`
        )
        .bind(`evt-${Date.now()}`, transferId)
        .run();

      // Log audit trail
      const auditEntry = createAuditLogEntry(
        userId,
        userType,
        'refund_transfer:approve',
        'refund_transfer',
        'success',
        {
          resourceId: transferId,
          entity: 'refund_transfer',
          entityId: transferId,
          details: `Approved refund transfer`,
        }
      );
      await logAccessAttempt(db, auditEntry);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Refund transfer approved',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('POST /approve/:transferId error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * GET /api/refund-transfer/fee-disclosure
   * Get fee disclosures for refund transfer products
   * Public endpoint (no auth required)
   */
  router.get('/fee-disclosure', async (req: any, env: any) => {
    try {
      // Get current fee schedule
      const feeSchedule = await db
        .prepare(
          `SELECT product_name, fee_amount, description, effective_date
           FROM refund_transfer_fees
           WHERE is_active = 1
           ORDER BY product_name`
        )
        .all();

      return new Response(
        JSON.stringify({
          feeSchedule: feeSchedule.results || [],
          disclaimers: {
            notABank: 'Ross Tax & Bookkeeping is not a bank.',
            partnerProcessed: 'Refund transfers are processed through partner financial institutions.',
            feesSubjectToChange: 'Fees are subject to change. Fees disclosed at time of service are locked in.',
            noHiddenFees: 'All fees are disclosed upfront. No hidden charges.',
          },
          effectiveDate: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('GET /fee-disclosure error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  return router;
}

/**
 * Helper: Get human-readable status description
 */
function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    'pending_supervisor_approval': 'Awaiting internal approval',
    'approved': 'Approved - awaiting IRS acceptance',
    'submitted_to_partner': 'Submitted to partner financial institution',
    'irs_accepted': 'IRS accepted return',
    'funds_released': 'Funds released by IRS',
    'completed': 'Refund transfer completed',
    'rejected': 'Rejected - see notes',
    'cancelled': 'Cancelled',
  };
  return descriptions[status] || 'Status unknown';
}

export default { createRefundTransferRouter };
