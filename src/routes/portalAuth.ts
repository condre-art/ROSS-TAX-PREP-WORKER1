import { Router } from 'itty-router';
import { isValidEmail, sanitizeString } from '../middleware/validation';
import { decryptPII } from '../utils/encryption';
import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';

const portalAuthRouter = Router();

// POST /api/portal/login
portalAuthRouter.post('/login', async (req, env) => {
  try {
    const body = await req.json();
    const email = sanitizeString(body.email || "");
    const password = body.password || "";
    if (!isValidEmail(email) || !password) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 400 });
    }
    // Find user by email (encrypted in DB)
    const clientRows = await env.DB.prepare('SELECT id, full_name, email, password_hash FROM clients').all();
    let user = null;
    for (const row of clientRows.results) {
      const decEmail = await decryptPII(row.email, env);
      if (decEmail === email) {
        user = row;
        break;
      }
    }
    if (!user) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    // Issue JWT
    const payload = {
      id: user.id,
      email,
      role: 'client',
      name: user.full_name ? await decryptPII(user.full_name, env) : undefined
    };
    const token = await jwt.sign(payload, env.JWT_SECRET || "change-this-secret-in-production", { expiresIn: '7d' });
    return new Response(JSON.stringify({ success: true, token }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Login failed' }), { status: 500 });
  }
});

export default portalAuthRouter;
