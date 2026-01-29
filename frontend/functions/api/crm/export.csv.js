export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, full_name, email, phone, service, status, created_at
       FROM intakes ORDER BY created_at DESC`
    ).all();

    const header = ["id", "full_name", "email", "phone", "service", "status", "created_at"];
    const rows = results.map(r => header.map(k => csvCell(r[k])));

    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=intakes.csv",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    console.error("Export CSV error:", err);
    return json({ error: "Export failed" }, 500);
  }
}

function csvCell(v) {
  const s = (v ?? "").toString();
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
