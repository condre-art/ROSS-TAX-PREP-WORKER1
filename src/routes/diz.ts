// @ts-ignore - itty-router is a JS dependency
import { Router } from 'itty-router';
import { requireAuth } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const dizRouter = Router();

// GET /api/diz/returns - List all returns for the authenticated client
// List all returns for the authenticated client
dizRouter.get('/returns', async (req: Request, env: any) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  const { results } = await env.DB.prepare(
    `SELECT * FROM returns WHERE client_id = ? ORDER BY updated_at DESC LIMIT 20`
  ).bind(user.id).all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
});

// POST /api/diz/returns - Create a new return (DIY onboarding)
// Create a new return (DIY onboarding)
dizRouter.post('/returns', async (req: Request, env: any) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  const body = (await req.json()) as { tax_year: string };
  const tax_year = body.tax_year;
  const result = await env.DB.prepare(
    `INSERT INTO returns (client_id, tax_year, status, updated_at) VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)`
  ).bind(user.id, tax_year).run();
  await logAudit(env, { action: 'diz_return_create', entity: 'returns', entity_id: result.lastRowId, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true, id: result.lastRowId }), { headers: { 'Content-Type': 'application/json' } });
});

// POST /api/diz/returns/:id/upload - Upload document for a return
// Upload document for a return
dizRouter.post('/returns/:id/upload', async (req: Request & { params?: any }, env: any) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  // TODO: Handle file upload (R2 or similar)
  // For now, just log
  await logAudit(env, { action: 'diz_upload', entity: 'returns', entity_id: req.params?.id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});

// POST /api/diz/returns/:id/esign - Mark e-signature as complete
// Mark e-signature as complete
dizRouter.post('/returns/:id/esign', async (req: Request & { params?: any }, env: any) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  await env.DB.prepare(
    `UPDATE returns SET status = 'signed', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).run();
  await logAudit(env, { action: 'diz_esign', entity: 'returns', entity_id: req.params?.id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});

// POST /api/diz/returns/:id/payment - Mark payment as complete
// Mark payment as complete
dizRouter.post('/returns/:id/payment', async (req: Request & { params?: any }, env: any) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  await env.DB.prepare(
    `UPDATE returns SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).run();
  await logAudit(env, { action: 'diz_payment', entity: 'returns', entity_id: req.params?.id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});

// POST /api/diz/returns/:id/efile - Submit return for e-file
// Submit return for e-file
dizRouter.post('/returns/:id/efile', async (req: Request & { params?: any }, env: any) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  // Check payment status
  const row = await env.DB.prepare(
    `SELECT status FROM returns WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).first();
  if (!row || row.status !== 'paid') {
    return new Response(JSON.stringify({ error: 'Payment required before e-file' }), { status: 403 });
  }
  // TODO: Validate, store, and transmit return XML
  await env.DB.prepare(
    `UPDATE returns SET status = 'efile_submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).run();
  await logAudit(env, { action: 'diz_efile', entity: 'returns', entity_id: req.params?.id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});

// GET /api/diz/returns/:id/status - Get workflow status/history for a return
dizRouter.get('/returns/:id/status', async (req: Request & { params?: any }, env: any) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  const row = await env.DB.prepare(
    `SELECT * FROM returns WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).first();
  if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  // Optionally join with payments, efile_transmissions, etc.
  return new Response(JSON.stringify(row), { headers: { 'Content-Type': 'application/json' } });
});
export default dizRouter;
