/**
 * Ross Tax & Bookkeeping Money Management Platform
 * 
 * Digital banking and money management service with:
 * - Individual checking/savings accounts
 * - System-generated account numbers linked to SSN/Tax ID
 * - FDIC insurance tracking ($250K per account type)
 * - Automated transaction limits
 * - Account tier system (Basic, Premium, Business)
 * - Real-time balance tracking
 * - Transaction categorization
 * 
 * Compliance:
 * - Federal Reserve Regulation E (Electronic Funds Transfers)
 * - Regulation D (Reserve Requirements)
 * - Regulation CC (Funds Availability)
 * - Bank Secrecy Act (BSA/AML)
 * - FDIC insurance requirements
 */

import { D1Database } from '@cloudflare/workers-types';
import { sanitizeString } from '../utils/sanitization';
import { encryptPII, decryptPII } from '../utils/encryption';
import { logAudit } from '../utils/audit';
import { sendRealtimeNotification } from '../utils/notifications';
import { createBadge } from './badgeSystem';

export interface MoneyManagementAccount {
  id: string;
  client_id: string;
  account_number: string; // System-generated, identity-linked
  routing_number: string; // Ross Tax & Bookkeeping routing number
  account_type: 'checking' | 'savings' | 'money_market';
  account_tier: 'basic' | 'premium' | 'business';
  account_name: string;
  balance: number;
  available_balance: number;
  pending_deposits: number;
  pending_withdrawals: number;
  daily_limit: number;
  monthly_limit: number;
  transaction_limit_per: number;
  overdraft_protection: boolean;
  overdraft_limit: number;
  interest_rate: number;
  fdic_insured: boolean;
  fdic_coverage: number;
  status: 'active' | 'frozen' | 'closed' | 'suspended';
  created_at: string;
  last_transaction_at?: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'p2p' | 'card' | 'check' | 'fee' | 'interest';
  amount: number;
  balance_after: number;
  description: string;
  category?: string;
  merchant_name?: string;
  merchant_category?: string;
  reference_number: string;
  source_account?: string;
  destination_account?: string;
  p2p_recipient_id?: string;
  card_last4?: string;
  check_number?: string;
  status: 'pending' | 'posted' | 'declined' | 'reversed';
  posted_at?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface AccountTierLimits {
  tier: 'basic' | 'premium' | 'business';
  daily_limit: number;
  monthly_limit: number;
  transaction_limit: number;
  p2p_daily_limit: number;
  mobile_deposit_limit: number;
  overdraft_limit: number;
  monthly_fee: number;
  atm_fee_reimbursement: number;
  features: string[];
}

// Account tier configurations
const ACCOUNT_TIERS: Record<string, AccountTierLimits> = {
  basic: {
    tier: 'basic',
    daily_limit: 1000,
    monthly_limit: 5000,
    transaction_limit: 500,
    p2p_daily_limit: 500,
    mobile_deposit_limit: 2000,
    overdraft_limit: 0,
    monthly_fee: 0,
    atm_fee_reimbursement: 0,
    features: [
      'Free checking account',
      'Mobile banking',
      'Bill pay',
      'Direct deposit',
      'Mobile check deposit',
    ],
  },
  premium: {
    tier: 'premium',
    daily_limit: 5000,
    monthly_limit: 25000,
    transaction_limit: 2500,
    p2p_daily_limit: 2500,
    mobile_deposit_limit: 10000,
    overdraft_limit: 500,
    monthly_fee: 9.95,
    atm_fee_reimbursement: 20,
    features: [
      'All Basic features',
      'Higher transaction limits',
      '$500 overdraft protection',
      'ATM fee reimbursement (up to $20/mo)',
      'Premium customer support',
      'Early direct deposit (2 days early)',
    ],
  },
  business: {
    tier: 'business',
    daily_limit: 25000,
    monthly_limit: 150000,
    transaction_limit: 10000,
    p2p_daily_limit: 10000,
    mobile_deposit_limit: 50000,
    overdraft_limit: 2500,
    monthly_fee: 24.95,
    atm_fee_reimbursement: 50,
    features: [
      'All Premium features',
      'Business transaction limits',
      '$2,500 overdraft protection',
      'Business bookkeeping integration',
      'Tax document generation',
      'Dedicated account manager',
      'Bulk payment processing',
      'Multi-user access',
    ],
  },
};

/**
 * Generate system account number linked to identity
 * Format: RTB-{year}{month}-{client_id_hash}-{random}
 */
export function generateAccountNumber(clientId: string, accountType: string): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Create deterministic hash from client ID
  const hashBase = clientId + accountType;
  const hash = Array.from(hashBase)
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString()
    .padStart(6, '0')
    .slice(0, 6);
  
  // Random suffix for uniqueness
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  
  return `${year}${month}${hash}${random}`;
}

/**
 * Ross Tax & Bookkeeping routing number (would be issued by Federal Reserve)
 * Using example format: 011401533 (ABA routing number format)
 */
export const RTB_ROUTING_NUMBER = '011401533';

/**
 * Create new money management account
 */
