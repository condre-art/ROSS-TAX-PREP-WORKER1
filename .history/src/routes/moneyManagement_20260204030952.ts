/**
 * Ross Tax & Bookkeeping Money Management API Routes
 * 
 * Comprehensive digital banking endpoints for:
 * - Money management accounts
 * - P2P transfers
 * - Mobile check deposits
 * - Debit card issuing
 * - Biometric authentication
 */

import { Router } from 'itty-router';
import type { IRequest } from 'itty-router';
import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { verifyAuth } from '../utils/auth';
import { sanitizeString } from '../utils/sanitization';
import { logAudit } from '../utils/audit';
import {
  createMoneyAccount,
  getClientMoneyAccounts,
  getFDICCoverage,
  postTransaction,
  getTransactionHistory,
  getAccountTier,
  upgradeAccountTier,
} from '../services/moneyManagementService';
import {
  initiateP2PTransfer,
  processP2PTransfer,
  getClientP2PTransfers,
  lookupRecipient,
} from '../services/p2pTransferService';
import {
  submitMobileDeposit,
  approveMobileDeposit,
  getClientMobileDeposits,
} from '../services/mobileDepositService';
import {
  issueVirtualCard,
  orderPhysicalCard,
  activateCard,
  toggleCardFreeze,
  authorizeCardTransaction,
} from '../services/cardIssuingService';
import {
  recordBiometricConsent,
  enrollFaceBiometric,
  verifyFaceBiometric,
  deleteBiometricData,
} from '../services/biometricAuthService';

const moneyRouter = Router({ base: '/api/money' });

// ===========================
// MONEY MANAGEMENT ACCOUNTS
// ===========================

/**
 * GET /api/money/accounts
 * List client's money management accounts
 */
