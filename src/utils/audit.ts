import { v4 as uuid } from "uuid";

export interface AuditLogEntry {
  action: string;
  entity: string;
  entity_id?: string;
  user_id?: number;
  user_role?: string;
  user_email?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit entry to the database
 * Captures all sensitive actions for compliance tracking
 * 
 * @param env - Environment with DB access
 * @param entry - Audit log entry details
 * @param req - Optional request object to extract IP and user agent
 */
export async function logAudit(
  env: any,
  entry: AuditLogEntry,
  req?: Request
): Promise<void> {
  try {
    const id = uuid();
    const ip_address = entry.ip_address || req?.headers.get("CF-Connecting-IP") || req?.headers.get("X-Forwarded-For") || "unknown";
    const user_agent = entry.user_agent || req?.headers.get("User-Agent") || "unknown";
    
    await env.DB.prepare(
      `INSERT INTO audit_log (id, action, entity, entity_id, user_id, user_role, user_email, details, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      id,
      entry.action,
      entry.entity,
      entry.entity_id || null,
      entry.user_id || null,
      entry.user_role || null,
      entry.user_email || null,
      entry.details || null,
      ip_address,
      user_agent
    ).run();
    
    console.log(`[AUDIT] ${entry.action} on ${entry.entity} by ${entry.user_email || "system"}`);
  } catch (error) {
    console.error("Failed to log audit entry:", error);
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Audit helper for login attempts
 */
export async function auditLogin(
  env: any,
  email: string,
  success: boolean,
  req: Request,
  mfaUsed: boolean = false
): Promise<void> {
  await logAudit(env, {
    action: success ? "login_success" : "login_failed",
    entity: "authentication",
    user_email: email,
    details: JSON.stringify({ mfa_used: mfaUsed })
  }, req);
}

/**
 * Audit helper for data access
 */
export async function auditDataAccess(
  env: any,
  entity: string,
  entity_id: string,
  user: { id: number; email: string; role: string },
  action: "read" | "list" | "search",
  req?: Request
): Promise<void> {
  await logAudit(env, {
    action: `${entity}_${action}`,
    entity,
    entity_id,
    user_id: user.id,
    user_role: user.role,
    user_email: user.email
  }, req);
}

/**
 * Audit helper for data modifications
 */
export async function auditDataChange(
  env: any,
  entity: string,
  entity_id: string,
  user: { id: number; email: string; role: string },
  action: "create" | "update" | "delete",
  details?: any,
  req?: Request
): Promise<void> {
  await logAudit(env, {
    action: `${entity}_${action}`,
    entity,
    entity_id,
    user_id: user.id,
    user_role: user.role,
    user_email: user.email,
    details: details ? JSON.stringify(details) : undefined
  }, req);
}

/**
 * Audit helper for file operations
 */
export async function auditFileOperation(
  env: any,
  filename: string,
  user: { id: number; email: string; role: string },
  action: "upload" | "download" | "delete",
  req?: Request
): Promise<void> {
  await logAudit(env, {
    action: `file_${action}`,
    entity: "document",
    entity_id: filename,
    user_id: user.id,
    user_role: user.role,
    user_email: user.email,
    details: JSON.stringify({ filename })
  }, req);
}

/**
 * Audit helper for admin actions
 */
export async function auditAdminAction(
  env: any,
  action: string,
  entity: string,
  user: { id: number; email: string; role: string },
  details?: any,
  req?: Request
): Promise<void> {
  await logAudit(env, {
    action: `admin_${action}`,
    entity,
    user_id: user.id,
    user_role: user.role,
    user_email: user.email,
    details: details ? JSON.stringify(details) : undefined
  }, req);
}

/**
 * Audit helper for permission changes
 */
export async function auditPermissionChange(
  env: any,
  targetUserId: number,
  targetEmail: string,
  user: { id: number; email: string; role: string },
  changes: any,
  req?: Request
): Promise<void> {
  await logAudit(env, {
    action: "permission_change",
    entity: "user",
    entity_id: targetUserId.toString(),
    user_id: user.id,
    user_role: user.role,
    user_email: user.email,
    details: JSON.stringify({
      target_email: targetEmail,
      changes
    })
  }, req);
}

/**
 * Audit helper for payment transactions
 */
export async function auditPayment(
  env: any,
  transactionId: string,
  amount: number,
  user: { id: number; email: string; role: string },
  status: "initiated" | "completed" | "failed",
  req?: Request
): Promise<void> {
  await logAudit(env, {
    action: `payment_${status}`,
    entity: "payment",
    entity_id: transactionId,
    user_id: user.id,
    user_role: user.role,
    user_email: user.email,
    details: JSON.stringify({ amount, currency: "USD" })
  }, req);
}

/**
 * Audit helper for e-file submissions
 */
export async function auditEfileSubmission(
  env: any,
  returnId: string,
  user: { id: number; email: string; role: string },
  status: "submitted" | "accepted" | "rejected",
  details?: any,
  req?: Request
): Promise<void> {
  await logAudit(env, {
    action: `efile_${status}`,
    entity: "tax_return",
    entity_id: returnId,
    user_id: user.id,
    user_role: user.role,
    user_email: user.email,
    details: details ? JSON.stringify(details) : undefined
  }, req);
}
