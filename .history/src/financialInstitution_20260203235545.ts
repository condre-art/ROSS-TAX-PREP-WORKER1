/**
 * Custom Financial Institution (FI) Module
 * 
 * Enables Ross Tax Prep to operate as a fintech platform offering:
 * - Refund Transfers (RT) - Electronic deposit of tax refunds
 * - Refund Advances (RA) - Pre-refund advances
 * - Short-term Loans - Instant loan origination
 * - Fund Management - Customer deposits, withdrawals, fund pools
 * - Compliance Reporting - Regulatory filings, audit trails
 * 
 * Legal Structure:
 * - Application for Federal Depository: Federal Reserve
 * - State Banking Commission Registration: Texas (primary) + other states
 * - FDIC Insurance: Up to $250K per customer per account type
 * - ACH Participant: For electronic transfers
 * - Compliance: AML/KYC, OFAC, TILA, FCRA
 */

import { v4 as uuid } from 'uuid';
import { logAudit } from './utils/audit';

export interface FIAccount {
  account_id: string;
  client_id: string;
  account_type: 'savings' | 'checking' | 'loan' | 'sweep';
  account_number: string; // Unique per account
  routing_number: string; // FI routing number
  account_name: string;
  balance: number;
  available_balance: number;
  status: 'active' | 'suspended' | 'closed';
  fdic_insured: boolean;
  created_at: string;
  updated_at: string;
}

export interface FITransaction {
  transaction_id: string;
  account_id: string;
  transaction_type: 'debit' | 'credit' | 'transfer' | 'reversal';
  amount: number;
  balance_after: number;
  description: string;
  reference_number: string; // ACH, check number, loan ID, etc.
  status: 'pending' | 'posted' | 'reversed' | 'failed';
  created_at: string;
  posted_at?: string;
}

export interface AdvanceOrigination {
  advance_id: string;
  client_id: string;
  return_id: number;
  requested_amount: number;
  approved_amount: number;
  fee: number;
  net_deposit: number;
  status: 'pending' | 'approved' | 'funded' | 'repaid' | 'defaulted';
  refund_offset_amount?: number; // Amount offset from actual refund
  created_at: string;
  funded_at?: string;
  repaid_at?: string;
}

export interface LoanOrigination {
  loan_id: string;
  client_id: string;
  requested_amount: number;
  approved_amount: number;
  apr: number;
  term_days: number;
  fee: number;
  total_payback: number;
  monthly_payment?: number;
  status: 'pending' | 'approved' | 'funded' | 'active' | 'repaid' | 'defaulted';
  co_borrower_id?: string;
  created_at: string;
  funded_at?: string;
  due_date?: string;
  repaid_at?: string;
}

// ============================================================================
// FINANCIAL INSTITUTION CONFIGURATION
// ============================================================================

export const FI_CONFIG = {
  institution_name: 'Ross Financial Services LLC',
  institution_dba: 'Ross Tax Prep Financial',
  routing_number: '021202337', // Example routing (requires registration)
  ein: '33-4891499', // Same as parent company
  nml_id: 'TBD', // Nationwide Mortgage Licensing System ID
  nmls_branch_id: 'TBD',
  primary_state: 'TX',
  secondary_states: ['CA', 'NY', 'FL'],
  fdic_cert_number: 'TBD',
  federal_reserve_member: false, // Initially non-member
  
  // Compliance & Regulatory
  compliance_officer: 'Condre Ross',
  compliance_email: 'compliance@rosstaxprepandbookkeeping.com',
  aml_officer: 'Compliance Team',
  
  // Operational Limits
  max_account_balance: 250000, // FDIC insurance limit per account type
  max_advance_amount: 35000,
  max_loan_amount: 50000,
  max_daily_transactions: 100,
  max_daily_volume: 500000 // $500K per day
};

// ============================================================================
// ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Create FI savings/checking account for client
 */
