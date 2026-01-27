import { healthRoute } from "./routes/health";
import { authRoute } from "./routes/auth";
import { cors } from "./middleware/cors";

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return cors(healthRoute());
    }

    if (url.pathname.startsWith("/auth")) {
      return cors(await authRoute(req, env));
    }

    return new Response("Not Found", { status: 404 });
  }
};
