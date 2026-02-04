/**
 * Client-Facing Bank Service
 * 
 * Allows clients to:
 * - Link external bank accounts for refund deposits
 * - Verify routing/account numbers
 * - Select bank products (RA, EPS, SBTPG, Refundo)
 * - Manage linked financial institutions
 * - View transaction history
 * 
 * Integrates with badge system for bank_routing_verified and bank_product_selected
 */

import { D1Database } from '@cloudflare/workers-types';
import { sanitizeString } from '../utils/sanitization';
import { logAudit } from '../utils/audit';
import { sendRealtimeNotification } from '../utils/notifications';
import { createBadge } from './badgeSystem';

export interface LinkedBank {
  id: string;
  client_id: string;
  bank_name: string;
  account_type: 'checking' | 'savings';
  account_number_last4: string; // Only last 4 digits
  account_number_encrypted: string; // Full encrypted
  routing_number: string;
  routing_verified: boolean;
  account_verified: boolean;
  is_primary: boolean;
  bank_product?: 'RA' | 'EPS' | 'SBTPG' | 'Refundo' | null;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  created_at: string;
  verified_at?: string;
}

export interface BankProduct {
  id: string;
  code: 'RA' | 'EPS' | 'SBTPG' | 'Refundo';
  name: string;
  description: string;
  features: string[];
  fees: {
    refund_transfer?: number;
    refund_advance?: number;
    monthly?: number;
  };
  requirements: string[];
  logo_url?: string;
}

export interface BankVerificationRequest {
  client_id: string;
  bank_name: string;
  account_type: 'checking' | 'savings';
  account_number: string;
  routing_number: string;
  account_holder_name: string;
}

// Bank product definitions
const BANK_PRODUCTS: BankProduct[] = [
  {
    id: 'ra',
    code: 'RA',
    name: 'Refund Advantage',
    description: 'Get your refund up to 21 days early with Refund Advance',
    features: [
      'Advance up to $6,000',
      'No credit check required',
      '0% APR - No interest',
      'Instant approval',
      'Direct deposit to your account',
    ],
    fees: {
      refund_transfer: 29.95,
      refund_advance: 0,
    },
    requirements: [
      'Valid government-issued ID',
      'Active checking or savings account',
      'Expected refund of at least $500',
    ],
    logo_url: '/assets/bank-logos/refund-advantage.png',
  },
  {
    id: 'eps',
    code: 'EPS',
    name: 'EPS Financial',
    description: 'Reliable refund transfer services with instant access',
    features: [
      'Same-day refund transfer',
      'Free debit card',
      'Mobile banking app',
      'No monthly fees',
    ],
    fees: {
      refund_transfer: 34.95,
    },
    requirements: [
      'Valid email address',
      'U.S. resident',
    ],
    logo_url: '/assets/bank-logos/eps.png',
  },
  {
    id: 'sbtpg',
    code: 'SBTPG',
    name: 'Santa Barbara TPG',
    description: 'Industry-leading refund processing with enhanced security',
    features: [
      'Enhanced fraud protection',
      '24/7 customer support',
      'Fast refund processing',
      'Multiple payment options',
    ],
    fees: {
      refund_transfer: 39.95,
    },
    requirements: [
      'Valid Social Security Number',
      'U.S. bank account',
    ],
    logo_url: '/assets/bank-logos/sbtpg.png',
  },
  {
    id: 'refundo',
    code: 'Refundo',
    name: 'Refundo',
    description: 'Simple, transparent refund advances',
    features: [
      'No hidden fees',
      'Transparent pricing',
      'Quick approval process',
      'Direct bank deposit',
    ],
    fees: {
      refund_transfer: 24.95,
      refund_advance: 0,
    },
    requirements: [
      'Active bank account',
      'Expected refund amount',
    ],
    logo_url: '/assets/bank-logos/refundo.png',
  },
];

/**
 * Link a new bank account for client
 */
