export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const intakeId = (body.intakeId || "").trim();
    const status = (body.status || "").trim();

    if (!intakeId) return json({ error: "Missing intakeId" }, 400);
    if (!status) return json({ error: "Missing status" }, 400);

    // Get intake details
    const row = await env.DB.prepare(
      "SELECT full_name, email, service FROM intakes WHERE id = ?"
    ).bind(intakeId).first();

    if (!row) return json({ error: "Intake not found" }, 404);

    const now = new Date().toISOString();

    // Update status
    await env.DB.prepare(
      "UPDATE intakes SET status = ?, last_status_at = ? WHERE id = ?"
    ).bind(status, now, intakeId).run();

    // Send client status email
    const TO = row.email;
    const fullName = row.full_name || "Client";
    const service = row.service || "your request";

    const FROM_EMAIL = env.FROM_EMAIL || "no-reply@rossbookkeeping.com";
    const FROM_NAME = env.FROM_NAME || "Ross Tax & Bookkeeping";
    const REPLY_TO = env.TO_EMAIL;

    const emailText = `Hello ${fullName},

Status update for ${service}:

${status}

If you have questions, reply to this email.

— Ross Tax & Bookkeeping`;

    await sendMailChannels({
      to: TO,
      fromEmail: FROM_EMAIL,
      fromName: FROM_NAME,
      replyTo: REPLY_TO,
      subject: `Update on ${service}: ${status}`,
      text: emailText
    });

    return json({ ok: true }, 200);
  } catch (err) {
    console.error("Update status error:", err);
    return json({ error: "Failed to update status" }, 500);
  }
}

async function sendMailChannels({ to, fromEmail, fromName, replyTo, subject, text }) {
  const mail = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: fromEmail, name: fromName },
    reply_to: { email: replyTo },
    subject,
    content: [{ type: "text/plain", value: text }]
  };

  const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mail)
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Mail failed: ${res.status} ${detail}`);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
