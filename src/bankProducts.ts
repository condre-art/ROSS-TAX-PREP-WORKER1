/**
 * Bank Products & Refund Advance System
 * 
 * Supports:
 * - Direct Deposit (IRS standard)
 * - Refund Transfer (RT) - Fees deducted from refund
 * - Refund Advance (RA) - Instant advance loan
 * - Paper Check
 * 
 * Integration with banking partner APIs
 */

import { v4 as uuid } from 'uuid';
import { logAudit } from '../utils/audit';
import { getBankProductById, calculateReturnFees } from '../config/company';

export interface BankProduct {
  id: string;
  name: string;
  description: string;
  fee: number;
  processing_days: number;
  advance_amounts?: number[];
  apr?: number;
  requires_approval?: boolean;
}

export interface BankProductSelection {
  id: string;
  return_id: number;
  client_id: string;
  product_id: string;
  product_name: string;
  
  // Bank account info (encrypted)
  routing_number_encrypted?: string;
  account_number_encrypted?: string;
  account_type?: 'checking' | 'savings';
  
  // Refund advance specific
  advance_amount?: number;
  advance_status?: 'pending' | 'approved' | 'denied' | 'disbursed';
  advance_disbursed_at?: string;
  
  // Fees
  product_fee: number;
  total_fees: number;
  
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/**
 * Create bank product selection
 */
export async function createBankProductSelection(
  env: any,
  data: {
    return_id: number;
    client_id: string;
    product_id: string;
    routing_number?: string;
    account_number?: string;
    account_type?: 'checking' | 'savings';
    advance_amount?: number;
  }
): Promise<BankProductSelection> {
  const product = getBankProductById(data.product_id);
  
  if (!product) {
    throw new Error('Invalid bank product ID');
  }
  
  // Encrypt bank account info
  const routingEncrypted = data.routing_number 
    ? await encryptPII(data.routing_number, env.ENCRYPTION_KEY)
    : undefined;
    
  const accountEncrypted = data.account_number
    ? await encryptPII(data.account_number, env.ENCRYPTION_KEY)
    : undefined;
  
  const selectionId = uuid();
  const now = new Date().toISOString();
  
  const selection: BankProductSelection = {
    id: selectionId,
    return_id: data.return_id,
    client_id: data.client_id,
    product_id: data.product_id,
    product_name: product.name,
    routing_number_encrypted: routingEncrypted,
    account_number_encrypted: accountEncrypted,
    account_type: data.account_type,
    advance_amount: data.advance_amount,
    advance_status: product.requires_approval ? 'pending' : undefined,
    product_fee: product.fee,
    total_fees: product.fee, // TODO: Add other fees
    status: 'pending',
    created_at: now,
    updated_at: now
  };
  
  await env.DB.prepare(`
    INSERT INTO bank_product_selections (
      id, return_id, client_id, product_id, product_name,
      routing_number_encrypted, account_number_encrypted, account_type,
      advance_amount, advance_status, product_fee, total_fees,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    selection.id,
    selection.return_id,
    selection.client_id,
    selection.product_id,
    selection.product_name,
    selection.routing_number_encrypted || null,
    selection.account_number_encrypted || null,
    selection.account_type || null,
    selection.advance_amount || null,
    selection.advance_status || null,
    selection.product_fee,
    selection.total_fees,
    selection.status,
    selection.created_at,
    selection.updated_at
  ).run();
  
  // Link to efile_transmissions
  await env.DB.prepare(`
    UPDATE efile_transmissions
    SET bank_product_id = ?, payment_method = ?, updated_at = ?
    WHERE return_id = ?
  `).bind(selectionId, data.product_id, now, data.return_id).run();
  
  await logAudit(env, {
    action: 'bank_product_selected',
    resource_type: 'bank_product_selection',
    resource_id: selectionId,
    user_id: data.client_id,
    details: { product_id: data.product_id, product_name: product.name }
  });
  
  // Send notification
  await sendNotification(env, {
    type: 'bank_product_selected',
    client_id: data.client_id,
    message: `Bank product selected: ${product.name}`,
    data: selection
  });
  
  return selection;
}

/**
 * Request refund advance approval
 */
export async function requestRefundAdvance(
  env: any,
  selectionId: string,
  advanceAmount: number
): Promise<{ approved: boolean; reason?: string }> {
  const selection = await env.DB.prepare(
    'SELECT * FROM bank_product_selections WHERE id = ?'
  ).bind(selectionId).first();
  
  if (!selection) {
    throw new Error('Bank product selection not found');
  }
  
  if (selection.product_id !== 'refund_advance') {
    throw new Error('Not a refund advance product');
  }
  
  // TODO: Integrate with banking partner API for approval
  // For now, auto-approve if amount <= $3500 and client has return
  const returnData = await env.DB.prepare(
    'SELECT * FROM returns WHERE id = ?'
  ).bind(selection.return_id).first();
  
  const approved = advanceAmount <= 3500 && returnData !== null;
  
  if (approved) {
    await env.DB.prepare(`
      UPDATE bank_product_selections
      SET advance_status = 'approved', advance_amount = ?, updated_at = ?
      WHERE id = ?
    `).bind(advanceAmount, new Date().toISOString(), selectionId).run();
    
    await logAudit(env, {
      action: 'refund_advance_approved',
      resource_type: 'bank_product_selection',
      resource_id: selectionId,
      details: { advance_amount: advanceAmount }
    });
    
    // Notify client (instant)
    await sendNotification(env, {
      type: 'refund_advance_approved',
      client_id: selection.client_id,
      message: `Refund advance of $${advanceAmount} approved!`,
      urgent: true
    });
    
    // Notify admin
    await sendNotification(env, {
      type: 'refund_advance_approved',
      admin: true,
      message: `Refund advance approved: $${advanceAmount} for client ${selection.client_id}`
    });
  } else {
    await env.DB.prepare(`
      UPDATE bank_product_selections
      SET advance_status = 'denied', updated_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), selectionId).run();
    
