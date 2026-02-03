/**
 * Invoice Management Routes
 * Admin-only endpoints for creating, viewing, sending, and managing invoices
 */

import { Router } from 'itty-router';
import { v4 as uuid } from 'uuid';
import { logAudit } from '../utils/audit';

const router = Router();

interface Invoice {
  id: string;
  admin_id: number;
  client_id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string;
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  sent_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

/**
 * GET /api/admin/invoices
 * List all invoices with filtering and pagination
 */
router.get('/invoices', async (req: any, env: any) => {
  try {
    // Verify auth
    const user = req.user; // Injected by middleware
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const clientId = url.searchParams.get('client_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let sql = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (clientId) {
      sql += ' AND client_id = ?';
      params.push(clientId);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await env.DB.prepare(sql).bind(...params).all();

    // Parse items JSON for each invoice
    const invoices = (result.results || []).map((inv: any) => ({
      ...inv,
      items: inv.items_json ? JSON.parse(inv.items_json) : []
    }));

    // Log access
    await logAudit(env, {
      action: 'invoices_list',
      entity: 'invoice',
      user_id: user.id,
      user_role: user.role,
      user_email: user.email,
      details: JSON.stringify({ status, clientId, count: invoices.length })
    }, req);

    return new Response(JSON.stringify({
      invoices,
      total: result.results.length,
      limit,
      offset
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error listing invoices:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * GET /api/admin/invoices/:id
 * Get single invoice detail
 */
router.get('/invoices/:id', async (req: any, env: any) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const invoiceId = req.params.id;

    const invoice = await env.DB.prepare(
      'SELECT * FROM invoices WHERE id = ?'
    ).bind(invoiceId).first();

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 });
    }

    // Parse items
    const items = invoice.items_json ? JSON.parse(invoice.items_json) : [];

    // Log access
    await logAudit(env, {
      action: 'invoice_view',
      entity: 'invoice',
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email
    }, req);

    return new Response(JSON.stringify({ ...invoice, items }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error getting invoice:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * POST /api/admin/invoices
 * Create new invoice
 */
router.post('/invoices', async (req: any, env: any) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403 });
    }

    const body = await req.json();
    const {
      client_id,
      issue_date,
      due_date,
      items,
      tax_rate = 0,
      notes = ''
    } = body;

    // Validate
    if (!client_id || !issue_date || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);
    const taxAmount = subtotal * (tax_rate / 100);
    const total = subtotal + taxAmount;

    // Generate invoice number
    const datePrefix = new Date(issue_date).toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const invoiceNumber = `INV-${datePrefix}-${randomSuffix}`;

    const id = uuid();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO invoices (
        id, admin_id, client_id, invoice_number, issue_date, due_date,
        items_json, subtotal, tax_rate, tax_amount, total, notes,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, user.id, client_id, invoiceNumber, issue_date, due_date,
      JSON.stringify(items), subtotal, tax_rate, taxAmount, total, notes,
      'draft', now, now
    ).run();

    // Log creation
    await logAudit(env, {
      action: 'invoice_create',
      entity: 'invoice',
      entity_id: id,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email,
      details: JSON.stringify({ invoiceNumber, total, clientId: client_id })
    }, req);

    return new Response(JSON.stringify({
      id,
      invoice_number: invoiceNumber,
      total,
      status: 'draft'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * PATCH /api/admin/invoices/:id
 * Update invoice (draft only)
 */
router.patch('/invoices/:id', async (req: any, env: any) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403 });
    }

    const invoiceId = req.params.id;
    const body = await req.json();

    // Check if draft
    const invoice = await env.DB.prepare(
      'SELECT status FROM invoices WHERE id = ?'
    ).bind(invoiceId).first();

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 });
    }

    if (invoice.status !== 'draft') {
      return new Response(JSON.stringify({ error: 'Can only edit draft invoices' }), { status: 400 });
    }

    // Update
    const updates = [];
    const params = [];

    if (body.items) {
      const subtotal = body.items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);
      const taxAmount = subtotal * ((body.tax_rate || 0) / 100);
      const total = subtotal + taxAmount;

      updates.push('items_json = ?, subtotal = ?, tax_amount = ?, total = ?');
      params.push(JSON.stringify(body.items), subtotal, taxAmount, total);
    }

    if (body.tax_rate !== undefined) {
      if (!body.items) {
        updates.push('tax_rate = ?');
        params.push(body.tax_rate);
      }
    }

    if (body.due_date) {
      updates.push('due_date = ?');
      params.push(body.due_date);
    }

    if (body.notes) {
      updates.push('notes = ?');
      params.push(body.notes);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(invoiceId);

    await env.DB.prepare(`
      UPDATE invoices SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    // Log
    await logAudit(env, {
      action: 'invoice_update',
      entity: 'invoice',
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email
    }, req);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * POST /api/admin/invoices/:id/send
 * Send invoice to client via email
 */
router.post('/invoices/:id/send', async (req: any, env: any) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403 });
    }

    const invoiceId = req.params.id;

    // Get invoice
    const invoice = await env.DB.prepare(
      'SELECT i.*, c.email as client_email, c.name as client_name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = ?'
    ).bind(invoiceId).first();

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 });
    }

    if (!invoice.client_email) {
      return new Response(JSON.stringify({ error: 'Client email not found' }), { status: 400 });
    }

    // Parse items
    const items = invoice.items_json ? JSON.parse(invoice.items_json) : [];

    // Build invoice PDF content (simplified - would use library in production)
    const invoiceHtml = `
      <h1>Invoice ${invoice.invoice_number}</h1>
      <p>Due: ${invoice.due_date}</p>
      <table border="1">
        <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        ${items.map((item: any) => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>$${item.unit_price.toFixed(2)}</td>
            <td>$${item.line_total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
      <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
      <p>Tax (${invoice.tax_rate}%): $${invoice.tax_amount.toFixed(2)}</p>
      <h2>Total: $${invoice.total.toFixed(2)}</h2>
      ${invoice.notes ? `<p>Notes: ${invoice.notes}</p>` : ''}
    `;

    // Send via MailChannels
    const emailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: invoice.client_email, name: invoice.client_name }],
            dkim_domain: 'rosstaxprepandbookkeeping.com'
          }
        ],
        from: {
          email: 'invoices@rosstaxprepandbookkeeping.com',
          name: 'Ross Tax Prep - Invoicing'
        },
        subject: `Invoice ${invoice.invoice_number} from Ross Tax Prep`,
        html: invoiceHtml
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    // Update status
    const now = new Date().toISOString();
    await env.DB.prepare(
      'UPDATE invoices SET status = ?, sent_at = ?, updated_at = ? WHERE id = ?'
    ).bind('sent', now, now, invoiceId).run();

    // Log
    await logAudit(env, {
      action: 'invoice_send',
      entity: 'invoice',
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email,
      details: JSON.stringify({ clientEmail: invoice.client_email })
    }, req);

    return new Response(JSON.stringify({ success: true, sent_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * POST /api/admin/invoices/:id/mark-paid
 * Mark invoice as paid
 */
router.post('/invoices/:id/mark-paid', async (req: any, env: any) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403 });
    }

    const invoiceId = req.params.id;
    const now = new Date().toISOString();

    await env.DB.prepare(
      'UPDATE invoices SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?'
    ).bind('paid', now, now, invoiceId).run();

    // Log
    await logAudit(env, {
      action: 'invoice_paid',
      entity: 'invoice',
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email
    }, req);

    return new Response(JSON.stringify({ success: true, paid_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error marking invoice paid:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * DELETE /api/admin/invoices/:id
 * Soft delete invoice (cancel)
 */
router.delete('/invoices/:id', async (req: any, env: any) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403 });
    }

    const invoiceId = req.params.id;

    await env.DB.prepare(
      'UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?'
    ).bind('cancelled', new Date().toISOString(), invoiceId).run();

    // Log
    await logAudit(env, {
      action: 'invoice_delete',
      entity: 'invoice',
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email
    }, req);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

export default router;
