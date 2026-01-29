export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const intakeId = (url.searchParams.get("intakeId") || "").trim();

    if (!intakeId) return json({ error: "Missing intakeId" }, 400);

    const { results } = await env.DB.prepare(
      `SELECT id, intake_id, filename, content_type, size, created_at
       FROM documents WHERE intake_id = ? ORDER BY created_at DESC`
    ).bind(intakeId).all();

    return json({ ok: true, results }, 200);
  } catch (err) {
    console.error("List docs error:", err);
    return json({ error: "Failed to fetch documents" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
