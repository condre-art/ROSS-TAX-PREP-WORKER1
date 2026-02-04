/**
 * Permission Middleware & Utilities
 * Comprehensive role-based access control enforcement
 */

import { IRequest } from 'itty-router';
import jwt from '@tsndr/cloudflare-worker-jwt';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  role_level: number;
  permissions: string[];
}

interface PermissionCheck {
  permission: string;
  requireMfa?: boolean;
  auditRequired?: boolean;
}

/**
 * Permission Hierarchy Levels
 */
export const ROLE_LEVELS = {
  client: 1,
  preparer: 2,
  ero: 3,
  admin: 4,
  owner: 5
} as const;

/**
 * Verify JWT token and extract user
 */
export async function verifyAuthToken(request: IRequest, env: Env): Promise<User | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const isValid = await jwt.verify(token, env.JWT_SECRET);
    if (!isValid) return null;

    const decoded = jwt.decode(token);
    const payload = decoded.payload as any;

    // Load user permissions from database
    const { results } = await env.DB.prepare(`
      SELECT DISTINCT rp.permission_key
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_name = rp.role_name
      WHERE ur.user_id = ?
        AND (ur.effective_until IS NULL OR ur.effective_until > datetime('now'))
        AND ur.effective_from <= datetime('now')
    `).bind(payload.sub).all();

    const permissions = results?.map((row: any) => row.permission_key) || [];

    // Get role level
    const roleLevel = ROLE_LEVELS[payload.role as keyof typeof ROLE_LEVELS] || 1;

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      role_level: roleLevel,
      permissions
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: User, permission: string): boolean {
  // Owner role has all permissions
  if (user.role === 'owner') return true;

  // Admin role has all permissions except ownership transfer
  if (user.role === 'admin' && !permission.startsWith('system:database')) return true;

  // ERO role has all efile and mef permissions
  if (user.role === 'ero' && (permission.startsWith('efile:') || permission.startsWith('mef:'))) return true;

  // Check explicit permission
  return user.permissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(user: User, permissions: string[]): boolean {
  return permissions.some(p => hasPermission(user, p));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(user: User, permissions: string[]): boolean {
  return permissions.every(p => hasPermission(user, p));
}

/**
 * Check if user's role level meets minimum requirement
 */
export function hasMinimumRoleLevel(user: User, minLevel: number): boolean {
  return user.role_level >= minLevel;
}

/**
 * Require authentication middleware
 */
export function requireAuth(env: Env) {
  return async (request: IRequest) => {
    const user = await verifyAuthToken(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Attach user to request
    (request as any).user = user;
    return null; // Continue to next handler
  };
}

/**
 * Require specific permission middleware
 */
export function requirePermission(permission: string, env: Env) {
  return async (request: IRequest) => {
    const user = await verifyAuthToken(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!hasPermission(user, permission)) {
      // Log unauthorized access attempt
      await logAuditEvent(env, {
        action: 'permission_denied',
        user_id: user.id,
        resource_type: 'permission',
        resource_id: permission,
        details: { role: user.role, attempted_permission: permission },
        timestamp: new Date().toISOString()
      });

      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions',
        required: permission,
        current_role: user.role
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if permission requires MFA
    const permissionInfo = await env.DB.prepare(`
      SELECT requires_mfa, audit_required, is_sensitive
      FROM permissions
      WHERE permission_key = ?
    `).bind(permission).first<any>();

    if (permissionInfo?.requires_mfa) {
      const mfaVerified = request.headers.get('X-MFA-Verified');
      if (mfaVerified !== 'true') {
        return new Response(JSON.stringify({ 
          error: 'MFA verification required',
          mfa_required: true
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Attach user to request
    (request as any).user = user;
    return null; // Continue to next handler
  };
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(permissions: string[], env: Env) {
  return async (request: IRequest) => {
    const user = await verifyAuthToken(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!hasAnyPermission(user, permissions)) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions',
        required_any: permissions,
        current_role: user.role
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    (request as any).user = user;
    return null;
  };
}

/**
 * Require minimum role level
 */
export function requireRole(minLevel: number, env: Env) {
  return async (request: IRequest) => {
    const user = await verifyAuthToken(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!hasMinimumRoleLevel(user, minLevel)) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient role level',
        required_level: minLevel,
        current_role: user.role,
        current_level: user.role_level
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    (request as any).user = user;
    return null;
  };
}

/**
 * Check if feature flag is enabled for user
 */
export async function isFeatureEnabled(
  env: Env, 
  featureKey: string, 
  user?: User
): Promise<boolean> {
  const feature = await env.DB.prepare(`
    SELECT is_enabled, min_role_level, rollout_percentage
    FROM feature_flags
    WHERE feature_key = ?
  `).bind(featureKey).first<any>();

  if (!feature) return false;
  if (!feature.is_enabled) return false;

  // Check role level requirement
  if (user && user.role_level < feature.min_role_level) return false;

  // Check rollout percentage (simple hash-based distribution)
  if (feature.rollout_percentage < 100 && user) {
    const hash = simpleHash(user.id);
    const userPercentile = hash % 100;
    if (userPercentile >= feature.rollout_percentage) return false;
  }

  return true;
}

/**
 * Simple hash function for rollout distribution
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Log audit event
 */
export async function logAuditEvent(env: Env, event: {
  action: string;
  user_id?: string;
  resource_type: string;
  resource_id: string;
  details: any;
  timestamp: string;
}): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_logs (action, user_id, resource_type, resource_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      event.action,
      event.user_id || 'system',
      event.resource_type,
      event.resource_id,
      JSON.stringify(event.details),
      event.timestamp
    ).run();
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get user's effective permissions
 */
export async function getUserPermissions(env: Env, userId: string): Promise<string[]> {
  const { results } = await env.DB.prepare(`
    SELECT DISTINCT rp.permission_key
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_name = rp.role_name
    WHERE ur.user_id = ?
      AND (ur.effective_until IS NULL OR ur.effective_until > datetime('now'))
      AND ur.effective_from <= datetime('now')
    ORDER BY rp.permission_key
  `).bind(userId).all();

  return results?.map((row: any) => row.permission_key) || [];
}

/**
 * Grant permission to role (admin only)
 */
export async function grantPermissionToRole(
  env: Env,
  adminUserId: string,
  roleName: string,
  permissionKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_name, permission_key, granted_at, granted_by)
      VALUES (?, ?, datetime('now'), ?)
    `).bind(roleName, permissionKey, adminUserId).run();

    await logAuditEvent(env, {
      action: 'permission_granted',
      user_id: adminUserId,
      resource_type: 'role',
      resource_id: roleName,
      details: { permission: permissionKey },
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Revoke permission from role (admin only)
 */
export async function revokePermissionFromRole(
  env: Env,
  adminUserId: string,
  roleName: string,
  permissionKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await env.DB.prepare(`
      DELETE FROM role_permissions
      WHERE role_name = ? AND permission_key = ?
    `).bind(roleName, permissionKey).run();

    await logAuditEvent(env, {
      action: 'permission_revoked',
      user_id: adminUserId,
      resource_type: 'role',
      resource_id: roleName,
      details: { permission: permissionKey },
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  env: Env,
  adminUserId: string,
  userId: string,
  userType: 'client' | 'staff',
  roleName: string,
  reason?: string,
  effectiveUntil?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await env.DB.prepare(`
      INSERT INTO user_roles (
        user_id, user_type, role_name, effective_from, effective_until, 
        assigned_by, assignment_reason, created_at
      ) VALUES (?, ?, ?, datetime('now'), ?, ?, ?, datetime('now'))
    `).bind(
      userId,
      userType,
      roleName,
      effectiveUntil || null,
      adminUserId,
      reason || 'Role assignment'
    ).run();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get role information with permissions
 */
export async function getRoleInfo(env: Env, roleName: string): Promise<any> {
  const role = await env.DB.prepare(`
    SELECT * FROM roles WHERE role_name = ?
  `).bind(roleName).first();

  if (!role) return null;

  const { results: permissions } = await env.DB.prepare(`
    SELECT p.permission_key, p.permission_name, p.permission_group, 
           p.description, p.requires_mfa, p.is_sensitive
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_key = p.permission_key
    WHERE rp.role_name = ?
    ORDER BY p.permission_group, p.permission_name
  `).bind(roleName).all();

  return {
    ...role,
    permissions: permissions || []
  };
}

/**
 * Export permission utilities
 */
export const PermissionUtils = {
  verifyAuthToken,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasMinimumRoleLevel,
  isFeatureEnabled,
  getUserPermissions,
  grantPermissionToRole,
  revokePermissionFromRole,
  assignRoleToUser,
  getRoleInfo,
  logAuditEvent
};

export default PermissionUtils;
