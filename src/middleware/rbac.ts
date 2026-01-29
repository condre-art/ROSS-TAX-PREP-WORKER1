// --- Role-Based Access Control (RBAC) ---
// Principle of least privilege, role separation

export type UserRole = "admin" | "staff" | "preparer" | "reviewer" | "support" | "client";

export interface RolePermissions {
  role: UserRole;
  permissions: string[];
  can_access_resources: string[];
  cross_client_access: boolean;
  sensitive_operations: boolean;
}

/**
 * Define role-based permissions matrix
 * Principle of Least Privilege
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    role: "admin",
    permissions: [
      "read:all",
      "write:all",
      "delete:all",
      "manage_users",
      "manage_roles",
      "view_audit_logs",
      "manage_irs_integration",
      "issue_certificates",
      "revoke_certificates",
    ],
    can_access_resources: ["staff", "clients", "intakes", "certificates", "audit_logs"],
    cross_client_access: true,
    sensitive_operations: true,
  },

  staff: {
    role: "staff",
    permissions: [
      "read:own_clients",
      "write:own_clients",
      "read:intakes",
      "write:intakes",
      "submit:irs",
      "view:audit_logs_own",
      "sign:documents",
    ],
    can_access_resources: ["assigned_clients", "intakes", "documents"],
    cross_client_access: false,
    sensitive_operations: true,
  },

  preparer: {
    role: "preparer",
    permissions: [
      "read:assigned_intakes",
      "write:assigned_intakes",
      "upload:documents",
      "view:client_info_limited",
    ],
    can_access_resources: ["assigned_intakes", "documents"],
    cross_client_access: false,
    sensitive_operations: false,
  },

  reviewer: {
    role: "reviewer",
    permissions: [
      "read:all_intakes",
      "write:review_notes",
      "approve:intakes",
      "request:revisions",
    ],
    can_access_resources: ["all_intakes", "review_notes"],
    cross_client_access: true,
    sensitive_operations: false,
  },

  support: {
    role: "support",
    permissions: [
      "read:client_support_info",
      "write:support_tickets",
      "view:refund_status",
      "reset:passwords",
    ],
    can_access_resources: ["support_tickets", "client_public_info"],
    cross_client_access: false,
    sensitive_operations: false,
  },

  client: {
    role: "client",
    permissions: [
      "read:own_intake",
      "write:own_intake",
      "view:own_documents",
      "upload:own_documents",
      "view:refund_status",
    ],
    can_access_resources: ["own_intake", "own_documents"],
    cross_client_access: false,
    sensitive_operations: false,
  },
};

/**
 * Check if user has permission for action
 */
export function hasPermission(
  user: { role: UserRole; id: number },
  action: string,
  context?: { resource_owner_id?: number; client_id?: number }
): boolean {
  const rolePerms = ROLE_PERMISSIONS[user.role];

  // Check basic permission
  if (!rolePerms.permissions.includes(action)) {
    return false;
  }

  // Check cross-client access restrictions
  if (
    context?.client_id &&
    context?.client_id !== user.id &&
    !rolePerms.cross_client_access
  ) {
    return false;
  }

  return true;
}

/**
 * Enforce RBAC middleware
 */
export function requirePermission(action: string, context?: any) {
  return async (req: Request, env: any, user: any): Promise<boolean> => {
    if (!user) {
      console.warn(`Unauthorized access attempt for action: ${action}`);
      return false;
    }

    const allowed = hasPermission(user, action, context);

    if (!allowed) {
      console.warn(
        `Permission denied for user ${user.id} (${user.role}): ${action}`
      );

      // Log security event
      if (env.DB) {
        await env.DB.prepare(
          `INSERT INTO audit_log (action, entity, entity_id, details, created_at)
           VALUES (?, ?, ?, ?, datetime('now'))`
        )
          .bind(
            "permission_denied",
            "access_control",
            user.id,
            JSON.stringify({
              action,
              role: user.role,
              requested_context: context,
            })
          )
          .run()
          .catch((e: unknown) => console.error("Audit log failed:", e));
      }
    }

    return allowed;
  };
}

