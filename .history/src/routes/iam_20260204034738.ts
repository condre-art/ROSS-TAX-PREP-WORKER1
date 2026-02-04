/**
 * IAM API Routes - User management, role assignment, access reviews
 * Admin-only endpoints for identity and access management
 */

import { Router } from 'itty-router';
import { D1Database } from '@cloudflare/workers-types';
import {
  hasPermission,
  createAuditLogEntry,
  logAccessAttempt,
} from '../utils/iam';
import {
  provisionUser,
  deprovisionUser,
  performAccessReview,
  createRole,
  addPermissionToRole,
  removePermissionFromRole,
  getUsersWithPermission,
  getAccessAnomalies,
} from '../services/iamService';

export function createIamRouter(db: D1Database): Router {
  const router = Router({ base: '/api/iam' });

  /**
   * GET /api/iam/users/:userId
   * Get user details and current roles/permissions
   * Permission: user:view_profile OR own user
   */
  router.get('/users/:userId', async (req: any, env: any) => {
    try {
      const { userId: targetUserId } = req.params;
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'client';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const canView =
        userId === targetUserId ||
        (await hasPermission(
          db,
          userId,
          userType,
          'user:view_profile'
        ));

      if (!canView) {
        const auditEntry = createAuditLogEntry(
          userId,
          userType,
          'user:view_profile',
          'user',
          'denied',
          {
            resourceId: targetUserId,
            denyReason: 'Missing permission',
            userRole: (req as any).user?.role,
            permissionRequired: 'user:view_profile',
          }
        );
        await logAccessAttempt(db, auditEntry);

        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get user info
      const user = await db
        .prepare(
          'SELECT id, name, email FROM staff WHERE id = ? LIMIT 1'
        )
        .bind(targetUserId)
        .first();

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          user,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('GET /users error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * POST /api/iam/users
   * Provision new user (create + assign role)
   * Permission: user:create
   */
  router.post('/users', async (req: any, env: any) => {
    try {
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'staff';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const canCreate = await hasPermission(
        db,
        userId,
        userType,
        'user:create'
      );

      if (!canCreate) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const {
        userId: newUserId,
        email,
        name,
        roleId,
        reason,
      } = await req.json();

      const result = await provisionUser(
        db,
        {
          userId: newUserId,
          email,
          name,
          roleId,
          userType: 'staff',
          reason: reason || 'User provisioning',
        },
        userId
      );

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          userId: newUserId,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('POST /users error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * DELETE /api/iam/users/:userId
   * Deprovisioning (offboard) user
   * Permission: user:delete
   */
  router.delete('/users/:userId', async (req: any, env: any) => {
    try {
      const { userId: targetUserId } = req.params;
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'staff';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const canDelete = await hasPermission(
        db,
        userId,
        userType,
        'user:delete'
      );

      if (!canDelete) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { reason } = await req.json();

      const result = await deprovisionUser(
        db,
        targetUserId,
        'staff',
        userId,
        reason
      );

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('DELETE /users error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * POST /api/iam/roles
   * Create new role
   * Permission: rbac:modify_role
   */
  router.post('/roles', async (req: any, env: any) => {
    try {
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'staff';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const canModify = await hasPermission(
        db,
        userId,
        userType,
        'rbac:modify_role'
      );

      if (!canModify) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { name, description, roleType, permissions } = await req.json();

      const result = await createRole(
        db,
        {
          name,
          description,
          roleType,
          permissions,
        },
        userId
      );

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          roleId: result.roleId,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('POST /roles error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * POST /api/iam/roles/:roleId/permissions
   * Add permission to role
   * Permission: rbac:manage_permissions
   */
  router.post('/roles/:roleId/permissions', async (req: any, env: any) => {
    try {
      const { roleId } = req.params;
      const userId = (req as any).user?.id;
      const userType = (req as any).user?.type || 'staff';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const canManage = await hasPermission(
        db,
        userId,
        userType,
        'rbac:manage_permissions'
      );

      if (!canManage) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { permissionId, reason } = await req.json();

      const result = await addPermissionToRole(
        db,
        roleId,
        permissionId,
        userId,
        reason
      );

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('POST /roles/:roleId/permissions error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * DELETE /api/iam/roles/:roleId/permissions/:permissionId
   * Remove permission from role
   * Permission: rbac:manage_permissions
   */
  router.delete(
    '/roles/:roleId/permissions/:permissionId',
    async (req: any, env: any) => {
      try {
        const { roleId, permissionId } = req.params;
        const auth = await verifyAuth(req, env);

        if (!auth.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Check permission
        const canManage = await hasPermission(
          db,
          auth.user.id,
          'staff',
          'rbac:manage_permissions'
        );

        if (!canManage) {
          return new Response(JSON.stringify({ error: 'Access denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const result = await removePermissionFromRole(
          db,
          roleId,
          permissionId,
          auth.user.id
        );

        if (!result.success) {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('DELETE /roles/:roleId/permissions error:', error);
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  );

  /**
   * POST /api/iam/access-reviews
   * Perform quarterly access review
   * Permission: rbac:access_certification
   */
  router.post('/access-reviews', async (req: any, env: any) => {
    try {
      const auth = await verifyAuth(req, env);

      if (!auth.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const canReview = await hasPermission(
        db,
        auth.user.id,
        'staff',
        'rbac:access_certification'
      );

      if (!canReview) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { userId, userType, certificationStatus, notes } = await req.json();

      const result = await performAccessReview(db, {
        userId,
        userType,
        reviewerId: auth.user.id,
        certificationStatus,
        notes,
      });

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('POST /access-reviews error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * GET /api/iam/anomalies
   * Get access anomalies for investigation
   * Permission: audit:view_logs OR fraud:investigate_case
   */
  router.get('/anomalies', async (req: any, env: any) => {
    try {
      const auth = await verifyAuth(req, env);

      if (!auth.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const canView =
        (await hasPermission(
          db,
          auth.user.id,
          'staff',
          'audit:view_logs'
        )) ||
        (await hasPermission(
          db,
          auth.user.id,
          'staff',
          'fraud:investigate_case'
        ));

      if (!canView) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const timeWindow = parseInt(req.query?.timeWindow || '60');
      const anomalies = await getAccessAnomalies(db, timeWindow);

      return new Response(
        JSON.stringify({
          anomalies,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('GET /anomalies error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  /**
   * GET /api/iam/permissions/:permissionName/users
   * Get all users with a specific permission
   * Permission: audit:view_logs
   */
  router.get(
    '/permissions/:permissionName/users',
    async (req: any, env: any) => {
      try {
        const { permissionName } = req.params;
        const auth = await verifyAuth(req, env);

        if (!auth.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Check permission
        const canView = await hasPermission(
          db,
          auth.user.id,
          'staff',
          'audit:view_logs'
        );

        if (!canView) {
          return new Response(JSON.stringify({ error: 'Access denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const users = await getUsersWithPermission(db, permissionName, 'staff');

        return new Response(
          JSON.stringify({
            permission: permissionName,
            users,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error(
          'GET /permissions/:permissionName/users error:',
          error
        );
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  );

  return router;
}

export default { createIamRouter };
