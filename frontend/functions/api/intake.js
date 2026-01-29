/**
 * /api/intake - Client Intake Form Handler
 * 
 * POST endpoint for collecting client intake submissions
 * Sends email via MailChannels and can post to CRM webhook
 * 
 * Environment Variables Required:
 *   TO_EMAIL: Your receiving email inbox
 * 
 * Optional:
 *   FROM_EMAIL: Sender email (default: noreply@rosstaxbookkeeping.com)
 *   FROM_NAME: Sender name (default: Ross Tax & Bookkeeping)
 *   CRM_WEBHOOK_URL: Webhook to post to CRM system (Zapier, Make, etc.)
 *   ALLOWED_ORIGINS: Comma-separated list of allowed origins (default: all)
 */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function getCorsHeaders(request, allowedOrigins) {
  const origin = request.headers.get("origin") || "";
  const allowed = allowedOrigins ? allowedOrigins.split(",").map(o => o.trim()) : ["*"];
  
  const isAllowed = allowed.includes("*") || allowed.includes(origin);
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

async function sendEmail(to, from, fromName, subject, html, env) {
  const mailChannelsUrl = "https://api.mailchannels.net/tx/v1/send";
  
  const body = {
    personalizations: [
      {
        to: [{ email: to }],
        dkim_domain: new URL(from).hostname,
        dkim_selector: "mailchannels",
        dkim_private_key: env.DKIM_PRIVATE_KEY || ""
      }
    ],
    from: {
      email: from,
      name: fromName
    },
    subject,
    content: [
      {
        type: "text/html",
        value: html
      }
    ]
  };

  try {
    const res = await fetch(mailChannelsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("MailChannels error:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: err.message };
  }
}

function generateEmailHtml(payload) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0b2340; color: white; padding: 20px; border-radius: 8px; }
          .field { margin: 15px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #caa24a; }
          .label { font-weight: bold; color: #0b2340; }
          .footer { margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Client Intake Submission</h1>
          </div>

          <div class="field">
            <div class="label">Full Name:</div>
            <div>${payload.fullName}</div>
          </div>

          <div class="field">
            <div class="label">Email:</div>
            <div>${payload.email}</div>
          </div>

          <div class="field">
            <div class="label">Phone:</div>
            <div>${payload.phone || "(not provided)"}</div>
          </div>

          <div class="field">
            <div class="label">Service Needed:</div>
            <div>${payload.service}</div>
          </div>

          <div class="field">
            <div class="label">Notes:</div>
            <div>${payload.notes || "(none)"}</div>
          </div>

          <div class="field" style="background: #eff6ff; border-left-color: #3b82f6;">
            <div class="label">Submitted:</div>
            <div>${payload.submittedAt}</div>
          </div>

          <div class="footer">
            <p>This submission came from your website intake form.</p>
            <p>Ross Tax & Bookkeeping Client Management System</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request, env.ALLOWED_ORIGINS)
    });
  }

  // Validate content type
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return json({ error: "Content-Type must be application/json" }, 415);
  }

  // Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  // Extract and validate fields
  const fullName = (body.fullName || "").trim();
  const email = (body.email || "").trim();
  const phone = (body.phone || "").trim();
  const service = (body.service || "").trim();
  const notes = (body.notes || "").trim();

  if (fullName.length < 2) {
    return json({ error: "Full name is required and must be at least 2 characters" }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ error: "Valid email address is required" }, 400);
  }

  // Build payload
  const payload = {
    fullName,
    email,
    phone: phone || null,
    service: service || "Not specified",
    notes: notes || null,
    source: "website-intake",
    submittedAt: new Date().toISOString()
  };

  // Validate config
  const TO_EMAIL = env.TO_EMAIL;
  if (!TO_EMAIL) {
    console.error("TO_EMAIL not configured");
    return json({ error: "Server configuration error" }, 500);
  }

  const FROM_EMAIL = env.FROM_EMAIL || "noreply@rosstaxbookkeeping.com";
  const FROM_NAME = env.FROM_NAME || "Ross Tax & Bookkeeping";

  // Send email to admin
  const emailHtml = generateEmailHtml(payload);
  const emailResult = await sendEmail(TO_EMAIL, FROM_EMAIL, FROM_NAME, "New Client Intake Submission", emailHtml, env);

  if (!emailResult.success) {
    console.error("Failed to send intake email:", emailResult.error);
    // Don't fail the request, just log it
  }

  // Post to CRM webhook if configured
  if (env.CRM_WEBHOOK_URL) {
    try {
      await fetch(env.CRM_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("CRM webhook failed:", err);
    }
  }

  // Return success to client
  return json({
    success: true,
    message: "Intake submission received. We'll follow up soon.",
    id: crypto.randomUUID()
  }, 201);
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request, context.env.ALLOWED_ORIGINS)
  });
}
