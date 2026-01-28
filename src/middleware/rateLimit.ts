/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse using Cloudflare KV
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix?: string;
}

/**
 * Rate limit by IP address
 * @param req - Request object
 * @param env - Environment with KV_NAMESPACE
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null if allowed
 */
export async function rateLimitByIP(
  req: Request,
  env: any,
  config: RateLimitConfig = { maxRequests: 10, windowSeconds: 60 }
): Promise<Response | null> {
  if (!env.KV_NAMESPACE) {
    console.warn("KV_NAMESPACE not configured - rate limiting disabled");
    return null;
  }

  const ip = req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || "unknown";
  const key = `${config.keyPrefix || "ratelimit"}:ip:${ip}`;

  try {
    const currentValue = await env.KV_NAMESPACE.get(key);
    const current = currentValue ? parseInt(currentValue) : 0;

    if (current >= config.maxRequests) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retry_after: config.windowSeconds
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": config.windowSeconds.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": (Date.now() + config.windowSeconds * 1000).toString()
          }
        }
      );
    }

    // Increment counter
    await env.KV_NAMESPACE.put(key, (current + 1).toString(), {
      expirationTtl: config.windowSeconds
    });

    return null;
  } catch (error) {
    console.error("Rate limiting error:", error);
    // On error, allow the request through
    return null;
  }
}

/**
 * Rate limit by user ID
 * @param req - Request object
 * @param env - Environment with KV_NAMESPACE
 * @param userId - User ID to rate limit
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null if allowed
 */
export async function rateLimitByUser(
  req: Request,
  env: any,
  userId: number,
  config: RateLimitConfig = { maxRequests: 100, windowSeconds: 60 }
): Promise<Response | null> {
  if (!env.KV_NAMESPACE) {
    console.warn("KV_NAMESPACE not configured - rate limiting disabled");
    return null;
  }

  const key = `${config.keyPrefix || "ratelimit"}:user:${userId}`;

  try {
    const currentValue = await env.KV_NAMESPACE.get(key);
    const current = currentValue ? parseInt(currentValue) : 0;

    if (current >= config.maxRequests) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retry_after: config.windowSeconds
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": config.windowSeconds.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0"
          }
        }
      );
    }

    // Increment counter
    await env.KV_NAMESPACE.put(key, (current + 1).toString(), {
      expirationTtl: config.windowSeconds
    });

    return null;
  } catch (error) {
    console.error("Rate limiting error:", error);
    return null;
  }
}

/**
 * Strict rate limiting for authentication endpoints (prevents brute force)
 */
export async function rateLimitAuth(req: Request, env: any): Promise<Response | null> {
  return await rateLimitByIP(req, env, {
    maxRequests: 5,
    windowSeconds: 300, // 5 attempts per 5 minutes
    keyPrefix: "auth"
  });
}

/**
 * Rate limiting for login attempts by email
 * @param req - Request object
 * @param env - Environment with KV_NAMESPACE
 * @param email - Email address attempting login
 * @returns Response if rate limited, null if allowed
 */
export async function rateLimitLoginByEmail(
  req: Request,
  env: any,
  email: string
): Promise<Response | null> {
  if (!env.KV_NAMESPACE) {
    console.warn("KV_NAMESPACE not configured - rate limiting disabled");
    return null;
  }

  const key = `auth:email:${email.toLowerCase()}`;

  try {
    const currentValue = await env.KV_NAMESPACE.get(key);
    const current = currentValue ? parseInt(currentValue) : 0;

    if (current >= 5) {
      return new Response(
        JSON.stringify({
          error: "Too many login attempts for this account. Please try again in 15 minutes.",
          retry_after: 900
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "900"
          }
        }
      );
    }

    // Increment counter
    await env.KV_NAMESPACE.put(key, (current + 1).toString(), {
      expirationTtl: 900 // 15 minutes
    });

    return null;
  } catch (error) {
    console.error("Rate limiting error:", error);
    return null;
  }
}

/**
 * Clear rate limit for a specific key (used after successful authentication)
 */
export async function clearRateLimit(env: any, keyType: string, identifier: string): Promise<void> {
  if (!env.KV_NAMESPACE) return;

  try {
    await env.KV_NAMESPACE.delete(`${keyType}:${identifier}`);
  } catch (error) {
    console.error("Failed to clear rate limit:", error);
  }
}

/**
 * Rate limiting for API endpoints
 */
export async function rateLimitAPI(req: Request, env: any): Promise<Response | null> {
  return await rateLimitByIP(req, env, {
    maxRequests: 100,
    windowSeconds: 60, // 100 requests per minute
    keyPrefix: "api"
  });
}

/**
 * Rate limiting for file uploads
 */
export async function rateLimitUpload(req: Request, env: any, userId: number): Promise<Response | null> {
  return await rateLimitByUser(req, env, userId, {
    maxRequests: 10,
    windowSeconds: 3600, // 10 uploads per hour
    keyPrefix: "upload"
  });
}
