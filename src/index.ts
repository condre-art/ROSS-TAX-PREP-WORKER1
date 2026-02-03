import consultRouter from "./routes/consult";
import dizRouter from "./routes/diz";
import eroRouter from "./routes/ero";
import aiSupportRouter from "./routes/aiSupport";
import workflowRouter from "./routes/workflows";
import invoicingRouter from "./routes/invoicing";
// --- All Imports at Top ---
import { healthRoute } from "./health";
import { cors } from "./cors";
import bcrypt from "bcryptjs";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { v4 as uuid } from "uuid";
import { authRoute, mfaSetupRoute, mfaVerifyRoute } from "./routes/auth";
import { ERO_EFIN_PROFILE, BANK_PRODUCT_PROVIDERS, SUPPORTED_PAYMENT_METHODS } from "./efileProviders";
import { paymentRouter } from "./payment";
import { transmitEFile, checkSubmissionStatus, processNewAcknowledgments, getEFileStatusInfo } from "./efile";
import { fetchIrsSchema, fetchIrsMemos } from "./irs";
import { handleCrmIntakes, handleCrmIntakeById, handleCrmIntakeCreate, handleCrmIntakeDelete } from "./routes/crm";
import lmsRouter from "./routes/lms";
import portalRouter from "./routes/portal";
import portalAuthRouter from "./routes/portalAuth";
import { handleListCertificates, handleIssueCertificate, handleGetCertificate, handleRevokeCertificate, handleDownloadCertificate, handleCertificateTypes } from "./routes/certificates";
import { handleListTeam, handleGetTeamMember, handleListRegions } from "./routes/team";
import { handleComplianceCheck, handleComplianceRequirements, handleIssueAllCertificates, handleComplianceReport } from "./routes/compliance";
import { handleSocialPost, handleSocialFeed, handleSocialMetrics, handleSchedulePost, handleSocialMentions, handleSocialReply } from "./routes/socialMedia";
import { handleGoogleReviews, handleGoogleReplyReview, handleGoogleStats } from "./routes/socialMedia";
import {
  handleInstagramFeed,
  handleInstagramReviews,
  handleInstagramAnalytics,
  handleInstagramPost,
  handleInstagramDM
  // @ts-expect-error - Legacy Instagram JS module without TypeScript definitions
} from "./instagram.js";
import { handleScheduledIRSSync, handleAuditLogProcessing } from "./utils";
import { handleIrsCallback } from "./handlers/irs-callback";
import { handlePaymentWebhook } from "./handlers/payment-webhook";
import { handleCredentialUpload } from "./handlers/credential-upload";
import { handleIrsRealtimeSchema, handleIrsRealtimeMemo, getIrsRealtimeStatus } from "./handlers/irs-realtime";

// --- Global Configuration ---
let seeded = false;

export const SOCIAL_MEDIA_HANDLES = {
  INSTAGRAM: "@rosstaxprepandbookkeepingllc",
  X_TWITTER: "@rosstaxprep",
  FACEBOOK: "Ross tax prep and bookkeeping inc.",
  GOOGLE_BUSINESS: "Ross Tax Prep and Bookkeeping"
};

export const BUSINESS_INFO = {
  legal_name: "Ross Tax Prep & Bookkeeping LLC",
  business_name: "Ross Tax & Bookkeeping",
  display_name: "Ross Tax Prep and Bookkeeping",
  ein: "33-4891499",
  category: "Tax Consultants",
  address: "2509 Cody Poe Rd",
  city: "Killeen",
  state: "TX",
  zip: "76549",
  phone: "5124896749",
  phone_formatted: "(512) 489-6749",
  email: "info@rosstaxprepandbookkeeping.com",
  website_url: "https://www.rosstaxprepandbookkeeping.com",
  google_business_verified: true,
  google_verification_date: "2026-01-28",
  location_id: "ross-tax-killeen-tx"
};

// --- Administrator Email Routes ---
export const ADMIN_EMAIL_ROUTES = {
  // Owner/CEO
  condre: {
    name: "Condre Ross",
    email: "condre@rosstaxprepandbookkeeping.com",
    role: "owner_ceo",
    departments: ["executive", "compliance", "strategy"]
  },
  // General Admin
  admin: {
    name: "Administrator",
    email: "admin@rosstaxprepandbookkeeping.com",
    role: "admin",
    departments: ["administration", "operations"]
  },
  // Client Support & 1040-X (Extensions)
  support: {
    name: "Support Team",
    email: "info@rosstaxprepandbookkeeping.com",
    role: "support",
    departments: ["client_services", "1040x_support", "tax_amendments"]
  },
  // ERO Employees & Help Desk
  hr: {
    name: "HR & Help Desk",
    email: "hr@rosstaxprepandbookkeeping.com",
    role: "hr_helpdesk",
    departments: ["human_resources", "ero_support", "employee_assistance"]
  },
  // Reviews & Concerns
  experience: {
    name: "Experience Team",
    email: "experience@rosstaxprepandbookkeeping.com",
    role: "experience",
    departments: ["customer_feedback", "quality_assurance", "compliance_reviews"]
  }
};

// --- Type Interfaces ---
interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
  name?: string;
}

interface DocuSignEnvelope {
  envelopeId: string;
  [key: string]: any;
}

interface IrsResponse {
  access_token?: string;
  url?: string;
  [key: string]: any;
}

async function verifyAuth(req: Request, env: any): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const isValid = await jwt.verify(token, env.JWT_SECRET || "change-this-secret-in-production");
    if (!isValid) return null;
    
    const { payload } = jwt.decode(token);
    return payload as AuthenticatedUser;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" }
  });
}

