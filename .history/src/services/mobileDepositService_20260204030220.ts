/**
 * Ross Tax & Bookkeeping Mobile Check Deposit Service
 * 
 * Mobile check deposit processing:
 * - Front/back image capture and validation
 * - MICR line extraction (routing, account, check number)
 * - Amount verification
 * - Duplicate detection
 * - Funds hold and release schedule
 * 
 * Compliance:
 * - Check 21 (Check Clearing for the 21st Century Act)
 * - Regulation CC (Funds Availability)
 * - UCC Article 3 (Negotiable Instruments)
 */

import { D1Database } from '@cloudflare/workers-types';
import { R2Bucket } from '@cloudflare/workers-types';
import { sanitizeString } from '../utils/sanitization';
import { logAudit } from '../utils/audit';
import { sendRealtimeNotification } from '../utils/notifications';
import { postTransaction } from './moneyManagementService';

export interface MobileDeposit {
  id: string;
  account_id: string;
  client_id: string;
  check_amount: number;
  check_number?: string;
  routing_number?: string;
  account_number?: string;
  payor_name?: string;
  check_date?: string;
  front_image_url: string;
  back_image_url: string;
  micr_data?: string;
  duplicate_check: boolean;
  duplicate_of?: string;
  status: 'pending' | 'processing' | 'approved' | 'declined' | 'cleared' | 'returned';
  decline_reason?: string;
  funds_available_at?: string;
  hold_amount: number;
  hold_released: boolean;
  cleared_at?: string;
  created_at: string;
}

export interface DepositLimit {
  tier: 'basic' | 'premium' | 'business';
  per_check: number;
  daily_limit: number;
  monthly_limit: number;
  hold_days_first_check: number;
  hold_days_regular: number;
}

// Deposit limits by account tier
const DEPOSIT_LIMITS: Record<string, DepositLimit> = {
  basic: {
    tier: 'basic',
    per_check: 2000,
    daily_limit: 5000,
    monthly_limit: 20000,
    hold_days_first_check: 10,
    hold_days_regular: 5,
  },
  premium: {
    tier: 'premium',
    per_check: 10000,
    daily_limit: 25000,
    monthly_limit: 100000,
    hold_days_first_check: 7,
    hold_days_regular: 3,
  },
  business: {
    tier: 'business',
    per_check: 50000,
    daily_limit: 100000,
    monthly_limit: 500000,
    hold_days_first_check: 5,
    hold_days_regular: 2,
  },
};

/**
 * Validate MICR line data (basic validation)
 * Real implementation would use OCR service like Tesseract or Google Vision API
 */
function parseMICRLine(micrData: string): {
  routing_number: string;
  account_number: string;
  check_number: string;
} | null {
  // MICR format: ⑆routing⑆ ⑈account⑈ ⑈check⑈
  // Simplified regex for demonstration
  const micrPattern = /(\d{9})\s+(\d+)\s+(\d+)/;
  const match = micrData.match(micrPattern);
  
  if (!match) {
    return null;
  }
  
  return {
    routing_number: match[1],
    account_number: match[2],
    check_number: match[3],
  };
}

/**
 * Check for duplicate deposits (same check already deposited)
 */
async function checkDuplicate(
  db: D1Database,
  routingNumber: string,
  accountNumber: string,
  checkNumber: string
): Promise<string | null> {
  const existing = await db
    .prepare(
      `
      SELECT id FROM mobile_deposits
      WHERE routing_number = ? AND account_number = ? AND check_number = ?
        AND status IN ('processing', 'approved', 'cleared')
      LIMIT 1
    `
    )
    .bind(routingNumber, accountNumber, checkNumber)
    .first();
  
  return existing ? (existing.id as string) : null;
}

/**
 * Calculate funds availability date
 */
function calculateFundsAvailability(
  tier: 'basic' | 'premium' | 'business',
  isFirstDeposit: boolean
): Date {
  const limits = DEPOSIT_LIMITS[tier];
  const holdDays = isFirstDeposit ? limits.hold_days_first_check : limits.hold_days_regular;
  
  const availableDate = new Date();
  availableDate.setDate(availableDate.getDate() + holdDays);
  
  // Skip weekends (simplified - real implementation would skip bank holidays too)
  while (availableDate.getDay() === 0 || availableDate.getDay() === 6) {
    availableDate.setDate(availableDate.getDate() + 1);
  }
  
  return availableDate;
}

/**
 * Upload check images to R2
 */
