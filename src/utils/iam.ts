/**
 * IAM Utilities - Role-Based Access Control (RBAC) Helpers
 * Identity & Access Management for Ross Tax Prep Platform
 */

import { D1Database } from '@cloudflare/workers-types';

export type UserType = 'staff' | 'client';
export type ActionResult = 'success' | 'denied' | 'failed';

export interface UserContext {
  userId: string;
  userType: UserType;
  userRole?: string;
  email?: string;
  permissions?: string[];
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  requiredPermission?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  roleType: 'staff' | 'customer' | 'preparer' | 'system';
}

export interface PermissionDef {
  id: string;
  name: string;
  category: string;
  description?: string;
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  db: D1Database,
  userId: string,
  userType: UserType,
  permission: string
): Promise<boolean> {
  try {
    const result = await db
      .prepare(
        `
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ?
        AND ur.user_type = ?
        AND p.name = ?
        AND ur.is_active = 1
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
      LIMIT 1
    `
      )
      .bind(userId, userType, permission)
      .first();

    return !!result;
  } catch (error) {
    console.error('hasPermission error:', error);
    return false;
  }
}

/**
 * Check if user has multiple permissions (ALL must be true)
 */
export async function hasAllPermissions(
  db: D1Database,
  userId: string,
  userType: UserType,
  permissions: string[]
): Promise<boolean> {
  for (const permission of permissions) {
    const has = await hasPermission(db, userId, userType, permission);
    if (!has) return false;
  }
  return true;
}

/**
 * Check if user has ANY of the permissions
 */
export async function hasAnyPermission(
  db: D1Database,
  userId: string,
  userType: UserType,
  permissions: string[]
): Promise<boolean> {
  for (const permission of permissions) {
    const has = await hasPermission(db, userId, userType, permission);
    if (has) return true;
  }
  return false;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  db: D1Database,
  userId: string,
  userType: UserType
): Promise<string[]> {
  try {
    const results = await db
      .prepare(
        `
      SELECT DISTINCT p.name
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ?
        AND ur.user_type = ?
        AND ur.is_active = 1
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
      ORDER BY p.name
    `
      )
      .bind(userId, userType)
      .all();

    return results.results?.map((r: any) => r.name) || [];
  } catch (error) {
    console.error('getUserPermissions error:', error);
    return [];
  }
}

/**
 * Get user's roles
 */
export async function getUserRoles(
  db: D1Database,
  userId: string,
  userType: UserType
): Promise<string[]> {
  try {
    const results = await db
      .prepare(
        `
      SELECT DISTINCT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
        AND ur.user_type = ?
        AND ur.is_active = 1
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
      ORDER BY r.name
    `
      )
      .bind(userId, userType)
      .all();

    return results.results?.map((r: any) => r.name) || [];
  } catch (error) {
    console.error('getUserRoles error:', error);
    return [];
  }
}

/**
 * Check for Segregation of Duties (SoD) conflict
 * Example: Cannot have both 'money:initiate_transfer' and 'money:approve_transfer'
 */
