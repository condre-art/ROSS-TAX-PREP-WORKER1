// src/routes/crm.ts
// CRM API with authentication + encryption for sensitive data

import { requireStaff } from "../middleware/auth";
import { encryptPII, decryptPII } from "../utils/encryption";
import { logAudit } from "../utils/audit";

export interface IntakeRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service: string;
  notes: string;
  ip: string;
  created_at: string;
}

/**
 * GET /api/crm/intakes - List all client intakes (staff/admin only)
 */
export async function handleCrmIntakes(req: Request, env: any): Promise<Response> {
  // Require staff or admin authentication
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) {
    return authResult; // Unauthorized
  }
  const user = authResult;

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM intakes ORDER BY created_at DESC LIMIT 500"
    ).all();

    // Decrypt sensitive fields before returning
    const decryptedResults = await Promise.all(
      (results || []).map(async (row: any) => {
        try {
          return {
            ...row,
            full_name: row.full_name ? await decryptPII(row.full_name, env) : row.full_name,
            email: row.email ? await decryptPII(row.email, env) : row.email,
            phone: row.phone ? await decryptPII(row.phone, env) : row.phone,
            notes: row.notes ? await decryptPII(row.notes, env) : row.notes,
          };
        } catch {
          // If decryption fails, return as-is (legacy unencrypted data)
          return row;
        }
      })
    );

    // Audit log
    await logAudit(env, {
      action: "crm_intakes_view",
      user_id: user.id,
      user_email: user.email,
      entity: "intakes",
      details: JSON.stringify({ count: decryptedResults.length }),
    });

    return new Response(JSON.stringify(decryptedResults), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("CRM intakes error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch intakes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * GET /api/crm/intakes/:id - Get a single intake (staff/admin only)
 */
export async function handleCrmIntakeById(req: Request, env: any, id: string): Promise<Response> {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;

  try {
    const row = await env.DB.prepare("SELECT * FROM intakes WHERE id = ?").bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: "Intake not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Decrypt sensitive fields
    let decrypted = row;
    try {
      decrypted = {
        ...row,
        full_name: row.full_name ? await decryptPII(row.full_name, env) : row.full_name,
        email: row.email ? await decryptPII(row.email, env) : row.email,
        phone: row.phone ? await decryptPII(row.phone, env) : row.phone,
        notes: row.notes ? await decryptPII(row.notes, env) : row.notes,
      };
    } catch {
      // Legacy unencrypted data
    }

    await logAudit(env, {
      action: "crm_intake_view",
      user_id: user.id,
      user_email: user.email,
      entity: "intakes",
      entity_id: id,
    });

    return new Response(JSON.stringify(decrypted), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("CRM intake by id error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch intake" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/crm/intakes - Create a new intake (encrypts sensitive data)
 */
export async function handleCrmIntakeCreate(req: Request, env: any): Promise<Response> {
  try {
    const body = await req.json() as { full_name?: string; email?: string; phone?: string; service?: string; notes?: string };
    const { full_name, email, phone, service, notes } = body;

    if (!full_name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    // Encrypt sensitive fields
    const encFullName = await encryptPII(full_name, env);
    const encEmail = await encryptPII(email, env);
    const encPhone = phone ? await encryptPII(phone, env) : null;
    const encNotes = notes ? await encryptPII(notes, env) : null;

    await env.DB.prepare(
      `INSERT INTO intakes (id, full_name, email, phone, service, notes, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, encFullName, encEmail, encPhone, service || null, encNotes, ip, created_at)
      .run();

    await logAudit(env, {
      action: "crm_intake_create",
      entity: "intakes",
      entity_id: id,
      details: JSON.stringify({ service }),
    });

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("CRM intake create error:", error);
    return new Response(JSON.stringify({ error: "Failed to create intake" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE /api/crm/intakes/:id - Delete an intake (admin only)
 */
export async function handleCrmIntakeDelete(req: Request, env: any, id: string): Promise<Response> {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;

  // Only admin can delete
  if (user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await env.DB.prepare("DELETE FROM intakes WHERE id = ?").bind(id).run();

    await logAudit(env, {
      action: "crm_intake_delete",
      user_id: user.id,
      user_email: user.email,
      entity: "intakes",
      entity_id: id,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("CRM intake delete error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete intake" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
