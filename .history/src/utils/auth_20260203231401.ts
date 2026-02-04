/**
 * Authentication utilities
 * JWT verification and role-based authorization
 */

import jwt from '@tsndr/cloudflare-worker-jwt';

export interface AuthResult {
  valid: boolean;
  userId?: string;
  role?: string;
  email?: string;
  error?: string;
}

/**
 * Verify JWT token and extract user info
 */
export async function verifyAuth(req: Request, env: any): Promise<AuthResult> {
  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'No authorization token provided' };
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT
    const isValid = await jwt.verify(token, env.JWT_SECRET || 'default-secret');
    
    if (!isValid) {
      return { valid: false, error: 'Invalid or expired token' };
    }
    
    // Decode JWT payload
    const { payload } = jwt.decode(token);
    
    return {
      valid: true,
      userId: payload.sub || payload.userId,
      role: payload.role,
      email: payload.email
    };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(auth: AuthResult, allowedRoles: string[]): boolean {
  if (!auth.valid || !auth.role) {
    return false;
  }
  
  return allowedRoles.includes(auth.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(auth: AuthResult): boolean {
  return auth.valid && (auth.role === 'admin' || auth.role === 'ero');
}

/**
 * Check if user is staff
 */
export function isStaff(auth: AuthResult): boolean {
  return auth.valid && (auth.role === 'admin' || auth.role === 'ero' || auth.role === 'tax_prep' || auth.role === 'manager');
}
