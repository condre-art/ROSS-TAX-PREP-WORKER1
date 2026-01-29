export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Protect CRM and related API routes with Cloudflare Access
  if (url.pathname.startsWith("/crm") || url.pathname.startsWith("/api/crm") || url.pathname.startsWith("/api/docs")) {
    const jwt = context.request.headers.get("CF-Access-Jwt-Assertion");
    
    // If no JWT, request is not coming through Cloudflare Access
    if (!jwt) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Request came through Access, allow it to proceed
    return context.next();
  }

  // All other requests pass through
  return context.next();
}
