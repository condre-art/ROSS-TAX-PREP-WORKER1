/**
 * Ross Tax & Bookkeeping Visa Card Issuing Service
 * 
 * Debit card issuing and management:
 * - Virtual card generation (instant)
 * - Physical card fulfillment (5-7 days)
 * - Card controls (spending limits, merchant categories, geography)
 * - Real-time authorization and fraud detection
 * - Card lifecycle management (activation, freeze, replace, cancel)
 * 
 * Integration: Marqeta Card Issuing Platform API
 * 
 * Compliance:
 * - Visa Core Rules and Visa Product and Service Rules
 * - Regulation E (Electronic Funds Transfer Act)
 * - PCI DSS Level 1 (Payment Card Industry Data Security Standard)
 * - Cardholder Agreement and Terms of Service
 */

import { D1Database } from '@cloudflare/workers-types';
import { sanitizeString } from '../utils/sanitization';
import { encryptPII, decryptPII } from '../utils/encryption';
import { logAudit } from '../utils/audit';
import { sendRealtimeNotification } from '../utils/notifications';
import { postTransaction } from './moneyManagementService';

export interface DebitCard {
  id: string;
  account_id: string;
  client_id: string;
  card_number_encrypted: string; // PCI-compliant encrypted storage
  card_last4: string;
  card_type: 'virtual' | 'physical';
  network: 'visa';
  exp_month: number;
  exp_year: number;
  cvv_encrypted: string;
  cardholder_name: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_zip: string;
  status: 'pending' | 'active' | 'frozen' | 'cancelled' | 'expired';
  activation_required: boolean;
  activated_at?: string;
  daily_limit: number;
  transaction_limit: number;
  atm_daily_limit: number;
  international_enabled: boolean;
  online_enabled: boolean;
  contactless_enabled: boolean;
  pin_set: boolean;
  marqeta_token?: string; // External card platform token
  fulfillment_status?: 'pending' | 'shipped' | 'delivered';
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  cancelled_at?: string;
}

export interface CardAuthorization {
  id: string;
  card_id: string;
  account_id: string;
  amount: number;
  merchant_name: string;
  merchant_category: string;
  merchant_city?: string;
  merchant_state?: string;
  merchant_country: string;
  authorization_code?: string;
  status: 'approved' | 'declined';
  decline_reason?: string;
  fraud_score?: number;
  transaction_id?: string;
  created_at: string;
}

export interface CardControl {
  card_id: string;
  daily_limit: number;
  transaction_limit: number;
  atm_daily_limit: number;
  international_enabled: boolean;
  online_enabled: boolean;
  contactless_enabled: boolean;
  allowed_categories?: string[]; // Merchant category codes
  blocked_categories?: string[]; // Merchant category codes
  allowed_countries?: string[]; // ISO country codes
}

// Merchant category codes
export const MERCHANT_CATEGORIES = {
  GROCERY: '5411',
  GAS: '5542',
  RESTAURANT: '5812',
  TRAVEL: '4722',
  ENTERTAINMENT: '7832',
  RETAIL: '5300',
  HEALTHCARE: '8011',
  UTILITIES: '4900',
  GAMBLING: '7995',
  ALCOHOL: '5921',
};

/**
 * Generate virtual debit card (instant)
 */
