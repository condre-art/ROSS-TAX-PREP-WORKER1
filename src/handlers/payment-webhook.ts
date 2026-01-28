// Payment Provider Webhook Handler
interface PaymentWebhookBody {
  transactionId?: string;
  clientId?: number;
  amount?: number;
  status?: string;
  paymentMethod?: string;
}

export async function handlePaymentWebhook(request: Request, env: any) {
  try {
    const body = await request.json() as PaymentWebhookBody;
    
    // Validate webhook signature (depends on payment provider)
    const signature = request.headers.get("X-Payment-Signature");
    // TODO: Verify signature based on provider (Stripe, Square, etc.)
    
    // Extract payment data
    const { transactionId, clientId, amount, status, paymentMethod } = body;
    
    if (!transactionId) {
      return new Response(JSON.stringify({ error: "Missing transactionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Record payment in database
    if (!env.DB) {
      console.warn("DB binding not available, skipping payment record");
    } else {
      try {
        await env.DB.prepare(
          `INSERT INTO payments (id, client_id, transaction_id, amount, status, payment_method, created_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(
          crypto.randomUUID(),
          clientId,
          transactionId,
          amount,
          status || "completed",
          paymentMethod || "card"
        ).run();
      } catch (dbError) {
        console.error("Failed to record payment in database:", dbError);
        // Don't fail the webhook if DB insert fails
      }
    }
    
    // Trigger workflow event if Workflow binding exists
    if (env.MY_WORKFLOW && clientId) {
      try {
        // Find the workflow instance waiting for this payment
        const instance = await env.MY_WORKFLOW.get(clientId);
        if (instance) {
          await instance.resume("payment_confirmed", {
            transactionId,
            amount,
            status,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Failed to resume workflow:", e);
      }
    }
    
    return new Response(JSON.stringify({ success: true, transactionId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