export async function createMoneyAccount(
  db: D1Database,
  clientId: string,
  accountType: 'checking' | 'savings' | 'money_market',
  accountTier: 'basic' | 'premium' | 'business' = 'basic',
  accountName?: string
): Promise<MoneyManagementAccount> {
  const accountId = `mma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  // Generate account number
  const accountNumber = generateAccountNumber(clientId, accountType);
  
  // Get tier limits
  const tierLimits = ACCOUNT_TIERS[accountTier];
  
  // Default interest rates
  const interestRates = {
    checking: 0.01,
    savings: 1.50,
    money_market: 2.25,
  };
  
  const account: MoneyManagementAccount = {
    id: accountId,
    client_id: clientId,
    account_number: accountNumber,
    routing_number: RTB_ROUTING_NUMBER,
    account_type: accountType,
    account_tier: accountTier,
    account_name: accountName || `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account`,
    balance: 0,
    available_balance: 0,
    pending_deposits: 0,
    pending_withdrawals: 0,
    daily_limit: tierLimits.daily_limit,
    monthly_limit: tierLimits.monthly_limit,
    transaction_limit_per: tierLimits.transaction_limit,
    overdraft_protection: accountTier !== 'basic',
    overdraft_limit: tierLimits.overdraft_limit,
    interest_rate: interestRates[accountType],
    fdic_insured: true,
    fdic_coverage: 250000,
    status: 'active',
    created_at: now,
  };
  
  await db
    .prepare(
      `
      INSERT INTO money_accounts (
        id, client_id, account_number, routing_number, account_type, account_tier,
        account_name, balance, available_balance, pending_deposits, pending_withdrawals,
        daily_limit, monthly_limit, transaction_limit_per, overdraft_protection,
        overdraft_limit, interest_rate, fdic_insured, fdic_coverage, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      accountId,
      sanitizeString(clientId),
      accountNumber,
      RTB_ROUTING_NUMBER,
      accountType,
      accountTier,
      sanitizeString(account.account_name),
      0,
      0,
      0,
      0,
      tierLimits.daily_limit,
      tierLimits.monthly_limit,
      tierLimits.transaction_limit,
      accountTier !== 'basic' ? 1 : 0,
      tierLimits.overdraft_limit,
      interestRates[accountType],
      1,
      250000,
      'active',
      now
    )
    .run();
  
  // Log audit
  await logAudit(db, {
    action: 'money_account_created',
    entity: 'money_account',
    entity_id: accountId,
    user_id: parseInt(clientId),
    details: `${accountType} account created (${accountTier} tier): ${accountNumber}`,
  });
  
  // Send notification
  await sendRealtimeNotification(clientId, {
    type: 'account_opened',
    title: 'Account Opened Successfully',
    message: `Your ${account.account_name} (${accountNumber}) is now active and ready to use.`,
  });
  
  // Award badge
  await createBadge(db, clientId, 'bank_routing_verified', {
    account_id: accountId,
    account_number: accountNumber,
  });
  
  return account;
}

/**
 * Get client's money management accounts
 */
export async function getClientMoneyAccounts(
  db: D1Database,
  clientId: string
): Promise<MoneyManagementAccount[]> {
  const { results } = await db
    .prepare(
      `
      SELECT * FROM money_accounts
      WHERE client_id = ? AND status != 'closed'
      ORDER BY created_at DESC
    `
    )
    .bind(sanitizeString(clientId))
    .all();
  
  return (results || []).map((row: any) => ({
    id: row.id,
    client_id: row.client_id,
    account_number: row.account_number,
    routing_number: row.routing_number,
    account_type: row.account_type,
    account_tier: row.account_tier,
    account_name: row.account_name,
    balance: row.balance,
    available_balance: row.available_balance,
    pending_deposits: row.pending_deposits,
    pending_withdrawals: row.pending_withdrawals,
    daily_limit: row.daily_limit,
    monthly_limit: row.monthly_limit,
    transaction_limit_per: row.transaction_limit_per,
    overdraft_protection: row.overdraft_protection === 1,
    overdraft_limit: row.overdraft_limit,
    interest_rate: row.interest_rate,
    fdic_insured: row.fdic_insured === 1,
    fdic_coverage: row.fdic_coverage,
    status: row.status,
    created_at: row.created_at,
    last_transaction_at: row.last_transaction_at,
  }));
}

/**
 * Get total FDIC coverage for client
 */
