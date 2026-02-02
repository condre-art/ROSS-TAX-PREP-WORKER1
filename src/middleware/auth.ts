/**
 * Middleware to require manager role
 */
export async function requireManager(req: Request, env: any): Promise<AuthenticatedUser | Response> {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "manager" && user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden - Manager access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}

/**
 * Middleware to require supervisor role
 */
export async function requireSupervisor(req: Request, env: any): Promise<AuthenticatedUser | Response> {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "supervisor" && user.role !== "manager" && user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden - Supervisor access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}

/**
 * Middleware to require team lead role
 */
export async function requireLead(req: Request, env: any): Promise<AuthenticatedUser | Response> {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "lead" && user.role !== "supervisor" && user.role !== "manager" && user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden - Team Lead access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}

/**
 * Middleware to require tax associate role
 */
export async function requireAssociate(req: Request, env: any): Promise<AuthenticatedUser | Response> {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "associate" && user.role !== "lead" && user.role !== "supervisor" && user.role !== "manager" && user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden - Tax Associate access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}

/**
 * Middleware to require PTIN holder role
 */
export async function requirePTINHolder(req: Request, env: any): Promise<AuthenticatedUser | Response> {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "ptin_holder" && user.role !== "associate" && user.role !== "lead" && user.role !== "supervisor" && user.role !== "manager" && user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden - PTIN Holder access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}

/**
 * Middleware to require ERO role
 */
export async function requireERO(req: Request, env: any): Promise<AuthenticatedUser | Response> {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "ero" && user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden - ERO access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}
import jwt from "@tsndr/cloudflare-worker-jwt";

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
  name?: string;
}

/**
 * Extract and verify JWT token from Authorization header
 * Returns user object if valid, null if invalid or missing
 */
export async function verifyJWT(req: Request, env: any): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const isValid = await jwt.verify(token, env.JWT_SECRET || "your-secret-key-change-in-production");
    if (!isValid) {
      return null;
    }

    const { payload } = jwt.decode(token);
    return payload as AuthenticatedUser;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Middleware to require authentication
 * Returns 401 response if not authenticated
 */
export async function requireAuth(req: Request, env: any): Promise<AuthenticatedUser | Response> {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}

/**
 * Middleware to require admin role
 * Returns 403 response if not admin
 */
export async function requireAdmin(req: Request, env: any): Promise<AuthenticatedUser | Response> {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}

/**
 * Middleware to require staff or admin role
 * Returns 403 response if client
 */
export async function requireStaff(req: Request, env: any): Promise<AuthenticatedUser | Response> {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Forbidden - Staff access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}

/**
 * Generate JWT token for authenticated user
 */
export async function generateToken(user: AuthenticatedUser, env: any): Promise<string> {
  const token = await jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    env.JWT_SECRET || "your-secret-key-change-in-production"
  );
  return token;
}
