// src/routes/certificates.ts
// Generate and issue digital certificates and licenses for compliance

import { requireAdmin } from "../middleware/auth";
import { logAudit } from "../utils/audit";

export interface Certificate {
  id: string;
  type: string;
  title: string;
  issuer: string;
  issuedTo: string;
  issuedAt: string;
  expiresAt?: string;
  status: "active" | "expired" | "revoked";
  credentials: Record<string, string>;
  signature: string;
}

// Predefined certificate templates
const CERTIFICATE_TEMPLATES: Record<string, Partial<Certificate>> = {
  EFIN: {
    type: "EFIN",
    title: "IRS Electronic Filing Identification Number",
    issuer: "Internal Revenue Service",
  },
  PTIN: {
    type: "PTIN",
    title: "Preparer Tax Identification Number",
    issuer: "Internal Revenue Service",
  },
  CAF: {
    type: "CAF",
    title: "Centralized Authorization File Number",
    issuer: "Internal Revenue Service",
  },
  ETIN: {
    type: "ETIN",
    title: "Electronic Transmitter Identification Number",
    issuer: "Internal Revenue Service",
  },
  BUSINESS_LICENSE: {
    type: "BUSINESS_LICENSE",
    title: "Business License",
    issuer: "State of Texas",
  },
  ERO_CERTIFICATE: {
    type: "ERO_CERTIFICATE",
    title: "Authorized IRS E-File Provider (ERO)",
    issuer: "Internal Revenue Service",
  },
  SOFTWARE_DEVELOPER: {
    type: "SOFTWARE_DEVELOPER",
    title: "IRS MeF Software Developer Certification",
    issuer: "Internal Revenue Service",
  },
  DATA_SECURITY: {
    type: "DATA_SECURITY",
    title: "Data Security Compliance Certificate",
    issuer: "Ross Tax Prep & Bookkeeping",
  },
  STAFF_TRAINING: {
    type: "STAFF_TRAINING",
    title: "Staff Training & Compliance Completion",
    issuer: "Ross Tax Prep & Bookkeeping",
  },
};

/**
 * Generate a digital signature for a certificate
 */
async function generateCertificateSignature(cert: Partial<Certificate>, env: any): Promise<string> {
  const data = JSON.stringify({
    type: cert.type,
    issuedTo: cert.issuedTo,
    issuedAt: cert.issuedAt,
    credentials: cert.credentials,
  });
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data + (env.CERT_SECRET || "cert-signing-key"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * GET /api/certificates - List all certificates (admin only)
 */
export async function handleListCertificates(req: Request, env: any): Promise<Response> {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM certificates ORDER BY issued_at DESC"
    ).all();

    await logAudit(env, {
      action: "certificates_list",
      user_id: user.id,
      user_email: user.email,
      entity: "certificates",
    });

    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("List certificates error:", error);
    return new Response(JSON.stringify({ error: "Failed to list certificates" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/certificates/issue - Issue a new certificate (admin only)
 */
export async function handleIssueCertificate(req: Request, env: any): Promise<Response> {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;

  try {
    const body = await req.json() as { type?: string; issuedTo?: string; credentials?: Record<string, string>; expiresAt?: string };
    const { type, issuedTo, credentials, expiresAt } = body;

    if (!type || !issuedTo) {
      return new Response(JSON.stringify({ error: "type and issuedTo are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const template = CERTIFICATE_TEMPLATES[type];
    if (!template) {
      return new Response(
        JSON.stringify({
          error: "Invalid certificate type",
          validTypes: Object.keys(CERTIFICATE_TEMPLATES),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const id = crypto.randomUUID();
    const issuedAt = new Date().toISOString();

    const cert: Certificate = {
      id,
      type,
      title: template.title!,
      issuer: template.issuer!,
      issuedTo,
      issuedAt,
      expiresAt: expiresAt ?? undefined,
      status: "active",
      credentials: credentials || {},
      signature: "",
    };

    cert.signature = await generateCertificateSignature(cert, env);

    await env.DB.prepare(
      `INSERT INTO certificates (id, type, title, issuer, issued_to, issued_at, expires_at, status, credentials_json, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        cert.id,
        cert.type,
        cert.title,
        cert.issuer,
        cert.issuedTo,
        cert.issuedAt,
        cert.expiresAt,
        cert.status,
        JSON.stringify(cert.credentials),
        cert.signature
      )
      .run();

    await logAudit(env, {
      action: "certificate_issue",
      user_id: user.id,
      user_email: user.email,
      entity: "certificates",
      entity_id: id,
      details: JSON.stringify({ type, issuedTo }),
    });

    return new Response(JSON.stringify({ ok: true, certificate: cert }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Issue certificate error:", error);
    return new Response(JSON.stringify({ error: "Failed to issue certificate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * GET /api/certificates/:id - Get a certificate by ID
 */
export async function handleGetCertificate(req: Request, env: any, id: string): Promise<Response> {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const row = await env.DB.prepare("SELECT * FROM certificates WHERE id = ?").bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: "Certificate not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cert = {
      ...row,
      credentials: row.credentials_json ? JSON.parse(row.credentials_json) : {},
    };

    return new Response(JSON.stringify(cert), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Get certificate error:", error);
    return new Response(JSON.stringify({ error: "Failed to get certificate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/certificates/:id/revoke - Revoke a certificate (admin only)
 */
export async function handleRevokeCertificate(req: Request, env: any, id: string): Promise<Response> {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;

  try {
    await env.DB.prepare("UPDATE certificates SET status = 'revoked' WHERE id = ?").bind(id).run();

    await logAudit(env, {
      action: "certificate_revoke",
      user_id: user.id,
      user_email: user.email,
      entity: "certificates",
      entity_id: id,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Revoke certificate error:", error);
    return new Response(JSON.stringify({ error: "Failed to revoke certificate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * GET /api/certificates/:id/download - Download certificate as JSON (for PDF generation client-side)
 */
export async function handleDownloadCertificate(req: Request, env: any, id: string): Promise<Response> {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const row = await env.DB.prepare("SELECT * FROM certificates WHERE id = ?").bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: "Certificate not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cert = {
      ...row,
      credentials: row.credentials_json ? JSON.parse(row.credentials_json) : {},
    };

    // Return as downloadable JSON
    return new Response(JSON.stringify(cert, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="certificate-${cert.type}-${cert.id}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Download certificate error:", error);
    return new Response(JSON.stringify({ error: "Failed to download certificate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * GET /api/certificates/types - List available certificate types
 */
export async function handleCertificateTypes(req: Request, env: any): Promise<Response> {
  return new Response(
    JSON.stringify(
      Object.entries(CERTIFICATE_TEMPLATES).map(([key, val]) => ({
        type: key,
        title: val.title,
        issuer: val.issuer,
      }))
    ),
    { headers: { "Content-Type": "application/json" } }
  );
}