export async function checkSoDViolation(
  db: D1Database,
  userId: string,
  userType: UserType,
  newPermission: string
): Promise<{ violates: boolean; conflictingPermission?: string }> {
  const sodConflicts: Record<string, string[]> = {
    'money:initiate_transfer': ['money:approve_transfer'],
    'money:initiate_external_transfer': ['money:approve_transfer'],
    'fraud:restrict_account': ['fraud:submit_sar'],
    'user:create': ['rbac:assign_role'],
    'user:delete': ['audit:view_logs'],
    'system:modify_config': ['system:deploy'],
    'card:issue_virtual': ['card:set_limits'],
  };

  const conflictsWith = sodConflicts[newPermission] || [];
  if (conflictsWith.length === 0) return { violates: false };

  for (const conflicting of conflictsWith) {
    const hasConflict = await hasPermission(db, userId, userType, conflicting);
    if (hasConflict) {
      return { violates: true, conflictingPermission: conflicting };
    }
  }

  return { violates: false };
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  db: D1Database,
  userId: string,
  userType: UserType,
  roleId: string,
  assignedBy: string,
  reason?: string,
  expiresAt?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if role exists
    const roleExists = await db
      .prepare('SELECT 1 FROM roles WHERE id = ? LIMIT 1')
      .bind(roleId)
      .first();

    if (!roleExists) {
      return { success: false, error: 'Role not found' };
    }

    // Remove any conflicting existing roles (SoD)
    // For simplicity, we allow multiple roles but check conflicts at access time
    
    const userRoleId = `${userId}-${roleId}-${Date.now()}`;
    
    await db
      .prepare(
        `
      INSERT INTO user_roles (id, user_id, user_type, role_id, assigned_by, reason, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(userRoleId, userId, userType, roleId, assignedBy, reason || null, expiresAt || null)
      .run();

    return { success: true };
  } catch (error) {
    console.error('assignRoleToUser error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Revoke role from user
 */
export async function revokeRoleFromUser(
  db: D1Database,
  userId: string,
  userType: UserType,
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .prepare(
        `
      UPDATE user_roles
      SET is_active = 0
      WHERE user_id = ?
        AND user_type = ?
        AND role_id = ?
    `
      )
      .bind(userId, userType, roleId)
      .run();

    return { success: true };
  } catch (error) {
    console.error('revokeRoleFromUser error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Can user access a specific customer's data?
 * Rules:
 * - CSR can access assisted-only (must be in active support ticket)
 * - Preparers can access assigned-only
 * - Compliance/Audit can access all
 * - Customers can access own data only
 */
export async function canAccessCustomerData(
  db: D1Database,
  userId: string,
  userType: UserType,
  targetCustomerId: string,
  accessType: 'view' | 'edit' = 'view'
): Promise<AccessDecision> {
  try {
    if (userType === 'client') {
      // Customers can only access their own data
      if (userId === targetCustomerId) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Cannot access other customer data' };
    }

    // Staff roles
    const hasComplianceAccess = await hasPermission(
      db,
      userId,
      userType,
      'audit:view_logs'
    );
    if (hasComplianceAccess) {
      return { allowed: true }; // Compliance can view all
    }

    if (accessType === 'edit') {
      const hasEditAccess = await hasPermission(
        db,
        userId,
        userType,
        'customer:edit_profile'
      );
      if (!hasEditAccess) {
        return { allowed: false, reason: 'Missing edit permission', requiredPermission: 'customer:edit_profile' };
      }
    }

    // Check if preparer has assignment to this customer
    const hasAssignment = await db
      .prepare(
        `
      SELECT 1 FROM client_assignments
      WHERE staff_id = ? AND client_id = ?
      LIMIT 1
    `
      )
      .bind(userId, targetCustomerId)
      .first();

    if (hasAssignment) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'No assignment to this customer' };
  } catch (error) {
    console.error('canAccessCustomerData error:', error);
    return { allowed: false, reason: 'Error checking access' };
  }
}

/**
 * Can user access an account (for money management)?
 */
export async function canAccessAccount(
  db: D1Database,
  userId: string,
  userType: UserType,
  accountId: string
): Promise<AccessDecision> {
  try {
    // Customers can only access their own accounts
    if (userType === 'client') {
      const isOwner = await db
        .prepare(
          `
        SELECT 1 FROM money_accounts
        WHERE id = ? AND client_id = ?
        LIMIT 1
      `
        )
        .bind(accountId, userId)
        .first();

      if (isOwner) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Not account owner' };
    }

    // Staff must have money:view_balance or audit:view_logs
    const hasPermission =
      (await hasPermission(db, userId, userType, 'money:view_balance')) ||
      (await hasPermission(db, userId, userType, 'audit:view_logs'));

    if (hasPermission) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Missing account access permission', requiredPermission: 'money:view_balance' };
  } catch (error) {
    console.error('canAccessAccount error:', error);
    return { allowed: false, reason: 'Error checking access' };
  }
}

/**
 * Check if transaction requires dual approval (SoD)
 */
export function transactionRequiresDualApproval(
  amount: number,
  transactionType: 'transfer' | 'refund' | 'wire'
): boolean {
  const thresholds: Record<string, number> = {
    transfer: 10000,
    refund: 5000,
    wire: 25000,
  };

  return amount > (thresholds[transactionType] || Infinity);
}

/**
 * Get access audit log entry template
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  userType: UserType;
  action: string;
  resourceType: string;
  resourceId?: string;
  result: ActionResult;
  denyReason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  requestId?: string;
  entity?: string;
  entityId?: string;
  userRole?: string;
  permissionRequired?: string;
  timestamp: string;
}

/**
 * Generate audit log entry (ready to insert)
 */
export function createAuditLogEntry(
  userId: string,
  userType: UserType,
  action: string,
  resourceType: string,
  result: ActionResult,
  options?: {
    resourceId?: string;
    denyReason?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    requestId?: string;
    entity?: string;
    entityId?: string;
    userRole?: string;
    permissionRequired?: string;
  }
): AuditLogEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userType,
    action,
    resourceType,
    resourceId: options?.resourceId,
    result,
    denyReason: options?.denyReason,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    deviceFingerprint: options?.deviceFingerprint,
    requestId: options?.requestId,
    entity: options?.entity,
    entityId: options?.entityId,
    userRole: options?.userRole,
    permissionRequired: options?.permissionRequired,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Insert audit log entry
 */
export async function logAccessAttempt(
  db: D1Database,
  entry: AuditLogEntry
): Promise<boolean> {
  try {
    await db
      .prepare(
        `
      INSERT INTO access_audit_log (
        id, user_id, user_type, action, resource_type, resource_id, result,
        deny_reason, ip_address, user_agent, device_fingerprint, request_id,
        entity, entity_id, user_role, permission_required, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        entry.id,
        entry.userId,
        entry.userType,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.result,
        entry.denyReason || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.deviceFingerprint || null,
        entry.requestId || null,
        entry.entity || null,
        entry.entityId || null,
        entry.userRole || null,
        entry.permissionRequired || null,
        entry.timestamp
      )
      .run();

    return true;
  } catch (error) {
    console.error('logAccessAttempt error:', error);
    return false;
  }
}

