// Credential Upload Handler
interface CredentialUploadBody {
  clientId?: number;
  credentialType?: string;
  encryptedData?: string;
  returnId?: number;
}

export async function handleCredentialUpload(request: Request, env: any) {
  try {
    const body = await request.json() as CredentialUploadBody;
    
    // Extract credential data
    const { clientId, credentialType, encryptedData, returnId } = body;
    
    if (!clientId || !credentialType || !encryptedData) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: clientId, credentialType, encryptedData" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Store encrypted credentials in database
    const credentialId = crypto.randomUUID();
    if (!env.DB) {
      console.warn("DB binding not available, skipping credential storage");
    } else {
      try {
        await env.DB.prepare(
          `INSERT INTO client_credentials 
           (id, client_id, return_id, credential_type, encrypted_data, uploaded_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(
          credentialId,
          clientId,
          returnId || null,
          credentialType,
          encryptedData
        ).run();
      } catch (dbError) {
        console.error("Failed to store credentials in database:", dbError);
        // Don't fail the request if DB insert fails
      }
    }
    
    // Trigger workflow event if Workflow binding exists
    if (env.MY_WORKFLOW) {
      try {
        // Find the workflow instance waiting for credentials
        const instance = await env.MY_WORKFLOW.get(clientId);
        if (instance) {
          await instance.resume("credential_uploaded", {
            credentialId,
            credentialType,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Failed to resume workflow:", e);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      credentialId 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Credential upload error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