/**
 * Check if user can access specific resource
 */
export function canAccessResource(
  user: { role: UserRole; id: number },
  resourceType: string,
  resourceOwnerId?: number
): boolean {
  const rolePerms = ROLE_PERMISSIONS[user.role];

  // Check if role can access resource type
  if (!rolePerms.can_access_resources.includes(resourceType)) {
    return false;
  }

  // If resource has owner, check ownership or cross-client access
  if (resourceOwnerId && resourceOwnerId !== user.id) {
    if (!rolePerms.cross_client_access) {
      return false;
    }
  }

  return true;
}

/**
 * Quarterly access review audit
 */
export async function generateAccessReview(
  env: any,
  quarter: number,
  year: number
): Promise<any> {
  if (!env.DB) {
    throw new Error("Database not available");
  }

  const review = {
    quarter,
    year,
    timestamp: new Date().toISOString(),
    users_reviewed: [] as any[],
    findings: [] as string[],
  };

  try {
    // Fetch all active staff users
    const staffRows = await env.DB.prepare(
      "SELECT id, email, role, last_login FROM staff WHERE active = 1"
    ).all();

    for (const user of staffRows.results || []) {
      const lastActivity = await env.DB.prepare(
        "SELECT MAX(created_at) as last_activity FROM audit_log WHERE entity_id = ?"
      )
        .bind(user.id)
        .first();

      const rolePerms = ROLE_PERMISSIONS[user.role as UserRole];
      const daysInactive =
        (Date.now() -
          new Date(lastActivity?.last_activity || user.last_login).getTime()) /
        (1000 * 60 * 60 * 24);

      review.users_reviewed.push({
        user_id: user.id,
        email: user.email,
        role: user.role,
        permissions_count: rolePerms.permissions.length,
        days_since_activity: Math.round(daysInactive),
        last_activity: lastActivity?.last_activity,
      });

      // Flag inactive users (>90 days)
      if (daysInactive > 90) {
        review.findings.push(
          `User ${user.email} has been inactive for ${Math.round(daysInactive)} days`
        );
      }

      // Flag privilege escalation candidates
      if (rolePerms.sensitive_operations && daysInactive > 30) {
        review.findings.push(
          `Review ${user.email}'s need for ${user.role} role (${Math.round(daysInactive)} days inactive)`
        );
      }
    }

    // Store review in database
    await env.DB.prepare(
      `INSERT INTO access_reviews (quarter, year, data, created_at)
       VALUES (?, ?, ?, datetime('now'))`
    )
      .bind(quarter, year, JSON.stringify(review))
      .run();

    return review;
  } catch (error) {
    console.error("Access review generation failed:", error);
    throw error;
  }
}

/**
 * Prevent cross-client data access
 */
export async function enforceCrossClientBoundary(
  req: Request,
  user: { role: UserRole; id: number },
  targetClientId: number
): Promise<boolean> {
  const rolePerms = ROLE_PERMISSIONS[user.role];

  // Admins and reviewers can access all clients
  if (rolePerms.cross_client_access) {
    return true;
  }

  // Other roles can only access their own client ID
  if (targetClientId !== user.id) {
    console.warn(
      `Cross-client access attempt: User ${user.id} tried to access client ${targetClientId}`
    );
    return false;
  }

  return true;
}

/**
 * Check if action requires elevated privileges
 */
export function requiresSensitiveOperationApproval(action: string): boolean {
  const sensitiveActions = [
    "submit_irs_return",
    "revoke_certificate",
    "delete_client_data",
    "modify_refund_status",
    "issue_extension",
    "access_audit_logs",
  ];

  return sensitiveActions.includes(action);
}
