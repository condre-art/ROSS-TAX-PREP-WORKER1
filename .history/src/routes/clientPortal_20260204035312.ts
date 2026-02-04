/**
 * Client Portal Routes - Central access hub for clients
 * Self-service dashboard, documents, messaging, status tracking
 * 
 * CRITICAL: "Ross Tax & Bookkeeping is not a bank"
 * Funds are facilitated, not held. Compliance-first design.
 */

import { Router } from 'itty-router';
import { D1Database } from '@cloudflare/workers-types';
import { hasPermission, createAuditLogEntry, logAccessAttempt } from '../utils/iam';

export function createClientPortalRouter(db: D1Database) {
  const router = Router({ base: '/api/portal' });

  /**
   * GET /api/portal/dashboard
   * Client dashboard overview - status, alerts, next steps
   * Permission: client:view_dashboard (self-service)
   */
  router.get('/dashboard', async (req: any, env: any) => {
    try {
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'client';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Clients can only view their own dashboard
      const canView = await hasPermission(db, userId, userType, 'client:view_dashboard');
      
      if (!canView) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get client profile
      const client = await db
        .prepare('SELECT id, name, email, phone FROM clients WHERE id = ? LIMIT 1')
        .bind(userId)
        .first();

      if (!client) {
        return new Response(JSON.stringify({ error: 'Client not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get active returns
      const activeReturns = await db
        .prepare(
          `SELECT return_id, tax_year, status, filing_status, created_at, updated_at
           FROM tax_returns
           WHERE client_id = ?
           AND status NOT IN ('archived', 'withdrawn')
           ORDER BY tax_year DESC, created_at DESC
           LIMIT 5`
        )
        .bind(userId)
        .all();

      // Get pending tasks/actions
      const pendingTasks = await db
        .prepare(
          `SELECT task_id, task_type, description, due_date, created_at
           FROM client_tasks
           WHERE client_id = ?
           AND status = 'pending'
           ORDER BY due_date ASC
           LIMIT 10`
        )
        .bind(userId)
        .all();

      // Get recent notifications
      const notifications = await db
        .prepare(
          `SELECT notification_id, type, message, created_at, is_read
           FROM client_notifications
           WHERE client_id = ?
           ORDER BY created_at DESC
           LIMIT 5`
        )
        .bind(userId)
        .all();

      // Get refund transfer status (if applicable)
      const refundStatus = await db
        .prepare(
          `SELECT rt.transfer_id, rt.status, rt.amount, rt.fee, rt.partner_bank, rt.updated_at
           FROM refund_transfers rt
           JOIN tax_returns tr ON rt.return_id = tr.return_id
           WHERE tr.client_id = ?
           AND rt.status NOT IN ('completed', 'cancelled')
           ORDER BY rt.created_at DESC
           LIMIT 1`
        )
        .bind(userId)
        .first();

      return new Response(
        JSON.stringify({
          client: {
            id: client.id,
            name: client.name,
            email: client.email,
          },
          activeReturns: activeReturns.results || [],
          pendingTasks: pendingTasks.results || [],
          notifications: notifications.results || [],
          refundStatus: refundStatus || null,
          disclaimers: {
            notABank: 'Ross Tax & Bookkeeping is not a bank. Refund transfers and advances are offered through third-party financial institutions.',
            fundsNotHeld: 'Funds are not held by Ross Tax & Bookkeeping.',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('GET /dashboard error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * GET /api/portal/documents
   * Client document center - upload & download
   * Permission: client:view_documents
   */
  router.get('/documents', async (req: any, env: any) => {
    try {
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'client';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const canView = await hasPermission(db, userId, userType, 'client:view_documents');
      
      if (!canView) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get all documents for client
      const documents = await db
        .prepare(
          `SELECT doc_id, doc_type, filename, file_size, uploaded_at, uploaded_by, status
           FROM client_documents
           WHERE client_id = ?
           ORDER BY uploaded_at DESC`
        )
        .bind(userId)
        .all();

      return new Response(
        JSON.stringify({
          documents: documents.results || [],
          uploadInstructions: {
            maxFileSize: '25MB',
            allowedTypes: ['PDF', 'JPG', 'PNG', 'DOC', 'DOCX', 'XLS', 'XLSX'],
            uploadEndpoint: '/api/portal/documents/upload',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('GET /documents error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * POST /api/portal/documents/upload
   * Upload client document
   * Permission: client:upload_documents
   */
  router.post('/documents/upload', async (req: any, env: any) => {
    try {
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'client';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const canUpload = await hasPermission(db, userId, userType, 'client:upload_documents');
      
      if (!canUpload) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { docType, filename, fileSize, fileContent } = await req.json();

      // Validate file size (25MB limit)
      if (fileSize > 25 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: 'File size exceeds 25MB limit' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Generate document ID
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store in R2 (if available) or database
      // For now, store metadata in database
      await db
        .prepare(
          `INSERT INTO client_documents (doc_id, client_id, doc_type, filename, file_size, uploaded_by, status)
           VALUES (?, ?, ?, ?, ?, ?, 'pending_review')`
        )
        .bind(docId, userId, docType, filename, fileSize, userId)
        .run();

      // Log audit trail
      const auditEntry = createAuditLogEntry(
        userId,
        userType,
        'document:upload',
        'document',
        'success',
        {
          resourceId: docId,
          entity: 'document',
          entityId: docId,
        }
      );
      await logAccessAttempt(db, auditEntry);

      return new Response(
        JSON.stringify({
          success: true,
          docId,
          message: 'Document uploaded successfully. Pending staff review.',
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('POST /documents/upload error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * GET /api/portal/messages
   * Secure client messaging center
   * Permission: client:view_messages
   */
  router.get('/messages', async (req: any, env: any) => {
    try {
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'client';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const canView = await hasPermission(db, userId, userType, 'client:view_messages');
      
      if (!canView) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get message threads
      const threads = await db
        .prepare(
          `SELECT t.thread_id, t.subject, t.status, t.created_at, t.updated_at,
                  (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.thread_id AND m.is_read = 0 AND m.sender_id != ?) as unread_count,
                  (SELECT m.message_text FROM messages m WHERE m.thread_id = t.thread_id ORDER BY m.created_at DESC LIMIT 1) as last_message
           FROM message_threads t
           WHERE t.client_id = ?
           ORDER BY t.updated_at DESC`
        )
        .bind(userId, userId)
        .all();

      return new Response(
        JSON.stringify({
          threads: threads.results || [],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('GET /messages error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * POST /api/portal/messages
   * Send secure message to staff
   * Permission: client:send_messages
   */
  router.post('/messages', async (req: any, env: any) => {
    try {
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'client';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const canSend = await hasPermission(db, userId, userType, 'client:send_messages');
      
      if (!canSend) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { subject, message, threadId } = await req.json();

      if (!message || message.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Message cannot be empty' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      let finalThreadId = threadId;

      // Create new thread if none provided
      if (!threadId) {
        finalThreadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db
          .prepare(
            `INSERT INTO message_threads (thread_id, client_id, subject, status)
             VALUES (?, ?, ?, 'active')`
          )
          .bind(finalThreadId, userId, subject || 'New Message')
          .run();
      }

      // Insert message
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db
        .prepare(
          `INSERT INTO messages (message_id, thread_id, sender_id, sender_type, message_text)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(messageId, finalThreadId, userId, 'client', message)
        .run();

      // Update thread timestamp
      await db
        .prepare(
          `UPDATE message_threads SET updated_at = CURRENT_TIMESTAMP WHERE thread_id = ?`
        )
        .bind(finalThreadId)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          threadId: finalThreadId,
          messageId,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('POST /messages error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * GET /api/portal/activity
   * Client activity history & audit trail
   * Permission: client:view_activity
   */
  router.get('/activity', async (req: any, env: any) => {
    try {
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'client';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const canView = await hasPermission(db, userId, userType, 'client:view_activity');
      
      if (!canView) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get activity history (last 90 days)
      const activities = await db
        .prepare(
          `SELECT activity_id, activity_type, description, created_at
           FROM client_activity_log
           WHERE client_id = ?
           AND created_at > datetime('now', '-90 days')
           ORDER BY created_at DESC
           LIMIT 100`
        )
        .bind(userId)
        .all();

      return new Response(
        JSON.stringify({
          activities: activities.results || [],
          retentionPolicy: 'Activity history is retained for 7 years for compliance purposes.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('GET /activity error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  return router;
}

export default { createClientPortalRouter };