    await sendNotification(env, {
      type: 'refund_advance_denied',
      client_id: selection.client_id,
      message: 'Refund advance request requires additional review'
    });
  }
  
  return {
    approved,
    reason: approved ? 'Approved' : 'Amount exceeds limit or missing return data'
  };
}

/**
 * Disburse refund advance
 */
export async function disburseRefundAdvance(
  env: any,
  selectionId: string
): Promise<void> {
  const selection = await env.DB.prepare(
    'SELECT * FROM bank_product_selections WHERE id = ?'
  ).bind(selectionId).first();
  
  if (!selection || selection.advance_status !== 'approved') {
    throw new Error('Refund advance not approved');
  }
  
  // TODO: Integrate with banking partner API to disburse funds
  // For now, simulate disbursement
  const now = new Date().toISOString();
  
  await env.DB.prepare(`
    UPDATE bank_product_selections
    SET advance_status = 'disbursed', advance_disbursed_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(now, now, selectionId).run();
  
  await logAudit(env, {
    action: 'refund_advance_disbursed',
    resource_type: 'bank_product_selection',
    resource_id: selectionId,
    details: { advance_amount: selection.advance_amount }
  });
  
  // Notify client (instant)
  await sendNotification(env, {
    type: 'refund_advance_disbursed',
    client_id: selection.client_id,
    message: `Refund advance of $${selection.advance_amount} has been disbursed to your account!`,
    urgent: true
  });
}

/**
 * Get bank product selection for return
 */
export async function getBankProductForReturn(
  env: any,
  returnId: number
): Promise<BankProductSelection | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM bank_product_selections WHERE return_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(returnId).first();
  
  return result as BankProductSelection | null;
}

/**
 * Process refund transfer (RT)
 * Deduct fees from IRS refund when it arrives
 */
export async function processRefundTransfer(
  env: any,
  selectionId: string,
  refundAmount: number
): Promise<{ netRefund: number; feesDeducted: number }> {
  const selection = await env.DB.prepare(
    'SELECT * FROM bank_product_selections WHERE id = ?'
  ).bind(selectionId).first();
  
  if (!selection || selection.product_id !== 'refund_transfer') {
    throw new Error('Not a refund transfer product');
  }
  
  const feesDeducted = selection.total_fees;
  const netRefund = refundAmount - feesDeducted;
  
  if (netRefund < 0) {
    throw new Error('Refund amount insufficient to cover fees');
  }
  
  // TODO: Initiate bank transfer via banking partner API
  
  await env.DB.prepare(`
    UPDATE bank_product_selections
    SET status = 'completed', updated_at = ?
    WHERE id = ?
  `).bind(new Date().toISOString(), selectionId).run();
  
  await logAudit(env, {
    action: 'refund_transfer_processed',
    resource_type: 'bank_product_selection',
    resource_id: selectionId,
    details: { refund_amount: refundAmount, fees_deducted: feesDeducted, net_refund: netRefund }
  });
  
  await sendNotification(env, {
    type: 'refund_transfer_complete',
    client_id: selection.client_id,
    message: `Your refund of $${netRefund} (after $${feesDeducted} fees) has been sent to your bank!`
  });
  
  return { netRefund, feesDeducted };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function encryptPII(data: string, key: string): Promise<string> {
  // Use proper encryption (AES-256)
  // Placeholder - replace with actual crypto implementation
  return Buffer.from(data).toString('base64');
}

async function sendNotification(
  env: any,
  notification: {
    type: string;
    client_id?: string;
    admin?: boolean;
    message: string;
    urgent?: boolean;
    data?: any;
  }
): Promise<void> {
  // Real-time notification without approval
  console.log(`[NOTIFICATION] ${notification.type}: ${notification.message}`);
  
  // TODO: Integrate with:
  // - Email (MailChannels)
  // - SMS (Twilio)
  // - Push notifications (Firebase Cloud Messaging)
  // - WebSocket for real-time updates
  
  // Store in notifications table
  await env.DB.prepare(`
    INSERT INTO notifications (id, type, recipient_id, message, urgent, data, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    uuid(),
    notification.type,
    notification.client_id || (notification.admin ? 'admin' : null),
    notification.message,
    notification.urgent ? 1 : 0,
    JSON.stringify(notification.data || {}),
    0,
    new Date().toISOString()
  ).run();
}
