import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { encryptPII, decryptPII } from '../utils/encryption';
import { sendEmail } from '../utils/email';
import { logAudit } from '../utils/audit';

export async function handleClientRegister(req: Request, env: any): Promise<Response> {
  try {
    const { firstName, lastName, email, username, password, phone, ssn, idType, idNumber, dob, role } = await req.json();

    // Validation
    if (!firstName || !lastName || !email || !username || !password || !phone || !ssn || !idNumber || !dob) {
      return new Response(JSON.stringify({ error: "All fields required" }), { status: 400 });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), { status: 400 });
    }

    // Check if email already exists
    const existing = await env.DB.prepare("SELECT id FROM clients WHERE email = ?").bind(email).first();
    if (existing) {
      return new Response(JSON.stringify({ error: "Email already registered" }), { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Encrypt SSN before storage
    const encryptedSSN = encryptPII(ssn, env.ENCRYPTION_KEY);
    const encryptedIDNumber = encryptPII(idNumber, env.ENCRYPTION_KEY);

    // Assign role-based permissions
    const rolePermissions = getRolePermissions(role || "client");

    // Insert client with verification status
    const clientId = uuid();
    await env.DB.prepare(`
      INSERT INTO clients (
        id, name, email, phone, username, password_hash, 
        ssn_encrypted, id_type, id_number_encrypted, dob,
        role, permissions, verified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      clientId,
      `${firstName} ${lastName}`,
      email,
      phone,
      username,
      passwordHash,
      encryptedSSN,
      idType,
      encryptedIDNumber,
      dob,
      role || "client",
      JSON.stringify(rolePermissions),
      0, // not verified until 2FA
      new Date().toISOString()
    ).run();

    // Send 2FA code
    const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
    const mfaExpiry = new Date(Date.now() + 10 * 60000).toISOString();
    
    await env.DB.prepare(`
      INSERT INTO mfa_codes (client_id, code, expires_at)
      VALUES (?, ?, ?)
    `).bind(clientId, mfaCode, mfaExpiry).run();

    // Send email with 2FA code
    await sendEmail(env, email, "Verify Your Ross Tax Account", `Your verification code is: ${mfaCode}`);

    // Log registration
    await logAudit(env, "client_registration", clientId, `New ${role} account created: ${email}`, "info");

    return new Response(JSON.stringify({
      client_id: clientId,
      role: role || "client",
      message: "Account created. Check your email for 2FA code."
    }), { status: 201 });
  } catch (err: any) {
    console.error("Client registration error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function handleVerifyIdentity(req: Request, env: any): Promise<Response> {
  try {
    const { client_id, mfa_code } = await req.json();

    if (!client_id || !mfa_code) {
      return new Response(JSON.stringify({ error: "Client ID and 2FA code required" }), { status: 400 });
    }

    // Verify code
    const code = await env.DB.prepare(
      "SELECT * FROM mfa_codes WHERE client_id = ? AND code = ? AND expires_at > ?"
    ).bind(client_id, mfa_code, new Date().toISOString()).first();

    if (!code) {
      return new Response(JSON.stringify({ error: "Invalid or expired 2FA code" }), { status: 401 });
    }

    // Mark client as verified
    await env.DB.prepare("UPDATE clients SET verified = 1 WHERE id = ?").bind(client_id).run();
    
    // Delete used code
    await env.DB.prepare("DELETE FROM mfa_codes WHERE id = ?").bind(code.id).run();

    // Get client and return permissions
    const client = await env.DB.prepare("SELECT role, permissions FROM clients WHERE id = ?").bind(client_id).first();

    await logAudit(env, "identity_verified", client_id, "Client identity verified via 2FA", "info");

    return new Response(JSON.stringify({
      verified: true,
      role: client.role,
      permissions: JSON.parse(client.permissions)
    }), { status: 200 });
  } catch (err: any) {
    console.error("Identity verification error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

function getRolePermissions(role: string) {
  const permissions: { [key: string]: string[] } = {
    client: [
      "efile:create_own",
      "efile:view_own",
      "efile:download_own",
      "portal:access",
      "mfa:required"
    ],
    preparer: [
      "efile:create",
      "efile:view",
      "efile:submit",
      "clients:manage",
      "reporting:view",
      "mfa:required",
      "ptin:required"
    ],
    ero: [
      "efile:create",
      "efile:view",
      "efile:submit",
      "efile:authorize",
      "clients:manage",
      "staff:manage",
      "reporting:full",
      "mfa:required",
      "efin:required"
    ]
  };

  return permissions[role] || permissions["client"];
}

// Encryption, email, and audit functions now imported from utils
