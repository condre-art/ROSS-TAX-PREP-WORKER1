/**
 * Bank Products API Routes
 * Santa Barbara TPG Integration for Refund Transfer, Refund Advance, and EITC products
 */

import { Router } from 'itty-router';
import { v4 as uuid } from 'uuid';
import { createSBTPGClient } from '../bankProducts/santaBarbaraTPG';

const router = Router({ base: '/api/bank-products' });

/**
 * Get available bank products for a refund amount
 * GET /api/bank-products/eligibility
 */
router.get('/eligibility', async (req: any, env: any) => {
  const url = new URL(req.url);
  const refundAmount = parseFloat(url.searchParams.get('refundAmount') || '0');
  const eitcAmount = parseFloat(url.searchParams.get('eitcAmount') || '0');
  const productType = url.searchParams.get('productType') as 'RT' | 'RAL' | 'EITC_Advance' || 'RT';

  if (refundAmount <= 0) {
    return new Response(JSON.stringify({ error: 'Valid refund amount required' }), { status: 400 });
  }

  const client = createSBTPGClient(env);
  const eligibleProducts = await client.checkEligibility(refundAmount, eitcAmount, productType);

  return new Response(JSON.stringify({ 
    refund_amount: refundAmount,
    eitc_amount: eitcAmount,
    eligible_products: eligibleProducts 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * Create Refund Transfer
 * POST /api/bank-products/refund-transfer
 */
router.post('/refund-transfer', async (req: any, env: any) => {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.client_id || !body.return_id || !body.refund_amount) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: client_id, return_id, refund_amount' 
      }), { status: 400 });
    }

    if (!body.taxpayer_ssn || !body.taxpayer_name) {
      return new Response(JSON.stringify({ 
        error: 'Missing taxpayer information: taxpayer_ssn, taxpayer_name' 
      }), { status: 400 });
    }

    const client = createSBTPGClient(env);
    const transaction = await client.createRefundTransfer({
      client_id: body.client_id,
      return_id: body.return_id,
      taxpayer_ssn: body.taxpayer_ssn,
      taxpayer_name: body.taxpayer_name,
      refund_amount: body.refund_amount,
      routing_number: body.routing_number,
      account_number: body.account_number,
      account_type: body.account_type,
      product_id: body.product_id || 'RT-2025'
    });

    // Log audit trail
    await env.DB.prepare(`
      INSERT INTO audit_log (id, action, entity, entity_id, user_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      uuid(),
      'create',
      'bank_product_transaction',
      transaction.id,
      body.client_id,
      JSON.stringify({ product_type: 'RT', amount: body.refund_amount })
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      transaction 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Bank Products] RT creation failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create refund transfer' 
    }), { status: 500 });
  }
});

/**
 * Create Refund Advance Loan
 * POST /api/bank-products/refund-advance
 */
router.post('/refund-advance', async (req: any, env: any) => {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.client_id || !body.return_id || !body.estimated_refund || !body.requested_advance) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), { status: 400 });
    }

    if (!body.taxpayer_ssn || !body.taxpayer_name) {
      return new Response(JSON.stringify({ 
        error: 'Missing taxpayer information' 
      }), { status: 400 });
    }

    if (!body.credit_check_consent) {
      return new Response(JSON.stringify({ 
        error: 'Credit check consent is required for refund advance loans' 
      }), { status: 400 });
    }

    const client = createSBTPGClient(env);
    const transaction = await client.createRefundAdvance({
      client_id: body.client_id,
      return_id: body.return_id,
      taxpayer_ssn: body.taxpayer_ssn,
      taxpayer_name: body.taxpayer_name,
      estimated_refund: body.estimated_refund,
      requested_advance: body.requested_advance,
      eitc_amount: body.eitc_amount,
      credit_check_consent: body.credit_check_consent,
      product_id: body.product_id || 'RAL-2025'
    });

    // Log audit trail
    await env.DB.prepare(`
      INSERT INTO audit_log (id, action, entity, entity_id, user_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      uuid(),
      'create',
      'bank_product_transaction',
      transaction.id,
      body.client_id,
      JSON.stringify({ product_type: 'RAL', amount: body.requested_advance })
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      transaction 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Bank Products] RAL creation failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create refund advance' 
    }), { status: 500 });
  }
});

/**
 * Get transaction status
 * GET /api/bank-products/transactions/:id
 */