/**
 * Get audit logs for compliance/investigation
 */
export async function getAuditLogs(
  db: D1Database,
  filters?: {
    userId?: string;
    userType?: UserType;
    action?: string;
    resourceType?: string;
    result?: ActionResult;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<AuditLogEntry[]> {
  try {
    let query =
      'SELECT * FROM access_audit_log WHERE 1=1';
    const bindings: any[] = [];

    if (filters?.userId) {
      query += ' AND user_id = ?';
      bindings.push(filters.userId);
    }
    if (filters?.userType) {
      query += ' AND user_type = ?';
      bindings.push(filters.userType);
    }
    if (filters?.action) {
      query += ' AND action = ?';
      bindings.push(filters.action);
    }
    if (filters?.resourceType) {
      query += ' AND resource_type = ?';
      bindings.push(filters.resourceType);
    }
    if (filters?.result) {
      query += ' AND result = ?';
      bindings.push(filters.result);
    }
    if (filters?.startDate) {
      query += ' AND timestamp >= ?';
      bindings.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND timestamp <= ?';
      bindings.push(filters.endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    bindings.push(filters?.limit || 1000);

    const stmt = db.prepare(query);
    const result = await stmt.bind(...bindings).all();

    return (result.results || []) as AuditLogEntry[];
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return [];
  }
}

/**
 * Check if request should be denied based on real-time monitoring
 * (e.g., brute force, unusual access pattern, etc.)
 */
export async function shouldDenyRequest(
  db: D1Database,
  userId: string,
  userType: UserType,
  ipAddress?: string
): Promise<{ deny: boolean; reason?: string }> {
  try {
    // Check for brute force (5+ failed logins in 10 minutes)
    const recentFailures = await db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM access_audit_log
      WHERE user_id = ?
        AND user_type = ?
        AND action = 'login'
        AND result = 'failed'
        AND timestamp > datetime('now', '-10 minutes')
    `
      )
      .bind(userId, userType)
      .first();

    if ((recentFailures?.count || 0) >= 5) {
      return { deny: true, reason: 'Account locked due to failed login attempts' };
    }

    // Check for privileged access outside business hours
    if (userType === 'staff') {
      const hasPrivilegedRole = await hasAnyPermission(db, userId, userType, [
        'user:create',
        'rbac:assign_role',
        'system:modify_config',
      ]);

      if (hasPrivilegedRole) {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();

        // Outside 8am-6pm Mon-Fri
        if (hour < 8 || hour >= 18 || day === 0 || day === 6) {
          // Log this as suspicious but allow for now
          // In production, might require MFA or deny
        }
      }
    }

    return { deny: false };
  } catch (error) {
    console.error('shouldDenyRequest error:', error);
    return { deny: false };
  }
}

export default {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getUserPermissions,
  getUserRoles,
  checkSoDViolation,
  assignRoleToUser,
  revokeRoleFromUser,
  canAccessCustomerData,
  canAccessAccount,
  transactionRequiresDualApproval,
  createAuditLogEntry,
  logAccessAttempt,
  getAuditLogs,
  shouldDenyRequest,
};
