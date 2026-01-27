export interface Env {
  ENV: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check (required)
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "ross-tax-prep-worker1",
          env: env.ENV
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Fallback
    return new Response(
      JSON.stringify({ error: "Not Found" }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