export async function createFIAccount(
  env: any,
  data: {
    client_id: string;
    account_type: 'savings' | 'checking';
    account_name: string;
  }
): Promise<FIAccount> {
  const accountId = uuid();
  const accountNumber = generateAccountNumber();
  const now = new Date().toISOString();
  
  const account: FIAccount = {
    account_id: accountId,
    client_id: data.client_id,
    account_type: data.account_type,
    account_number: accountNumber,
    routing_number: FI_CONFIG.routing_number,
    account_name: data.account_name,
    balance: 0,
    available_balance: 0,
    status: 'active',
    fdic_insured: true,
    created_at: now,
    updated_at: now
  };
  
  // Store account
  await env.DB.prepare(`
    INSERT INTO fi_accounts (
      account_id, client_id, account_type, account_number, routing_number,
      account_name, balance, available_balance, status, fdic_insured,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    account.account_id, account.client_id, account.account_type, account.account_number,
    account.routing_number, account.account_name, account.balance, account.available_balance,
    account.status, account.fdic_insured, account.created_at, account.updated_at
  ).run();
  
  // Log audit
  await logAudit(env, {
    action: 'fi_account_created',
    resource_type: 'fi_account',
    resource_id: accountId,
    user_id: data.client_id,
    details: { account_type: data.account_type }
  });
  
  return account;
}

/**
 * Get FI account details
 */
export async function getFIAccount(env: any, accountId: string): Promise<FIAccount> {
  const account = await env.DB.prepare(
    'SELECT * FROM fi_accounts WHERE account_id = ?'
  ).bind(accountId).first();
  
  if (!account) {
    throw new Error('FI account not found');
  }
  
  return account as FIAccount;
}

/**
 * Get all FI accounts for client
 */
export async function listFIAccounts(
  env: any,
  clientId: string
): Promise<FIAccount[]> {
  const accounts = await env.DB.prepare(
    'SELECT * FROM fi_accounts WHERE client_id = ? AND status = "active" ORDER BY created_at DESC'
  ).bind(clientId).all();
  
  return accounts.results as FIAccount[];
}

// ============================================================================
// TRANSACTION PROCESSING
// ============================================================================

/**
 * Create transaction (deposit, withdrawal, transfer)
 */
export async function createFITransaction(
  env: any,
  data: {
    account_id: string;
    transaction_type: 'debit' | 'credit' | 'transfer';
    amount: number;
    description: string;
    reference_number?: string;
  }
): Promise<FITransaction> {
  const transactionId = uuid();
  const now = new Date().toISOString();
  
  // Get account
  const account = await getFIAccount(env, data.account_id);
  
  // Validate transaction
  if (data.transaction_type === 'debit' && data.amount > account.available_balance) {
    throw new Error('Insufficient funds');
  }
  
  // Calculate new balance
  const newBalance = data.transaction_type === 'debit' 
    ? account.balance - data.amount 
    : account.balance + data.amount;
  
  // Create transaction record
  const transaction: FITransaction = {
    transaction_id: transactionId,
    account_id: data.account_id,
    transaction_type: data.transaction_type,
    amount: data.amount,
    balance_after: newBalance,
    description: data.description,
    reference_number: data.reference_number || '',
    status: 'pending',
    created_at: now
  };
  
  // Store transaction
  await env.DB.prepare(`
    INSERT INTO fi_transactions (
      transaction_id, account_id, transaction_type, amount, balance_after,
      description, reference_number, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    transaction.transaction_id, transaction.account_id, transaction.transaction_type,
    transaction.amount, transaction.balance_after, transaction.description,
    transaction.reference_number, transaction.status, transaction.created_at
  ).run();
  
  // Post transaction (ACH delay simulation)
  setTimeout(async () => {
    await postFITransaction(env, transactionId, newBalance);
  }, 3000); // 3-second delay to simulate processing
  
  return transaction;
}

/**
 * Post transaction to account (final settlement)
 */
async function postFITransaction(
  env: any,
  transactionId: string,
  newBalance: number
): Promise<void> {
  const now = new Date().toISOString();
  const transaction = await env.DB.prepare(
    'SELECT * FROM fi_transactions WHERE transaction_id = ?'
  ).bind(transactionId).first() as any;
  
  // Update transaction status
  await env.DB.prepare(`
    UPDATE fi_transactions
    SET status = 'posted', posted_at = ?
    WHERE transaction_id = ?
  `).bind(now, transactionId).run();
  
  // Update account balance
  await env.DB.prepare(`
    UPDATE fi_accounts
    SET balance = ?, updated_at = ?
    WHERE account_id = ?
  `).bind(newBalance, now, transaction.account_id).run();
}

/**
 * Get transaction history
 */
export async function getFITransactionHistory(
  env: any,
  accountId: string,
  limit: number = 50
): Promise<FITransaction[]> {
  const transactions = await env.DB.prepare(`
    SELECT * FROM fi_transactions
    WHERE account_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(accountId, limit).all();
  
  return transactions.results as FITransaction[];
}

// ============================================================================
// REFUND TRANSFER (RT) PROCESSING
// ============================================================================

/**
 * Process refund transfer through FI
 */
export async function processRTTransaction(
  env: any,
  data: {
    client_id: string;
    return_id: number;
    refund_amount: number;
    fee: number;
  }
): Promise<{ account_id: string; transaction_id: string; net_amount: number }> {
  // Get or create client's savings account
  let accounts = await listFIAccounts(env, data.client_id);
  let savingsAccount = accounts.find(a => a.account_type === 'savings');
  
  if (!savingsAccount) {
    savingsAccount = await createFIAccount(env, {
      client_id: data.client_id,
      account_type: 'savings',
      account_name: 'Refund Savings Account'
    });
  }
  
  // Calculate net amount (refund - fee)
  const netAmount = data.refund_amount - data.fee;
  
  // Create deposit transaction
  const transaction = await createFITransaction(env, {
    account_id: savingsAccount.account_id,
    transaction_type: 'credit',
    amount: netAmount,
    description: `Refund Transfer - Tax Year Return #${data.return_id}`,
    reference_number: `RT-${data.return_id}`
  });
  
  // Log audit
  await logAudit(env, {
    action: 'refund_transfer_processed',
    resource_type: 'fi_transaction',
    resource_id: transaction.transaction_id,
    user_id: data.client_id,
    details: {
      return_id: data.return_id,
      refund_amount: data.refund_amount,
      fee: data.fee,
      net_amount: netAmount
    }
  });
  
  return {
    account_id: savingsAccount.account_id,
    transaction_id: transaction.transaction_id,
    net_amount: netAmount
  };
}

