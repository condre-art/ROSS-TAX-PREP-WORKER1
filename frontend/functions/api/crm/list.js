export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, full_name, email, phone, service, status, notes, created_at
       FROM intakes ORDER BY created_at DESC LIMIT 500`
    ).all();

    return json({ ok: true, results }, 200);
  } catch (err) {
    console.error("List intakes error:", err);
    return json({ error: "Failed to fetch intakes" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
