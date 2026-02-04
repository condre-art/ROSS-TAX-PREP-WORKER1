/**
 * IAM Service - Business logic for user provisioning, access reviews, etc.
 * Implements RBAC pattern with audit trail
 */

import { D1Database } from '@cloudflare/workers-types';
import { logAccessAttempt, createAuditLogEntry } from '../utils/iam';

export interface UserProvisioningRequest {
  userId: string;
  userType: 'staff' | 'client';
  email: string;
  name: string;
  roleId: string;
  reason: string;
}

export interface AccessReviewRequest {
  userId: string;
  userType: 'staff' | 'client';
  reviewerId: string;
  certificationStatus: 'approved' | 'revoked';
  notes?: string;
}

export interface RoleCreationRequest {
  name: string;
  description?: string;
  roleType: 'staff' | 'customer' | 'preparer' | 'system';
  permissions: string[]; // Permission IDs
  isSystemRole?: boolean;
}

/**
 * Provision new user (create account + assign role)
 */
export async function provisionUser(
  db: D1Database,
  request: UserProvisioningRequest,
  createdBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Check if user already exists
    const existingUser = await db
      .prepare(
        request.userType === 'staff'
          ? 'SELECT 1 FROM staff WHERE id = ? LIMIT 1'
          : 'SELECT 1 FROM clients WHERE id = ? LIMIT 1'
      )
      .bind(request.userId)
      .first();

    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    // Step 2: Create user account
    if (request.userType === 'staff') {
      // Insert into staff table (password would be set separately)
      await db
        .prepare(
          `INSERT INTO staff (id, name, email, role) 
           VALUES (?, ?, ?, ?)
        `
        )
        .bind(request.userId, request.name, request.email, 'staff')
        .run();
    } else {
      // Insert into clients table
      await db
        .prepare(
          `INSERT INTO clients (id, name, email, role) 
           VALUES (?, ?, ?, ?)
        `
        )
        .bind(request.userId, request.name, request.email, 'client')
        .run();
    }

    // Step 3: Assign role
    const roleAssignment = await assignRoleToUser(
      db,
      request.userId,
      request.userType,
      request.roleId,
      createdBy,
      request.reason
    );

    if (!roleAssignment.success) {
      // Rollback user creation
      // In production, use transaction
      return { success: false, error: `Role assignment failed: ${roleAssignment.error}` };
    }

    // Step 4: Log provisioning action
    const auditEntry = createAuditLogEntry(
      createdBy,
      'staff',
      'user:create',
      'user',
      'success',
      {
        resourceId: request.userId,
        entity: 'user',
        entityId: request.userId,
      }
    );
    await logAccessAttempt(db, auditEntry);

    return { success: true };
  } catch (error) {
    console.error('provisionUser error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Deprovisioning (offboard user)
 */
export async function deprovisionUser(
  db: D1Database,
  userId: string,
  userType: 'staff' | 'client',
  deactivatedBy: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Get all active roles
    const roles = await getUserRoles(db, userId, userType);

    // Step 2: Revoke all roles
    for (const roleName of roles) {
      const role = await db
        .prepare('SELECT id FROM roles WHERE name = ? LIMIT 1')
        .bind(roleName)
        .first();

      if (role) {
        await revokeRoleFromUser(db, userId, userType, (role as any).id);
      }
    }

    // Step 3: Disable/mark as inactive
    if (userType === 'staff') {
      // Mark staff as inactive (don't delete for audit trail)
      // Could add is_active field
    } else {
      // Mark client as inactive
      // Could add is_active field
    }

    // Step 4: Log deprovisioning
    const auditEntry = createAuditLogEntry(
      deactivatedBy,
      'staff',
      'user:delete',
      'user',
      'success',
      {
        resourceId: userId,
        entity: 'user',
        entityId: userId,
      }
    );
    await logAccessAttempt(db, auditEntry);

    return { success: true };
  } catch (error) {
    console.error('deprovisionUser error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Perform quarterly access review for a user
 */
export async function performAccessReview(
  db: D1Database,
  request: AccessReviewRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const reviewId = `review-${request.userId}-${Date.now()}`;

    // Check for SoD violations
    const userPermissions = await getUserPermissions(
      db,
      request.userId,
      request.userType
    );
    const violations = [];

    for (const perm of userPermissions) {
      const sodCheck = await checkSoDViolation(
        db,
        request.userId,
        request.userType,
        perm
      );
      if (sodCheck.violates) {
        violations.push({
          permission: perm,
          conflicts: sodCheck.conflictingPermission,
        });
      }
    }

    // If violations found and status is 'approved', flag for investigation
    if (violations.length > 0 && request.certificationStatus === 'approved') {
      // Log as flag for investigation
      console.warn(
        `Access review found SoD violations for ${request.userId}`,
        violations
      );
    }

    // Record certification result
    await db
      .prepare(
        `
      INSERT INTO role_certifications (
        id, user_id, user_type, reviewer_id, certification_status, notes, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+90 days'))
    `
      )
      .bind(
        reviewId,
        request.userId,
        request.userType,
        request.reviewerId,
        request.certificationStatus,
        request.notes || null
      )
      .run();

    // If revoked, deactivate roles
    if (request.certificationStatus === 'revoked') {
      await deprovisionUser(
        db,
        request.userId,
        request.userType,
        request.reviewerId,
        'Access review revoked'
      );
    }

    return { success: true };
  } catch (error) {
    console.error('performAccessReview error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Create new role definition
 */
export async function createRole(
  db: D1Database,
  request: RoleCreationRequest,
  createdBy: string
): Promise<{ success: boolean; roleId?: string; error?: string }> {
  try {
    const roleId = `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create role
    await db
      .prepare(
        `
      INSERT INTO roles (id, name, description, role_type, is_system_role)
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .bind(
        roleId,
        request.name,
        request.description || null,
        request.roleType,
        request.isSystemRole ? 1 : 0
      )
      .run();

    // Assign permissions to role
    for (const permissionId of request.permissions) {
      await db
        .prepare(
          `
        INSERT INTO role_permissions (role_id, permission_id, granted_by)
        VALUES (?, ?, ?)
      `
        )
        .bind(roleId, permissionId, createdBy)
        .run();
    }

    // Log creation
    const auditEntry = createAuditLogEntry(
      createdBy,
      'staff',
      'rbac:modify_role',
      'role',
      'success',
      {
        resourceId: roleId,
        entity: 'role',
        entityId: roleId,
      }
    );
    await logAccessAttempt(db, auditEntry);

    return { success: true, roleId };
  } catch (error) {
    console.error('createRole error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Add permission to role
 */
export async function addPermissionToRole(
  db: D1Database,
  roleId: string,
  permissionId: string,
  grantedBy: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if relationship already exists
    const exists = await db
      .prepare(
        `
      SELECT 1 FROM role_permissions
      WHERE role_id = ? AND permission_id = ?
      LIMIT 1
    `
      )
      .bind(roleId, permissionId)
      .first();

    if (exists) {
      return { success: false, error: 'Permission already assigned to role' };
    }

    // Add permission
    await db
      .prepare(
        `
      INSERT INTO role_permissions (role_id, permission_id, granted_by, reason)
      VALUES (?, ?, ?, ?)
    `
      )
      .bind(roleId, permissionId, grantedBy, reason || null)
      .run();

    return { success: true };
  } catch (error) {
    console.error('addPermissionToRole error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Remove permission from role
 */
export async function removePermissionFromRole(
  db: D1Database,
  roleId: string,
  permissionId: string,
  revokedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get users with this role (to notify of change)
    const usersWithRole = await db
      .prepare(
        `
      SELECT DISTINCT user_id, user_type
      FROM user_roles
      WHERE role_id = ? AND is_active = 1
    `
      )
      .bind(roleId)
      .all();

    // Remove permission
    await db
      .prepare(
        `
      DELETE FROM role_permissions
      WHERE role_id = ? AND permission_id = ?
    `
      )
      .bind(roleId, permissionId)
      .run();

    // Log removal
    const auditEntry = createAuditLogEntry(
      revokedBy,
      'staff',
      'rbac:manage_permissions',
      'permission',
      'success',
      {
        resourceId: permissionId,
        entity: 'role',
        entityId: roleId,
      }
    );
    await logAccessAttempt(db, auditEntry);

    // TODO: In production, notify all affected users

    return { success: true };
  } catch (error) {
    console.error('removePermissionFromRole error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get all users with a specific permission
 */
export async function getUsersWithPermission(
  db: D1Database,
  permissionName: string,
  userType?: 'staff' | 'client'
): Promise<
  Array<{ userId: string; userType: 'staff' | 'client'; roles: string[] }>
> {
  try {
    const query = `
      SELECT DISTINCT ur.user_id, ur.user_type, GROUP_CONCAT(r.name) as roles
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      JOIN roles r ON ur.role_id = r.id
      WHERE p.name = ?
        AND ur.is_active = 1
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
      ${userType ? 'AND ur.user_type = ?' : ''}
      GROUP BY ur.user_id, ur.user_type
    `;

    const bindings = [permissionName];
    if (userType) bindings.push(userType);

    const result = await db.prepare(query).bind(...bindings).all();

    return (
      result.results?.map((row: any) => ({
        userId: row.user_id,
        userType: row.user_type,
        roles: row.roles?.split(',') || [],
      })) || []
    );
  } catch (error) {
    console.error('getUsersWithPermission error:', error);
    return [];
  }
}

/**
 * Audit log analysis - find anomalies
 */
export async function getAccessAnomalies(
  db: D1Database,
  timeWindowMinutes: number = 60
): Promise<Array<{ userId: string; anomalyType: string; severity: string }>> {
  try {
    const anomalies: Array<{
      userId: string;
      anomalyType: string;
      severity: string;
    }> = [];

    // Check for multiple failed logins
    const failedLogins = await db
      .prepare(
        `
      SELECT user_id, COUNT(*) as count
      FROM access_audit_log
      WHERE action = 'login'
        AND result = 'failed'
        AND timestamp > datetime('now', ? || ' minutes')
      GROUP BY user_id
      HAVING count >= 5
    `
      )
      .bind(-timeWindowMinutes)
      .all();

    (failedLogins.results || []).forEach((row: any) => {
      anomalies.push({
        userId: row.user_id,
        anomalyType: 'excessive_failed_logins',
        severity: 'high',
      });
    });

    // Check for unusual data access (high volume)
    const bulkDataAccess = await db
      .prepare(
        `
      SELECT user_id, COUNT(*) as count
      FROM access_audit_log
      WHERE action = 'view_data'
        AND timestamp > datetime('now', ? || ' minutes')
      GROUP BY user_id
      HAVING count > 100
    `
      )
      .bind(-timeWindowMinutes)
      .all();

    (bulkDataAccess.results || []).forEach((row: any) => {
      anomalies.push({
        userId: row.user_id,
        anomalyType: 'bulk_data_access',
        severity: 'medium',
      });
    });

    // Check for after-hours privileged access
    // (simplified - in production would be more sophisticated)

    return anomalies;
  } catch (error) {
    console.error('getAccessAnomalies error:', error);
    return [];
  }
}

export default {
  provisionUser,
  deprovisionUser,
  performAccessReview,
  createRole,
  addPermissionToRole,
  removePermissionFromRole,
  getUsersWithPermission,
  getAccessAnomalies,
};
