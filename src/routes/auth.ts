
import * as OTPAuth from "otpauth";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "@tsndr/cloudflare-worker-jwt";

// TOTP helper using OTPAuth
function verifyTOTP(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30
  });
  return totp.validate({ token, window: 1 }) !== null;
}

function generateTOTPSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

// AES-GCM encryption utilities
async function getKey(env) {
  const keyData = new TextEncoder().encode(env.ENCRYPTION_KEY);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(text, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(env);
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return btoa(String.fromCharCode(...iv) + String.fromCharCode(...new Uint8Array(ciphertext)));
}

async function decrypt(data, env) {
  const raw = atob(data);
  const iv = new Uint8Array([...raw].slice(0, 12).map(c => c.charCodeAt(0)));
  const ciphertext = new Uint8Array([...raw].slice(12).map(c => c.charCodeAt(0)));
  const key = await getKey(env);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

// Utility: get user by email (staff or client)
async function getUserByEmail(env, email) {
  let user = await env.DB.prepare("SELECT * FROM staff WHERE email = ?").bind(email).first();
  if (!user) user = await env.DB.prepare("SELECT * FROM clients WHERE email = ?").bind(email).first();
  return user;
}

// POST /api/auth/login
export async function authRoute(req: Request, env: Env) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const { email, password, mfa_code } = await req.json();
  const user = await getUserByEmail(env, email);
  if (!user) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  
  // Verify password with bcrypt
  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  // MFA required?
  if (user.mfa_enabled) {
    if (!mfa_code) {
      return new Response(JSON.stringify({ mfa_required: true, mfa_method: user.mfa_method }), { status: 200 });
    }
    
    let mfaValid = false;
    
    if (user.mfa_method === "totp") {
      let mfaSecret = user.mfa_secret;
      if (mfaSecret && !mfaSecret.startsWith("MFA")) {
        // If not encrypted, encrypt and update
        mfaSecret = await encrypt(mfaSecret, env);
        await env.DB.prepare(`UPDATE ${user.role ? "staff" : "clients"} SET mfa_secret = ? WHERE id = ?`).bind(mfaSecret, user.id).run();
      }
      const decryptedSecret = await decrypt(mfaSecret, env);
      mfaValid = decryptedSecret && verifyTOTP(decryptedSecret, mfa_code);
    } else if (user.mfa_method === "email" || user.mfa_method === "sms") {
      // Check verification code from KV (stored temporarily)
      const storedCode = await env.KV_NAMESPACE?.get(`mfa:${user.id}`);
      mfaValid = storedCode && storedCode === mfa_code;
      if (mfaValid && env.KV_NAMESPACE) {
        // Delete used code
        await env.KV_NAMESPACE.delete(`mfa:${user.id}`);
      }
    }
    
    // Check backup codes if primary method fails
    if (!mfaValid && user.mfa_backup_codes) {
      try {
        const backupCodes = JSON.parse(user.mfa_backup_codes);
        const codeIndex = backupCodes.findIndex(code => code === mfa_code);
        if (codeIndex !== -1) {
          mfaValid = true;
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await env.DB.prepare(`UPDATE ${user.role ? "staff" : "clients"} SET mfa_backup_codes = ? WHERE id = ?`)
            .bind(JSON.stringify(backupCodes), user.id).run();
        }
      } catch (e) {
        console.error("Failed to parse backup codes:", e);
      }
    }
    
    if (!mfaValid) {
      return new Response(JSON.stringify({ error: "Invalid MFA code" }), { status: 401 });
    }
  }
  
  // Generate JWT token
  const token = await jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "client",
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    env.JWT_SECRET || "change-this-secret-in-production"
  );
  
  // Success: return JWT token
  return new Response(JSON.stringify({ 
    success: true, 
    token,
    user: { id: user.id, email: user.email, role: user.role || "client", name: user.name } 
  }), { headers: { "Content-Type": "application/json" } });
}

// POST /api/auth/mfa/setup (enroll TOTP)
export async function mfaSetupRoute(req: Request, env: Env) {
  const { email } = await req.json();
  const user = await getUserByEmail(env, email);
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  const secret = generateTOTPSecret();
  const encryptedSecret = await encrypt(secret, env);
  // Save encrypted secret (do not enable yet)
  await env.DB.prepare(`UPDATE ${user.role ? "staff" : "clients"} SET mfa_secret = ? WHERE id = ?`).bind(encryptedSecret, user.id).run();
  // Return secret for QR code (not encrypted)
  return new Response(JSON.stringify({ secret }), { headers: { "Content-Type": "application/json" } });
}

// POST /api/auth/mfa/verify (verify TOTP and enable)
export async function mfaVerifyRoute(req: Request, env: Env) {
  const { email, code } = await req.json();
  const user = await getUserByEmail(env, email);
  if (!user || !user.mfa_secret) return new Response(JSON.stringify({ error: "User not found or not enrolled" }), { status: 404 });
  const decryptedSecret = await decrypt(user.mfa_secret, env);
  if (!verifyTOTP(decryptedSecret, code)) return new Response(JSON.stringify({ error: "Invalid code" }), { status: 401 });
  await env.DB.prepare(`UPDATE ${user.role ? "staff" : "clients"} SET mfa_enabled = 1 WHERE id = ?`).bind(user.id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
