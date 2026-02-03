/**
 * Santa Barbara TPG (Tax Products Group) Bank Products API Integration
 * 
 * Comprehensive integration for refund-related financial products:
 * - Refund Transfer (RT)
 * - Refund Anticipation Loan (RAL)
 * - EITC Advance
 * - Electronic Refund Check (ERC)
 * - Direct Deposit routing
 * 
 * API Documentation: https://docs.sbtpg.com/api
 * Support: support@sbtpg.com
 */

import { v4 as uuid } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SBTPGConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  timeout: number;
}

export interface SBTPGTransaction {
  id: string;
  client_id: number;
  return_id: number;
  product_type: 'RT' | 'RAL' | 'EITC_Advance' | 'ERC' | 'Direct_Deposit';
  product_id: string;
  refund_amount: number;
  fee_amount: number;
  net_amount: number;
  status: 'pending' | 'approved' | 'funded' | 'rejected' | 'completed' | 'cancelled';
  sbtpg_transaction_id?: string;
  approval_code?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface RefundTransferRequest {
  client_id: number;
  return_id: number;
  taxpayer_ssn: string;
  taxpayer_name: string;
  refund_amount: number;
  routing_number?: string; // Optional for RT, required for Direct Deposit
  account_number?: string; // Optional for RT, required for Direct Deposit
  account_type?: 'checking' | 'savings';
  product_id: string; // e.g., "RT-2025"
}

export interface RefundAdvanceRequest {
  client_id: number;
  return_id: number;
  taxpayer_ssn: string;
  taxpayer_name: string;
  estimated_refund: number;
  requested_advance: number;
  eitc_amount?: number;
  credit_check_consent: boolean;
  product_id: string; // e.g., "RAL-2025"
}

export interface SBTPGApiResponse {
  success: boolean;
  transaction_id?: string;
  approval_code?: string;
  status?: string;
  message?: string;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

export interface ProductEligibility {
  eligible: boolean;
  product_id: string;
  product_name: string;
  estimated_fee: number;
  net_amount: number;
  reasons?: string[];
}

// ============================================================================
// SBTPG CLIENT
// ============================================================================

export class SantaBarbaraTPGClient {
  private config: SBTPGConfig;
  private env: any;

  constructor(env: any) {
    this.env = env;
    this.config = {
      apiKey: env.SBTPG_API_KEY || 'test_key',
      environment: env.SBTPG_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      baseUrl: env.SBTPG_ENVIRONMENT === 'production' 
        ? 'https://api.sbtpg.com/v2' 
        : 'https://sandbox.sbtpg.com/v2',
      timeout: 30000
    };
  }

