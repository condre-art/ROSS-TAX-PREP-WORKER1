/**
 * Ross Tax Prep & Bookkeeping LLC - Production Configuration
 * 
 * Legal Entity: Ross Tax Prep & Bookkeeping LLC
 * State: Arkansas
 * EIN: 33-4891499
 * EFIN: 748335
 * 
 * IRS MeF Production Configuration
 */

export const COMPANY_CONFIG = {
  legal_name: 'Ross Tax Prep & Bookkeeping LLC',
  dba: 'Ross Tax Academy',
  state: 'AR',
  state_full: 'Arkansas',
  
  // Federal IDs
  ein: '33-4891499',
  efin: '748335',
  
  // Contact Information
  address: {
    street: '', // TODO: Add physical address
    city: '',
    state: 'AR',
    zip: ''
  },
  
  phone: '', // TODO: Add business phone
  email: 'info@rosstaxprepandbookkeeping.com',
  website: 'https://www.rosstaxprepandbookkeeping.com',
  
  // E-file Configuration
  efile: {
    provider: 'direct', // Direct IRS MeF integration
    efin: '748335',
    environment: process.env.ENVIRONMENT || 'ATS', // 'ATS' for testing, 'Production' for live
    
    // Software Developer Information (for IRS MeF)
    software_id: 'ROSS-TAX-2025', // TODO: Register with IRS
    software_version: '1.0.0',
    
    // Bank Product Originator ID (if offering refund advances)
    bank_originator_id: '', // TODO: Obtain from banking partner
  },
  
  // Banking & Payment Configuration
  banking: {
    enabled: true,
    
    // Supported Bank Products
    products: [
      {
        id: 'direct_deposit',
        name: 'Direct Deposit',
        description: 'Standard IRS refund direct deposit',
        fee: 0,
        processing_days: 21
      },
      {
        id: 'refund_transfer',
        name: 'Refund Transfer (RT)',
        description: 'Bank deducts fees from refund',
        fee: 39.95,
        processing_days: 7
      },
      {
        id: 'refund_advance',
        name: 'Refund Advance',
        description: 'Instant advance up to $3,500',
        fee: 49.95,
        advance_amounts: [500, 1000, 1500, 2000, 2500, 3000, 3500],
        processing_days: 1,
        apr: 0, // 0% APR promotional
        requires_approval: true
      },
      {
        id: 'check',
        name: 'Paper Check',
        description: 'IRS mails paper check',
        fee: 0,
        processing_days: 28
      }
    ],
    
    // Payment Gateways
    stripe: {
      enabled: true,
      public_key: process.env.STRIPE_PUBLIC_KEY || '',
      secret_key: process.env.STRIPE_SECRET_KEY || '',
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || ''
    },
    
    square: {
      enabled: true,
      application_id: process.env.SQUARE_APPLICATION_ID || '',
      access_token: process.env.SQUARE_ACCESS_TOKEN || '',
      location_id: process.env.SQUARE_LOCATION_ID || ''
    },
    
    // Banking Partner (for RT/RA products)
    partner: {
      name: '', // TODO: Add banking partner name (e.g., Republic Bank, MetaBank)
      bank_id: '',
      routing_number: '',
      api_endpoint: '',
      api_key: process.env.BANK_PARTNER_API_KEY || ''
    }
  },
  
  // Fee Schedule
  fees: {
    tax_preparation: {
      form_1040_ez: 89,
      form_1040: 149,
      form_1040_itemized: 249,
      form_1040x_amended: 299,
      form_1120: 499,
      form_1120s: 599,
      form_1065: 599,
      state_return: 49
    },
    
    bank_products: {
      refund_transfer: 39.95,
      refund_advance: 49.95,
      audit_defense: 29.95
    },
    
    bookkeeping: {
      monthly_basic: 99,
      monthly_standard: 199,
      monthly_premium: 399
    }
  },
  
  // Compliance & Security
  compliance: {
    ptin_required: true, // All preparers must have PTIN
    efin_required: true, // ERO must have EFIN
    ero_bond: true, // ERO bond requirement
    e_and_o_insurance: true, // E&O insurance required
    
    data_retention_years: 7, // IRS requires 7 years
    encryption_standard: 'AES-256',
    mfa_required: true
  },
  
  // Notification Settings
  notifications: {
    enabled: true,
    channels: ['email', 'sms', 'push'],
    
    // Admin notifications (real-time)
    admin_alerts: [
      'new_return_filed',
      'irs_acknowledgment',
      'payment_received',
      'refund_advance_approved',
      'bank_product_selected',
      'client_registered',
      'error_critical'
    ],
    
    // Client notifications
    client_alerts: [
      'return_accepted',
      'return_rejected',
      'refund_approved',
      'refund_disbursed',
      'payment_due',
      'document_needed',
      'signature_required'
    ]
  }
};

/**
 * Get EFIN for environment
 */
export function getEFIN(): string {
  return COMPANY_CONFIG.efin;
}

/**
 * Get EIN
 */
export function getEIN(): string {
  return COMPANY_CONFIG.ein;
}

/**
 * Check if bank products are enabled
 */
export function areBankProductsEnabled(): boolean {
  return COMPANY_CONFIG.banking.enabled;
}

/**
 * Get available bank products
 */
export function getBankProducts() {
  return COMPANY_CONFIG.banking.products;
}

/**
 * Get bank product by ID
 */
export function getBankProductById(productId: string) {
  return COMPANY_CONFIG.banking.products.find(p => p.id === productId);
}

/**
 * Calculate total fees for return
 */
export function calculateReturnFees(options: {
  formType: string;
  hasStateReturn: boolean;
  bankProductId?: string;
  includeAuditDefense?: boolean;
}): number {
  let total = 0;
  
  // Base tax prep fee
  const formFee = (COMPANY_CONFIG.fees.tax_preparation as any)[formType] || 149;
  total += formFee;
  
  // State return
  if (options.hasStateReturn) {
    total += COMPANY_CONFIG.fees.tax_preparation.state_return;
  }
  
  // Bank product fee
  if (options.bankProductId) {
    const product = getBankProductById(options.bankProductId);
    if (product) {
      total += product.fee;
    }
  }
  
  // Audit defense
  if (options.includeAuditDefense) {
    total += COMPANY_CONFIG.fees.bank_products.audit_defense;
  }
  
  return total;
}
