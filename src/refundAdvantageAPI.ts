/**
 * Refund Advantage Partnership API Integration
 * 
 * Handles all bank product operations:
 * - Refund Transfers (RT)
 * - Refund Advances (RA)
 * - Instant Loans
 * - Fee deductions
 * - Real-time status tracking
 */

import { v4 as uuid } from 'uuid';
import { logAudit } from '../utils/audit';
import { sendRealtimeNotification } from '../notifications';

interface RefundAdvantageConfig {
  bank_id: string;
  bank_name: string;
  api_endpoint: string;
  api_key: string;
  api_secret: string;
  originator_id: string;
  routing_number: string;
  environment: 'sandbox' | 'production';
}

interface BankProductTransmission {
  transmission_id: string;
  client_id: string;
  return_id: number;
  product_type: 'RT' | 'RA' | 'LOAN'; // Refund Transfer, Refund Advance, Instant Loan
  bank_account: {
    routing_number: string;
    account_number: string;
    account_type: 'checking' | 'savings';
    account_holder_name: string;
  };
  refund_amount: number;
  advance_amount?: number;
  fee: number;
  net_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'transmitted' | 'processed' | 'failed';
  transmission_date?: string;
  expected_deposit_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get Refund Advantage config from environment
 */
function getRefundAdvantageConfig(env: any): RefundAdvantageConfig {
  return {
    bank_id: 'REFUND_ADVANTAGE',
    bank_name: 'Refund Advantage Partnership',
    api_endpoint: env.REFUND_ADVANTAGE_API_ENDPOINT || 'https://api.refundadvantage.com/v1',
    api_key: env.REFUND_ADVANTAGE_API_KEY || '',
    api_secret: env.REFUND_ADVANTAGE_API_SECRET || '',
    originator_id: env.REFUND_ADVANTAGE_ORIGINATOR_ID || '',
    routing_number: env.REFUND_ADVANTAGE_ROUTING_NUMBER || '',
    environment: (env.ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
  };
}

/**
 * Transmit bank product to Refund Advantage
 */
export async function transmitBankProduct(
  env: any,
  data: {
    client_id: string;
    return_id: number;
    product_type: 'RT' | 'RA' | 'LOAN';
    routing_number: string;
    account_number: string;
    account_type: 'checking' | 'savings';
    account_holder_name: string;
    refund_amount?: number;
    advance_amount?: number;
    fee: number;
  }
): Promise<BankProductTransmission> {
  const config = getRefundAdvantageConfig(env);
  const transmissionId = uuid();
  const now = new Date().toISOString();
  
  // Calculate net amount
  const netAmount = (data.refund_amount || data.advance_amount || 0) - data.fee;
  
  // Build transmission payload
  const payload = {
    transmission_id: transmissionId,
    originator_id: config.originator_id,
    product_type: data.product_type,
    bank_account: {
      routing_number: data.routing_number,
      account_number: data.account_number,
      account_type: data.account_type,
      account_holder_name: data.account_holder_name
    },
    refund_amount: data.refund_amount,
    advance_amount: data.advance_amount,
    fee: data.fee,
    net_amount: netAmount,
    ippin: '', // IPPIN for IRS verification (if needed)
    tax_year: new Date().getFullYear() - 1,
    timestamp: now
  };
  
  const transmission: BankProductTransmission = {
    transmission_id: transmissionId,
    client_id: data.client_id,
    return_id: data.return_id,
    product_type: data.product_type,
    bank_account: payload.bank_account,
    refund_amount: data.refund_amount || 0,
    advance_amount: data.advance_amount,
    fee: data.fee,
    net_amount: netAmount,
    status: 'pending',
    created_at: now,
    updated_at: now
  };
  
  // Store in database
  await env.DB.prepare(`
    INSERT INTO bank_product_transmissions (
      transmission_id, client_id, return_id, product_type,
      routing_number_encrypted, account_number_encrypted, account_type, account_holder_name,
      refund_amount, advance_amount, fee, net_amount,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    transmission.transmission_id,
    transmission.client_id,
    transmission.return_id,
    transmission.product_type,
    await encryptData(data.routing_number, env.ENCRYPTION_KEY),
    await encryptData(data.account_number, env.ENCRYPTION_KEY),
    transmission.bank_account.account_type,
    transmission.bank_account.account_holder_name,
    transmission.refund_amount,
    transmission.advance_amount || null,
    transmission.fee,
    transmission.net_amount,
    transmission.status,
    transmission.created_at,
    transmission.updated_at
  ).run();
  
  // Log transmission
  await logAudit(env, {
    action: 'bank_product_transmitted',
    resource_type: 'bank_product_transmission',
    resource_id: transmissionId,
    user_id: data.client_id,
    details: {
      product_type: data.product_type,
      fee: data.fee,
      net_amount: netAmount
    }
  });
  
  // Send notification to client
  await sendRealtimeNotification(env, {
    type: 'bank_product_transmitted',
    recipient_id: data.client_id,
    recipient_type: 'client',
    title: `${data.product_type === 'RT' ? 'Refund Transfer' : data.product_type === 'RA' ? 'Refund Advance' : 'Instant Loan'} Submitted`,
    message: `Your bank product request has been submitted to our banking partner. You will receive a confirmation email within 2 hours.`,
    urgent: false,
    data: { transmission_id: transmissionId }
  });
  
  return transmission;
}

/**
 * Approve refund advance
 */
export async function approveRefundAdvance(
  env: any,
  transmissionId: string,
  approvedAmount: number
): Promise<BankProductTransmission> {
  const config = getRefundAdvantageConfig(env);
  
  // Get transmission
  const result = await env.DB.prepare(
    'SELECT * FROM bank_product_transmissions WHERE transmission_id = ?'
  ).bind(transmissionId).first();
  
  if (!result || result.product_type !== 'RA') {
    throw new Error('Transmission not found or not a refund advance');
  }
  
  // Call Refund Advantage API to approve
  const approval = await callRefundAdvantageAPI(config, 'POST', '/advances/approve', {
    transmission_id: transmissionId,
    approved_amount: approvedAmount
  });
  
  if (!approval.success) {
    throw new Error(`Refund Advantage API error: ${approval.error}`);
  }
  
  // Update status
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE bank_product_transmissions
    SET status = 'approved', advance_amount = ?, updated_at = ?
    WHERE transmission_id = ?
  `).bind(approvedAmount, now, transmissionId).run();
  
  // Notify client (urgent)
  await sendRealtimeNotification(env, {
    type: 'refund_advance_approved',
    recipient_id: result.client_id,
    recipient_type: 'client',
    title: '🎉 Refund Advance Approved!',
    message: `Your refund advance of $${approvedAmount} has been approved! Funds will be deposited within 24 hours.`,
    urgent: true,
    data: { transmission_id: transmissionId, amount: approvedAmount }
  });
  
  // Notify admin
  await sendRealtimeNotification(env, {
    type: 'refund_advance_approved',
    recipient_id: 'admin',
    recipient_type: 'admin',
    title: 'Refund Advance Approved',
    message: `RA approved for $${approvedAmount}. Transmission: ${transmissionId}`,
    urgent: false
  });
  
  return result;
}

/**
 * Process refund transfer from IRS
 */
export async function processRefundTransfer(
  env: any,
  transmissionId: string,
  irsRefundAmount: number
): Promise<BankProductTransmission> {
  const config = getRefundAdvantageConfig(env);
  
  // Get transmission
  const result = await env.DB.prepare(
    'SELECT * FROM bank_product_transmissions WHERE transmission_id = ?'
  ).bind(transmissionId).first();
  
  if (!result || result.product_type !== 'RT') {
    throw new Error('Transmission not found or not a refund transfer');
  }
  
  // Call API to process transfer
  const transfer = await callRefundAdvantageAPI(config, 'POST', '/transfers/process', {
    transmission_id: transmissionId,
    irs_refund_amount: irsRefundAmount,
    fee: result.fee,
    net_amount: irsRefundAmount - result.fee
  });
  
  if (!transfer.success) {
    throw new Error(`Refund transfer failed: ${transfer.error}`);
  }
  
  // Update status
  const now = new Date().toISOString();
  const expectedDepositDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  await env.DB.prepare(`
    UPDATE bank_product_transmissions
    SET status = 'transmitted', 
        transmission_date = ?,
        expected_deposit_date = ?,
        updated_at = ?
    WHERE transmission_id = ?
  `).bind(now, expectedDepositDate, now, transmissionId).run();
  
  // Notify client
  const netAmount = irsRefundAmount - result.fee;
  await sendRealtimeNotification(env, {
    type: 'refund_transfer_processed',
    recipient_id: result.client_id,
    recipient_type: 'client',
    title: 'Refund Transfer Processed',
    message: `Your refund of $${netAmount} (after $${result.fee} fee) will be deposited within 7 business days.`,
    urgent: false,
    data: { transmission_id: transmissionId, net_amount: netAmount, expected_date: expectedDepositDate }
  });
  
  return result;
}

/**
 * Get transmission status from Refund Advantage
 */
export async function getTransmissionStatus(
  env: any,
  transmissionId: string
): Promise<{ status: string; details: any }> {
  const config = getRefundAdvantageConfig(env);
  
  // Call API to get status
  const response = await callRefundAdvantageAPI(
    config,
    'GET',
    `/transmissions/${transmissionId}/status`,
    {}
  );
  
  if (!response.success) {
    throw new Error(`Status check failed: ${response.error}`);
  }
  
  // Update database if status changed
  if (response.status !== 'unknown') {
    const now = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE bank_product_transmissions
      SET status = ?, updated_at = ?
      WHERE transmission_id = ?
    `).bind(response.status, now, transmissionId).run();
  }
  
  return {
    status: response.status,
    details: response.details
  };
}

/**
 * Instant Loan API - Get pre-qualification
 */
export async function getInstantLoanOffer(
  env: any,
  clientId: string,
  requestedAmount: number
): Promise<{
  eligible: boolean;
  max_amount: number;
  apr: number;
  term_days: number;
  fee: number;
  total_payback: number;
}> {
  const config = getRefundAdvantageConfig(env);
  
  const offer = await callRefundAdvantageAPI(config, 'POST', '/loans/prequalify', {
    client_id: clientId,
    requested_amount: requestedAmount
  });
  
  if (!offer.success) {
    return {
      eligible: false,
      max_amount: 0,
      apr: 0,
      term_days: 0,
      fee: 0,
      total_payback: 0
    };
  }
  
  return {
    eligible: offer.eligible,
    max_amount: offer.max_amount,
    apr: offer.apr,
    term_days: offer.term_days,
    fee: offer.fee,
    total_payback: offer.total_payback
  };
}

/**
 * Accept instant loan offer
 */
export async function acceptInstantLoan(
  env: any,
  clientId: string,
  loanAmount: number,
  routingNumber: string,
  accountNumber: string,
  accountType: 'checking' | 'savings'
): Promise<BankProductTransmission> {
  const config = getRefundAdvantageConfig(env);
  
  // Get client info
  const client = await env.DB.prepare(
    'SELECT name FROM clients WHERE id = ?'
  ).bind(clientId).first();
  
  // Call API to initiate loan
  const response = await callRefundAdvantageAPI(config, 'POST', '/loans/originate', {
    client_id: clientId,
    loan_amount: loanAmount,
    bank_account: {
      routing_number: routingNumber,
      account_number: accountNumber,
      account_type: accountType
    }
  });
  
  if (!response.success) {
    throw new Error(`Loan origination failed: ${response.error}`);
  }
  
  // Create transmission record
  return await transmitBankProduct(env, {
    client_id: clientId,
    return_id: 0, // Loans may not be tied to returns
    product_type: 'LOAN',
    routing_number: routingNumber,
    account_number: accountNumber,
    account_type: accountType,
    account_holder_name: client.name,
    advance_amount: loanAmount,
    fee: response.fee
  });
}

/**
 * Webhook handler for Refund Advantage callbacks
 */
export async function handleRefundAdvantageWebhook(
  env: any,
  body: any,
  signature: string
): Promise<void> {
  const config = getRefundAdvantageConfig(env);
  
  // Verify webhook signature
  const isValid = verifyWebhookSignature(body, signature, config.api_secret);
  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }
  
  const { event_type, transmission_id, status, details } = body;
  
  // Update transmission status
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE bank_product_transmissions
    SET status = ?, updated_at = ?
    WHERE transmission_id = ?
  `).bind(status, now, transmission_id).run();
  
  // Get transmission for notifications
  const transmission = await env.DB.prepare(
    'SELECT * FROM bank_product_transmissions WHERE transmission_id = ?'
  ).bind(transmission_id).first();
  
  // Handle different event types
  if (event_type === 'transmission_processed') {
    await sendRealtimeNotification(env, {
      type: 'bank_product_processed',
      recipient_id: transmission.client_id,
      recipient_type: 'client',
      title: 'Bank Product Processed',
      message: `Your ${transmission.product_type} has been processed. Funds will be deposited within 1-2 business days.`,
      urgent: false
    });
  } else if (event_type === 'transmission_rejected') {
    await sendRealtimeNotification(env, {
      type: 'bank_product_rejected',
      recipient_id: transmission.client_id,
      recipient_type: 'client',
      title: 'Bank Product Request Denied',
      message: `Your bank product request was declined. Reason: ${details.reason}. Please contact support.`,
      urgent: true
    });
  } else if (event_type === 'deposit_completed') {
    await sendRealtimeNotification(env, {
      type: 'bank_product_deposited',
      recipient_id: transmission.client_id,
      recipient_type: 'client',
      title: '💰 Funds Deposited!',
      message: `Your funds of $${details.amount} have been deposited to your account.`,
      urgent: false
    });
  }
  
  // Log webhook
  await logAudit(env, {
    action: 'bank_product_webhook',
    resource_type: 'bank_product_transmission',
    resource_id: transmission_id,
    user_id: transmission.client_id,
    details: { event_type, status }
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Call Refund Advantage API
 */
async function callRefundAdvantageAPI(
  config: RefundAdvantageConfig,
  method: 'GET' | 'POST' | 'PUT',
  endpoint: string,
  body: any
): Promise<any> {
  const url = `${config.api_endpoint}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
      'X-API-Secret': config.api_secret,
      'X-Originator-ID': config.originator_id
    }
  };
  
  if (method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'API request failed',
        status: response.status
      };
    }
    
    return {
      success: true,
      ...data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(body: any, signature: string, secret: string): boolean {
  // TODO: Implement HMAC signature verification
  // This is a placeholder - implement proper crypto verification
  return true;
}

/**
 * Encrypt sensitive data
 */
async function encryptData(data: string, key: string): Promise<string> {
  // Use proper AES-256 encryption
  return Buffer.from(data).toString('base64'); // Placeholder
}