  /**
   * Create Refund Transfer (RT) transaction
   */
  async createRefundTransfer(request: RefundTransferRequest): Promise<SBTPGTransaction> {
    console.log('[SBTPG] Creating Refund Transfer:', request.product_id);

    // Calculate fees
    const fees = this.calculateFees(request.product_id, request.refund_amount);
    
    // Validate minimum refund
    if (request.refund_amount < fees.requirements.min_refund_amount) {
      throw new Error(`Refund amount must be at least $${fees.requirements.min_refund_amount}`);
    }

    const transaction: SBTPGTransaction = {
      id: uuid(),
      client_id: request.client_id,
      return_id: request.return_id,
      product_type: 'RT',
      product_id: request.product_id,
      refund_amount: request.refund_amount,
      fee_amount: fees.total_fee,
      net_amount: request.refund_amount - fees.total_fee,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Test mode - simulate API call
    if (!this.config.apiKey || this.config.apiKey === 'test_key') {
      console.log('[SBTPG] Test mode - simulating RT approval');
      transaction.status = 'approved';
      transaction.approval_code = `RT-${Date.now()}`;
      transaction.sbtpg_transaction_id = `SBTPG-${uuid().slice(0, 8)}`;
      
      await this.storeTransaction(transaction);
      return transaction;
    }

    // Production mode - actual API call
    try {
      const response = await this.callAPI('/refund-transfer', 'POST', {
        taxpayer_ssn: request.taxpayer_ssn,
        taxpayer_name: request.taxpayer_name,
        refund_amount: request.refund_amount,
        product_id: request.product_id,
        routing_number: request.routing_number,
        account_number: request.account_number,
        account_type: request.account_type || 'checking'
      });

      if (response.success) {
        transaction.status = 'approved';
        transaction.sbtpg_transaction_id = response.transaction_id;
        transaction.approval_code = response.approval_code;
      } else {
        transaction.status = 'rejected';
        transaction.error_message = response.message || 'Transaction rejected';
      }

      await this.storeTransaction(transaction);
      return transaction;

    } catch (error: any) {
      console.error('[SBTPG] RT creation failed:', error);
      transaction.status = 'rejected';
      transaction.error_message = error.message;
      await this.storeTransaction(transaction);
      throw error;
    }
  }

  /**
   * Create Refund Anticipation Loan (RAL)
   */
  async createRefundAdvance(request: RefundAdvanceRequest): Promise<SBTPGTransaction> {
    console.log('[SBTPG] Creating Refund Advance Loan:', request.product_id);

    // Validate consent
    if (!request.credit_check_consent) {
      throw new Error('Credit check consent is required for RAL products');
    }

    // Calculate fees
    const fees = this.calculateFees(request.product_id, request.requested_advance);

    // Validate limits
    if (request.requested_advance < fees.requirements.min_refund_amount) {
      throw new Error(`Advance amount must be at least $${fees.requirements.min_refund_amount}`);
    }
    if (fees.requirements.max_refund_amount && request.requested_advance > fees.requirements.max_refund_amount) {
      throw new Error(`Advance amount cannot exceed $${fees.requirements.max_refund_amount}`);
    }

    const transaction: SBTPGTransaction = {
      id: uuid(),
      client_id: request.client_id,
      return_id: request.return_id,
      product_type: 'RAL',
      product_id: request.product_id,
      refund_amount: request.requested_advance,
      fee_amount: fees.total_fee,
      net_amount: request.requested_advance - fees.total_fee,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Test mode
    if (!this.config.apiKey || this.config.apiKey === 'test_key') {
      console.log('[SBTPG] Test mode - simulating RAL approval');
      transaction.status = 'approved';
      transaction.approval_code = `RAL-${Date.now()}`;
      transaction.sbtpg_transaction_id = `SBTPG-${uuid().slice(0, 8)}`;
      
      await this.storeTransaction(transaction);
      return transaction;
    }

    // Production mode
    try {
      const response = await this.callAPI('/refund-advance', 'POST', {
        taxpayer_ssn: request.taxpayer_ssn,
        taxpayer_name: request.taxpayer_name,
        estimated_refund: request.estimated_refund,
        requested_advance: request.requested_advance,
        eitc_amount: request.eitc_amount,
        product_id: request.product_id,
        credit_check_consent: true
      });

      if (response.success) {
        transaction.status = 'approved';
        transaction.sbtpg_transaction_id = response.transaction_id;
        transaction.approval_code = response.approval_code;
      } else {
        transaction.status = 'rejected';
        transaction.error_message = response.message || 'Loan application rejected';
      }

      await this.storeTransaction(transaction);
      return transaction;

    } catch (error: any) {
      console.error('[SBTPG] RAL creation failed:', error);
      transaction.status = 'rejected';
      transaction.error_message = error.message;
      await this.storeTransaction(transaction);
      throw error;
    }
  }

  /**
   * Check transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<SBTPGTransaction | null> {
    const row = await this.env.DB.prepare(
      'SELECT * FROM bank_product_transactions WHERE id = ? OR sbtpg_transaction_id = ?'
    ).bind(transactionId, transactionId).first();

    if (!row) return null;

    // If still pending and has SBTPG ID, check with API
    if (row.status === 'pending' && row.sbtpg_transaction_id && this.config.apiKey !== 'test_key') {
      try {
        const response = await this.callAPI(`/transactions/${row.sbtpg_transaction_id}`, 'GET');
        if (response.status) {
          row.status = response.status;
          row.updated_at = new Date().toISOString();
          await this.updateTransaction(row);
        }
      } catch (error) {
        console.error('[SBTPG] Status check failed:', error);
      }
    }

    return row as SBTPGTransaction;
  }

  /**
   * Check product eligibility
   */
  async checkEligibility(
    refundAmount: number,
    eitcAmount: number = 0,
    productType: 'RT' | 'RAL' | 'EITC_Advance'
  ): Promise<ProductEligibility[]> {
    const eligibleProducts: ProductEligibility[] = [];

    // Check RT eligibility
    if (productType === 'RT' || productType === 'EITC_Advance') {
      const rtFees = this.calculateFees('RT-2025', refundAmount);
      if (refundAmount >= rtFees.requirements.min_refund_amount) {
        eligibleProducts.push({
          eligible: true,
          product_id: 'RT-2025',
          product_name: 'Refund Transfer',
          estimated_fee: rtFees.total_fee,
          net_amount: refundAmount - rtFees.total_fee
        });
      }
    }

    // Check RAL eligibility
    if (productType === 'RAL' && refundAmount >= 500) {
      const ralFees = this.calculateFees('RAL-2025', refundAmount);
      if (refundAmount >= ralFees.requirements.min_refund_amount) {
        eligibleProducts.push({
          eligible: true,
          product_id: 'RAL-2025',
          product_name: 'Refund Anticipation Loan',
          estimated_fee: ralFees.total_fee,
          net_amount: refundAmount - ralFees.total_fee,
          reasons: ['Credit check required']
        });
      }
    }

    // Check EITC Advance eligibility
    if (eitcAmount > 0 && eitcAmount >= 300) {
      const eitcFees = this.calculateFees('EITC-ADV-2025', eitcAmount);
      eligibleProducts.push({
        eligible: true,
        product_id: 'EITC-ADV-2025',
        product_name: 'EITC Advance',
        estimated_fee: eitcFees.total_fee,
        net_amount: eitcAmount - eitcFees.total_fee
      });
    }

    return eligibleProducts;
  }

  /**
   * Calculate fees for a product
   */
  private calculateFees(productId: string, amount: number): {
    total_fee: number;
    base_fee: number;
    percentage_fee: number;
    requirements: any;
  } {
    // Product fee schedules
    const products: Record<string, any> = {
      'RT-2025': {
        base_fee: 39.95,
        percentage_fee: 0,
        max_fee: 59.95,
        requirements: { min_refund_amount: 300 }
      },
      'RAL-2025': {
        base_fee: 0,
        percentage_fee: 10.5,
        max_fee: 500,
        requirements: { min_refund_amount: 500, max_refund_amount: 6000 }
      },
      'EITC-ADV-2025': {
        base_fee: 0,
        percentage_fee: 5.0,
        max_fee: 100,
        requirements: { min_refund_amount: 300, max_refund_amount: 2000 }
      },
      'DD-2025': {
        base_fee: 0,
        percentage_fee: 0,
        max_fee: 0,
        requirements: { min_refund_amount: 0 }
      }
    };

    const product = products[productId] || products['RT-2025'];
    
    let base = product.base_fee;
    let percentage = (amount * (product.percentage_fee / 100));
    let total = base + percentage;

    if (product.max_fee && total > product.max_fee) {
      total = product.max_fee;
    }

    return {
      total_fee: Math.round(total * 100) / 100,
      base_fee: base,
      percentage_fee: percentage,
      requirements: product.requirements
    };
  }

  /**
   * Make API call to SBTPG
   */
  private async callAPI(endpoint: string, method: string, body?: any): Promise<SBTPGApiResponse> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-API-Version': 'v2'
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || `HTTP ${response.status}`,
          errors: error.errors
        };
      }

