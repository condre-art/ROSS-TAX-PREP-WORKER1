// --- Enhanced Authentication Middleware ---
// MFA enforcement, JWT rotation, session management

import jwt from "@tsndr/cloudflare-worker-jwt";
import { v4 as uuid } from "uuid";

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: "admin" | "staff" | "preparer" | "reviewer" | "support" | "client";
  name?: string;
  mfa_enabled: boolean;
  last_mfa_verified?: number;
}

interface JWTPayload extends AuthenticatedUser {
  iat: number;
  exp: number;
  jti: string; // JWT ID for rotation tracking
  device_fingerprint?: string;
}

// JWT Configuration
const JWT_CONFIG = {
  ACCESS_TOKEN_TTL: 15 * 60, // 15 minutes
  REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60, // 7 days
  MFA_TOKEN_TTL: 5 * 60, // 5 minutes
  KEY_ROTATION_DAYS: 90,
};

/**
 * Verify JWT with enhanced security
 */
export async function verifyAuthToken(
  token: string,
  env: any,
  validateMFA: boolean = false
): Promise<AuthenticatedUser | null> {
  try {
    const isValid = await jwt.verify(
      token,
      env.JWT_SECRET || "change-this-secret-in-production"
    );

    if (!isValid) {
      console.warn("JWT verification failed: Invalid signature");
      return null;
    }

    const { payload } = jwt.decode<JWTPayload>(token);
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (!payload.exp || payload.exp < now) {
      console.warn("JWT expired:", payload.exp);
      return null;
    }

    // Check if token is on revocation list (if database available)
    if (env.DB && payload.jti) {
      const revoked = await env.DB.prepare(
        "SELECT 1 FROM revoked_tokens WHERE token_jti = ?"
      )
        .bind(payload.jti)
        .first();

      if (revoked) {
        console.warn("Token is revoked:", payload.jti);
        return null;
      }
    }

    // Enforce MFA for staff/admin if required
    if (validateMFA && ["admin", "staff", "preparer"].includes(payload.role)) {
      if (!payload.mfa_enabled) {
        console.warn("MFA required for role:", payload.role);
        return null;
      }

      // MFA must be verified within last 24 hours for sensitive operations
      if (
        payload.last_mfa_verified &&
        now - payload.last_mfa_verified > 24 * 60 * 60
      ) {
        console.warn("MFA verification expired");
        return null;
      }
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      mfa_enabled: payload.mfa_enabled,
      last_mfa_verified: payload.last_mfa_verified,
    };
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

/**
 * Generate new JWT with rotation tracking
 */
export async function generateAccessToken(
  user: AuthenticatedUser,
  env: any
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jti = uuid(); // Unique token identifier for rotation tracking

  const payload: JWTPayload = {
    ...user,
    iat: now,
    exp: now + JWT_CONFIG.ACCESS_TOKEN_TTL,
    jti,
    device_fingerprint: env.CF_CONNECTING_IP || "unknown",
  };

  // Log token issuance to audit log
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO audit_log (action, entity, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        "token_issued",
        "jwt_token",
        jti,
        JSON.stringify({
          user_id: user.id,
          role: user.role,
          email: user.email,
        })
      )
      .run()
      .catch((e: unknown) => console.error("Audit log failed:", e));
  }

  const token = await jwt.sign(
    payload,
    env.JWT_SECRET || "change-this-secret-in-production"
  );

  return token;
}

/**
 * Generate refresh token (longer TTL, stored securely)
 */
export async function generateRefreshToken(
  userId: number,
  env: any
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const refreshTokenId = uuid();

  const payload = {
    user_id: userId,
    type: "refresh",
    iat: now,
    exp: now + JWT_CONFIG.REFRESH_TOKEN_TTL,
    jti: refreshTokenId,
  };

  // Store refresh token in database for revocation tracking
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO refresh_tokens (id, user_id, expires_at, created_at)
       VALUES (?, ?, datetime('now', '+7 days'), datetime('now'))`
    )
      .bind(refreshTokenId, userId)
      .run();
  }

  const token = await jwt.sign(
    payload,
    env.JWT_SECRET || "change-this-secret-in-production"
  );

  return token;
}

/**
 * Session Invalidation on sensitive events
 */
export async function invalidateUserSessions(
  userId: number,
  env: any,
  reason: "password_change" | "role_change" | "mfa_disable" | "certificate_revoke"
): Promise<void> {
  console.log(`Invalidating sessions for user ${userId}: ${reason}`);

  if (env.DB) {
    // Revoke all active tokens
    await env.DB.prepare(
      `INSERT INTO revoked_tokens (token_jti, user_id, reason, created_at)
       SELECT id, user_id, ?, datetime('now')
       FROM refresh_tokens
       WHERE user_id = ? AND expires_at > datetime('now')`
    )
      .bind(reason, userId)
      .run();

    // Clear refresh token sessions
    await env.DB.prepare(
      "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL"
    )
      .bind(userId)
      .run();

    // Log to audit
    await env.DB.prepare(
      `INSERT INTO audit_log (action, entity, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        "sessions_invalidated",
        "user",
        userId,
        JSON.stringify({ reason })
      )
      .run();
  }
}

