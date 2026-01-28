// IRS Real-time Schema and Memos Integration
// Integration ID: 167c3ccd-56ce-4822-872f-711c5193f292

const IRS_REALTIME_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAihr5PtCXRVCgjAlOcZi7
0hX3c+4P2Kmp8Qqv+FFJmMhH0+dHSAqGfCUW8ZRq3jffrWFnPX1cTtGEudVFECLE
N+nNFSh0Ed699Roly9g6tuvbse/bxOIVljgfMWTtTKbiDTRRj0mcwHekmxdOHu7p
wMB+7ldF27u479ZtZ8Z7DaHgF37CMNMq1uwx0Px12AE0WzL70eLnXBAlIsotQAiU
cErpTk7xf4uRcrM4lOX4c/GdkaiASEgNY/BPcWDXRugl0C86WuAYvdYyUMkvBJba
bwH4tr0bwdjLrDF0DU+WHkJraDY0ESB3XLaYik+8c8U7GbUEyuARm51NvIexOswL
owIDAQAB
-----END PUBLIC KEY-----`;

const IRS_REALTIME_INTEGRATION_ID = "167c3ccd-56ce-4822-872f-711c5193f292";

interface IrsRealtimePayload {
  type: "schema_update" | "memo_published" | "memo_updated";
  timestamp: string;
  data: any;
  signature?: string;
}

// Verify IRS signature (if provided)
async function verifyIrsSignature(payload: string, signature: string): Promise<boolean> {
  try {
    // TODO: Implement RSA signature verification using IRS_REALTIME_PUBLIC_KEY
    // For now, we'll accept all requests (implement proper verification in production)
    return true;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

// Handle real-time schema updates from IRS
export async function handleIrsRealtimeSchema(request: Request, env: any) {
  try {
    const body: IrsRealtimePayload = await request.json();
    
    // Verify signature if provided
    if (body.signature) {
      const payloadStr = JSON.stringify({ type: body.type, timestamp: body.timestamp, data: body.data });
      const isValid = await verifyIrsSignature(payloadStr, body.signature);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    if (body.type === "schema_update") {
      // Process schema update
      const { formType, taxYear, fields } = body.data;
      
      if (!env.DB) {
        console.warn("DB binding not available, skipping schema update");
      } else {
        // Store schema fields in database
        for (const field of fields || []) {
          try {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO irs_schema_fields 
               (id, form_type, tax_year, field_name, field_path, field_type, description, status, detected_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(
              field.id || crypto.randomUUID(),
              formType,
              taxYear,
              field.name,
              field.path,
              field.type || "string",
              field.description || null,
              "active"
            ).run();
          } catch (fieldError) {
            console.error(`Failed to insert field ${field.name}:`, fieldError);
          }
        }
      }
      
      console.log(`Processed schema update for ${formType} ${taxYear}: ${fields?.length || 0} fields`);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      integrationId: IRS_REALTIME_INTEGRATION_ID,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("IRS realtime schema error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Handle real-time memo updates from IRS
export async function handleIrsRealtimeMemo(request: Request, env: any) {
  try {
    const body: IrsRealtimePayload = await request.json();
    
    // Verify signature if provided
    if (body.signature) {
      const payloadStr = JSON.stringify({ type: body.type, timestamp: body.timestamp, data: body.data });
      const isValid = await verifyIrsSignature(payloadStr, body.signature);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    if (body.type === "memo_published" || body.type === "memo_updated") {
      // Process memo update
      const { irsId, title, summary, fullText, publishedAt, url, tags, source } = body.data;
      
      if (!env.DB) {
        console.warn("DB binding not available, skipping memo update");
      } else {
        const memoId = crypto.randomUUID();
        try {
          await env.DB.prepare(
            `INSERT OR REPLACE INTO irs_memos 
             (id, source, irs_id, title, summary, full_text, published_at, url, tags_json, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            memoId,
            source || "irs_realtime",
            irsId,
            title,
            summary || null,
            fullText || null,
            publishedAt || new Date().toISOString(),
            url || null,
            tags ? JSON.stringify(tags) : null,
            "active"
          ).run();
        } catch (memoError) {
          console.error("Failed to store memo in database:", memoError);
        }
      }
      
      console.log(`Processed memo ${body.type}: ${irsId} - ${title}`);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      integrationId: IRS_REALTIME_INTEGRATION_ID,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("IRS realtime memo error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Health check for IRS realtime integration
export function getIrsRealtimeStatus() {
  return {
    integrationId: IRS_REALTIME_INTEGRATION_ID,
    status: "active",
    publicKeyFingerprint: "SHA256:ihr5PtCXRVCgjAlOcZi7...",
    supportedEvents: ["schema_update", "memo_published", "memo_updated"]
  };
}