// ============================================================================
// REFUND ADVANCE (RA) ORIGINATION
// ============================================================================

/**
 * Originate refund advance
 */
export async function originateRefundAdvance(
  env: any,
  data: {
    client_id: string;
    return_id: number;
    requested_amount: number;
    estimated_refund: number;
  }
): Promise<AdvanceOrigination> {
  const advanceId = uuid();
  const now = new Date().toISOString();
  
  // Underwriting logic
  const maxAdvance = Math.min(data.estimated_refund * 0.90, 35000);
  const approvedAmount = Math.min(data.requested_amount, maxAdvance);
  const fee = 49.95;
  const netDeposit = approvedAmount - fee;
  
  const advance: AdvanceOrigination = {
    advance_id: advanceId,
    client_id: data.client_id,
    return_id: data.return_id,
    requested_amount: data.requested_amount,
    approved_amount: approvedAmount,
    fee: fee,
    net_deposit: netDeposit,
    status: 'approved',
    created_at: now
  };
  
  // Store advance origination
  await env.DB.prepare(`
    INSERT INTO advance_originations (
      advance_id, client_id, return_id, requested_amount, approved_amount,
      fee, net_deposit, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    advance.advance_id, advance.client_id, advance.return_id,
    advance.requested_amount, advance.approved_amount, advance.fee,
    advance.net_deposit, advance.status, advance.created_at
  ).run();
  
  // Log audit
  await logAudit(env, {
    action: 'refund_advance_originated',
    resource_type: 'advance_origination',
    resource_id: advanceId,
    user_id: data.client_id,
    details: {
      requested: data.requested_amount,
      approved: approvedAmount,
      fee: fee
    }
  });
  
  return advance;
}

/**
 * Fund refund advance (deposit to client account)
 */
export async function fundRefundAdvance(
  env: any,
  advanceId: string
): Promise<void> {
  const advance = await env.DB.prepare(
    'SELECT * FROM advance_originations WHERE advance_id = ?'
  ).bind(advanceId).first() as any;
  
  if (!advance || advance.status !== 'approved') {
    throw new Error('Advance not eligible for funding');
  }
  
  // Get or create client's savings account
  let accounts = await listFIAccounts(env, advance.client_id);
  let savingsAccount = accounts.find(a => a.account_type === 'savings');
  
  if (!savingsAccount) {
    savingsAccount = await createFIAccount(env, {
      client_id: advance.client_id,
      account_type: 'savings',
      account_name: 'Refund Advance Account'
    });
  }
  
  // Create deposit transaction
  const transaction = await createFITransaction(env, {
    account_id: savingsAccount.account_id,
    transaction_type: 'credit',
    amount: advance.net_deposit,
    description: `Refund Advance - Return #${advance.return_id}`,
    reference_number: `RA-${advanceId.substring(0, 8)}`
  });
  
  // Update advance status
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE advance_originations
    SET status = 'funded', funded_at = ?
    WHERE advance_id = ?
  `).bind(now, advanceId).run();
  
  // Log audit
  await logAudit(env, {
    action: 'refund_advance_funded',
    resource_type: 'advance_origination',
    resource_id: advanceId,
    user_id: advance.client_id,
    details: {
      amount: advance.net_deposit,
      transaction_id: transaction.transaction_id
    }
  });
}

// ============================================================================
// LOAN ORIGINATION
// ============================================================================

/**
 * Originate short-term loan
 */
export async function originateLoan(
  env: any,
  data: {
    client_id: string;
    requested_amount: number;
    term_days?: number;
  }
): Promise<LoanOrigination> {
  const loanId = uuid();
  const now = new Date().toISOString();
  const termDays = data.term_days || 30;
  
  // Simple underwriting (could expand with credit score, etc.)
  const maxLoan = 50000;
  const approvedAmount = Math.min(data.requested_amount, maxLoan);
  
  // Calculate APR (3.5% - 7.5% based on creditworthiness)
  const apr = 5.5; // Default 5.5% APR
  
  // Calculate fee and total payback
  const fee = approvedAmount * (apr / 100) * (termDays / 365);
  const totalPayback = approvedAmount + fee;
  const monthlyPayment = termDays <= 30 ? totalPayback : (totalPayback / (termDays / 30));
  
  const loan: LoanOrigination = {
    loan_id: loanId,
    client_id: data.client_id,
    requested_amount: data.requested_amount,
    approved_amount: approvedAmount,
    apr: apr,
    term_days: termDays,
    fee: fee,
    total_payback: totalPayback,
    monthly_payment: monthlyPayment,
    status: 'approved',
    created_at: now,
    due_date: new Date(Date.now() + termDays * 24 * 60 * 60 * 1000).toISOString()
  };
  
  // Store loan origination
  await env.DB.prepare(`
    INSERT INTO loan_originations (
      loan_id, client_id, requested_amount, approved_amount, apr, term_days,
      fee, total_payback, monthly_payment, status, created_at, due_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    loan.loan_id, loan.client_id, loan.requested_amount, loan.approved_amount,
    loan.apr, loan.term_days, loan.fee, loan.total_payback, loan.monthly_payment,
    loan.status, loan.created_at, loan.due_date
  ).run();
  
  // Log audit
  await logAudit(env, {
    action: 'loan_originated',
    resource_type: 'loan_origination',
    resource_id: loanId,
    user_id: data.client_id,
    details: {
      amount: approvedAmount,
      apr: apr,
      term_days: termDays,
      total_payback: totalPayback
    }
  });
  
  return loan;
}

