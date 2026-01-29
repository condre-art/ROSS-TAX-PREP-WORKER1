export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, full_name, email, service, status, created_at
     FROM intakes
     ORDER BY created_at DESC`
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