moneyRouter.get('/accounts', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const accounts = await getClientMoneyAccounts(env.DB, user.id);
    const fdic = await getFDICCoverage(env.DB, user.id);
    
    return new Response(JSON.stringify({ accounts, fdic_coverage: fdic }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * POST /api/money/accounts/create
 * Create new money management account
 */
moneyRouter.post('/accounts/create', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await req.json() as any;
    const { account_type, account_tier, account_name } = body;
    
    if (!account_type || !['checking', 'savings', 'money_market'].includes(account_type)) {
      return new Response(JSON.stringify({ error: 'Invalid account type' }), { status: 400 });
    }
    
    const account = await createMoneyAccount(
      env.DB,
      user.id,
      account_type,
      account_tier || 'basic',
      account_name
    );
    
    return new Response(JSON.stringify({ account }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * GET /api/money/accounts/:accountId/transactions
 * Get account transaction history
 */
moneyRouter.get('/accounts/:accountId/transactions', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const { accountId } = req.params as any;
    const transactions = await getTransactionHistory(env.DB, accountId, 100, 0);
    
    return new Response(JSON.stringify({ transactions }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * POST /api/money/accounts/:accountId/upgrade
 * Upgrade account tier
 */
moneyRouter.post('/accounts/:accountId/upgrade', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const { accountId } = req.params as any;
    const body = await req.json() as any;
    const { new_tier } = body;
    
    if (!['basic', 'premium', 'business'].includes(new_tier)) {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), { status: 400 });
    }
    
    await upgradeAccountTier(env.DB, accountId, new_tier);
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ===========================
// P2P TRANSFERS
// ===========================

/**
 * POST /api/money/p2p/transfer
 * Initiate P2P money transfer
 */
moneyRouter.post('/p2p/transfer', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await req.json() as any;
    const { account_id, recipient, amount, description, transfer_type, scheduled_date } = body;
    
    if (!account_id || !recipient || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid transfer parameters' }), { status: 400 });
    }
    
    const transfer = await initiateP2PTransfer(
      env.DB,
      account_id,
      user.id,
      recipient,
      parseFloat(amount),
      description || 'P2P Transfer',
      transfer_type || 'instant',
      scheduled_date
    );
    
    return new Response(JSON.stringify({ transfer }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});

/**
 * GET /api/money/p2p/transfers
 * Get client P2P transfer history
 */
moneyRouter.get('/p2p/transfers', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const transfers = await getClientP2PTransfers(env.DB, user.id, 50, 0);
    
    return new Response(JSON.stringify({ transfers }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * POST /api/money/p2p/lookup
 * Lookup recipient by email or phone
 */
moneyRouter.post('/p2p/lookup', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await req.json() as any;
    const { identifier } = body;
    
    const recipient = await lookupRecipient(env.DB, identifier);
    
    if (!recipient) {
      return new Response(JSON.stringify({ found: false }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ found: true, recipient }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ===========================
// MOBILE CHECK DEPOSITS
// ===========================

/**
 * POST /api/money/mobile-deposit
 * Submit mobile check deposit
 */
moneyRouter.post('/mobile-deposit', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const formData = await req.formData();
    const accountId = formData.get('account_id') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const frontImage = formData.get('front_image') as File;
    const backImage = formData.get('back_image') as File;
    
    if (!accountId || !amount || !frontImage || !backImage) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const frontBuffer = new Uint8Array(await frontImage.arrayBuffer());
    const backBuffer = new Uint8Array(await backImage.arrayBuffer());
    
    const deposit = await submitMobileDeposit(
      env.DB,
      env.DOCUMENTS_BUCKET,
      accountId,
      user.id,
      amount,
      frontBuffer,
      backBuffer
    );
    
    return new Response(JSON.stringify({ deposit }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});

/**
 * GET /api/money/mobile-deposits
 * Get client mobile deposit history
 */
moneyRouter.get('/mobile-deposits', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const deposits = await getClientMobileDeposits(env.DB, user.id, 50, 0);
    
    return new Response(JSON.stringify({ deposits }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ===========================
// DEBIT CARDS
// ===========================

/**
 * POST /api/money/cards/issue
 * Issue virtual or physical debit card
 */
moneyRouter.post('/cards/issue', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await req.json() as any;
    const { account_id, card_type } = body;
    
    if (!account_id || !['virtual', 'physical'].includes(card_type)) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 });
    }
    
    // Get user details for cardholder name
    const client = await env.DB.prepare('SELECT name FROM clients WHERE id = ?').bind(user.id).first();
    
    let card;
    if (card_type === 'virtual') {
      card = await issueVirtualCard(env.DB, env, account_id, user.id, client.name as string, {
        street: '123 Main St', // In real app, get from client profile
        city: 'Conway',
        state: 'AR',
        zip: '72034',
      });
    } else {
      card = await orderPhysicalCard(env.DB, env, account_id, user.id, client.name as string, {
        street: '123 Main St',
        city: 'Conway',
        state: 'AR',
        zip: '72034',
      });
    }
    
    return new Response(JSON.stringify({ card }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});

/**
 * GET /api/money/cards
 * List client's debit cards
 */
moneyRouter.get('/cards', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, card_last4, card_type, status, daily_limit, exp_month, exp_year FROM debit_cards WHERE client_id = ?'
    )
      .bind(user.id)
      .all();
    
    return new Response(JSON.stringify({ cards: results || [] }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * POST /api/money/cards/:cardId/freeze
 * Freeze/unfreeze debit card
 */
moneyRouter.post('/cards/:cardId/freeze', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const { cardId } = req.params as any;
    const newStatus = await toggleCardFreeze(env.DB, cardId);
    
    return new Response(JSON.stringify({ status: newStatus }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ===========================
// BIOMETRIC AUTHENTICATION
// ===========================

/**
 * POST /api/money/biometric/consent
 * Record biometric consent
 */
moneyRouter.post('/biometric/consent', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await req.json() as any;
    const { consent_given } = body;
    const ipAddress = req.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = req.headers.get('User-Agent') || 'unknown';
    
    const consent = await recordBiometricConsent(env.DB, user.id, consent_given, ipAddress, userAgent);
    
    return new Response(JSON.stringify({ consent }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * POST /api/money/biometric/enroll
 * Enroll facial biometric
 */
moneyRouter.post('/biometric/enroll', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await req.json() as any;
    const { enrollment_images, device_fingerprint } = body;
    
    if (!enrollment_images || !Array.isArray(enrollment_images) || enrollment_images.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one enrollment image required' }), { status: 400 });
    }
    
    const enrollment = await enrollFaceBiometric(env.DB, user.id, enrollment_images, device_fingerprint);
    
    return new Response(JSON.stringify({ enrollment }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});

/**
 * POST /api/money/biometric/verify
 * Verify facial biometric
 */
moneyRouter.post('/biometric/verify', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await req.json() as any;
    const { verification_image, verification_type, device_fingerprint } = body;
    const ipAddress = req.headers.get('CF-Connecting-IP') || 'unknown';
    
    if (!verification_image || !verification_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const result = await verifyFaceBiometric(
      env.DB,
      user.id,
      verification_image,
      verification_type,
      device_fingerprint,
      ipAddress
    );
    
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message, verified: false }), { status: 400 });
  }
});

/**
 * DELETE /api/money/biometric
 * Delete biometric data (BIPA right to deletion)
 */
moneyRouter.delete('/biometric', async (req: IRequest, env: any) => {
  const user = await verifyAuth(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    await deleteBiometricData(env.DB, user.id);
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

export default moneyRouter;