// --- Helper Functions ---
async function seedAdminIfNone(env: any) {
  try {
    if (!env.DB) {
      console.log("env.DB is undefined! Available keys:", Object.keys(env));
      return;
    }
    const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM staff").first();
    console.log("seedAdminIfNone row:", row);
    if (!row || typeof row.count !== "number") {
      console.log("Staff table missing or unreadable. Skipping admin seed.");
      return;
    }
    if (row.count === 0) {
      const password_hash = await bcrypt.hash("Admin123!", 10);
      
      // Seed all admin staff accounts from ADMIN_EMAIL_ROUTES
      const adminAccounts = [
        { name: "Condre Ross", email: "condre@rosstaxprepandbookkeeping.com", role: "admin" },
        { name: "Administrator", email: "admin@rosstaxprepandbookkeeping.com", role: "admin" },
        { name: "Support Team", email: "info@rosstaxprepandbookkeeping.com", role: "staff" },
        { name: "HR & Help Desk", email: "hr@rosstaxprepandbookkeeping.com", role: "staff" },
        { name: "Experience Team", email: "experience@rosstaxprepandbookkeeping.com", role: "staff" }
      ];
      
      for (const account of adminAccounts) {
        await env.DB.prepare(
          "INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
        ).bind(account.name, account.email, password_hash, account.role).run();
      }
      console.log(`✅ Admin staff seeded: ${adminAccounts.length} accounts created`);
    }
  } catch (e) {
    console.log("seedAdminIfNone error:", e);
  }
}

function requireRole(user: any, roles: string[]) {
  if (!user || !roles.includes(user.role)) throw new Response("Forbidden", { status: 403 });
}

function validateDocuSignWebhookPayload(payload: any) {
  if (!payload || typeof payload !== "object") return false;
  if (!payload.envelopeId || typeof payload.envelopeId !== "string") return false;
  if (!payload.status || typeof payload.status !== "string") return false;
  return true;
}

async function getDocuSignAccessToken(env: any) {
  const jwtPayload = {
    iss: env.DOCUSIGN_INTEGRATION_KEY,
    sub: env.DOCUSIGN_IMPERSONATED_USER,
    aud: "account-d.docusign.com",
    scope: "signature"
  };
  const jwtToken = await jwt.sign(jwtPayload, env.DOCUSIGN_PRIVATE_KEY);
  const res = await fetch("https://account-d.docusign.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
  });
  if (!res.ok) throw new Error("Failed to obtain DocuSign access token");
  const data = await res.json() as IrsResponse;
  return data.access_token || "";
}