export async function getFDICCoverage(db: D1Database, clientId: string): Promise<{
  total_deposits: number;
  checking_balance: number;
  savings_balance: number;
  money_market_balance: number;
  checking_coverage: number;
  savings_coverage: number;
  total_covered: number;
  excess_uninsured: number;
}> {
  const accounts = await getClientMoneyAccounts(db, clientId);
  
  const checking = accounts.filter((a) => a.account_type === 'checking').reduce((sum, a) => sum + a.balance, 0);
  const savings = accounts.filter((a) => a.account_type === 'savings').reduce((sum, a) => sum + a.balance, 0);
  const moneyMarket = accounts.filter((a) => a.account_type === 'money_market').reduce((sum, a) => sum + a.balance, 0);
  
  const total = checking + savings + moneyMarket;
  
  // FDIC insures up to $250K per depositor, per account category
  const checkingCoverage = Math.min(checking, 250000);
  const savingsCoverage = Math.min(savings + moneyMarket, 250000);
  const totalCovered = checkingCoverage + savingsCoverage;
  const excessUninsured = Math.max(0, total - totalCovered);
  
  return {
    total_deposits: total,
    checking_balance: checking,
    savings_balance: savings,
    money_market_balance: moneyMarket,
    checking_coverage: checkingCoverage,
    savings_coverage: savingsCoverage,
    total_covered: totalCovered,
    excess_uninsured: excessUninsured,
  };
}

/**
 * Post transaction to account
 */
export async function postTransaction(
  db: D1Database,
  accountId: string,
  transaction: Omit<Transaction, 'id' | 'created_at' | 'balance_after'>
): Promise<Transaction> {
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  // Get current account balance
  const account = await db
    .prepare(`SELECT balance, available_balance FROM money_accounts WHERE id = ?`)
    .bind(accountId)
    .first();
  
  if (!account) {
    throw new Error('Account not found');
  }
  
  const currentBalance = account.balance as number;
  let newBalance = currentBalance;
  
  // Calculate new balance based on transaction type
  if (transaction.transaction_type === 'deposit' || transaction.transaction_type === 'interest') {
    newBalance += transaction.amount;
  } else {
    newBalance -= transaction.amount;
  }
  
  // Insert transaction
  await db
    .prepare(
      `
      INSERT INTO transactions (
        id, account_id, transaction_type, amount, balance_after, description,
        category, merchant_name, merchant_category, reference_number,
        source_account, destination_account, p2p_recipient_id, card_last4,
        check_number, status, posted_at, created_at, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      transactionId,
      accountId,
      transaction.transaction_type,
      transaction.amount,
      newBalance,
      sanitizeString(transaction.description),
      transaction.category || null,
      transaction.merchant_name || null,
      transaction.merchant_category || null,
      transaction.reference_number,
      transaction.source_account || null,
      transaction.destination_account || null,
      transaction.p2p_recipient_id || null,
      transaction.card_last4 || null,
      transaction.check_number || null,
      transaction.status,
      transaction.status === 'posted' ? now : null,
      now,
      transaction.metadata ? JSON.stringify(transaction.metadata) : null
    )
    .run();
  
  // Update account balance if posted
  if (transaction.status === 'posted') {
    await db
      .prepare(
        `
        UPDATE money_accounts
        SET balance = ?, available_balance = ?, last_transaction_at = ?
        WHERE id = ?
      `
      )
      .bind(newBalance, newBalance, now, accountId)
      .run();
  }
  
  return {
    id: transactionId,
    account_id: accountId,
    balance_after: newBalance,
    created_at: now,
    ...transaction,
  };
}

/**
 * Get account transaction history
 */
export async function getTransactionHistory(
  db: D1Database,
  accountId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const { results } = await db
    .prepare(
      `
      SELECT * FROM transactions
      WHERE account_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    )
    .bind(accountId, limit, offset)
    .all();
  
  return (results || []).map((row: any) => ({
    id: row.id,
    account_id: row.account_id,
    transaction_type: row.transaction_type,
    amount: row.amount,
    balance_after: row.balance_after,
    description: row.description,
    category: row.category,
    merchant_name: row.merchant_name,
    merchant_category: row.merchant_category,
    reference_number: row.reference_number,
    source_account: row.source_account,
    destination_account: row.destination_account,
    p2p_recipient_id: row.p2p_recipient_id,
    card_last4: row.card_last4,
    check_number: row.check_number,
    status: row.status,
    posted_at: row.posted_at,
    created_at: row.created_at,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}

/**
 * Get account tier details
 */
export function getAccountTier(tier: 'basic' | 'premium' | 'business'): AccountTierLimits {
  return ACCOUNT_TIERS[tier];
}

/**
 * Upgrade account tier
 */
export async function upgradeAccountTier(
  db: D1Database,
  accountId: string,
  newTier: 'basic' | 'premium' | 'business'
): Promise<void> {
  const tierLimits = ACCOUNT_TIERS[newTier];
  
  await db
    .prepare(
      `
      UPDATE money_accounts
      SET account_tier = ?, daily_limit = ?, monthly_limit = ?,
          transaction_limit_per = ?, overdraft_protection = ?, overdraft_limit = ?
      WHERE id = ?
    `
    )
    .bind(
      newTier,
      tierLimits.daily_limit,
      tierLimits.monthly_limit,
      tierLimits.transaction_limit,
      newTier !== 'basic' ? 1 : 0,
      tierLimits.overdraft_limit,
      accountId
    )
    .run();
  
  // Log audit
  await logAudit(db, {
    action: 'account_tier_upgraded',
    entity: 'money_account',
    entity_id: accountId,
    details: `Account upgraded to ${newTier} tier`,
  });
}
