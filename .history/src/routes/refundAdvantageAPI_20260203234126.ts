/**
 * Bank Products API Routes - Refund Advantage Integration
 * 
 * Endpoints:
 * - POST /api/bank-products/transmit - Transmit to Refund Advantage
 * - GET /api/bank-products/:transmissionId/status - Get transmission status
 * - POST /api/bank-products/:transmissionId/approve - Approve RA (admin)
 * - POST /api/bank-products/:transmissionId/process-transfer - Process RT (admin)
 * - GET /api/loans/prequalify - Get instant loan offer
 * - POST /api/loans/accept - Accept instant loan
 * - POST /api/webhooks/refund-advantage - Refund Advantage webhook
 */

import { Router } from 'itty-router';
import {
  transmitBankProduct,
  approveRefundAdvance,
  processRefundTransfer,
  getTransmissionStatus,
  getInstantLoanOffer,
  acceptInstantLoan,
  handleRefundAdvantageWebhook
} from '../refundAdvantageAPI';
import { verifyAuth, isAdmin } from '../utils/auth';

const router = Router();

/**
 * POST /api/bank-products/transmit
 * Transmit bank product to Refund Advantage
 */
router.post('/bank-products/transmit', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    const data = await req.json();
    
    if (!data.return_id || !data.product_type || !data.routing_number || !data.account_number) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: return_id, product_type, routing_number, account_number'
      }), { status: 400 });
    }
    
    const transmission = await transmitBankProduct(env, {
      client_id: auth.userId!,
      return_id: data.return_id,
      product_type: data.product_type,
      routing_number: data.routing_number,
      account_number: data.account_number,
      account_type: data.account_type || 'checking',
      account_holder_name: data.account_holder_name,
      refund_amount: data.refund_amount,
      advance_amount: data.advance_amount,
      fee: data.fee || 0
    });
    
    return new Response(JSON.stringify({
      success: true,
      transmission
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error transmitting bank product:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/bank-products/:transmissionId/status
 * Get transmission status from Refund Advantage
 */
router.get('/bank-products/:transmissionId/status', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    const transmissionId = req.params.transmissionId;
    const status = await getTransmissionStatus(env, transmissionId);
    
    return new Response(JSON.stringify({
      success: true,
      ...status
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting transmission status:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/bank-products/:transmissionId/approve
 * Approve refund advance (admin)
 */
router.post('/bank-products/:transmissionId/approve', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid || !isAdmin(auth)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin only' }), { status: 403 });
    }
    
    const { approved_amount } = await req.json();
    const transmissionId = req.params.transmissionId;
    
    if (!approved_amount) {
      return new Response(JSON.stringify({ error: 'Missing approved_amount' }), { status: 400 });
    }
    
    await approveRefundAdvance(env, transmissionId, approved_amount);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Refund advance approved'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error approving refund advance:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/bank-products/:transmissionId/process-transfer
 * Process refund transfer from IRS (admin)
 */
router.post('/bank-products/:transmissionId/process-transfer', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid || !isAdmin(auth)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin only' }), { status: 403 });
    }
    
    const { irs_refund_amount } = await req.json();
    const transmissionId = req.params.transmissionId;
    
    if (!irs_refund_amount) {
      return new Response(JSON.stringify({ error: 'Missing irs_refund_amount' }), { status: 400 });
    }
    
    await processRefundTransfer(env, transmissionId, irs_refund_amount);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Refund transfer processed'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error processing refund transfer:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/loans/prequalify
 * Get instant loan pre-qualification offer
 */
router.get('/loans/prequalify', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    const url = new URL(req.url);
    const requestedAmount = parseInt(url.searchParams.get('amount') || '0');
    
    if (!requestedAmount || requestedAmount < 500) {
      return new Response(JSON.stringify({
        error: 'Requested amount must be at least $500'
      }), { status: 400 });
    }
    
    const offer = await getInstantLoanOffer(env, auth.userId!, requestedAmount);
    
    return new Response(JSON.stringify({
      success: true,
      offer
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting loan offer:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/loans/accept
 * Accept instant loan offer
 */
router.post('/loans/accept', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    const data = await req.json();
    
    if (!data.loan_amount || !data.routing_number || !data.account_number) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: loan_amount, routing_number, account_number'
      }), { status: 400 });
    }
    
    const transmission = await acceptInstantLoan(
      env,
      auth.userId!,
      data.loan_amount,
      data.routing_number,
      data.account_number,
      data.account_type || 'checking'
    );
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Loan accepted',
      transmission
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error accepting loan:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/webhooks/refund-advantage
 * Refund Advantage webhook callback
 */
router.post('/webhooks/refund-advantage', async (req, env) => {
  try {
    const body = await req.json();
    const signature = req.headers.get('X-Webhook-Signature') || '';
    
    await handleRefundAdvantageWebhook(env, body, signature);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processed'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error processing webhook:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

export default router;