export async function linkBankAccount(
  db: D1Database,
  request: BankVerificationRequest
): Promise<LinkedBank> {
  const bankId = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // Extract last 4 digits
  const last4 = request.account_number.slice(-4);

  // In production, encrypt the full account number
  // For now, we'll simulate encryption
  const encrypted = `ENC_${Buffer.from(request.account_number).toString('base64')}`;

  // Verify routing number format (9 digits)
  const routingValid = /^\d{9}$/.test(request.routing_number);

  await db
    .prepare(
      `
      INSERT INTO linked_banks (
        id, client_id, bank_name, account_type, account_number_last4,
        account_number_encrypted, routing_number, routing_verified,
        account_verified, is_primary, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      bankId,
      sanitizeString(request.client_id),
      sanitizeString(request.bank_name),
      request.account_type,
      last4,
      encrypted,
      request.routing_number,
      routingValid ? 1 : 0,
      0, // Account verification pending
      0, // Not primary yet
      routingValid ? 'active' : 'pending',
      now
    )
    .run();

  // Log audit
  await logAudit(db, {
    action: 'bank_account_linked',
    entity: 'linked_bank',
    entity_id: bankId,
    user_id: parseInt(request.client_id),
    details: `Bank account linked: ${request.bank_name} (${last4})`,
  });

  // Send notification
  await sendRealtimeNotification(request.client_id, {
    type: 'bank_linked',
    title: 'Bank Account Linked',
    message: `Your ${request.bank_name} account ending in ${last4} has been linked.`,
  });

  // Award badge if routing verified
  if (routingValid) {
    await createBadge(db, request.client_id, 'bank_routing_verified', {
      bank_id: bankId,
      routing_number: request.routing_number,
    });
  }

  return {
    id: bankId,
    client_id: request.client_id,
    bank_name: request.bank_name,
    account_type: request.account_type,
    account_number_last4: last4,
    account_number_encrypted: encrypted,
    routing_number: request.routing_number,
    routing_verified: routingValid,
    account_verified: false,
    is_primary: false,
    status: routingValid ? 'active' : 'pending',
    created_at: now,
  };
}

/**
 * Get all linked banks for client
 */
export async function getClientBanks(db: D1Database, clientId: string): Promise<LinkedBank[]> {
  const { results } = await db
    .prepare(
      `
      SELECT 
        id, client_id, bank_name, account_type, account_number_last4,
        account_number_encrypted, routing_number, routing_verified,
        account_verified, is_primary, bank_product, status, created_at, verified_at
      FROM linked_banks
      WHERE client_id = ?
      ORDER BY is_primary DESC, created_at DESC
    `
    )
    .bind(sanitizeString(clientId))
    .all();

  return (results || []).map((row: any) => ({
    id: row.id,
    client_id: row.client_id,
    bank_name: row.bank_name,
    account_type: row.account_type,
    account_number_last4: row.account_number_last4,
    account_number_encrypted: row.account_number_encrypted,
    routing_number: row.routing_number,
    routing_verified: row.routing_verified === 1,
    account_verified: row.account_verified === 1,
    is_primary: row.is_primary === 1,
    bank_product: row.bank_product,
    status: row.status,
    created_at: row.created_at,
    verified_at: row.verified_at,
  }));
}

/**
 * Verify bank account via micro-deposits or instant verification
 */
export async function verifyBankAccount(
  db: D1Database,
  bankId: string,
  clientId: string,
  verificationMethod: 'micro_deposit' | 'instant' | 'manual',
  verificationData?: { amount1?: number; amount2?: number }
): Promise<boolean> {
  const now = new Date().toISOString();

  // In production, verify micro-deposit amounts or use Plaid/similar for instant verification
  const verified = true; // Simulate successful verification

  if (verified) {
    await db
      .prepare(
        `
        UPDATE linked_banks
        SET account_verified = 1, verified_at = ?, status = 'active'
        WHERE id = ? AND client_id = ?
      `
      )
      .bind(now, bankId, sanitizeString(clientId))
      .run();

    // Log audit
    await logAudit(db, {
      action: 'bank_account_verified',
      entity: 'linked_bank',
      entity_id: bankId,
      user_id: parseInt(clientId),
      details: `Bank account verified via ${verificationMethod}`,
    });

    // Send notification
    await sendRealtimeNotification(clientId, {
      type: 'bank_verified',
      title: 'Bank Account Verified',
      message: 'Your bank account has been successfully verified and is ready for use.',
    });

    // Award badge
    await createBadge(db, clientId, 'bank_routing_verified', {
      bank_id: bankId,
      verification_method: verificationMethod,
    });
  }

  return verified;
}

/**
 * Select bank product for refund processing
 */
export async function selectBankProduct(
  db: D1Database,
  clientId: string,
  bankId: string,
  productCode: 'RA' | 'EPS' | 'SBTPG' | 'Refundo'
): Promise<void> {
  await db
    .prepare(
      `
      UPDATE linked_banks
      SET bank_product = ?
      WHERE id = ? AND client_id = ?
    `
    )
    .bind(productCode, bankId, sanitizeString(clientId))
    .run();

  // Log audit
  await logAudit(db, {
    action: 'bank_product_selected',
    entity: 'linked_bank',
    entity_id: bankId,
    user_id: parseInt(clientId),
    details: `Bank product selected: ${productCode}`,
  });

  // Send notification
  const product = BANK_PRODUCTS.find((p) => p.code === productCode);
  await sendRealtimeNotification(clientId, {
    type: 'bank_product_selected',
    title: 'Bank Product Selected',
    message: `You've selected ${product?.name} for your refund processing.`,
  });

  // Award badge
  await createBadge(db, clientId, 'bank_product_selected', {
    bank_id: bankId,
    product_code: productCode,
  });
}

