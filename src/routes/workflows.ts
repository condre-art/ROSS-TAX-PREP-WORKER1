/**
 * Workflow Router - Assigns workflows to Admin Hub, ERO Hub, and Client Portal
 * Integrates D1 Database and R2 Bucket bindings
 */

import { Router } from 'itty-router';
import { v4 as uuid } from 'uuid';
import { encryptPII, decryptPII } from '../utils/encryption';
import { logAudit } from '../utils/audit';

const workflowRouter = Router({ base: '/api/workflows' });

// ============================================================================
// ADMIN HUB WORKFLOWS
// ============================================================================

// GET /api/workflows/admin/dashboard - Admin dashboard stats
workflowRouter.get('/admin/dashboard', async (req: any, env: any) => {
  try {
    // User stats
    const userStats = await env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM staff) as total_staff,
        (SELECT COUNT(*) FROM clients WHERE created_at >= datetime('now', '-30 days')) as new_clients_30d,
        (SELECT COUNT(*) FROM staff WHERE created_at >= datetime('now', '-30 days')) as new_staff_30d
    `).first();
    
    // Return stats
    const returnStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_returns,
        SUM(CASE WHEN status = 'filed' THEN 1 ELSE 0 END) as filed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
      FROM returns
      WHERE tax_year = ?
    `).bind(new Date().getFullYear()).first();
    
    // E-file stats
    const efileStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_transmissions,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM efile_transmissions
      WHERE created_at >= datetime('now', '-30 days')
    `).first();
    
    // Revenue stats (mock - integrate with payment system)
    const revenueStats = await env.DB.prepare(`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as transaction_count
      FROM payments
      WHERE status = 'completed'
        AND created_at >= datetime('now', '-30 days')
    `).first();
    
    // AI Support stats
    const aiStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(DISTINCT session_id) as unique_sessions,
        AVG(confidence) as avg_confidence
      FROM ai_chat_analytics
      WHERE created_at >= datetime('now', '-7 days')
    `).first();
    
    return new Response(JSON.stringify({
      users: userStats,
      returns: returnStats,
      efile: efileStats,
      revenue: revenueStats,
      ai_support: aiStats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch dashboard stats' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// GET /api/workflows/admin/users - List all users (clients + staff)
workflowRouter.get('/admin/users', async (req: any, env: any) => {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get('role'); // 'client' or 'staff'
    const search = url.searchParams.get('search');
    
    let clients = [];
    let staff = [];
    
    if (!role || role === 'client') {
      let clientQuery = 'SELECT id, name, email, phone, created_at FROM clients';
      const params: any[] = [];
      
      if (search) {
        clientQuery += ' WHERE name LIKE ? OR email LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      clientQuery += ' ORDER BY created_at DESC LIMIT 100';
      
      const clientResults = await env.DB.prepare(clientQuery).bind(...params).all();
      clients = clientResults.results;
    }
    
    if (!role || role === 'staff') {
      let staffQuery = 'SELECT id, name, email, role, created_at FROM staff';
      const params: any[] = [];
      
      if (search) {
        staffQuery += ' WHERE name LIKE ? OR email LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      staffQuery += ' ORDER BY created_at DESC LIMIT 100';
      
      const staffResults = await env.DB.prepare(staffQuery).bind(...params).all();
      staff = staffResults.results;
    }
    
    return new Response(JSON.stringify({
      clients,
      staff
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('List users error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// POST /api/workflows/admin/broadcast - Send broadcast message to all users
workflowRouter.post('/admin/broadcast', async (req: any, env: any) => {
  try {
    const { subject, message, recipients } = await req.json(); // recipients: 'all', 'clients', 'staff'
    
    let emails: string[] = [];
    
    if (recipients === 'all' || recipients === 'clients') {
      const clients = await env.DB.prepare('SELECT email FROM clients').all();
      emails.push(...clients.results.map((c: any) => c.email));
    }
    
    if (recipients === 'all' || recipients === 'staff') {
      const staff = await env.DB.prepare('SELECT email FROM staff').all();
      emails.push(...staff.results.map((s: any) => s.email));
    }
    
    // Send broadcast (batch email via MailChannels)
    const broadcastId = uuid();
    
    // Store broadcast record
    await env.DB.prepare(`
      INSERT INTO admin_broadcasts (id, subject, message, recipients, sent_count, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(broadcastId, subject, message, recipients, emails.length).run();
    
    // Send emails (in production, batch this)
    for (const email of emails) {
      try {
        await fetch('https://api.mailchannels.net/tx/v1/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email }],
              dkim_domain: 'rosstaxprepandbookkeeping.com',
              dkim_selector: 'mailchannels',
              dkim_private_key: env.DKIM_PRIVATE_KEY
            }],
            from: {
              email: 'admin@rosstaxprepandbookkeeping.com',
              name: 'Ross Tax Prep Admin'
            },
            subject,
            content: [{
              type: 'text/html',
              value: `<div style="font-family: Arial, sans-serif;">${message}</div>`
            }]
          })
        });
      } catch (emailError) {
        console.error(`Failed to send to ${email}:`, emailError);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      broadcast_id: broadcastId,
      sent_count: emails.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Broadcast error:', error);
    return new Response(JSON.stringify({ error: 'Broadcast failed' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// ============================================================================
// ERO HUB WORKFLOWS
// ============================================================================

// GET /api/workflows/ero/assigned-returns - Get returns assigned to ERO
workflowRouter.get('/ero/assigned-returns', async (req: any, env: any) => {
  try {
    const url = new URL(req.url);
    const eroId = url.searchParams.get('ero_id');
    
    if (!eroId) {
      return new Response(JSON.stringify({ error: 'ERO ID required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const returns = await env.DB.prepare(`
      SELECT 
        r.*,
        c.name as client_name,
        c.email as client_email,
        e.status as efile_status,
        e.ack_code,
        e.updated_at as efile_updated_at
      FROM returns r
      JOIN clients c ON r.client_id = c.id
      LEFT JOIN efile_transmissions e ON e.return_id = r.id
      WHERE r.assigned_ero_id = ?
      ORDER BY r.updated_at DESC
      LIMIT 50
    `).bind(eroId).all();
    
    return new Response(JSON.stringify(returns.results), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Get assigned returns error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch returns' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// POST /api/workflows/ero/assign-return - Assign return to ERO
workflowRouter.post('/ero/assign-return', async (req: any, env: any) => {
  try {
    const { return_id, ero_id } = await req.json();
    
    await env.DB.prepare(`
      UPDATE returns 
      SET assigned_ero_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(ero_id, return_id).run();
    
    // Log audit
    await logAudit(env, {
      action: 'assign_return',
      entity: 'return',
      entity_id: return_id.toString(),
      user_id: ero_id,
      details: JSON.stringify({ ero_id })
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Assign return error:', error);
    return new Response(JSON.stringify({ error: 'Failed to assign return' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// ============================================================================
// CLIENT PORTAL WORKFLOWS
// ============================================================================

// GET /api/workflows/client/documents - Get client documents from R2
workflowRouter.get('/client/documents', async (req: any, env: any) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    
    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Client ID required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // Get document metadata from D1
    const documents = await env.DB.prepare(`
      SELECT id, filename, content_type, key, uploaded_at
      FROM documents
      WHERE client_id = ?
      ORDER BY uploaded_at DESC
    `).bind(clientId).all();
    
    // Add presigned URLs for R2 access
    const docsWithUrls = await Promise.all(
      documents.results.map(async (doc: any) => {
        try {
          const object = await env.DOCUMENTS_BUCKET.get(doc.key);
          return {
            ...doc,
            size: object?.size || 0,
            download_url: `/api/workflows/client/documents/${doc.id}/download`
          };
        } catch (e) {
          return {
            ...doc,
            size: 0,
            download_url: null,
            error: 'File not accessible'
          };
        }
      })
    );
    
    return new Response(JSON.stringify(docsWithUrls), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Get documents error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch documents' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// POST /api/workflows/client/upload-document - Upload document to R2
workflowRouter.post('/client/upload-document', async (req: any, env: any) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('client_id') as string;
    const returnId = formData.get('return_id') as string | null;
    
    if (!file || !clientId) {
      return new Response(JSON.stringify({ error: 'File and client ID required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const documentId = uuid();
    const key = `clients/${clientId}/${documentId}-${file.name}`;
    
    // Upload to R2
    await env.DOCUMENTS_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    });
    
    // Store metadata in D1
    await env.DB.prepare(`
      INSERT INTO documents (id, client_id, return_id, key, filename, content_type, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(documentId, clientId, returnId, key, file.name, file.type).run();
    
    // Log audit
    await logAudit(env, {
      action: 'upload_document',
      entity: 'document',
      entity_id: documentId,
      user_id: parseInt(clientId),
      details: JSON.stringify({ filename: file.name, size: file.size })
    });
    
    return new Response(JSON.stringify({
      success: true,
      document_id: documentId,
      filename: file.name
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Upload document error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// GET /api/workflows/client/documents/:id/download - Download document from R2
workflowRouter.get('/client/documents/:id/download', async (req: any, env: any) => {
  try {
    const { id } = req.params;
    
    // Get document metadata
    const doc = await env.DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(id).first();
    
    if (!doc) {
      return new Response('Document not found', { status: 404 });
    }
    
    // Get from R2
    const object = await env.DOCUMENTS_BUCKET.get(doc.key);
    
    if (!object) {
      return new Response('File not found in storage', { status: 404 });
    }
    
    // Return file stream
    return new Response(object.body, {
      headers: {
        'Content-Type': doc.content_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${doc.filename}"`
      }
    });
    
  } catch (error: any) {
    console.error('Download document error:', error);
    return new Response('Download failed', { status: 500 });
  }
});

// GET /api/workflows/client/returns - Get client returns
workflowRouter.get('/client/returns', async (req: any, env: any) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    
    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Client ID required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const returns = await env.DB.prepare(`
      SELECT 
        r.*,
        e.status as efile_status,
        e.ack_code,
        e.irs_refund_status,
        e.refund_amount,
        e.refund_disbursed_at,
        s.name as preparer_name
      FROM returns r
      LEFT JOIN efile_transmissions e ON e.return_id = r.id
      LEFT JOIN staff s ON s.id = r.assigned_ero_id
      WHERE r.client_id = ?
      ORDER BY r.tax_year DESC
    `).bind(clientId).all();
    
    return new Response(JSON.stringify(returns.results), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Get client returns error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch returns' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// ============================================================================
// INTAKE FORM ROUTING
// ============================================================================

// POST /api/workflows/intake - Submit intake form (routes to info@rosstaxandbookkeeping.com)
workflowRouter.post('/intake', async (req: any, env: any) => {
  try {
    const intakeData = await req.json();
    
    const intakeId = uuid();
    
    // Store encrypted intake data in D1
    const encryptedData = await encryptPII(JSON.stringify(intakeData), env);
    
    await env.DB.prepare(`
      INSERT INTO intake_forms (
        id, client_name, client_email, client_phone, 
        encrypted_data, source, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      intakeId,
      intakeData.name,
      intakeData.email,
      intakeData.phone || null,
      encryptedData,
      intakeData.source || 'web',
      'pending'
    ).run();
    
    // Route to info@rosstaxandbookkeeping.com
    try {
      await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: 'info@rosstaxprepandbookkeeping.com', name: 'Intake Team' }],
            dkim_domain: 'rosstaxprepandbookkeeping.com',
            dkim_selector: 'mailchannels',
            dkim_private_key: env.DKIM_PRIVATE_KEY
          }],
          from: {
            email: 'intake@rosstaxprepandbookkeeping.com',
            name: 'Intake System'
          },
          subject: `📋 New Intake Form - ${intakeData.name}`,
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">📋 New Intake Form Submission</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #1f2937;">Client Information</h2>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${intakeData.name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${intakeData.email}">${intakeData.email}</a></p>
                    ${intakeData.phone ? `<p><strong>Phone:</strong> ${intakeData.phone}</p>` : ''}
                    ${intakeData.service ? `<p><strong>Service Requested:</strong> ${intakeData.service}</p>` : ''}
                    ${intakeData.message ? `<p><strong>Message:</strong><br/>${intakeData.message}</p>` : ''}
                    <p><strong>Intake ID:</strong> ${intakeId}</p>
                  </div>
                  
                  <a href="https://app.rosstaxprepandbookkeeping.com/admin/intakes/${intakeId}" 
                     style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    View Full Intake Form
                  </a>
                </div>
              </div>
            `
          }]
        })
      });
    } catch (emailError) {
      console.error('Failed to send intake notification:', emailError);
    }
    
    // Log audit
    await logAudit(env, {
      action: 'intake_submitted',
      entity: 'intake',
      entity_id: intakeId,
      user_email: intakeData.email
    });
    
    return new Response(JSON.stringify({
      success: true,
      intake_id: intakeId,
      message: 'Intake form submitted successfully. Our team will contact you within 24 hours.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Intake submission error:', error);
    return new Response(JSON.stringify({ error: 'Intake submission failed' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

export default workflowRouter;
