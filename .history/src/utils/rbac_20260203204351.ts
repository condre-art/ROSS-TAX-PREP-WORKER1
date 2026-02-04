// src/utils/rbac.ts
// Role-Based Access Control (RBAC) System for LMS

export type UserRole = 'super_admin' | 'admin' | 'instructor' | 'auditor' | 'student';

export interface Permission {
  resource: string;
  action: string;
}

// Role permission definitions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    { resource: '*', action: '*' } // Full access to everything
  ],
  
  admin: [
    // User management
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    
    // Course management
    { resource: 'courses', action: 'create' },
    { resource: 'courses', action: 'read' },
    { resource: 'courses', action: 'update' },
    { resource: 'courses', action: 'delete' },
    
    // Enrollment management
    { resource: 'enrollments', action: 'create' },
    { resource: 'enrollments', action: 'read' },
    { resource: 'enrollments', action: 'update' },
    
    // Certificate management
    { resource: 'certificates', action: 'read' },
    { resource: 'certificates', action: 'issue' },
    { resource: 'certificates', action: 'revoke' },
    
    // Analytics
    { resource: 'analytics', action: 'read' },
    
    // Instructors
    { resource: 'instructors', action: 'create' },
    { resource: 'instructors', action: 'read' },
    { resource: 'instructors', action: 'update' },
    
    // Audit logs
    { resource: 'audit_logs', action: 'read' }
  ],
  
  instructor: [
    // Course content
    { resource: 'courses', action: 'read' },
    { resource: 'courses', action: 'update' }, // Only assigned courses
    
    // Lessons
    { resource: 'lessons', action: 'create' },
    { resource: 'lessons', action: 'read' },
    { resource: 'lessons', action: 'update' },
    { resource: 'lessons', action: 'unlock' },
    { resource: 'lessons', action: 'lock' },
    
    // Students
    { resource: 'students', action: 'read' }, // Only enrolled in their courses
    { resource: 'student_progress', action: 'read' },
    
    // Grading
    { resource: 'quizzes', action: 'read' },
    { resource: 'quizzes', action: 'reset' },
    { resource: 'grades', action: 'read' },
    { resource: 'grades', action: 'update' },
    
    // Certificates
    { resource: 'certificates', action: 'read' },
    { resource: 'certificates', action: 'issue' }, // Only for their students
    
    // Transcripts
    { resource: 'transcripts', action: 'read' },
    { resource: 'transcripts', action: 'export' }
  ],
  
  auditor: [
    // Read-only access
    { resource: 'courses', action: 'read' },
    { resource: 'enrollments', action: 'read' },
    { resource: 'students', action: 'read' },
    { resource: 'certificates', action: 'read' },
    { resource: 'analytics', action: 'read' },
    { resource: 'audit_logs', action: 'read' },
    { resource: 'transcripts', action: 'read' },
    { resource: 'transcripts', action: 'export' }
  ],
  
  student: [
    // Own data only
    { resource: 'courses', action: 'read' },
    { resource: 'enrollments', action: 'read' }, // Own enrollments
    { resource: 'lessons', action: 'read' },
    { resource: 'quizzes', action: 'attempt' },
    { resource: 'student_progress', action: 'read' }, // Own progress
    { resource: 'certificates', action: 'read' }, // Own certificates
    { resource: 'certificates', action: 'download' }, // Own certificates
    { resource: 'transcripts', action: 'read' }, // Own transcript
    { resource: 'transcripts', action: 'export' } // Own transcript
  ]
};

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions) {
    return false;
  }
  
  // Check for wildcard permission (super admin)
  if (permissions.some(p => p.resource === '*' && p.action === '*')) {
    return true;
  }
  
  // Check for exact permission
  if (permissions.some(p => p.resource === resource && p.action === action)) {
    return true;
  }
  
  // Check for wildcard action on specific resource
  if (permissions.some(p => p.resource === resource && p.action === '*')) {
    return true;
  }
  
  return false;
}

/**
 * Require permission middleware
 * Returns 403 if user doesn't have permission
 */
export function requirePermission(resource: string, action: string) {
  return (req: any, env: any) => {
    const user = req.user; // Assumes user is attached by auth middleware
    
    if (!user || !user.role) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!hasPermission(user.role, resource, action)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: `User role '${user.role}' does not have permission to '${action}' on '${resource}'`
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Permission granted, continue
    return null;
  };
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role A has higher authority than role B
 */
export function hasHigherAuthority(roleA: UserRole, roleB: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    super_admin: 5,
    admin: 4,
    instructor: 3,
    auditor: 2,
    student: 1
  };
  
  return hierarchy[roleA] > hierarchy[roleB];
}

/**
 * Get user-friendly role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    instructor: 'Instructor',
    auditor: 'Auditor',
    student: 'Student'
  };
  
  return names[role] || role;
}
