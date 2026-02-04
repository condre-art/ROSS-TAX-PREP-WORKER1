/**
 * Ross Tax & Bookkeeping P2P Transfer Service
 * 
 * Person-to-person money transfers within the platform:
 * - Instant transfers between Ross Tax accounts
 * - Email/phone recipient lookup
 * - Transfer requests with approval flow
 * - Recurring transfer schedules
 * - Transaction limits and fraud detection
 * 
 * Compliance:
 * - Regulation E (Electronic Funds Transfer Act)
 * - NACHA Operating Rules
 * - Bank Secrecy Act (BSA/AML)
 * - USA PATRIOT Act
 */

import { D1Database } from '@cloudflare/workers-types';
import { sanitizeString } from '../utils/sanitization';
import { logAudit } from '../utils/audit';
import { sendRealtimeNotification } from '../utils/notifications';
import { postTransaction } from './moneyManagementService';

export interface P2PTransfer {
  id: string;
  sender_account_id: string;
  sender_client_id: string;
  recipient_account_id?: string;
  recipient_client_id?: string;
  recipient_email?: string;
  recipient_phone?: string;
  amount: number;
  description: string;
  reference_number: string;
  transfer_type: 'instant' | 'standard' | 'scheduled';
  status: 'pending' | 'processing' | 'completed' | 'declined' | 'cancelled' | 'expired';
  scheduled_date?: string;
  recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  next_recurrence?: string;
  decline_reason?: string;
  fraud_score?: number;
  requires_approval: boolean;
  approved_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface TransferLimit {
  tier: 'basic' | 'premium' | 'business';
  per_transaction: number;
  daily_limit: number;
  monthly_limit: number;
  max_pending: number;
}

// Transfer limits by account tier
const TRANSFER_LIMITS: Record<string, TransferLimit> = {
  basic: {
    tier: 'basic',
    per_transaction: 500,
    daily_limit: 1000,
    monthly_limit: 5000,
    max_pending: 3,
  },
  premium: {
    tier: 'premium',
    per_transaction: 2500,
    daily_limit: 5000,
    monthly_limit: 25000,
    max_pending: 10,
  },
  business: {
    tier: 'business',
    per_transaction: 10000,
    daily_limit: 25000,
    monthly_limit: 150000,
    max_pending: 50,
  },
};

/**
 * Lookup recipient by email or phone
 */
export async function lookupRecipient(
  db: D1Database,
  emailOrPhone: string
): Promise<{ client_id: string; account_id: string; name: string } | null> {
  // Check if it's an email
  const isEmail = emailOrPhone.includes('@');
  
  const query = isEmail
    ? `
      SELECT c.id as client_id, c.name, ma.id as account_id
      FROM clients c
      JOIN money_accounts ma ON ma.client_id = c.id
      WHERE c.email = ? AND ma.status = 'active'
      LIMIT 1
    `
    : `
      SELECT c.id as client_id, c.name, ma.id as account_id
      FROM clients c
      JOIN money_accounts ma ON ma.client_id = c.id
      WHERE c.phone = ? AND ma.status = 'active'
      LIMIT 1
    `;
  
  const result = await db.prepare(query).bind(sanitizeString(emailOrPhone)).first();
  
  if (!result) {
    return null;
  }
  
  return {
    client_id: result.client_id as string,
    account_id: result.account_id as string,
    name: result.name as string,
  };
}

/**
 * Calculate fraud risk score
 */
function calculateFraudScore(
  amount: number,
  senderHistory: number,
  recipientNew: boolean,
  timeOfDay: number
): number {
  let score = 0;
  
  // Large amount risk
  if (amount > 1000) score += 20;
  if (amount > 5000) score += 30;
  if (amount > 10000) score += 40;
  
  // New sender risk
  if (senderHistory < 5) score += 15;
  
  // New recipient risk
  if (recipientNew) score += 25;
  
  // Unusual time (midnight to 5am)
  if (timeOfDay >= 0 && timeOfDay < 5) score += 10;
  
  return Math.min(100, score);
}

/**
 * Check transfer limits
 */
async function checkTransferLimits(
  db: D1Database,
  accountId: string,
  amount: number,
  tier: 'basic' | 'premium' | 'business'
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = TRANSFER_LIMITS[tier];
  
  // Check per-transaction limit
  if (amount > limits.per_transaction) {
    return {
      allowed: false,
      reason: `Amount exceeds per-transaction limit of $${limits.per_transaction}`,
    };
  }
  
  // Check daily limit
  const today = new Date().toISOString().split('T')[0];
  const { daily_total } = (await db
    .prepare(
      `
      SELECT COALESCE(SUM(amount), 0) as daily_total
      FROM p2p_transfers
      WHERE sender_account_id = ?
        AND DATE(created_at) = ?
        AND status IN ('completed', 'processing')
    `
    )
    .bind(accountId, today)
    .first()) as any;
  
  if (daily_total + amount > limits.daily_limit) {
    return {
      allowed: false,
      reason: `Daily limit exceeded ($${limits.daily_limit})`,
    };
  }
  
  // Check monthly limit
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartISO = monthStart.toISOString();
  
  const { monthly_total } = (await db
    .prepare(
      `
      SELECT COALESCE(SUM(amount), 0) as monthly_total
      FROM p2p_transfers
      WHERE sender_account_id = ?
        AND created_at >= ?
        AND status IN ('completed', 'processing')
    `
    )
    .bind(accountId, monthStartISO)
    .first()) as any;
  
  if (monthly_total + amount > limits.monthly_limit) {
    return {
      allowed: false,
      reason: `Monthly limit exceeded ($${limits.monthly_limit})`,
    };
  }
  
  // Check pending transfers
  const { pending_count } = (await db
    .prepare(
      `
      SELECT COUNT(*) as pending_count
      FROM p2p_transfers
      WHERE sender_account_id = ? AND status = 'pending'
    `
    )
    .bind(accountId)
    .first()) as any;
  
  if (pending_count >= limits.max_pending) {
    return {
      allowed: false,
      reason: `Maximum pending transfers reached (${limits.max_pending})`,
    };
  }
  
  return { allowed: true };
}

/**
 * Initiate P2P transfer
 */
export async function initiateP2PTransfer(
  db: D1Database,
  senderAccountId: string,
  senderClientId: string,
  recipientIdentifier: string, // email, phone, or account ID
  amount: number,
  description: string,
  transferType: 'instant' | 'standard' | 'scheduled' = 'instant',
  scheduledDate?: string
): Promise<P2PTransfer> {
  const transferId = `p2p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const referenceNumber = `RTB${Date.now().toString().slice(-8)}`;
  const now = new Date().toISOString();
  
  // Get sender account
  const senderAccount = await db
    .prepare(`SELECT account_tier, balance FROM money_accounts WHERE id = ?`)
    .bind(senderAccountId)
    .first();
  
  if (!senderAccount) {
    throw new Error('Sender account not found');
  }
  
  const accountTier = senderAccount.account_tier as 'basic' | 'premium' | 'business';
  const balance = senderAccount.balance as number;
  
  // Check balance
  if (balance < amount) {
    throw new Error('Insufficient funds');
  }
  
  // Check transfer limits
  const limitCheck = await checkTransferLimits(db, senderAccountId, amount, accountTier);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.reason);
  }
  
  // Lookup recipient
  let recipientAccountId: string | undefined;
  let recipientClientId: string | undefined;
  let recipientEmail: string | undefined;
  let recipientPhone: string | undefined;
  
  if (recipientIdentifier.startsWith('mma_')) {
    // Direct account ID
    recipientAccountId = recipientIdentifier;
    const recipient = await db
      .prepare(`SELECT client_id FROM money_accounts WHERE id = ?`)
      .bind(recipientAccountId)
      .first();
    if (recipient) {
      recipientClientId = recipient.client_id as string;
    }
  } else {
    // Email or phone lookup
    const recipient = await lookupRecipient(db, recipientIdentifier);
    if (recipient) {
      recipientAccountId = recipient.account_id;
      recipientClientId = recipient.client_id;
    } else {
      // Store for later claim
      if (recipientIdentifier.includes('@')) {
        recipientEmail = recipientIdentifier;
      } else {
        recipientPhone = recipientIdentifier;
      }
    }
  }
  
  // Calculate fraud score
  const { transaction_count } = (await db
    .prepare(
      `
      SELECT COUNT(*) as transaction_count
      FROM p2p_transfers
      WHERE sender_account_id = ?
    `
    )
    .bind(senderAccountId)
    .first()) as any;
  
  const recipientNew = !recipientAccountId;
  const hour = new Date().getHours();
  const fraudScore = calculateFraudScore(amount, transaction_count, recipientNew, hour);
  
  // Require approval if fraud score > 70 or amount > $5000
  const requiresApproval = fraudScore > 70 || amount > 5000;
  
  const transfer: P2PTransfer = {
    id: transferId,
    sender_account_id: senderAccountId,
    sender_client_id: senderClientId,
    recipient_account_id: recipientAccountId,
    recipient_client_id: recipientClientId,
    recipient_email: recipientEmail,
    recipient_phone: recipientPhone,
    amount,
    description: sanitizeString(description),
    reference_number: referenceNumber,
    transfer_type: transferType,
    status: requiresApproval ? 'pending' : transferType === 'scheduled' ? 'pending' : 'processing',
    scheduled_date: scheduledDate,
    recurring: false,
    fraud_score: fraudScore,
    requires_approval: requiresApproval,
    created_at: now,
  };
  
  // Insert transfer
  await db
    .prepare(
      `
      INSERT INTO p2p_transfers (
        id, sender_account_id, sender_client_id, recipient_account_id,
        recipient_client_id, recipient_email, recipient_phone, amount,
        description, reference_number, transfer_type, status, scheduled_date,
        recurring, fraud_score, requires_approval, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      transferId,
      senderAccountId,
      senderClientId,
      recipientAccountId || null,
      recipientClientId || null,
      recipientEmail || null,
      recipientPhone || null,
      amount,
      transfer.description,
      referenceNumber,
      transferType,
      transfer.status,
      scheduledDate || null,
      0,
      fraudScore,
      requiresApproval ? 1 : 0,
      now
    )
    .run();
  
  // Process immediately if not requiring approval and not scheduled
  if (!requiresApproval && transferType === 'instant') {
    await processP2PTransfer(db, transferId);
  }
  
  // Log audit
  await logAudit(db, {
    action: 'p2p_transfer_initiated',
    entity: 'p2p_transfer',
    entity_id: transferId,
    user_id: parseInt(senderClientId),
    details: `P2P transfer of $${amount} to ${recipientAccountId || recipientEmail || recipientPhone}`,
  });
  
  // Notify sender
  await sendRealtimeNotification(senderClientId, {
    type: 'transfer_initiated',
    title: 'Transfer Initiated',
    message: `Your transfer of $${amount.toFixed(2)} has been initiated.`,
  });
  
  return transfer;
}

/**
 * Process P2P transfer (execute the actual money movement)
 */
export async function processP2PTransfer(db: D1Database, transferId: string): Promise<void> {
  const transfer = await db
    .prepare(`SELECT * FROM p2p_transfers WHERE id = ?`)
    .bind(transferId)
    .first();
  
  if (!transfer) {
    throw new Error('Transfer not found');
  }
  
  if (transfer.status !== 'processing' && transfer.status !== 'pending') {
    throw new Error(`Transfer cannot be processed (status: ${transfer.status})`);
  }
  
  const amount = transfer.amount as number;
  const senderAccountId = transfer.sender_account_id as string;
  const recipientAccountId = transfer.recipient_account_id as string | null;
  
  if (!recipientAccountId) {
    throw new Error('Recipient account not found');
  }
  
  const now = new Date().toISOString();
  const referenceNumber = transfer.reference_number as string;
  
  try {
    // Debit sender account
    await postTransaction(db, senderAccountId, {
      transaction_type: 'p2p',
      amount,
      description: `P2P Transfer to ${recipientAccountId}`,
      reference_number: referenceNumber,
      destination_account: recipientAccountId,
      status: 'posted',
    });
    
    // Credit recipient account
    await postTransaction(db, recipientAccountId, {
      transaction_type: 'p2p',
      amount,
      description: `P2P Transfer from ${senderAccountId}`,
      reference_number: referenceNumber,
      source_account: senderAccountId,
      status: 'posted',
    });
    
    // Update transfer status
    await db
      .prepare(`UPDATE p2p_transfers SET status = 'completed', completed_at = ? WHERE id = ?`)
      .bind(now, transferId)
      .run();
    
    // Notify both parties
    await sendRealtimeNotification(transfer.sender_client_id as string, {
      type: 'transfer_completed',
      title: 'Transfer Completed',
      message: `Your transfer of $${amount.toFixed(2)} has been completed.`,
    });
    
    if (transfer.recipient_client_id) {
      await sendRealtimeNotification(transfer.recipient_client_id as string, {
        type: 'money_received',
        title: 'Money Received',
        message: `You received $${amount.toFixed(2)} from another user.`,
      });
    }
    
    // Log audit
    await logAudit(db, {
      action: 'p2p_transfer_completed',
      entity: 'p2p_transfer',
      entity_id: transferId,
      details: `P2P transfer completed: $${amount}`,
    });
  } catch (error: any) {
    // Mark transfer as declined
    await db
      .prepare(`UPDATE p2p_transfers SET status = 'declined', decline_reason = ? WHERE id = ?`)
      .bind(error.message, transferId)
      .run();
    
    throw error;
  }
}

/**
 * Get client P2P transfers
 */
export async function getClientP2PTransfers(
  db: D1Database,
  clientId: string,
  limit: number = 50,
  offset: number = 0
): Promise<P2PTransfer[]> {
  const { results } = await db
    .prepare(
      `
      SELECT * FROM p2p_transfers
      WHERE sender_client_id = ? OR recipient_client_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    )
    .bind(clientId, clientId, limit, offset)
    .all();
  
  return (results || []).map((row: any) => ({
    id: row.id,
    sender_account_id: row.sender_account_id,
    sender_client_id: row.sender_client_id,
    recipient_account_id: row.recipient_account_id,
    recipient_client_id: row.recipient_client_id,
    recipient_email: row.recipient_email,
    recipient_phone: row.recipient_phone,
    amount: row.amount,
    description: row.description,
    reference_number: row.reference_number,
    transfer_type: row.transfer_type,
    status: row.status,
    scheduled_date: row.scheduled_date,
    recurring: row.recurring === 1,
    recurring_frequency: row.recurring_frequency,
    next_recurrence: row.next_recurrence,
    decline_reason: row.decline_reason,
    fraud_score: row.fraud_score,
    requires_approval: row.requires_approval === 1,
    approved_at: row.approved_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
  }));
}
