export async function authRoute(req: Request, env: Env) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Placeholder – replace with real auth later
  return new Response(
    JSON.stringify({ message: "Auth endpoint placeholder" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