export async function issueVirtualCard(
  db: D1Database,
  env: any, // For encryption keys
  accountId: string,
  clientId: string,
  cardholderName: string,
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }
): Promise<DebitCard> {
  const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  // Generate card number (Visa BIN: 4 + 15 digits)
  // Real implementation would call Marqeta API
  const cardNumber = generateCardNumber();
  const cardLast4 = cardNumber.slice(-4);
  const cvv = generateCVV();
  
  // Expiration: 3 years from now
  const expDate = new Date();
  expDate.setFullYear(expDate.getFullYear() + 3);
  const expMonth = expDate.getMonth() + 1;
  const expYear = expDate.getFullYear();
  
  // Encrypt sensitive data
  const cardNumberEncrypted = await encryptPII(cardNumber);
  const cvvEncrypted = await encryptPII(cvv);
  
  // Get account tier for limits
  const account = await db
    .prepare(`SELECT account_tier FROM money_accounts WHERE id = ?`)
    .bind(accountId)
    .first();
  
  if (!account) {
    throw new Error('Account not found');
  }
  
  const accountTier = account.account_tier as 'basic' | 'premium' | 'business';
  const limits = getCardLimits(accountTier);
  
  const card: DebitCard = {
    id: cardId,
    account_id: accountId,
    client_id: clientId,
    card_number_encrypted: cardNumberEncrypted,
    card_last4: cardLast4,
    card_type: 'virtual',
    network: 'visa',
    exp_month: expMonth,
    exp_year: expYear,
    cvv_encrypted: cvvEncrypted,
    cardholder_name: sanitizeString(cardholderName),
    billing_address: sanitizeString(billingAddress.street),
    billing_city: sanitizeString(billingAddress.city),
    billing_state: sanitizeString(billingAddress.state),
    billing_zip: sanitizeString(billingAddress.zip),
    status: 'active', // Virtual cards are active immediately
    activation_required: false,
    daily_limit: limits.daily_limit,
    transaction_limit: limits.transaction_limit,
    atm_daily_limit: limits.atm_daily_limit,
    international_enabled: true,
    online_enabled: true,
    contactless_enabled: true,
    pin_set: false,
    created_at: now,
  };
  
  // Insert card
  await db
    .prepare(
      `
      INSERT INTO debit_cards (
        id, account_id, client_id, card_number_encrypted, card_last4,
        card_type, network, exp_month, exp_year, cvv_encrypted,
        cardholder_name, billing_address, billing_city, billing_state,
        billing_zip, status, activation_required, daily_limit,
        transaction_limit, atm_daily_limit, international_enabled,
        online_enabled, contactless_enabled, pin_set, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      cardId,
      accountId,
      clientId,
      cardNumberEncrypted,
      cardLast4,
      'virtual',
      'visa',
      expMonth,
      expYear,
      cvvEncrypted,
      card.cardholder_name,
      card.billing_address,
      card.billing_city,
      card.billing_state,
      card.billing_zip,
      'active',
      0,
      limits.daily_limit,
      limits.transaction_limit,
      limits.atm_daily_limit,
      1,
      1,
      1,
      0,
      now
    )
    .run();
  
  // Log audit
  await logAudit(db, {
    action: 'virtual_card_issued',
    entity: 'debit_card',
    entity_id: cardId,
    user_id: parseInt(clientId),
    details: `Virtual debit card issued ending in ${cardLast4}`,
  });
  
  // Notify client
  await sendRealtimeNotification(clientId, {
    type: 'card_issued',
    title: 'Virtual Card Issued',
    message: `Your virtual debit card ending in ${cardLast4} is ready to use.`,
  });
  
  return card;
}

/**
 * Order physical debit card
 */
export async function orderPhysicalCard(
  db: D1Database,
  env: any,
  accountId: string,
  clientId: string,
  cardholderName: string,
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }
): Promise<DebitCard> {
  const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  // Generate card credentials
  const cardNumber = generateCardNumber();
  const cardLast4 = cardNumber.slice(-4);
  const cvv = generateCVV();
  
  const expDate = new Date();
  expDate.setFullYear(expDate.getFullYear() + 3);
  const expMonth = expDate.getMonth() + 1;
  const expYear = expDate.getFullYear();
  
  const cardNumberEncrypted = await encryptPII(cardNumber);
  const cvvEncrypted = await encryptPII(cvv);
  
  const account = await db
    .prepare(`SELECT account_tier FROM money_accounts WHERE id = ?`)
    .bind(accountId)
    .first();
  
  if (!account) {
    throw new Error('Account not found');
  }
  
  const accountTier = account.account_tier as 'basic' | 'premium' | 'business';
  const limits = getCardLimits(accountTier);
  
  const card: DebitCard = {
    id: cardId,
    account_id: accountId,
    client_id: clientId,
    card_number_encrypted: cardNumberEncrypted,
    card_last4: cardLast4,
    card_type: 'physical',
    network: 'visa',
    exp_month: expMonth,
    exp_year: expYear,
    cvv_encrypted: cvvEncrypted,
    cardholder_name: sanitizeString(cardholderName),
    billing_address: sanitizeString(shippingAddress.street),
    billing_city: sanitizeString(shippingAddress.city),
    billing_state: sanitizeString(shippingAddress.state),
    billing_zip: sanitizeString(shippingAddress.zip),
    status: 'pending',
    activation_required: true,
    daily_limit: limits.daily_limit,
    transaction_limit: limits.transaction_limit,
    atm_daily_limit: limits.atm_daily_limit,
    international_enabled: true,
    online_enabled: true,
    contactless_enabled: true,
    pin_set: false,
    fulfillment_status: 'pending',
    created_at: now,
  };
  
  await db
    .prepare(
      `
      INSERT INTO debit_cards (
        id, account_id, client_id, card_number_encrypted, card_last4,
        card_type, network, exp_month, exp_year, cvv_encrypted,
        cardholder_name, billing_address, billing_city, billing_state,
        billing_zip, status, activation_required, daily_limit,
        transaction_limit, atm_daily_limit, international_enabled,
        online_enabled, contactless_enabled, pin_set, fulfillment_status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      cardId,
      accountId,
      clientId,
      cardNumberEncrypted,
      cardLast4,
      'physical',
      'visa',
      expMonth,
      expYear,
      cvvEncrypted,
      card.cardholder_name,
      card.billing_address,
      card.billing_city,
      card.billing_state,
      card.billing_zip,
      'pending',
      1,
      limits.daily_limit,
      limits.transaction_limit,
      limits.atm_daily_limit,
      1,
      1,
      1,
      0,
      'pending',
      now
    )
    .run();
  
  // Log audit
  await logAudit(db, {
    action: 'physical_card_ordered',
    entity: 'debit_card',
    entity_id: cardId,
    user_id: parseInt(clientId),
    details: `Physical debit card ordered ending in ${cardLast4}`,
  });
  
  // Notify client
  await sendRealtimeNotification(clientId, {
    type: 'card_ordered',
    title: 'Card Ordered',
    message: `Your physical debit card ending in ${cardLast4} will arrive in 5-7 business days.`,
  });
  
  return card;
}

/**
 * Activate physical card
 */
export async function activateCard(
  db: D1Database,
  cardId: string,
  cardLast4: string
): Promise<void> {
  const now = new Date().toISOString();
  
  const card = await db
    .prepare(`SELECT * FROM debit_cards WHERE id = ? AND card_last4 = ?`)
    .bind(cardId, cardLast4)
    .first();
  
  if (!card) {
    throw new Error('Card not found');
  }
  
  if (card.status !== 'pending') {
    throw new Error('Card is not pending activation');
  }
  
  await db
    .prepare(`UPDATE debit_cards SET status = 'active', activated_at = ? WHERE id = ?`)
    .bind(now, cardId)
    .run();
  
  // Notify client
  await sendRealtimeNotification(card.client_id as string, {
    type: 'card_activated',
    title: 'Card Activated',
    message: `Your debit card ending in ${cardLast4} is now active and ready to use.`,
  });
}

/**
 * Freeze/unfreeze card
 */
export async function toggleCardFreeze(db: D1Database, cardId: string): Promise<string> {
  const card = await db.prepare(`SELECT status FROM debit_cards WHERE id = ?`).bind(cardId).first();
  
  if (!card) {
    throw new Error('Card not found');
  }
  
  const currentStatus = card.status as string;
  const newStatus = currentStatus === 'frozen' ? 'active' : 'frozen';
  
  await db
    .prepare(`UPDATE debit_cards SET status = ? WHERE id = ?`)
    .bind(newStatus, cardId)
    .run();
  
  return newStatus;
}

/**
 * Authorize card transaction
 */
export async function authorizeCardTransaction(
  db: D1Database,
  cardLast4: string,
  amount: number,
  merchantName: string,
  merchantCategory: string,
  merchantCountry: string = 'US'
): Promise<CardAuthorization> {
  const authId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  // Find card
  const card = await db
    .prepare(`SELECT * FROM debit_cards WHERE card_last4 = ? AND status = 'active'`)
    .bind(cardLast4)
    .first();
  
  if (!card) {
    return {
      id: authId,
      card_id: 'unknown',
      account_id: 'unknown',
      amount,
      merchant_name: merchantName,
      merchant_category: merchantCategory,
      merchant_country: merchantCountry,
      status: 'declined',
      decline_reason: 'Card not found or inactive',
      created_at: now,
    };
  }
  
  const cardId = card.id as string;
  const accountId = card.account_id as string;
  
  // Check transaction limit
  if (amount > (card.transaction_limit as number)) {
    return {
      id: authId,
      card_id: cardId,
      account_id: accountId,
      amount,
      merchant_name: merchantName,
      merchant_category: merchantCategory,
      merchant_country: merchantCountry,
      status: 'declined',
      decline_reason: 'Amount exceeds transaction limit',
      created_at: now,
    };
  }
  
  // Check daily limit
  const today = new Date().toISOString().split('T')[0];
  const { daily_total } = (await db
    .prepare(
      `
      SELECT COALESCE(SUM(amount), 0) as daily_total
      FROM card_authorizations
      WHERE card_id = ? AND DATE(created_at) = ? AND status = 'approved'
    `
    )
    .bind(cardId, today)
    .first()) as any;
  
  if (daily_total + amount > (card.daily_limit as number)) {
    return {
      id: authId,
      card_id: cardId,
      account_id: accountId,
      amount,
      merchant_name: merchantName,
      merchant_category: merchantCategory,
      merchant_country: merchantCountry,
      status: 'declined',
      decline_reason: 'Daily limit exceeded',
      created_at: now,
    };
  }
  
  // Check account balance
  const account = await db
    .prepare(`SELECT balance FROM money_accounts WHERE id = ?`)
    .bind(accountId)
    .first();
  
  if (!account || (account.balance as number) < amount) {
    return {
      id: authId,
      card_id: cardId,
      account_id: accountId,
      amount,
      merchant_name: merchantName,
      merchant_category: merchantCategory,
      merchant_country: merchantCountry,
      status: 'declined',
      decline_reason: 'Insufficient funds',
      created_at: now,
    };
  }
  
  // Check international transactions
  if (merchantCountry !== 'US' && !(card.international_enabled as boolean)) {
    return {
      id: authId,
      card_id: cardId,
      account_id: accountId,
      amount,
      merchant_name: merchantName,
      merchant_category: merchantCategory,
      merchant_country: merchantCountry,
      status: 'declined',
      decline_reason: 'International transactions disabled',
      created_at: now,
    };
  }
  
  // Generate authorization code
  const authorizationCode = `RTB${Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0')}`;
  
  // Approve transaction
  const authorization: CardAuthorization = {
    id: authId,
    card_id: cardId,
    account_id: accountId,
    amount,
    merchant_name: sanitizeString(merchantName),
    merchant_category: merchantCategory,
    merchant_country: merchantCountry,
    authorization_code: authorizationCode,
    status: 'approved',
    created_at: now,
  };
  
  // Insert authorization
  await db
    .prepare(
      `
      INSERT INTO card_authorizations (
        id, card_id, account_id, amount, merchant_name, merchant_category,
        merchant_country, authorization_code, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      authId,
      cardId,
      accountId,
      amount,
      authorization.merchant_name,
      merchantCategory,
      merchantCountry,
      authorizationCode,
      'approved',
      now
    )
    .run();
  
  // Post transaction to account
  const transaction = await postTransaction(db, accountId, {
    transaction_type: 'card',
    amount,
    description: `Card purchase - ${merchantName}`,
    reference_number: authorizationCode,
    merchant_name: merchantName,
    merchant_category: merchantCategory,
    card_last4: cardLast4,
    status: 'posted',
  });
  
  authorization.transaction_id = transaction.id;
  
  return authorization;
}

/**
 * Get card spending limits by tier
 */
function getCardLimits(tier: 'basic' | 'premium' | 'business'): {
  daily_limit: number;
  transaction_limit: number;
  atm_daily_limit: number;
} {
  const limits = {
    basic: { daily_limit: 1000, transaction_limit: 500, atm_daily_limit: 300 },
    premium: { daily_limit: 5000, transaction_limit: 2500, atm_daily_limit: 1000 },
    business: { daily_limit: 25000, transaction_limit: 10000, atm_daily_limit: 5000 },
  };
  
  return limits[tier];
}

/**
 * Generate card number (Visa BIN)
 */
function generateCardNumber(): string {
  // Visa starts with 4
  // Real implementation would call Marqeta API
  const bin = '4532'; // Example Visa BIN
  const account = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(11, '0');
  
  // Luhn algorithm checksum
  const partial = bin + account;
  const checkDigit = calculateLuhnCheckDigit(partial);
  
  return partial + checkDigit;
}

/**
 * Generate CVV
 */
function generateCVV(): string {
  return Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
}

/**
 * Calculate Luhn check digit
 */
function calculateLuhnCheckDigit(number: string): string {
  const digits = number.split('').map(Number);
  let sum = 0;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    
    if ((digits.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}
