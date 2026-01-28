// IRS Acknowledgment Callback Handler
interface IrsCallbackBody {
  submissionId?: string;
  clientId?: number;
  status?: string;
  ackTimestamp?: string;
  errors?: any;
}

export async function handleIrsCallback(request: Request, env: any) {
  try {
    const body = await request.json() as IrsCallbackBody;
    
    // Validate the callback signature/authentication
    const signature = request.headers.get("X-IRS-Signature");
    // TODO: Verify signature if needed
    
    // Extract acknowledgment data
    const { submissionId, clientId, status, ackTimestamp, errors } = body;
    
    if (!submissionId) {
      return new Response(JSON.stringify({ error: "Missing submissionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // If clientId not provided, query database to find it
    let workflowClientId = clientId;
    if (!workflowClientId && env.DB) {
      try {
        const submission = await env.DB.prepare(
          "SELECT client_id FROM efile_submissions WHERE submission_id = ?"
        ).bind(submissionId).first();
        if (submission) {
          workflowClientId = submission.client_id;
        }
      } catch (e) {
        console.error("Failed to fetch client_id from DB:", e);
      }
    }
    
    // Update submission status in database
    if (!env.DB) {
      console.warn("DB binding not available, skipping status update");
    } else {
      try {
        await env.DB.prepare(
          `UPDATE efile_submissions 
           SET status = ?, ack_timestamp = ?, errors = ? 
           WHERE submission_id = ?`
        ).bind(
          status || "acknowledged",
          ackTimestamp || new Date().toISOString(),
          errors ? JSON.stringify(errors) : null,
          submissionId
        ).run();
      } catch (dbError) {
        console.error("Database update failed:", dbError);
        // Don't fail the entire request if DB update fails
      }
    }
    
    // Trigger workflow event if Workflow binding exists and clientId is available
    if (env.MY_WORKFLOW && workflowClientId) {
      try {
        // Find the workflow instance waiting for this acknowledgment
        const instance = await env.MY_WORKFLOW.get(workflowClientId.toString());
        if (instance) {
          await instance.resume("irs_ack", {
            status,
            timestamp: ackTimestamp,
            errors,
            submissionId
          });
        }
      } catch (e) {
        console.error("Failed to resume workflow:", e);
      }
    }
    
    return new Response(JSON.stringify({ success: true, submissionId, clientId: workflowClientId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("IRS callback error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