// --- Audit Log Handlers ---
async function handleAuditLog(req: Request, env: any) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  let sql = `SELECT * FROM audit_log`;
  const params = [];
  if (q) {
    sql += ` WHERE action LIKE ? OR entity LIKE ? OR entity_id LIKE ? OR details LIKE ?`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY created_at DESC LIMIT 200`;
  const rows = await env.DB.prepare(sql).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}

async function handleAuditAnalytics(req: Request, env: any) {
  const actions = await env.DB.prepare(`SELECT action, COUNT(*) as count FROM audit_log GROUP BY action ORDER BY count DESC`).all();
  const entities = await env.DB.prepare(`SELECT entity, COUNT(*) as count FROM audit_log GROUP BY entity ORDER BY count DESC`).all();
  return new Response(JSON.stringify({ actions: actions.results, entities: entities.results }), { headers: { "Content-Type": "application/json" } });
}

// --- Refund Handlers ---
async function handleClientRefunds(req: Request, env: any, user: any) {
  if (!user || user.role !== "client") return new Response("Forbidden", { status: 403 });
  const sql = `SELECT id, return_id, irs_refund_status, refund_method, refund_amount, refund_disbursed_at, refund_trace_id, refund_notes
    FROM efile_transmissions WHERE client_id = ? ORDER BY updated_at DESC LIMIT 20`;
  const rows = await env.DB.prepare(sql).bind(user.id).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}

async function handleMe(req: Request, env: any, user: any) {
  if (!user) return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401 });
  return new Response(JSON.stringify({ user }), { headers: { "Content-Type": "application/json" } });
}

async function handleAdminRefunds(req: Request, env: any) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  let sql = `SELECT t.id, t.return_id, t.irs_refund_status, t.refund_method, t.refund_amount, t.refund_disbursed_at, t.refund_trace_id, t.refund_notes, c.name as client_name
    FROM efile_transmissions t
    LEFT JOIN clients c ON t.client_id = c.id`;
  const params = [];
  if (q) {
    sql += ` WHERE (c.name LIKE ? OR t.return_id LIKE ? OR t.irs_refund_status LIKE ? OR t.refund_method LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY t.updated_at DESC LIMIT 100`;
  const rows = await env.DB.prepare(sql).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}

async function handleGetRefundStatus(req: Request, env: any) {
  const id = req.url.split("/").pop();
  const row = await env.DB.prepare("SELECT irs_refund_status, refund_method, refund_amount, refund_disbursed_at, refund_trace_id, refund_notes FROM efile_transmissions WHERE id = ?").bind(id).first();
  if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return new Response(JSON.stringify(row), { headers: { "Content-Type": "application/json" } });
}

async function handleUpdateRefundStatus(req: Request, env: any) {
  const id = req.url.split("/").pop();
  const body = await req.json() as Record<string, any>;
  const fields = ["irs_refund_status", "refund_method", "refund_amount", "refund_disbursed_at", "refund_trace_id", "refund_notes"];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(body[f]);
    }
  }
  if (!updates.length) return new Response(JSON.stringify({ error: "No fields to update" }), { status: 400 });
  params.push(id);
  await env.DB.prepare(`UPDATE efile_transmissions SET ${updates.join(", ")}, updated_at = datetime('now') WHERE id = ?`).bind(...params).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}

// --- IRS Memo Handlers ---
async function updateIrsMemo(request: Request, env: any) {
  const id = request.url.split("/")[4];
  const body = await request.json() as Record<string, any>;
  const fields = ["title", "summary", "full_text", "url", "tags", "status", "published_at"];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (body[f] !== undefined) {
      if (f === "tags") {
        updates.push("tags_json = ?");
        params.push(JSON.stringify(body.tags));
      } else {
        updates.push(`${f} = ?`);
        params.push(body[f]);
      }
    }
  }
  if (!updates.length) return new Response(JSON.stringify({ error: "No fields to update" }), { status: 400 });
  params.push(id);
  await env.DB.prepare(`UPDATE irs_memos SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  await env.DB.prepare(`INSERT INTO audit_log (action, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).bind(
    "update", "irs_memo", id, JSON.stringify(body)
  ).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}

async function deleteIrsMemo(request: Request, env: any) {
  const id = request.url.split("/")[4];
  await env.DB.prepare(`UPDATE irs_memos SET status = 'deleted' WHERE id = ?`).bind(id).run();
  await env.DB.prepare(`INSERT INTO audit_log (action, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).bind(
    "delete", "irs_memo", id, null
  ).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}

async function unlinkIrsMemoLink(request: Request, env: any) {
  const parts = request.url.split("/");
  const linkId = parts[6];
  await env.DB.prepare(`DELETE FROM irs_memo_links WHERE id = ?`).bind(linkId).run();
  await env.DB.prepare(`INSERT INTO audit_log (action, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).bind(
    "unlink", "irs_memo_link", linkId, null
  ).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}

async function searchIrsMemos(request: Request, env: any) {
  const url = new URL(request.url);
  const text = url.searchParams.get("text");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const tags = url.searchParams.getAll("tags");
  let query = "SELECT * FROM irs_memos WHERE status = 'active'";
  const params = [];
  if (text) {
    query += " AND (title LIKE ? OR summary LIKE ? OR full_text LIKE ?)";
    params.push(`%${text}%`, `%${text}%`, `%${text}%`);
  }
  if (from) {
    query += " AND published_at >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND published_at <= ?";
    params.push(to);
  }
  for (const tag of tags) {
    query += " AND tags_json LIKE ?";
    params.push(`%${tag}%`);
  }
  query += " ORDER BY published_at DESC LIMIT 100";
  const rows = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}

async function listIrsMemos(request: Request, env: any) {
  const url = new URL(request.url);
  const source = url.searchParams.get("source");
  const tag = url.searchParams.get("tag");
  const status = url.searchParams.get("status") ?? "active";
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  let query = "SELECT * FROM irs_memos WHERE status = ?";
  const params: any[] = [status];

  if (source) {
    query += " AND source = ?";
    params.push(source);
  }
  if (tag) {
    query += " AND tags_json LIKE ?";
    params.push(`%${tag}%`);
  }
  query += " ORDER BY published_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const rows = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}

async function getIrsMemo(request: Request, env: any) {
  const id = request.url.split("/").pop();
  const memo = await env.DB.prepare(
    "SELECT * FROM irs_memos WHERE id = ?"
  ).bind(id).first();
  if (!memo) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  const links = await env.DB.prepare(
    "SELECT * FROM irs_memo_links WHERE memo_id = ?"
  ).bind(id).all();
  return new Response(JSON.stringify({ memo, links: links.results }), { headers: { "Content-Type": "application/json" } });
}

async function linkIrsMemo(request: Request, env: any) {
  const memoId = request.url.split("/")[3];
  const body = await request.json() as Record<string, any>;
  const id = uuid();
  await env.DB.prepare(
    `INSERT INTO irs_memo_links 
     (id, memo_id, client_id, return_id, topic, note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      memoId,
      body.client_id ?? null,
      body.return_id ?? null,
      body.topic ?? null,
      body.note ?? null,
      body.staff_id ?? "1"
    )
    .run();
  return new Response(JSON.stringify({ success: true, id }), { headers: { "Content-Type": "application/json" } });
}

async function listIrsSchemaFields(request: Request, env: any) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status") ?? "active";
  let query = "SELECT * FROM irs_schema_fields WHERE status = ?";
  const params: any[] = [status];
  if (type) {
    query += " AND schema_type = ?";
    params.push(type);
  }
  query += " ORDER BY field_name ASC";
  const rows = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}

// --- DocuSign Handlers ---
async function handleCreateEnvelope(request: Request, env: any, user: any) {
  requireRole(user, ["admin", "staff"]);
  const { client_id, name, email, documentBase64 } = await request.json() as Record<string, any>;
  const accessToken = await getDocuSignAccessToken(env);
  const envelopeBody = {
    emailSubject: "Ross Tax Prep – Engagement Letter",
    documents: [
      {
        documentBase64,
        name: "Engagement Letter",
        fileExtension: "pdf",
        documentId: "1"
      }
    ],
    recipients: {
      signers: [
        {
          email,
          name,
          recipientId: "1",
          routingOrder: "1",
          clientUserId: client_id.toString()
        }
      ]
    },
    eventNotification: {
      url: `${env.APP_URL}/api/docusign/webhook`,
      loggingEnabled: "true",
      requireAcknowledgment: "true",
      includeDocuments: "false",
      includeTimeZone: "true",
      includeEnvelopeVoidReason: "true"
    },
    status: "sent"
  };
  const res = await fetch(
    `${env.DOCUSIGN_BASE_URL}/v2.1/accounts/${env.DOCUSIGN_ACCOUNT_ID}/envelopes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(envelopeBody)
    }
  );
  if (!res.ok) {
    const err = await res.text();
    return new Response(err, { status: 500 });
  }
  const envelope = await res.json() as DocuSignEnvelope;
  await env.DB.prepare(
    `INSERT INTO signatures (client_id, envelope_id, status)
     VALUES (?, ?, ?)`
  ).bind(client_id, envelope.envelopeId, "sent").run();
  return Response.json({
    success: true,
    envelopeId: envelope.envelopeId
  });
}

async function handleEmbeddedSigningUrl(request: Request, env: any, user: any) {
  requireRole(user, ["admin", "staff", "client"]);
  const { envelopeId, client_id, name, email } = await request.json() as Record<string, any>;
  const accessToken = await getDocuSignAccessToken(env);
  const body = {
    returnUrl: env.DOCUSIGN_REDIRECT_URL,
    authenticationMethod: "none",
    email,
    userName: name,
    clientUserId: client_id.toString()
  };
  const res = await fetch(
    `${env.DOCUSIGN_BASE_URL}/v2.1/accounts/${env.DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) {
    const err = await res.text();
    return new Response(err, { status: 500 });
  }
  const data = await res.json() as Record<string, any>;
  return Response.json({ url: data.url });
}

async function handleDocuSignWebhook(req: Request, env: any) {
  const secret = req.headers.get("X-DS-SECRET");
  if (secret !== env.DOCUSIGN_WEBHOOK_SECRET)
    return new Response("Unauthorized", { status: 401 });

  let body: Record<string, any>;
  try {
    body = await req.json() as Record<string, any>;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!validateDocuSignWebhookPayload(body))
    return new Response("Invalid schema", { status: 400 });

  const { envelopeId, status } = body;

  await env.DB.prepare(
    `UPDATE signatures SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE envelope_id = ?`
  ).bind(status, envelopeId).run();

  return new Response("OK", { status: 200 });
}

async function handleSignatures(request: Request, env: any, user: any) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  if (scope === "client") {
    requireRole(user, ["client"]);
    const rows = await env.DB.prepare(
      "SELECT * FROM signatures WHERE client_id = ? ORDER BY created_at DESC"
    ).bind(user.id).all();
    return Response.json(rows.results);
  }
  requireRole(user, ["admin", "staff"]);
  const rows = await env.DB.prepare(
    "SELECT * FROM signatures ORDER BY created_at DESC"
  ).all();
  return Response.json(rows.results);
}

// --- Auth Handlers ---
async function handleRegisterStaff(req: Request, env: any) {
  const { name, email, password, role } = await req.json() as Record<string, any>;
  if (!name || !email || !password || !role) return new Response("Missing fields", { status: 400 });
  const password_hash = await bcrypt.hash(password, 10);
  try {
    await env.DB.prepare(
      "INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).bind(name, email, password_hash, role).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response("Email already exists", { status: 409 });
  }
}

async function handleRegisterClient(req: Request, env: any) {
  const { name, email, password, phone } = await req.json() as Record<string, any>;
  if (!name || !email || !password) return new Response("Missing fields", { status: 400 });
  const password_hash = await bcrypt.hash(password, 10);
  try {
    await env.DB.prepare(
      "INSERT INTO clients (name, email, phone, password_hash) VALUES (?, ?, ?, ?)"
    ).bind(name, email, phone || null, password_hash).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response("Email already exists", { status: 409 });
  }
}

async function handleLoginStaff(req: Request, env: any) {
  const { email, password } = await req.json() as Record<string, any>;
  const user = await env.DB.prepare("SELECT * FROM staff WHERE email = ?").bind(email).first();
  if (!user) return new Response("Invalid credentials", { status: 401 });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return new Response("Invalid credentials", { status: 401 });
  return new Response(JSON.stringify({ ok: true, user }), { headers: { "Content-Type": "application/json" } });
}

async function handleLoginClient(req: Request, env: any) {
  const { email, password } = await req.json() as Record<string, any>;
  const user = await env.DB.prepare("SELECT * FROM clients WHERE email = ?").bind(email).first();
  if (!user) return new Response("Invalid credentials", { status: 401 });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return new Response("Invalid credentials", { status: 401 });
  return new Response(JSON.stringify({ ok: true, user }), { headers: { "Content-Type": "application/json" } });
}

// --- Training Handlers ---
async function listTrainingCourses(request: Request, env: any) {
  const rows = await env.DB.prepare("SELECT * FROM training_courses ORDER BY created_at DESC").all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}

async function enrollTrainingCourse(request: Request, env: any) {
  const body = await request.json() as Record<string, any>;
  const id = uuid();
  await env.DB.prepare(
    `INSERT INTO training_enrollments (id, course_id, student_email, student_name, notes)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, body.course_id, body.email, body.name ?? null, body.notes ?? null).run();
  return new Response(JSON.stringify({ success: true, id }), { headers: { "Content-Type": "application/json" } });
}

// --- Export Default Worker ---
export default {
  async fetch(req: Request, env: any, ctx: any): Promise<Response> {
    if (!seeded) {
      await seedAdminIfNone(env);
      seeded = true;
    }
    const url = new URL(req.url);

    // --- Consultation Booking API Route (all /api/consult/* endpoints) ---
    if (url.pathname.startsWith("/api/consult")) {
      const reqPath = url.pathname.replace(/^\/api\/consult/, "");
      const consultReq = new Request(reqPath || "/", req);
      Object.defineProperty(consultReq, "params", { value: {} });
      const resp = await consultRouter.handle(consultReq, env);
      return cors(resp);
    }

    // --- DIZ Client Workflow API Route (all /api/diz/* endpoints) ---
    if (url.pathname.startsWith("/api/diz")) {
      const reqPath = url.pathname.replace(/^\/api\/diz/, "");
      const dizReq = new Request(reqPath || "/", req);
      Object.defineProperty(dizReq, "params", { value: {} });
      const resp = await dizRouter.handle(dizReq, env);
      return cors(resp);
    }

    // --- ERO Workflow API Route (all /api/ero/* endpoints) ---
    if (url.pathname.startsWith("/api/ero")) {
      const reqPath = url.pathname.replace(/^\/api\/ero/, "");
      const eroReq = new Request(reqPath || "/", req);
      Object.defineProperty(eroReq, "params", { value: {} });
      const resp = await eroRouter.handle(eroReq, env);
      return cors(resp);
    }

    // --- Client Portal Auth Route (all /api/portal/login) ---
    if (url.pathname.startsWith("/api/portal/login")) {
      const reqPath = url.pathname.replace(/^\/api\/portal/, "");
      const portalAuthReq = new Request(reqPath || "/", req);
      Object.defineProperty(portalAuthReq, "params", { value: {} });
      const resp = await portalAuthRouter.handle(portalAuthReq, env);
      return cors(resp);
    }

    // --- Consultation Booking API Route (all /api/consult/* endpoints) ---
    if (url.pathname.startsWith("/api/consult")) {
      const reqPath = url.pathname.replace(/^\/api\/consult/, "");
      const consultReq = new Request(reqPath || "/", req);
      Object.defineProperty(consultReq, "params", { value: {} });
      const resp = await consultRouter.handle(consultReq, env);
      return cors(resp);
    }

    // --- DIZ Client Workflow API Route (all /api/diz/* endpoints) ---
    if (url.pathname.startsWith("/api/diz")) {
      const reqPath = url.pathname.replace(/^\/api\/diz/, "");
      const dizReq = new Request(reqPath || "/", req);
      Object.defineProperty(dizReq, "params", { value: {} });
      const resp = await dizRouter.handle(dizReq, env);
      return cors(resp);
    }

    // --- ERO Workflow API Route (all /api/ero/* endpoints) ---
    if (url.pathname.startsWith("/api/ero")) {
      const reqPath = url.pathname.replace(/^\/api\/ero/, "");
      const eroReq = new Request(reqPath || "/", req);
      Object.defineProperty(eroReq, "params", { value: {} });
      const resp = await eroRouter.handle(eroReq, env);
      return cors(resp);
    }

    // --- Invoicing API Route (all /api/admin/invoices/* endpoints) ---
    if (url.pathname.startsWith("/api/admin/invoices")) {
      const reqPath = url.pathname.replace(/^\/api\/admin/, "");
      const invoicingReq = new Request(reqPath || "/", req);
      Object.defineProperty(invoicingReq, "params", { value: {} });
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== 'admin' && user.role !== 'staff') return cors(forbidden());
      invoicingReq.user = user;
      const resp = await invoicingRouter.handle(invoicingReq, env);
      return cors(resp);
    }

    // Scheduled event: weekly Instagram tip post
    if (ctx && ctx.event && ctx.event.type === "scheduled") {
      const tipImageUrl = env.WEEKLY_TIP_IMAGE_URL;
      const tipCaption = env.WEEKLY_TIP_CAPTION;
      if (tipImageUrl && tipCaption) {
        const user = { role: "admin", id: 1 };
        await handleInstagramPost({
          json: async () => ({ caption: tipCaption, imageUrl: tipImageUrl })
        }, env, user);
      }
      return new Response("Scheduled Instagram tip posted", { status: 200 });
    }

    // Health check
    if (url.pathname === "/health") {
      return cors(healthRoute());
    }

    // --- Audit Log Endpoints (Admin only) ---
    if (url.pathname === "/api/admin/audit-log" && req.method === "GET") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin") return cors(forbidden());
      return await handleAuditLog(req, env);
    }
    if (url.pathname === "/api/admin/audit-analytics" && req.method === "GET") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin") return cors(forbidden());
      return await handleAuditAnalytics(req, env);
    }

    // --- X (Twitter) API Integration Endpoints ---
    if (url.pathname === "/api/x/brand-monitoring") {
      return new Response(JSON.stringify({ mentions: [
        `${SOCIAL_MEDIA_HANDLES.X_TWITTER} mentioned in #TaxSeason2026`,
        `Great service from ${SOCIAL_MEDIA_HANDLES.X_TWITTER}!`,
        "Ross Tax & Bookkeeping trending in local news."
      ] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/x/events") {
      return new Response(JSON.stringify({ events: [
        "IRS e-file opens Feb 1.",
        "Tax law update webinar Jan 30.",
        "Refund tracker feature launch."
      ] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/x/customer-care") {
      return new Response(JSON.stringify({ cases: [
        `@client123: Quick response from ${SOCIAL_MEDIA_HANDLES.X_TWITTER}!`,
        "Resolved: E-file submission issue.",
        `${SOCIAL_MEDIA_HANDLES.X_TWITTER}: Thank you for your feedback!`
      ] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/x/market-insights") {
      return new Response(JSON.stringify({ insights: [
        "EITC trending in #TaxTwitter.",
        "Clients prefer direct deposit refunds.",
        "Increased demand for virtual tax prep."
      ] }), { headers: { "Content-Type": "application/json" } });
    }

    // --- MFA Authentication Endpoints ---
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      return await authRoute(req, env);
    }
    if (url.pathname === "/api/auth/mfa/setup" && req.method === "POST") {
      return await mfaSetupRoute(req, env);
    }
    if (url.pathname === "/api/auth/mfa/verify" && req.method === "POST") {
      return await mfaVerifyRoute(req, env);
    }

    // --- Workflow Callback Handlers ---
    if (url.pathname === "/api/irs-callback" && req.method === "POST") {
      return cors(await handleIrsCallback(req, env));
    }
    if (url.pathname === "/api/payment-webhook" && req.method === "POST") {
      return cors(await handlePaymentWebhook(req, env));
    }
    if (url.pathname === "/api/credential-upload" && req.method === "POST") {
      return cors(await handleCredentialUpload(req, env));
    }

    // --- IRS Real-time Integration Endpoints ---
    if (url.pathname === "/api/irs/realtime/schema" && req.method === "POST") {
      return cors(await handleIrsRealtimeSchema(req, env));
    }
    if (url.pathname === "/api/irs/realtime/memo" && req.method === "POST") {
      return cors(await handleIrsRealtimeMemo(req, env));
    }
    if (url.pathname === "/api/irs/realtime/status" && req.method === "GET") {
      return cors(new Response(JSON.stringify(getIrsRealtimeStatus()), {
        headers: { "Content-Type": "application/json" }
      }));
    }

    // --- Client Refund Tracker Endpoints ---
    if (url.pathname === "/api/client/refunds" && req.method === "GET") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      return await handleClientRefunds(req, env, user);
    }

    // User info endpoint for portal
    if (url.pathname === "/api/me" && req.method === "GET") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      return await handleMe(req, env, user);
    }

    // Admin refund tracker list/search endpoint
    if (url.pathname === "/api/admin/refunds" && req.method === "GET") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleAdminRefunds(req, env);
    }

    // --- Refund Tracker Endpoints ---
    if (url.pathname.startsWith("/api/efile/refund/") && req.method === "GET") {
      return await handleGetRefundStatus(req, env);
    }
    if (url.pathname.startsWith("/api/efile/refund/") && req.method === "PATCH") {
      return await handleUpdateRefundStatus(req, env);
    }

    // --- Payment API ---
    if (url.pathname.startsWith("/api/payment")) {
      return await paymentRouter.fetch(req, env, ctx);
    }

    // --- E-file Provider Endpoints ---
    if (url.pathname === "/api/efile/efin-profile" && req.method === "GET") {
      return new Response(JSON.stringify(ERO_EFIN_PROFILE), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/efile/bank-products" && req.method === "GET") {
      return new Response(JSON.stringify(BANK_PRODUCT_PROVIDERS), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/efile/payment-methods" && req.method === "GET") {
      return new Response(JSON.stringify(SUPPORTED_PAYMENT_METHODS), { headers: { "Content-Type": "application/json" } });
    }

    // PATCH /api/efile/transmit/:id — Update e-file with bank product/payment info
    if (url.pathname.startsWith("/api/efile/transmit/") && req.method === "PATCH") {
      const id = url.pathname.split("/").pop();
      const body = await req.json() as Record<string, any>;
      await env.DB.prepare(
        `UPDATE efile_transmissions SET bank_product_id = ?, payment_method = ?, payment_details_json = ?, updated_at = ? WHERE id = ?`
      ).bind(
        body.bank_product_id ?? null,
        body.payment_method ?? null,
        body.payment_details ? JSON.stringify(body.payment_details) : null,
        new Date().toISOString(),
        id
      ).run();
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    // POST /api/efile/transmit — Initiate e-file transmission
    if (url.pathname === "/api/efile/transmit" && req.method === "POST") {
      const body = await req.json() as Record<string, any>;
      const id = uuid();
      const now = new Date().toISOString();
      const transmission = {
        id,
        return_id: body.return_id,
        client_id: body.client_id,
        preparer_id: body.preparer_id ?? null,
        method: body.method,
        status: "pending" as const,
        created_at: now,
        updated_at: now,
      };
      await env.DB.prepare(
        `INSERT INTO efile_transmissions (id, return_id, client_id, preparer_id, method, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        body.return_id,
        body.client_id,
        body.preparer_id ?? null,
        body.method,
        "pending",
        now,
        now
      ).run();
      
      // Transmit via MeF integration
      const result = await transmitEFile(
        env, 
        transmission, 
        body.returnXml,  // Optional: XML return data
        body.returnType || "1040",
        body.taxYear || "2025"
      );
      
      // Update database with transmission result
      await env.DB.prepare(
        `UPDATE efile_transmissions 
         SET status = ?, irs_submission_id = ?, ack_code = ?, ack_message = ?, efin = ?, etin = ?, environment = ?, updated_at = ? 
         WHERE id = ?`
      ).bind(
        result.transmission.status,
        result.transmission.irs_submission_id ?? null,
        result.transmission.ack_code ?? null,
        result.transmission.ack_message ?? null,
        result.transmission.efin ?? null,
        result.transmission.etin ?? null,
        result.transmission.environment ?? null,
        result.transmission.updated_at,
        id
      ).run();
      
      return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    // GET /api/efile/status/:id — Get e-file transmission status
    if (url.pathname.startsWith("/api/efile/status/") && req.method === "GET") {
      const id = url.pathname.split("/").pop();
      const row = await env.DB.prepare("SELECT * FROM efile_transmissions WHERE id = ?").bind(id).first();
      if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      
      // If pending, check with IRS for updates
      if (row.status === "pending" && row.irs_submission_id) {
        try {
          const statusUpdate = await checkSubmissionStatus(env, row.irs_submission_id);
          if (statusUpdate.acknowledgment) {
            // Update database with new status
            await env.DB.prepare(
              `UPDATE efile_transmissions SET status = ?, ack_code = ?, ack_message = ?, dcn = ?, updated_at = ? WHERE id = ?`
            ).bind(
              statusUpdate.acknowledgment.status.toLowerCase(),
              statusUpdate.acknowledgment.status === "Accepted" ? "A0000" : "R0000",
              statusUpdate.acknowledgment.status === "Accepted" ? "Accepted by IRS" : (statusUpdate.acknowledgment.errors?.[0]?.errorMessage || "Rejected"),
              statusUpdate.acknowledgment.dcn || null,
              new Date().toISOString(),
              id
            ).run();
            
            // Fetch updated row
            const updatedRow = await env.DB.prepare("SELECT * FROM efile_transmissions WHERE id = ?").bind(id).first();
            return new Response(JSON.stringify(updatedRow), { headers: { "Content-Type": "application/json" } });
          }
        } catch (err) {
          console.error("Error checking submission status:", err);
        }
      }
      
      return new Response(JSON.stringify(row), { headers: { "Content-Type": "application/json" } });
    }
    
    // GET /api/efile/config — Get e-file configuration info
    if (url.pathname === "/api/efile/config" && req.method === "GET") {
      const config = getEFileStatusInfo();
      return new Response(JSON.stringify(config), { headers: { "Content-Type": "application/json" } });
    }
    
    // POST /api/efile/acknowledgments/process — Process new acknowledgments from IRS
    if (url.pathname === "/api/efile/acknowledgments/process" && req.method === "POST") {
      const acks = await processNewAcknowledgments(env);
      return new Response(JSON.stringify({ 
        success: true, 
        processed: acks.length,
        acknowledgments: acks 
      }), { headers: { "Content-Type": "application/json" } });
    }

    // --- IRS Memo Admin Endpoints ---
    if (url.pathname.startsWith("/admin/irs/memos/") && req.method === "PATCH") {
      return await updateIrsMemo(req, env);
    }
    if (url.pathname.startsWith("/admin/irs/memos/") && req.method === "DELETE") {
      return await deleteIrsMemo(req, env);
    }
    if (url.pathname.startsWith("/admin/irs/memos/") && url.pathname.includes("/link/") && req.method === "DELETE") {
      return await unlinkIrsMemoLink(req, env);
    }
    if (url.pathname === "/admin/irs/memos/search" && req.method === "GET") {
      return await searchIrsMemos(req, env);
    }

    // --- IRS Admin API Routes ---
    if (url.pathname === "/admin/irs/memos" && req.method === "GET") {
      return await listIrsMemos(req, env);
    }
    if (url.pathname.startsWith("/admin/irs/memos/") && req.method === "GET") {
      return await getIrsMemo(req, env);
    }
    if (url.pathname.startsWith("/admin/irs/memos/") && url.pathname.endsWith("/link") && req.method === "POST") {
      return await linkIrsMemo(req, env);
    }
    if (url.pathname.startsWith("/admin/clients/") && url.pathname.endsWith("/irs-memos") && req.method === "GET") {
      const clientId = url.pathname.split("/")[3];
      const sql = `SELECT m.* FROM irs_memos m JOIN irs_memo_links l ON m.id = l.memo_id WHERE l.client_id = ? ORDER BY m.published_at DESC`;
      const rows = await env.DB.prepare(sql).bind(clientId).all();
      const memos = rows.results.map((memo: any) => ({ ...memo, tags: memo.tags_json ? JSON.parse(memo.tags_json) : [] }));
      return new Response(JSON.stringify(memos), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname.startsWith("/admin/returns/") && url.pathname.endsWith("/irs-memos") && req.method === "GET") {
      const returnId = url.pathname.split("/")[3];
      const sql = `SELECT m.* FROM irs_memos m JOIN irs_memo_links l ON m.id = l.memo_id WHERE l.return_id = ? ORDER BY m.published_at DESC`;
      const rows = await env.DB.prepare(sql).bind(returnId).all();
      const memos = rows.results.map((memo: any) => ({ ...memo, tags: memo.tags_json ? JSON.parse(memo.tags_json) : [] }));
      return new Response(JSON.stringify(memos), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/admin/irs/schema" && req.method === "GET") {
      return await listIrsSchemaFields(req, env);
    }

    // --- IRS Public API Endpoints ---
    if (url.pathname === "/api/irs/memos/db") {
      try {
        const rows = await env.DB.prepare("SELECT * FROM irs_memos WHERE status = 'active' ORDER BY published_at DESC LIMIT 20").all();
        const memos = rows.results.map((memo: any) => ({
          ...memo,
          tags: memo.tags_json ? JSON.parse(memo.tags_json) : []
        }));
        return new Response(JSON.stringify(memos), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response("Failed to fetch IRS memos from DB", { status: 500 });
      }
    }

    if (url.pathname === "/api/irs/schema/fields") {
      try {
        const rows = await env.DB.prepare("SELECT * FROM irs_schema_fields WHERE status = 'active' ORDER BY detected_at DESC LIMIT 100").all();
        return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response("Failed to fetch IRS schema fields from DB", { status: 500 });
      }
    }

    if (url.pathname === "/api/irs/memo/latest") {
      return new Response(JSON.stringify({
        source: "irb",
        irs_id: "IRB 2025-10",
        title: "...",
        summary: "...",
        full_text: "...",
        published_at: "...",
        url: "...",
        tags: ["EITC", "individual"]
      }), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/irs/schema") {
      try {
        const schema = await fetchIrsSchema();
        return new Response(schema, { headers: { "Content-Type": "application/xml" } });
      } catch (e) {
        return new Response("Failed to fetch IRS schema", { status: 500 });
      }
    }

    if (url.pathname === "/api/irs/memos") {
      try {
        const memos = await fetchIrsMemos();
        return new Response(memos, { headers: { "Content-Type": "application/xml" } });
      } catch (e) {
        return new Response("Failed to fetch IRS memos", { status: 500 });
      }
    }

    // --- Instagram API Endpoints ---
    if (url.pathname === "/api/instagram/feed") {
      return await handleInstagramFeed(env);
    }
    if (url.pathname === "/api/instagram/reviews") {
      return await handleInstagramReviews(env);
    }
    if (url.pathname === "/api/instagram/analytics") {
      return await handleInstagramAnalytics(env);
    }
    if (url.pathname === "/api/instagram/post" && req.method === "POST") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleInstagramPost(req, env, user);
    }
    if (url.pathname === "/api/instagram/dm" && req.method === "POST") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleInstagramDM(req, env, user);
    }

    // --- DocuSign Endpoints ---
    if (url.pathname === "/api/docusign/create-envelope" && req.method === "POST") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleCreateEnvelope(req, env, user);
    }
    if (url.pathname === "/api/docusign/embedded-url" && req.method === "POST") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleEmbeddedSigningUrl(req, env, user);
    }
    if (url.pathname === "/api/docusign/webhook" && req.method === "POST") {
      return await handleDocuSignWebhook(req, env);
    }
    if (url.pathname.startsWith("/api/signatures")) {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      return await handleSignatures(req, env, user);
    }

    // --- Auth Endpoints ---
    if (url.pathname === "/register/staff" && req.method === "POST") {
      return cors(await handleRegisterStaff(req, env));
    }
    if (url.pathname === "/register/client" && req.method === "POST") {
      return cors(await handleRegisterClient(req, env));
    }
    if (url.pathname === "/login/staff" && req.method === "POST") {
      return cors(await handleLoginStaff(req, env));
    }
    if (url.pathname === "/login/client" && req.method === "POST") {
      return cors(await handleLoginClient(req, env));
    }

    // --- Training API Endpoints ---
    if (url.pathname === "/api/training/courses" && req.method === "GET") {
      return await listTrainingCourses(req, env);
    }
    if (url.pathname === "/api/training/enroll" && req.method === "POST") {
      return await enrollTrainingCourse(req, env);
    }

    // --- CRM API Endpoints (Staff/Admin only, encrypted PII) ---
    if (url.pathname === "/api/crm/intakes" && req.method === "GET") {
      return cors(await handleCrmIntakes(req, env));
    }
    if (url.pathname === "/api/crm/intakes" && req.method === "POST") {
      return cors(await handleCrmIntakeCreate(req, env));
    }
    if (url.pathname.startsWith("/api/crm/intakes/") && req.method === "GET") {
      const id = url.pathname.split("/").pop()!;
      return cors(await handleCrmIntakeById(req, env, id));
    }
    if (url.pathname.startsWith("/api/crm/intakes/") && req.method === "DELETE") {
      const id = url.pathname.split("/").pop()!;
      return cors(await handleCrmIntakeDelete(req, env, id));
    }

    // --- Certificates & Licenses API Endpoints (Admin only) ---
    if (url.pathname === "/api/certificates/types" && req.method === "GET") {
      return cors(await handleCertificateTypes(req, env));
    }
    if (url.pathname === "/api/certificates" && req.method === "GET") {
      return cors(await handleListCertificates(req, env));
    }
    if (url.pathname === "/api/certificates/issue" && req.method === "POST") {
      return cors(await handleIssueCertificate(req, env));
    }
    if (url.pathname.match(/^\/api\/certificates\/[^\/]+\/download$/) && req.method === "GET") {
      const id = url.pathname.split("/")[3];
      return cors(await handleDownloadCertificate(req, env, id));
    }
    if (url.pathname.match(/^\/api\/certificates\/[^\/]+\/revoke$/) && req.method === "POST") {
      const id = url.pathname.split("/")[3];
      return cors(await handleRevokeCertificate(req, env, id));
    }
    if (url.pathname.match(/^\/api\/certificates\/[^\/]+$/) && req.method === "GET") {
      const id = url.pathname.split("/").pop()!;
      return cors(await handleGetCertificate(req, env, id));
    }

    // --- Meet the Team API Endpoints ---
    if (url.pathname === "/api/team" && req.method === "GET") {
      return cors(await handleListTeam(req, env));
    }
    if (url.pathname === "/api/team/regions" && req.method === "GET") {
      return cors(await handleListRegions(req, env));
    }
    if (url.pathname.match(/^\/api\/team\/[^\/]+$/) && req.method === "GET") {
      const id = url.pathname.split("/").pop()!;
      return cors(await handleGetTeamMember(req, env, id));
    }

    // --- Compliance API Endpoints ---
    if (url.pathname === "/api/compliance/check" && req.method === "GET") {
      return cors(await handleComplianceCheck(req, env));
    }
    if (url.pathname === "/api/compliance/requirements" && req.method === "GET") {
      return cors(await handleComplianceRequirements(req, env));
    }
    if (url.pathname === "/api/compliance/issue-all" && req.method === "POST") {
      return cors(await handleIssueAllCertificates(req, env));
    }
    if (url.pathname === "/api/compliance/report" && req.method === "GET") {
      return cors(await handleComplianceReport(req, env));
    }

    // --- Social Media Integration Endpoints ---
    if (url.pathname === "/api/social/post" && req.method === "POST") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      return cors(await handleSocialPost(req, env, user));
    }
    if (url.pathname === "/api/social/feed" && req.method === "GET") {
      return cors(await handleSocialFeed(req, env));
    }
    if (url.pathname === "/api/social/metrics" && req.method === "GET") {
      return cors(await handleSocialMetrics(req, env));
    }
    if (url.pathname === "/api/social/schedule" && req.method === "POST") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      return cors(await handleSchedulePost(req, env, user));
    }
    if (url.pathname === "/api/social/mentions" && req.method === "GET") {
      return cors(await handleSocialMentions(req, env));
    }
    if (url.pathname === "/api/social/reply" && req.method === "POST") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      return cors(await handleSocialReply(req, env, user));
    }

    // --- Google Business Integration Endpoints ---
    if (url.pathname === "/api/social/google/reviews" && req.method === "GET") {
      return cors(await handleGoogleReviews(req, env));
    }
    if (url.pathname === "/api/social/google/reply" && req.method === "POST") {
      const user = await verifyAuth(req, env);
      if (!user) return cors(unauthorized());
      return cors(await handleGoogleReplyReview(req, env, user));
    }
    if (url.pathname === "/api/social/google/stats" && req.method === "GET") {
      return cors(await handleGoogleStats(req, env));
    }



    // --- Client Portal API Route (all /api/portal/* endpoints) ---
    if (url.pathname.startsWith("/api/portal")) {
      const reqPath = url.pathname.replace(/^\/api\/portal/, "");
      const portalReq = new Request(reqPath || "/", req);
      Object.defineProperty(portalReq, "params", { value: {} });
      const resp = await portalRouter.handle(portalReq, env);
      return cors(resp);
    }

    // --- AI Support Route (all /api/ai-support/* endpoints) ---
    if (url.pathname.startsWith("/api/ai-support")) {
      const reqPath = url.pathname.replace(/^\/api\/ai-support/, "");
      const aiReq = new Request(reqPath || "/", req);
      Object.defineProperty(aiReq, "params", { value: {} });
      const resp = await aiSupportRouter.handle(aiReq, env);
      return cors(resp);
    }

    // --- Workflow Router (all /api/workflows/* endpoints) ---
    if (url.pathname.startsWith("/api/workflows")) {
      const reqPath = url.pathname.replace(/^\/api\/workflows/, "");
      const workflowReq = new Request(reqPath || "/", req);
      Object.defineProperty(workflowReq, "params", { value: {} });
      const resp = await workflowRouter.handle(workflowReq, env);
      return cors(resp);
    }

    // --- LMS API Route (all /api/lms/* endpoints) ---
    if (url.pathname.startsWith("/api/lms")) {
      // itty-router expects the path only (no query)
      const reqPath = url.pathname.replace(/^\/api\/lms/, "");
      // Patch req.url for itty-router
      const lmsReq = new Request(reqPath || "/", req);
      // Attach params for itty-router
      Object.defineProperty(lmsReq, "params", { value: {} });
      // Route
      const resp = await lmsRouter.handle(lmsReq, env);
      return cors(resp);
    }

    // LMS Payment Gateway
    if (url.pathname === "/api/lms/payment" && request.method === "POST") {
      return await lmsPaymentRouter.handle(request, event.target.env);
    }

    // --- Admin Email Routes Endpoint ---
    if (url.pathname === "/api/admin/email-routes" && req.method === "GET") {
      return cors(new Response(JSON.stringify(ADMIN_EMAIL_ROUTES), {
        headers: { "Content-Type": "application/json" }
      }));
    }

    return new Response("Not Found", { status: 404 });
  },

  // Scheduled handler for IRS sync and data retention
  async scheduled(event: any, env: any, ctx: any) {
    console.log("Running scheduled tasks...");
    await handleScheduledIRSSync(env, ctx);
    await handleAuditLogProcessing(env, ctx);
  }
};
