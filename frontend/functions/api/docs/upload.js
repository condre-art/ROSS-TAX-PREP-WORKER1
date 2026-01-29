export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return json({ error: "Use multipart/form-data" }, 415);
    }

    const form = await request.formData();
    const intakeId = (form.get("intakeId") || "").toString().trim();
    const file = form.get("file");

    if (!intakeId) return json({ error: "Missing intakeId" }, 400);
    if (!file || typeof file === "string") return json({ error: "Missing file" }, 400);

    const id = crypto.randomUUID();
    const filename = file.name || "upload";
    const contentType = file.type || "application/octet-stream";
    const size = file.size || 0;

    // Store under intake folder in R2
    const key = `intakes/${intakeId}/${id}-${sanitize(filename)}`;

    // Put in R2
    await env.DOCS.put(key, file.stream(), {
      httpMetadata: { contentType }
    });

    // Record in D1
    await env.DB.prepare(
      `INSERT INTO documents (id, intake_id, r2_key, filename, content_type, size, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, intakeId, key, filename, contentType, size, new Date().toISOString())
      .run();

    return json({ ok: true, documentId: id, key }, 200);
  } catch (err) {
    console.error("Upload error:", err);
    return json({ error: "Upload failed" }, 500);
  }
}

function sanitize(name) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
