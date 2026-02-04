/**
 * IRS.gov Integration - Refund & Amended Return Tracking
 * 
 * This module provides redirect links and tracking integration for:
 * - Where's My Refund (WMR) - IRS.gov/refunds
 * - Where's My Amended Return (WMAR) - IRS.gov/amended
 * 
 * Features:
 * - Direct IRS.gov redirect with pre-filled data
 * - Internal tracking of refund status updates
 * - Client portal integration for status checks
 * - Automated status syncing (when available)
 */

import { logAudit } from './utils/audit';

/**
 * IRS "Where's My Refund" Tool
 * Official URL: https://www.irs.gov/refunds
 * 
 * Required Info for WMR:
 * - SSN (or ITIN)
 * - Filing Status (Single, MFJ, MFS, HOH, QW)
 * - Exact Refund Amount (from return)
 */
export interface WMRParameters {
  ssn: string;           // Social Security Number (last 4 digits for security)
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'hoh' | 'widow';
  refundAmount: number;  // Exact refund amount from return
  taxYear: number;       // e.g., 2024
}

/**
 * IRS "Where's My Amended Return" Tool
 * Official URL: https://www.irs.gov/filing/wheres-my-amended-return
 * 
 * Required Info for WMAR:
 * - SSN (or ITIN)
 * - Date of Birth
 * - ZIP Code from amended return
 */
export interface WMARParameters {
  ssn: string;       // Social Security Number
  dob: string;       // Date of Birth (YYYY-MM-DD)
  zipCode: string;   // ZIP code from amended return
  taxYear: number;   // Tax year of amended return
}

/**
 * Generate IRS.gov "Where's My Refund" redirect URL
 * Note: IRS.gov WMR tool does not accept URL parameters, so this is informational
 * Clients must manually enter their info on IRS.gov
 */
export function getWhereIsMyRefundUrl(params: WMRParameters): string {
  // IRS.gov WMR tool URL (no query parameters accepted)
  const baseUrl = 'https://www.irs.gov/refunds';
  
  // Return base URL with instructions
  // In production, show a modal with pre-filled info before redirecting
  return baseUrl;
}

/**
 * Generate IRS.gov "Where's My Amended Return" redirect URL
 * Note: Similar to WMR, WMAR does not accept URL parameters
 */
export function getWhereIsMyAmendedReturnUrl(params: WMARParameters): string {
  const baseUrl = 'https://www.irs.gov/filing/wheres-my-amended-return';
  return baseUrl;
}

/**
 * Check IRS.gov Refund Status (via screen scraping or API if available)
 * 
 * Note: IRS does not provide a public API for WMR data.
 * This function simulates checking status internally from our database
 * which can be updated manually or via IRS A2A acknowledgments
 */
export async function checkRefundStatus(
  env: any,
  clientId: string,
  taxYear: number
): Promise<RefundStatus | null> {
  try {
    // Query our database for refund tracking
    const refund = await env.DB.prepare(`
      SELECT 
        t.id,
        t.irs_refund_status,
        t.refund_method,
        t.refund_amount,
        t.refund_disbursed_at,
        t.refund_trace_id,
        t.refund_notes,
        t.dcn,
        t.status,
        r.tax_year,
        r.form_type
      FROM efile_transmissions t
      JOIN returns r ON t.return_id = r.id
      WHERE t.client_id = ? 
        AND r.tax_year = ?
        AND r.is_amended = 0
        AND t.status = 'accepted'
      ORDER BY t.created_at DESC
      LIMIT 1
    `).bind(clientId, taxYear).first();

    if (!refund) {
      return null;
    }

    return {
      transmissionId: refund.id,
      taxYear: refund.tax_year,
      formType: refund.form_type,
      status: mapIrsRefundStatus(refund.irs_refund_status),
      statusDescription: getRefundStatusDescription(refund.irs_refund_status),
      refundAmount: refund.refund_amount,
      refundMethod: refund.refund_method,
      disbursedAt: refund.refund_disbursed_at,
      dcn: refund.dcn,
      traceId: refund.refund_trace_id,
      notes: refund.refund_notes,
      irsToolUrl: 'https://www.irs.gov/refunds'
    };
  } catch (error) {
    console.error('Error checking refund status:', error);
    return null;
  }
}

/**
 * Check Amended Return Status
 */
export async function checkAmendedReturnStatus(
  env: any,
  clientId: string,
  taxYear: number
): Promise<AmendedReturnStatus | null> {
  try {
    const amended = await env.DB.prepare(`
      SELECT 
        t.id,
        t.status,
        t.ack_code,
        t.ack_message,
        t.dcn,
        t.created_at,
        t.updated_at,
        r.tax_year,
        r.form_type,
        r.original_return_id
      FROM efile_transmissions t
      JOIN returns r ON t.return_id = r.id
      WHERE t.client_id = ? 
        AND r.tax_year = ?
        AND r.is_amended = 1
      ORDER BY t.created_at DESC
      LIMIT 1
    `).bind(clientId, taxYear).first();

    if (!amended) {
      return null;
    }

    return {
      transmissionId: amended.id,
      taxYear: amended.tax_year,
      formType: amended.form_type,
      status: mapAmendedReturnStatus(amended.status),
      statusDescription: getAmendedReturnStatusDescription(amended.status),
      dcn: amended.dcn,
      ackCode: amended.ack_code,
      submittedAt: amended.created_at,
      lastUpdated: amended.updated_at,
      irsToolUrl: 'https://www.irs.gov/filing/wheres-my-amended-return',
      estimatedProcessingTime: '16 weeks' // IRS standard processing time
    };
  } catch (error) {
    console.error('Error checking amended return status:', error);
    return null;
  }
}

