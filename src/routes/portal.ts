import { Router } from 'itty-router';
import { isValidEmail, isStrongPassword, sanitizeString } from '../middleware/validation';
import { encryptPII } from '../utils/encryption';
import bcrypt from 'bcryptjs';

const portalRouter = Router();

// POST /api/portal/register
portalRouter.post('/register', async (req, env) => {
  try {
    const body = await req.json();
    const name = sanitizeString(body.name || "");
    const email = sanitizeString(body.email || "");
    const password = body.password || "";
    if (!name || !isValidEmail(email) || !isStrongPassword(password).valid) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }
    // Check for existing user
    const exists = await env.DB.prepare('SELECT id FROM clients WHERE email = ?').bind(email).first();
    if (exists) return new Response(JSON.stringify({ error: "Email already registered" }), { status: 409 });
    // Hash password
    const hash = await bcrypt.hash(password, 10);
    // Encrypt PII
    const encName = await encryptPII(name, env);
    const encEmail = await encryptPII(email, env);
    // Insert user
    const result = await env.DB.prepare('INSERT INTO clients (full_name, email, password_hash, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').bind(encName, encEmail, hash).run();
    return new Response(JSON.stringify({ success: true, id: result.lastRowId }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Registration failed' }), { status: 500 });
  }
});

export default portalRouter;