/**
 * Set primary bank account
 */
export async function setPrimaryBank(
  db: D1Database,
  clientId: string,
  bankId: string
): Promise<void> {
  // Clear existing primary
  await db
    .prepare(`UPDATE linked_banks SET is_primary = 0 WHERE client_id = ?`)
    .bind(sanitizeString(clientId))
    .run();

  // Set new primary
  await db
    .prepare(`UPDATE linked_banks SET is_primary = 1 WHERE id = ? AND client_id = ?`)
    .bind(bankId, sanitizeString(clientId))
    .run();

  // Log audit
  await logAudit(db, {
    action: 'primary_bank_updated',
    entity: 'linked_bank',
    entity_id: bankId,
    user_id: parseInt(clientId),
    details: 'Primary bank account updated',
  });
}

/**
 * Remove linked bank account
 */
export async function removeBankAccount(
  db: D1Database,
  clientId: string,
  bankId: string
): Promise<void> {
  await db
    .prepare(`UPDATE linked_banks SET status = 'closed' WHERE id = ? AND client_id = ?`)
    .bind(bankId, sanitizeString(clientId))
    .run();

  // Log audit
  await logAudit(db, {
    action: 'bank_account_removed',
    entity: 'linked_bank',
    entity_id: bankId,
    user_id: parseInt(clientId),
    details: 'Bank account removed',
  });

  // Send notification
  await sendRealtimeNotification(clientId, {
    type: 'bank_removed',
    title: 'Bank Account Removed',
    message: 'Your bank account has been removed from your profile.',
  });
}

/**
 * Get available bank products
 */
export function getBankProducts(): BankProduct[] {
  return BANK_PRODUCTS;
}

/**
 * Get specific bank product details
 */
export function getBankProduct(code: string): BankProduct | null {
  return BANK_PRODUCTS.find((p) => p.code === code) || null;
}

/**
 * Validate routing number format and check if it exists
 */
export function validateRoutingNumber(routingNumber: string): {
  valid: boolean;
  bank_name?: string;
  message: string;
} {
  // Check format
  if (!/^\d{9}$/.test(routingNumber)) {
    return {
      valid: false,
      message: 'Routing number must be exactly 9 digits',
    };
  }

  // Checksum validation using ABA routing number algorithm
  const digits = routingNumber.split('').map(Number);
  const checksum =
    (3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      (digits[2] + digits[5] + digits[8])) %
    10;

  if (checksum !== 0) {
    return {
      valid: false,
      message: 'Invalid routing number checksum',
    };
  }

  // In production, look up in routing number database
  // For now, simulate successful validation
  return {
    valid: true,
    bank_name: 'Verified Bank',
    message: 'Routing number is valid',
  };
}