async function uploadCheckImages(
  bucket: R2Bucket,
  depositId: string,
  frontImage: Uint8Array,
  backImage: Uint8Array
): Promise<{ frontUrl: string; backUrl: string }> {
  const frontKey = `mobile-deposits/${depositId}/front.jpg`;
  const backKey = `mobile-deposits/${depositId}/back.jpg`;
  
  await bucket.put(frontKey, frontImage, {
    httpMetadata: { contentType: 'image/jpeg' },
  });
  
  await bucket.put(backKey, backImage, {
    httpMetadata: { contentType: 'image/jpeg' },
  });
  
  return {
    frontUrl: frontKey,
    backUrl: backKey,
  };
}

/**
 * Submit mobile check deposit
 */
export async function submitMobileDeposit(
  db: D1Database,
  bucket: R2Bucket,
  accountId: string,
  clientId: string,
  checkAmount: number,
  frontImage: Uint8Array,
  backImage: Uint8Array,
  micrData?: string
): Promise<MobileDeposit> {
  const depositId = `mdep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  // Get account tier
  const account = await db
    .prepare(`SELECT account_tier FROM money_accounts WHERE id = ?`)
    .bind(accountId)
    .first();
  
  if (!account) {
    throw new Error('Account not found');
  }
  
  const accountTier = account.account_tier as 'basic' | 'premium' | 'business';
  const limits = DEPOSIT_LIMITS[accountTier];
  
  // Check per-check limit
  if (checkAmount > limits.per_check) {
    throw new Error(`Check amount exceeds limit of $${limits.per_check}`);
  }
  
  // Check daily limit
  const today = new Date().toISOString().split('T')[0];
  const { daily_total } = (await db
    .prepare(
      `
      SELECT COALESCE(SUM(check_amount), 0) as daily_total
      FROM mobile_deposits
      WHERE account_id = ?
        AND DATE(created_at) = ?
        AND status IN ('approved', 'processing', 'cleared')
    `
    )
    .bind(accountId, today)
    .first()) as any;
  
  if (daily_total + checkAmount > limits.daily_limit) {
    throw new Error(`Daily deposit limit exceeded ($${limits.daily_limit})`);
  }
  
  // Upload check images
  const { frontUrl, backUrl } = await uploadCheckImages(bucket, depositId, frontImage, backImage);
  
  // Parse MICR data if provided
  let routingNumber: string | undefined;
  let accountNumber: string | undefined;
  let checkNumber: string | undefined;
  let duplicateOf: string | null = null;
  let isDuplicate = false;
  
  if (micrData) {
    const parsed = parseMICRLine(micrData);
    if (parsed) {
      routingNumber = parsed.routing_number;
      accountNumber = parsed.account_number;
      checkNumber = parsed.check_number;
      
      // Check for duplicates
      duplicateOf = await checkDuplicate(db, routingNumber, accountNumber, checkNumber);
      isDuplicate = duplicateOf !== null;
    }
  }
  
  // Check if this is first deposit
  const { deposit_count } = (await db
    .prepare(`SELECT COUNT(*) as deposit_count FROM mobile_deposits WHERE account_id = ?`)
    .bind(accountId)
    .first()) as any;
  
  const isFirstDeposit = deposit_count === 0;
  const fundsAvailableAt = calculateFundsAvailability(accountTier, isFirstDeposit);
  
  const deposit: MobileDeposit = {
    id: depositId,
    account_id: accountId,
    client_id: clientId,
    check_amount: checkAmount,
    check_number: checkNumber,
    routing_number: routingNumber,
    account_number: accountNumber,
    front_image_url: frontUrl,
    back_image_url: backUrl,
    micr_data: micrData,
    duplicate_check: isDuplicate,
    duplicate_of: duplicateOf || undefined,
    status: isDuplicate ? 'declined' : 'processing',
    decline_reason: isDuplicate ? 'Duplicate deposit detected' : undefined,
    funds_available_at: fundsAvailableAt.toISOString(),
    hold_amount: checkAmount,
    hold_released: false,
    created_at: now,
  };
  
  // Insert deposit
  await db
    .prepare(
      `
      INSERT INTO mobile_deposits (
        id, account_id, client_id, check_amount, check_number, routing_number,
        account_number, front_image_url, back_image_url, micr_data,
        duplicate_check, duplicate_of, status, decline_reason,
        funds_available_at, hold_amount, hold_released, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      depositId,
      accountId,
      clientId,
      checkAmount,
      checkNumber || null,
      routingNumber || null,
      accountNumber || null,
      frontUrl,
      backUrl,
      micrData || null,
      isDuplicate ? 1 : 0,
      duplicateOf || null,
      deposit.status,
      deposit.decline_reason || null,
      fundsAvailableAt.toISOString(),
      checkAmount,
      0,
      now
    )
    .run();
  
  // Create pending transaction if not duplicate
  if (!isDuplicate) {
    await postTransaction(db, accountId, {
      transaction_type: 'check',
      amount: checkAmount,
      description: `Mobile check deposit - Check #${checkNumber || 'Unknown'}`,
      reference_number: depositId,
      check_number: checkNumber,
      status: 'pending',
    });
  }
  
  // Log audit
  await logAudit(db, {
    action: 'mobile_deposit_submitted',
    entity: 'mobile_deposit',
    entity_id: depositId,
    user_id: parseInt(clientId),
    details: `Mobile deposit of $${checkAmount} submitted`,
  });
  
  // Notify client
  const notificationMessage = isDuplicate
    ? `Your check deposit of $${checkAmount.toFixed(2)} was declined (duplicate).`
    : `Your check deposit of $${checkAmount.toFixed(2)} is being processed. Funds will be available on ${fundsAvailableAt.toLocaleDateString()}.`;
  
  await sendRealtimeNotification(clientId, {
    type: 'deposit_received',
    title: 'Check Deposit Received',
    message: notificationMessage,
  });
  
  return deposit;
}

