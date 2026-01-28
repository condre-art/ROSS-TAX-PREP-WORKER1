export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health/db") {
      const row = await env.MY_BINDING.prepare("SELECT 1 AS ok").first();
      return Response.json(row);
    }

    // --- API ROUTES ---
    // Clients
    if (url.pathname === "/api/clients" && request.method === "GET") {
      return Response.json([{ id: 1, name: "John Doe" }]);
    }
    if (url.pathname === "/api/clients" && request.method === "POST") {
      const data = await request.json();
      // Normally insert into DB here
      return Response.json({ success: true, client: data });
    }

    // Returns
    if (url.pathname === "/api/returns" && request.method === "GET") {
      return Response.json([{ id: 1, clientId: 1, year: 2025 }]);
    }
    if (url.pathname === "/api/returns" && request.method === "POST") {
      const data = await request.json();
      return Response.json({ success: true, return: data });
    }

    // Documents
    if (url.pathname === "/api/documents" && request.method === "POST") {
      const data = await request.json();
      return Response.json({ success: true, document: data });
    }

    // Efile
    if (url.pathname === "/api/efile" && request.method === "POST") {
      const data = await request.json();
      return Response.json({ success: true, efile: data });
    }


    // Tasks collection
    if (url.pathname === "/api/tasks" && request.method === "GET") {
      const rows = await env.DB.prepare("SELECT * FROM tasks").all();
      return Response.json(rows.results);
    }
    if (url.pathname === "/api/tasks" && request.method === "POST") {
      const data = await request.json();
      await env.DB.prepare(
        `INSERT INTO tasks (title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?)`
      ).bind(
        data.title,
        data.description,
        data.status || 'pending',
        data.priority || 'Medium',
        data.due_date || null
      ).run();
      return Response.json({ success: true });
    }

    // Tasks by id
    const taskIdMatch = url.pathname.match(/^\/api\/tasks\/(\d+)$/);
    if (taskIdMatch) {
      const id = Number(taskIdMatch[1]);
      if (request.method === "GET") {
        const row = await env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first();
        if (!row) return new Response("Not found", { status: 404 });
        return Response.json(row);
      }
      if (request.method === "PUT") {
        const data = await request.json();
        await env.DB.prepare(
          `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ? WHERE id = ?`
        ).bind(
          data.title,
          data.description,
          data.status,
          data.priority,
          data.due_date,
          id
        ).run();
        return Response.json({ success: true });
      }
      if (request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
        return Response.json({ success: true });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