/**
 * Enforce MFA for sensitive roles
 */
export async function enforceMFARequirement(
  user: AuthenticatedUser,
  env: any
): Promise<boolean> {
  const requiresMFA = ["admin", "staff"].includes(user.role);

  if (requiresMFA && !user.mfa_enabled) {
    console.warn(`MFA required for ${user.role}:`, user.email);
    return false;
  }

  return true;
}

/**
 * Rate limit authentication attempts
 */
export async function checkAuthRateLimit(
  email: string,
  env: any,
  maxAttempts: number = 5,
  windowSeconds: number = 300
): Promise<boolean> {
  if (!env.KV_NAMESPACE) {
    console.warn("KV_NAMESPACE not available, skipping rate limit check");
    return true;
  }

  const key = `auth_attempt:${email}`;
  const current = await env.KV_NAMESPACE.get(key);
  const attempts = current ? parseInt(current) + 1 : 1;

  if (attempts > maxAttempts) {
    console.warn(`Rate limit exceeded for ${email}: ${attempts} attempts`);
    return false;
  }

  await env.KV_NAMESPACE.put(key, attempts.toString(), {
    expirationTtl: windowSeconds,
  });

  return true;
}

/**
 * Verify MFA code (TOTP)
 */
export async function verifyMFACode(
  user: AuthenticatedUser,
  code: string,
  env: any
): Promise<boolean> {
  if (!env.DB) {
    console.error("Database not available for MFA verification");
    return false;
  }

  try {
    // Fetch user's MFA secret
    const mfaRecord = await env.DB.prepare(
      "SELECT secret, last_used_code FROM mfa_secrets WHERE user_id = ?"
    )
      .bind(user.id)
      .first();

    if (!mfaRecord) {
      console.warn(`No MFA secret found for user ${user.id}`);
      return false;
    }

    // Verify TOTP code (simplified - use proper TOTP library in production)
    // This is a placeholder - implement with speakeasy or similar
    const isValid = validateTOTP(code, mfaRecord.secret);

    if (!isValid) {
      return false;
    }

    // Prevent replay attacks
    if (mfaRecord.last_used_code === code) {
      console.warn(`MFA code replay attempt for user ${user.id}`);
      return false;
    }

    // Update last used code
    await env.DB.prepare(
      "UPDATE mfa_secrets SET last_used_code = ?, verified_at = datetime('now') WHERE user_id = ?"
    )
      .bind(code, user.id)
      .run();

    return true;
  } catch (error) {
    console.error("MFA verification error:", error);
    return false;
  }
}

/**
 * Placeholder TOTP validation (use proper library in production)
 */
function validateTOTP(code: string, secret: string): boolean {
  // TODO: Implement proper TOTP validation using speakeasy or similar
  // This is a security-sensitive operation
  return code.length === 6 && /^\d+$/.test(code);
}