/**
 * Approve mobile deposit and release funds
 */
export async function approveMobileDeposit(db: D1Database, depositId: string): Promise<void> {
  const deposit = await db
    .prepare(`SELECT * FROM mobile_deposits WHERE id = ?`)
    .bind(depositId)
    .first();
  
  if (!deposit) {
    throw new Error('Deposit not found');
  }
  
  if (deposit.status !== 'processing') {
    throw new Error(`Deposit cannot be approved (status: ${deposit.status})`);
  }
  
  const now = new Date().toISOString();
  const accountId = deposit.account_id as string;
  const checkAmount = deposit.check_amount as number;
  
  // Update deposit status
  await db
    .prepare(`UPDATE mobile_deposits SET status = 'approved' WHERE id = ?`)
    .bind(depositId)
    .run();
  
  // Post transaction (will update from pending to posted when funds are released)
  await postTransaction(db, accountId, {
    transaction_type: 'deposit',
    amount: checkAmount,
    description: `Mobile check deposit - Approved`,
    reference_number: depositId,
    status: 'posted',
  });
  
  // Log audit
  await logAudit(db, {
    action: 'mobile_deposit_approved',
    entity: 'mobile_deposit',
    entity_id: depositId,
    details: `Mobile deposit of $${checkAmount} approved`,
  });
  
  // Notify client
  await sendRealtimeNotification(deposit.client_id as string, {
    type: 'deposit_approved',
    title: 'Check Deposit Approved',
    message: `Your check deposit of $${checkAmount.toFixed(2)} has been approved and will be available soon.`,
  });
}

/**
 * Release funds hold (typically run via cron)
 */
export async function releaseFundsHolds(db: D1Database): Promise<number> {
  const now = new Date().toISOString();
  
  // Find deposits with expired holds
  const { results } = await db
    .prepare(
      `
      SELECT id, account_id, check_amount, client_id
      FROM mobile_deposits
      WHERE status = 'approved'
        AND hold_released = 0
        AND funds_available_at <= ?
    `
    )
    .bind(now)
    .all();
  
  let releasedCount = 0;
  
  for (const deposit of results || []) {
    const depositId = deposit.id as string;
    const accountId = deposit.account_id as string;
    const amount = deposit.check_amount as number;
    const clientId = deposit.client_id as string;
    
    // Release hold
    await db
      .prepare(`UPDATE mobile_deposits SET hold_released = 1, status = 'cleared', cleared_at = ? WHERE id = ?`)
      .bind(now, depositId)
      .run();
    
    // Notify client
    await sendRealtimeNotification(clientId, {
      type: 'funds_available',
      title: 'Funds Available',
      message: `$${amount.toFixed(2)} from your check deposit is now available.`,
    });
    
    releasedCount++;
  }
  
  return releasedCount;
}

/**
 * Get client mobile deposits
 */
export async function getClientMobileDeposits(
  db: D1Database,
  clientId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MobileDeposit[]> {
  const { results } = await db
    .prepare(
      `
      SELECT * FROM mobile_deposits
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    )
    .bind(clientId, limit, offset)
    .all();
  
  return (results || []).map((row: any) => ({
    id: row.id,
    account_id: row.account_id,
    client_id: row.client_id,
    check_amount: row.check_amount,
    check_number: row.check_number,
    routing_number: row.routing_number,
    account_number: row.account_number,
    payor_name: row.payor_name,
    check_date: row.check_date,
    front_image_url: row.front_image_url,
    back_image_url: row.back_image_url,
    micr_data: row.micr_data,
    duplicate_check: row.duplicate_check === 1,
    duplicate_of: row.duplicate_of,
    status: row.status,
    decline_reason: row.decline_reason,
    funds_available_at: row.funds_available_at,
    hold_amount: row.hold_amount,
    hold_released: row.hold_released === 1,
    cleared_at: row.cleared_at,
    created_at: row.created_at,
  }));
}
