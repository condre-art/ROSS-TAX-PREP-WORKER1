/**
 * Financial Institution (FI) API Routes
 * Manages accounts, transactions, advances, and loans
 */

import { Router } from 'itty-router';
import {
  createFIAccount,
  getFIAccount,
  listFIAccounts,
  createFITransaction,
  getFITransactionHistory,
  processRTTransaction,
  originateRefundAdvance,
  fundRefundAdvance,
  originateLoan,
  fundLoan,
  calculateFDICCoverage
} from '../financialInstitution';
import { verifyAuth, isAdmin } from '../utils/auth';

const router = Router();

// ============================================================================
// ACCOUNT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/fi/accounts/create
 * Create new FI account (savings or checking)
 */
router.post('/fi/accounts/create', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const data = await req.json();

    if (!data.account_type || !data.account_name) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: account_type, account_name'
      }), { status: 400 });
    }

    const account = await createFIAccount(env, {
      client_id: auth.userId!,
      account_type: data.account_type,
      account_name: data.account_name
    });

    return new Response(JSON.stringify({
      success: true,
      account,
      message: `${data.account_type} account created successfully`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error creating account:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/fi/accounts
 * List all FI accounts for client
 */
router.get('/fi/accounts', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const accounts = await listFIAccounts(env, auth.userId!);
    const fdic = calculateFDICCoverage(accounts);

    return new Response(JSON.stringify({
      success: true,
      accounts,
      fdic_coverage: fdic,
      total_balance: accounts.reduce((sum, a) => sum + a.balance, 0),
      account_count: accounts.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error listing accounts:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/fi/accounts/:accountId
 * Get account details
 */
router.get('/fi/accounts/:accountId', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const account = await getFIAccount(env, req.params.accountId);

    return new Response(JSON.stringify({
      success: true,
      account
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting account:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

// ============================================================================
// TRANSACTION ENDPOINTS
// ============================================================================

/**
 * GET /api/fi/accounts/:accountId/transactions
 * Get transaction history
 */
router.get('/fi/accounts/:accountId/transactions', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const transactions = await getFITransactionHistory(env, req.params.accountId, limit);

    return new Response(JSON.stringify({
      success: true,
      transactions,
      count: transactions.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting transactions:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

// ============================================================================
// REFUND TRANSFER (RT) ENDPOINTS
// ============================================================================

/**
 * POST /api/fi/refund-transfers/process
 * Process refund transfer (IRS refund → client account)
 */
router.post('/fi/refund-transfers/process', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const data = await req.json();

    if (!data.return_id || !data.refund_amount || data.fee === undefined) {
      return new Response(JSON.stringify({
        error: 'Missing fields: return_id, refund_amount, fee'
      }), { status: 400 });
    }

    const result = await processRTTransaction(env, {
      client_id: auth.userId!,
      return_id: data.return_id,
      refund_amount: data.refund_amount,
      fee: data.fee
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Refund transfer processed successfully',
      ...result
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error processing RT:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

// ============================================================================
// REFUND ADVANCE (RA) ENDPOINTS
// ============================================================================

/**
 * POST /api/fi/advances/originate
 * Originate refund advance
 */
router.post('/fi/advances/originate', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const data = await req.json();

    if (!data.return_id || !data.requested_amount || !data.estimated_refund) {
      return new Response(JSON.stringify({
        error: 'Missing fields: return_id, requested_amount, estimated_refund'
      }), { status: 400 });
    }

    const advance = await originateRefundAdvance(env, {
      client_id: auth.userId!,
      return_id: data.return_id,
      requested_amount: data.requested_amount,
      estimated_refund: data.estimated_refund
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Refund advance approved',
      advance,
      next_step: 'funding'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error originating advance:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/fi/advances/:advanceId/fund
 * Fund approved refund advance
 */
router.post('/fi/advances/:advanceId/fund', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await fundRefundAdvance(env, req.params.advanceId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Refund advance funded successfully',
      deposited: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error funding advance:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

// ============================================================================
// LOAN ENDPOINTS
// ============================================================================

/**
 * POST /api/fi/loans/originate
 * Originate short-term loan
 */
router.post('/fi/loans/originate', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const data = await req.json();

    if (!data.requested_amount) {
      return new Response(JSON.stringify({
        error: 'Missing field: requested_amount'
      }), { status: 400 });
    }

    const loan = await originateLoan(env, {
      client_id: auth.userId!,
      requested_amount: data.requested_amount,
      term_days: data.term_days || 30
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Loan approved',
      loan,
      next_step: 'funding'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error originating loan:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/fi/loans/:loanId/fund
 * Fund approved loan
 */
router.post('/fi/loans/:loanId/fund', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await fundLoan(env, req.params.loanId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Loan funded successfully',
      disbursed: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error funding loan:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

export default router;
