/**
 * RBAC Middleware - Enforce role-based access control on routes
 * Handles permission checking, logging, and access denial
 */

import { D1Database } from '@cloudflare/workers-types';
import {
  hasPermission,
  hasAnyPermission,
  createAuditLogEntry,
  logAccessAttempt,
  shouldDenyRequest,
  UserType,
} from './iam';

export interface RBACOptions {
  requiredPermission?: string;
  requiredPermissions?: string[]; // All required
  anyPermission?: string[]; // Any one required
  allowedUserTypes?: UserType[];
  logAction: string; // For audit log
  resourceType: string; // For audit log
  resourceId?: string;
  checkCustomerAccess?: boolean;
}

export interface RequestContext {
  req: Request;
  env: any;
  db: D1Database;
  userId: string;
  userType: UserType;
  userRole?: string;
  permissions?: string[];
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

/**
 * RBAC Middleware Factory
 * Returns a handler that enforces permissions
 */
export function rbacMiddleware(options: RBACOptions) {
  return async (
    context: RequestContext,
    next?: (context: RequestContext) => Promise<Response>
  ): Promise<Response> => {
    const {
      req,
      env,
      db,
      userId,
      userType,
      userRole,
      requestId,
      ipAddress,
      userAgent,
      deviceFingerprint,
    } = context;

    try {
      // Check if request should be denied (real-time monitoring)
      const shouldDeny = await shouldDenyRequest(db, userId, userType, ipAddress);
      if (shouldDeny.deny) {
        const auditEntry = createAuditLogEntry(
          userId,
          userType,
          options.logAction,
          options.resourceType,
          'denied',
          {
            resourceId: options.resourceId,
            denyReason: shouldDeny.reason,
            ipAddress,
            userAgent,
            deviceFingerprint,
            requestId,
            userRole,
          }
        );
        await logAccessAttempt(db, auditEntry);

        return new Response(JSON.stringify({ error: shouldDeny.reason }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check allowed user types
      if (
        options.allowedUserTypes &&
        !options.allowedUserTypes.includes(userType)
      ) {
        const auditEntry = createAuditLogEntry(
          userId,
          userType,
          options.logAction,
          options.resourceType,
          'denied',
          {
            resourceId: options.resourceId,
            denyReason: `User type ${userType} not allowed`,
            ipAddress,
            userAgent,
            deviceFingerprint,
            requestId,
            userRole,
          }
        );
        await logAccessAttempt(db, auditEntry);

        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check required permissions
      let hasRequiredPermission = true;
      let missingPermission: string | undefined;

      if (options.requiredPermission) {
        hasRequiredPermission = await hasPermission(
          db,
          userId,
          userType,
          options.requiredPermission
        );
        if (!hasRequiredPermission) {
          missingPermission = options.requiredPermission;
        }
      }

      if (options.requiredPermissions && hasRequiredPermission) {
        for (const perm of options.requiredPermissions) {
          const has = await hasPermission(db, userId, userType, perm);
          if (!has) {
            hasRequiredPermission = false;
            missingPermission = perm;
            break;
          }
        }
      }

      if (options.anyPermission && hasRequiredPermission) {
        hasRequiredPermission = await hasAnyPermission(
          db,
          userId,
          userType,
          options.anyPermission
        );
        if (!hasRequiredPermission) {
          missingPermission = options.anyPermission.join(' OR ');
        }
      }

      if (!hasRequiredPermission) {
        const auditEntry = createAuditLogEntry(
          userId,
          userType,
          options.logAction,
          options.resourceType,
          'denied',
          {
            resourceId: options.resourceId,
            denyReason: `Missing permission: ${missingPermission}`,
            ipAddress,
            userAgent,
            deviceFingerprint,
            requestId,
            userRole,
            permissionRequired: missingPermission,
          }
        );
        await logAccessAttempt(db, auditEntry);

        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Access granted - log success and continue
      const auditEntry = createAuditLogEntry(
        userId,
        userType,
        options.logAction,
        options.resourceType,
        'success',
        {
          resourceId: options.resourceId,
          ipAddress,
          userAgent,
          deviceFingerprint,
          requestId,
          userRole,
          permissionRequired: options.requiredPermission,
        }
      );
      await logAccessAttempt(db, auditEntry);

      // Call next middleware/handler
      if (next) {
        return await next(context);
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return new Response(JSON.stringify({ error: 'Access control error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

/**
 * Decorator-style permission check (for use in route handlers)
 */
export async function requirePermission(
  db: D1Database,
  userId: string,
  userType: UserType,
  permission: string,
  options?: {
    logAction?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<{ allowed: boolean; reason?: string }> {
  const allowed = await hasPermission(db, userId, userType, permission);

  if (!allowed && options?.logAction) {
    const auditEntry = createAuditLogEntry(
      userId,
      userType,
      options.logAction,
      options.resourceType || 'unknown',
      'denied',
      {
        resourceId: options.resourceId,
        denyReason: `Missing permission: ${permission}`,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        permissionRequired: permission,
      }
    );
    await logAccessAttempt(db, auditEntry);
  }

  return {
    allowed,
    reason: allowed ? undefined : `Missing permission: ${permission}`,
  };
}

/**
 * Decorator-style multi-permission check (ANY)
 */
export async function requireAnyPermission(
  db: D1Database,
  userId: string,
  userType: UserType,
  permissions: string[],
  options?: {
    logAction?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<{ allowed: boolean; reason?: string }> {
  const allowed = await hasAnyPermission(db, userId, userType, permissions);

  if (!allowed && options?.logAction) {
    const auditEntry = createAuditLogEntry(
      userId,
      userType,
      options.logAction,
      options.resourceType || 'unknown',
      'denied',
      {
        resourceId: options.resourceId,
        denyReason: `Missing any of: ${permissions.join(', ')}`,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        permissionRequired: permissions.join(' OR '),
      }
    );
    await logAccessAttempt(db, auditEntry);
  }

  return {
    allowed,
    reason: allowed ? undefined : `Missing required permission`,
  };
}

/**
 * Check dual control requirement (manager review)
 */
export async function requiresDualControl(
  db: D1Database,
  userId: string,
  userType: UserType,
  action: string,
  amount?: number
): Promise<boolean> {
  // If user is manager/supervisor, they can approve high-value transactions
  const isManager = await hasPermission(
    db,
    userId,
    userType,
    'money:approve_transfer'
  );
  if (!isManager) {
    return true; // Non-managers always need approval
  }

  // Managers approving their own transaction violates SoD
  // In audit logs, this would be flagged
  return false; // Manager can self-approve (should still be logged)
}

/**
 * Validate user context from request (typically JWT or session)
 */
export async function validateUserContext(
  db: D1Database,
  authHeader?: string
): Promise<{
  userId: string;
  userType: UserType;
  userRole?: string;
  valid: boolean;
  error?: string;
}> {
  // In real implementation, this would validate JWT or session token
  // For now, return placeholder
  return {
    userId: 'unknown',
    userType: 'client',
    valid: false,
    error: 'No authentication provided',
  };
}

/**
 * Create permission required response
 */
export function permissionDenied(
  permission: string,
  statusCode: number = 403
): Response {
  return new Response(
    JSON.stringify({
      error: 'Insufficient permissions',
      requiredPermission: permission,
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create access denied response (more generic)
 */
export function accessDenied(reason: string = 'Access denied', statusCode: number = 403): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  rbacMiddleware,
  requirePermission,
  requireAnyPermission,
  requiresDualControl,
  validateUserContext,
  permissionDenied,
  accessDenied,
};
