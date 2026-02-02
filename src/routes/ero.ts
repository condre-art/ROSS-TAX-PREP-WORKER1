// @ts-ignore - itty-router is a JS dependency
import { Router } from 'itty-router';
import { requireStaff } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const eroRouter = Router();

// GET /api/ero/returns - List all returns needing ERO review
eroRouter.get('/returns', async (req: Request, env: any) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const { results } = await env.DB.prepare(
    `SELECT t.*, c.full_name, c.email FROM efile_transmissions t
     LEFT JOIN clients c ON t.client_id = c.id
     WHERE t.status IN ('created', 'pending', 'review', 'awaiting_signature', 'awaiting_payment')
     ORDER BY t.updated_at DESC LIMIT 100`
  ).all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
});

// POST /api/ero/returns/:id/claim - Claim a return for review
eroRouter.post('/returns/:id/claim', async (req: Request & { params?: any }, env: any) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  await env.DB.prepare(
    `UPDATE efile_transmissions SET preparer_id = ?, status = 'review' WHERE id = ? AND (preparer_id IS NULL OR preparer_id = ?)`
  ).bind(user.id, id, user.id).run();
  await logAudit(env, { action: 'ero_claim', entity: 'efile_transmissions', entity_id: id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});

// POST /api/ero/returns/:id/compliance - Mark compliance review
eroRouter.post('/returns/:id/compliance', async (req: Request & { params?: any }, env: any) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  const body = (await req.json()) as { compliant?: boolean; notes?: string };
  const compliant = body.compliant;
  const notes = body.notes;
  await env.DB.prepare(
    `UPDATE efile_transmissions SET status = ?, compliance_notes = ? WHERE id = ?`
  ).bind(compliant ? 'awaiting_signature' : 'review', notes || null, id).run();
  await logAudit(env, { action: 'ero_compliance', entity: 'efile_transmissions', entity_id: id, user_id: user.id, user_email: user.email, details: JSON.stringify({ compliant, notes }) });
  return new Response(JSON.stringify({ success: true }));
});

// POST /api/ero/returns/:id/signature - Mark signature as received
eroRouter.post('/returns/:id/signature', async (req: Request & { params?: any }, env: any) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  await env.DB.prepare(
    `UPDATE efile_transmissions SET status = 'awaiting_payment' WHERE id = ?`
  ).bind(id).run();
  await logAudit(env, { action: 'ero_signature', entity: 'efile_transmissions', entity_id: id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});

// POST /api/ero/returns/:id/payment - Mark payment as received
eroRouter.post('/returns/:id/payment', async (req: Request & { params?: any }, env: any) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  await env.DB.prepare(
    `UPDATE efile_transmissions SET status = 'ready_to_transmit' WHERE id = ?`
  ).bind(id).run();
  await logAudit(env, { action: 'ero_payment', entity: 'efile_transmissions', entity_id: id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});

// POST /api/ero/returns/:id/transmit - Transmit return to IRS/state
eroRouter.post('/returns/:id/transmit', async (req: Request & { params?: any }, env: any) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  // Fetch transmission and XML
  const row = await env.DB.prepare('SELECT * FROM efile_transmissions WHERE id = ?').bind(id).first();
  if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  // TODO: Fetch return XML and type
  // const xml = ...
  // const returnType = ...
  // const result = await transmitEFile(env, row, xml, returnType, row.tax_year);
  // For now, just mark as transmitting
  await env.DB.prepare(
    `UPDATE efile_transmissions SET status = 'transmitting' WHERE id = ?`
  ).bind(id).run();
  await logAudit(env, { action: 'ero_transmit', entity: 'efile_transmissions', entity_id: id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});

export default eroRouter;