router.get('/transactions/:id', async (req: any, env: any) => {
  const id = req.params.id;
  
  const client = createSBTPGClient(env);
  const transaction = await client.getTransactionStatus(id);

  if (!transaction) {
    return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404 });
  }

  return new Response(JSON.stringify(transaction), {
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * List client transactions
 * GET /api/bank-products/transactions
 */
router.get('/transactions', async (req: any, env: any) => {
  const url = new URL(req.url);
  const clientId = url.searchParams.get('client_id');
  const returnId = url.searchParams.get('return_id');
  const status = url.searchParams.get('status');

  let query = 'SELECT * FROM bank_product_transactions WHERE 1=1';
  const params: any[] = [];

  if (clientId) {
    query += ' AND client_id = ?';
    params.push(parseInt(clientId));
  }

  if (returnId) {
    query += ' AND return_id = ?';
    params.push(parseInt(returnId));
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  const rows = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({ 
    transactions: rows.results 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * Get bank product configuration
 * GET /api/bank-products/config
 */
router.get('/config', async (req: any, env: any) => {
  const url = new URL(req.url);
  const taxYear = url.searchParams.get('tax_year') || '2025';

  const rows = await env.DB.prepare(
    'SELECT * FROM bank_product_config WHERE tax_year = ? AND active = 1 ORDER BY product_type'
  ).bind(parseInt(taxYear)).all();

  return new Response(JSON.stringify({ 
    tax_year: taxYear,
    products: rows.results 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * Calculate estimated fees
 * POST /api/bank-products/calculate-fees
 */
router.post('/calculate-fees', async (req: any, env: any) => {
  try {
    const body = await req.json();
    
    if (!body.product_id || !body.amount) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: product_id, amount' 
      }), { status: 400 });
    }

    const product = await env.DB.prepare(
      'SELECT * FROM bank_product_config WHERE product_id = ? AND active = 1'
    ).bind(body.product_id).first();

    if (!product) {
      return new Response(JSON.stringify({ 
        error: 'Product not found or inactive' 
      }), { status: 404 });
    }

    const amount = parseFloat(body.amount);
    let baseFee = product.base_fee || 0;
    let percentageFee = (amount * ((product.percentage_fee || 0) / 100));
    let totalFee = baseFee + percentageFee;

    if (product.max_fee && totalFee > product.max_fee) {
      totalFee = product.max_fee;
    }

    totalFee = Math.round(totalFee * 100) / 100;

    return new Response(JSON.stringify({
      product_id: body.product_id,
      product_name: product.product_name,
      refund_amount: amount,
      base_fee: baseFee,
      percentage_fee: percentageFee,
      total_fee: totalFee,
      net_amount: amount - totalFee,
      requirements: {
        min_refund_amount: product.min_refund_amount,
        max_refund_amount: product.max_refund_amount,
        eitc_required: product.eitc_required === 1,
        credit_check_required: product.credit_check_required === 1
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Bank Products] Fee calculation failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to calculate fees' 
    }), { status: 500 });
  }
});

/**
 * Webhook endpoint for SBTPG status updates
 * POST /api/bank-products/webhook
 */
router.post('/webhook', async (req: any, env: any) => {
  try {
    const body = await req.json();
    
    // Validate webhook signature (implement SBTPG signature validation)
    const signature = req.headers.get('X-SBTPG-Signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 });
    }

    // Store webhook payload
    const webhookId = uuid();
    await env.DB.prepare(`
      INSERT INTO bank_product_webhooks (id, transaction_id, webhook_event, payload, processed, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
    `).bind(
      webhookId,
      body.transaction_id,
      body.event,
      JSON.stringify(body)
    ).run();

    // Update transaction status
    if (body.status) {
      await env.DB.prepare(`
        UPDATE bank_product_transactions 
        SET status = ?, updated_at = datetime('now')
        WHERE sbtpg_transaction_id = ?
      `).bind(body.status, body.transaction_id).run();

      // Mark webhook as processed
      await env.DB.prepare(`
        UPDATE bank_product_webhooks 
        SET processed = 1, processed_at = datetime('now')
        WHERE id = ?
      `).bind(webhookId).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Bank Products] Webhook processing failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Webhook processing failed' 
    }), { status: 500 });
  }
});

/**
 * SBTPG client info (for debugging)
 * GET /api/bank-products/info
 */
router.get('/info', async (req: any, env: any) => {
  const client = createSBTPGClient(env);
  const info = client.getInfo();

  return new Response(JSON.stringify(info), {
    headers: { 'Content-Type': 'application/json' }
  });
});

export default router;