/**
 * Fund loan (deposit to client account)
 */
export async function fundLoan(env: any, loanId: string): Promise<void> {
  const loan = await env.DB.prepare(
    'SELECT * FROM loan_originations WHERE loan_id = ?'
  ).bind(loanId).first() as any;
  
  if (!loan || loan.status !== 'approved') {
    throw new Error('Loan not eligible for funding');
  }
  
  // Get or create client's checking account
  let accounts = await listFIAccounts(env, loan.client_id);
  let checkingAccount = accounts.find(a => a.account_type === 'checking');
  
  if (!checkingAccount) {
    checkingAccount = await createFIAccount(env, {
      client_id: loan.client_id,
      account_type: 'checking',
      account_name: 'Loan Disbursement Account'
    });
  }
  
  // Create deposit transaction
  const transaction = await createFITransaction(env, {
    account_id: checkingAccount.account_id,
    transaction_type: 'credit',
    amount: loan.approved_amount,
    description: `Instant Loan - ${loan.term_days} days`,
    reference_number: `LN-${loanId.substring(0, 8)}`
  });
  
  // Update loan status
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE loan_originations
    SET status = 'active', funded_at = ?
    WHERE loan_id = ?
  `).bind(now, loanId).run();
  
  // Log audit
  await logAudit(env, {
    action: 'loan_funded',
    resource_type: 'loan_origination',
    resource_id: loanId,
    user_id: loan.client_id,
    details: {
      amount: loan.approved_amount,
      transaction_id: transaction.transaction_id
    }
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique account number
 */
function generateAccountNumber(): string {
  // 10-digit account number
  return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
}

/**
 * Calculate FDIC insurance coverage
 */
export function calculateFDICCoverage(
  accounts: FIAccount[]
): { total_insured: number; total_uninsured: number } {
  let totalInsured = 0;
  let totalUninsured = 0;
  
  // FDIC insures up to $250K per depositor per account type per institution
  const coverageByType = {
    'savings': 0,
    'checking': 0,
    'loan': 0,
    'sweep': 0
  };
  
  for (const account of accounts) {
    if (account.fdic_insured) {
      const insuredAmount = Math.min(account.balance, 250000);
      const uninsuredAmount = Math.max(0, account.balance - 250000);
      
      coverageByType[account.account_type] += insuredAmount;
      totalInsured += insuredAmount;
      totalUninsured += uninsuredAmount;
    } else {
      totalUninsured += account.balance;
    }
  }
  
  return { total_insured: totalInsured, total_uninsured: totalUninsured };
}