/**
 * Update Refund Status (Manual or via IRS sync)
 */
export async function updateRefundStatus(
  env: any,
  transmissionId: string,
  statusUpdate: {
    irs_refund_status?: string;
    refund_method?: string;
    refund_amount?: number;
    refund_disbursed_at?: string;
    refund_trace_id?: string;
    refund_notes?: string;
  }
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];

  if (statusUpdate.irs_refund_status) {
    updates.push('irs_refund_status = ?');
    params.push(statusUpdate.irs_refund_status);
  }
  if (statusUpdate.refund_method) {
    updates.push('refund_method = ?');
    params.push(statusUpdate.refund_method);
  }
  if (statusUpdate.refund_amount !== undefined) {
    updates.push('refund_amount = ?');
    params.push(statusUpdate.refund_amount);
  }
  if (statusUpdate.refund_disbursed_at) {
    updates.push('refund_disbursed_at = ?');
    params.push(statusUpdate.refund_disbursed_at);
  }
  if (statusUpdate.refund_trace_id) {
    updates.push('refund_trace_id = ?');
    params.push(statusUpdate.refund_trace_id);
  }
  if (statusUpdate.refund_notes) {
    updates.push('refund_notes = ?');
    params.push(statusUpdate.refund_notes);
  }

  if (updates.length === 0) return;

  updates.push("updated_at = datetime('now')");
  params.push(transmissionId);

  await env.DB.prepare(
    `UPDATE efile_transmissions SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...params).run();

  await logAudit(env, {
    action: 'refund_status_updated',
    resource_type: 'efile_transmission',
    resource_id: transmissionId,
    details: statusUpdate
  });
}

// ============================================================================
// TYPES
// ============================================================================

export interface RefundStatus {
  transmissionId: string;
  taxYear: number;
  formType: string;
  status: 'pending' | 'approved' | 'sent' | 'disbursed' | 'rejected';
  statusDescription: string;
  refundAmount?: number;
  refundMethod?: string;
  disbursedAt?: string;
  dcn?: string;
  traceId?: string;
  notes?: string;
  irsToolUrl: string;
}

export interface AmendedReturnStatus {
  transmissionId: string;
  taxYear: number;
  formType: string;
  status: 'received' | 'adjusted' | 'completed' | 'rejected';
  statusDescription: string;
  dcn?: string;
  ackCode?: string;
  submittedAt: string;
  lastUpdated: string;
  irsToolUrl: string;
  estimatedProcessingTime: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapIrsRefundStatus(status: string | null): RefundStatus['status'] {
  if (!status) return 'pending';
  
  const normalized = status.toLowerCase();
  
  if (normalized.includes('disbursed') || normalized.includes('deposited')) {
    return 'disbursed';
  }
  if (normalized.includes('sent') || normalized.includes('mailed')) {
    return 'sent';
  }
  if (normalized.includes('approved')) {
    return 'approved';
  }
  if (normalized.includes('rejected') || normalized.includes('denied')) {
    return 'rejected';
  }
  
  return 'pending';
}

function getRefundStatusDescription(status: string | null): string {
  if (!status) return 'Your refund is being processed by the IRS.';
  
  const normalized = status.toLowerCase();
  
  if (normalized.includes('disbursed') || normalized.includes('deposited')) {
    return 'Your refund has been deposited into your bank account.';
  }
  if (normalized.includes('sent') || normalized.includes('mailed')) {
    return 'Your refund check has been mailed to your address on file.';
  }
  if (normalized.includes('approved')) {
    return 'Your refund has been approved and will be sent soon.';
  }
  if (normalized.includes('rejected') || normalized.includes('denied')) {
    return 'There was an issue with your refund. Please contact the IRS.';
  }
  
  return status;
}

function mapAmendedReturnStatus(status: string | null): AmendedReturnStatus['status'] {
  if (!status) return 'received';
  
  const normalized = status.toLowerCase();
  
  if (normalized.includes('completed') || normalized.includes('processed')) {
    return 'completed';
  }
  if (normalized.includes('adjusted') || normalized.includes('processing')) {
    return 'adjusted';
  }
  if (normalized.includes('rejected') || normalized.includes('denied')) {
    return 'rejected';
  }
  
  return 'received';
}

function getAmendedReturnStatusDescription(status: string | null): string {
  if (!status) return 'Your amended return has been received by the IRS.';
  
  const normalized = status.toLowerCase();
  
  if (normalized.includes('completed')) {
    return 'Your amended return has been processed. Any refund or balance due has been resolved.';
  }
  if (normalized.includes('adjusted')) {
    return 'Your amended return is being adjusted by the IRS. Processing typically takes up to 16 weeks.';
  }
  if (normalized.includes('rejected')) {
    return 'Your amended return was rejected. Please review and resubmit.';
  }
  
  return 'Your amended return is being processed. This can take up to 16 weeks.';
}

/**
 * Format SSN for display (last 4 digits only)
 */
export function formatSSNforDisplay(ssn: string): string {
  if (ssn.length < 4) return '***';
  return `***-**-${ssn.slice(-4)}`;
}

/**
 * Validate filing status
 */
export function isValidFilingStatus(status: string): boolean {
  const validStatuses = ['single', 'married_joint', 'married_separate', 'hoh', 'widow'];
  return validStatuses.includes(status);
}

/**
 * Format refund amount for display
 */
export function formatRefundAmount(amount: number | null | undefined): string {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
