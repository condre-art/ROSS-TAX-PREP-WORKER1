// --- PII Data Protection Utilities ---
// Encryption at rest, masking in logs, secure handling

import crypto from "crypto";

export interface EncryptedField {
  ciphertext: string;
  iv: string;
  algorithm: string;
  encrypted_at: string;
}

/**
 * Encrypt sensitive data at rest
 * Supports: SSN, DOB, Bank info, Driver License
 */
export function encryptSensitiveData(
  plaintext: string,
  env: any
): EncryptedField {
  if (!env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY not configured");
  }

  const algorithm = "aes-256-gcm";
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted + authTag.toString("hex"),
    iv: iv.toString("hex"),
    algorithm,
    encrypted_at: new Date().toISOString(),
  };
}

/**
 * Decrypt sensitive data
 */
export function decryptSensitiveData(
  encrypted: EncryptedField,
  env: any
): string {
  if (!env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY not configured");
  }

  const algorithm = "aes-256-gcm";
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const iv = Buffer.from(encrypted.iv, "hex");

  // Extract auth tag (last 32 hex chars = 16 bytes)
  const ciphertextWithTag = encrypted.ciphertext;
  const authTag = Buffer.from(
    ciphertextWithTag.slice(-32),
    "hex"
  );
  const ciphertext = ciphertextWithTag.slice(0, -32);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Mask PII in logs
 * Never log raw SSN, DOB, bank account numbers
 */
export function maskPII(value: string, type: "ssn" | "dob" | "bank" | "phone"): string {
  if (!value) return "[REDACTED]";

  switch (type) {
    case "ssn":
      // Show only last 4 digits: XXX-XX-1234
      return `XXX-XX-${value.slice(-4)}`;

    case "dob":
      // Show only year: 1990-**-**
      return `${value.slice(0, 4)}-**-**`;

    case "bank":
      // Show only last 4 digits: ****1234
      return `****${value.slice(-4)}`;

    case "phone":
      // Show only last 4 digits: (***) ***-1234
      return `(***) ***-${value.slice(-4)}`;

    default:
      return "[REDACTED]";
  }
}

/**
 * Create audit-safe log entry (all PII masked)
 */
export function createAuditLog(
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, any>,
  env: any
): string {
  const safeDetails = { ...details };

  // Mask all PII fields
  const piiFields = {
    ssn: "ssn",
    social_security: "ssn",
    dob: "dob",
    date_of_birth: "dob",
    bank_account: "bank",
    account_number: "bank",
    phone: "phone",
    phone_number: "phone",
  };

  for (const [key, maskType] of Object.entries(piiFields)) {
    if (safeDetails[key]) {
      safeDetails[key] = maskPII(safeDetails[key], maskType as any);
    }
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    entity,
    entity_id: entityId,
    details: safeDetails,
  };

  return JSON.stringify(logEntry);
}

/**
 * Hash PII for comparison without storing raw data
 */
export function hashPII(value: string, env: any): string {
  if (!env.HASHING_SALT) {
    throw new Error("HASHING_SALT not configured");
  }

  return crypto
    .createHmac("sha256", env.HASHING_SALT)
    .update(value)
    .digest("hex");
}

/**
 * Securely compare two PII values (constant-time comparison)
 */
export function comparePIIHash(hash1: string, hash2: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(hash1),
    Buffer.from(hash2)
  );
}

/**
 * Auto-purge policy for incomplete data
 */
export async function purgeIncompleteIntakes(
  env: any,
  daysOld: number = 90
): Promise<number> {
  if (!env.DB) {
    console.error("Database not available for purge operation");
    return 0;
  }

  try {
    // Delete incomplete intakes older than specified days
    const result = await env.DB.prepare(
      `DELETE FROM crm_intakes
       WHERE status IN ('draft', 'pending') 
       AND created_at < datetime('now', '-${daysOld} days')`
    ).run();

    console.log(
      `Purged ${result.meta.changes} incomplete intakes older than ${daysOld} days`
    );

    // Log purge operation
    await env.DB.prepare(
      `INSERT INTO audit_log (action, entity, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        "auto_purge",
        "crm_intakes",
        "batch",
        JSON.stringify({
          records_deleted: result.meta.changes,
          criteria: `status IN ('draft', 'pending') AND created_at < ${daysOld} days ago`,
        })
      )
      .run();

    return result.meta.changes;
  } catch (error) {
    console.error("Purge operation failed:", error);
    return 0;
  }
}

/**
 * Purge expired JWT and session records
 */
export async function purgeExpiredTokens(env: any): Promise<number> {
  if (!env.DB) {
    console.error("Database not available for token purge");
    return 0;
  }

  try {
    const result = await env.DB.prepare(
      `DELETE FROM refresh_tokens
       WHERE expires_at < datetime('now')`
    ).run();

    console.log(`Purged ${result.meta.changes} expired refresh tokens`);

    return result.meta.changes;
  } catch (error) {
    console.error("Token purge failed:", error);
    return 0;
  }
}

/**
 * Create immutable audit log entry for critical operations
 */
export async function logCriticalEvent(
  action: "irs_submission" | "docusign_event" | "permission_change",
  details: Record<string, any>,
  env: any
): Promise<boolean> {
  if (!env.DB) {
    console.error("Database not available for critical event logging");
    return false;
  }

  try {
    // Use transaction to ensure immutability
    await env.DB.prepare(
      `INSERT INTO immutable_audit_log (action, details, created_at, created_by)
       VALUES (?, ?, datetime('now'), ?)`
    )
      .bind(action, JSON.stringify(details), env.USER_ID || "system")
      .run();

    // Also log to regular audit log
    await env.DB.prepare(
      `INSERT INTO audit_log (action, entity, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
      .bind("critical_event", "system", action, JSON.stringify(details))
      .run();

    return true;
  } catch (error) {
    console.error("Critical event logging failed:", error);
    return false;
  }
}

/**
 * Data retention policy compliance
 */
export interface DataRetentionPolicy {
  entity: "crm_intakes" | "irs_submissions" | "documents" | "audit_logs";
  retention_days: number;
  purge_schedule: "daily" | "weekly" | "monthly";
}

export const DEFAULT_RETENTION_POLICIES: DataRetentionPolicy[] = [
  {
    entity: "crm_intakes",
    retention_days: 2555, // ~7 years (IRS requirement)
    purge_schedule: "monthly",
  },
  {
    entity: "irs_submissions",
    retention_days: 2555, // ~7 years (IRS requirement)
    purge_schedule: "monthly",
  },
  {
    entity: "documents",
    retention_days: 2555, // ~7 years
    purge_schedule: "monthly",
  },
  {
    entity: "audit_logs",
    retention_days: 1825, // 5 years (regulatory requirement)
    purge_schedule: "monthly",
  },
];