      const data = await response.json();
      return {
        success: true,
        ...data
      };

    } catch (error: any) {
      console.error('[SBTPG] API call failed:', error);
      return {
        success: false,
        message: error.message || 'API call failed'
      };
    }
  }

  /**
   * Store transaction in database
   */
  private async storeTransaction(transaction: SBTPGTransaction): Promise<void> {
    if (!this.env.DB) {
      console.warn('[SBTPG] No database connection - skipping storage');
      return;
    }

    try {
      await this.env.DB.prepare(`
        INSERT INTO bank_product_transactions (
          id, client_id, return_id, product_type, product_id,
          refund_amount, fee_amount, net_amount, status,
          sbtpg_transaction_id, approval_code, error_message,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        transaction.id,
        transaction.client_id,
        transaction.return_id,
        transaction.product_type,
        transaction.product_id,
        transaction.refund_amount,
        transaction.fee_amount,
        transaction.net_amount,
        transaction.status,
        transaction.sbtpg_transaction_id || null,
        transaction.approval_code || null,
        transaction.error_message || null,
        transaction.created_at,
        transaction.updated_at
      ).run();
    } catch (error) {
      console.error('[SBTPG] Failed to store transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction in database
   */
  private async updateTransaction(transaction: SBTPGTransaction): Promise<void> {
    if (!this.env.DB) return;

    try {
      await this.env.DB.prepare(`
        UPDATE bank_product_transactions 
        SET status = ?, 
            sbtpg_transaction_id = ?,
            approval_code = ?,
            error_message = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(
        transaction.status,
        transaction.sbtpg_transaction_id || null,
        transaction.approval_code || null,
        transaction.error_message || null,
        transaction.updated_at,
        transaction.id
      ).run();
    } catch (error) {
      console.error('[SBTPG] Failed to update transaction:', error);
    }
  }

  /**
   * Get client info for debugging
   */
  getInfo(): Record<string, any> {
    return {
      provider: 'Santa Barbara TPG',
      environment: this.config.environment,
      baseUrl: this.config.baseUrl,
      hasApiKey: !!this.config.apiKey && this.config.apiKey !== 'test_key',
      version: 'v2'
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createSBTPGClient(env: any): SantaBarbaraTPGClient {
  return new SantaBarbaraTPGClient(env);
}
