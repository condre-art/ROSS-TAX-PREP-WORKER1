/**
 * Pricing Configuration for RTB Tax Services
 * Base pricing structure with add-on fees and compliance
 */

export const PRICING = {
  // Base Service Pricing
  BASE_RETURN: {
    FORM_1040: 999.99,
    FORM_1041: 1199.99,
    FORM_1040_X: 1299.99,
    FORM_1040_SR: 1099.99,
    FORM_1120: 1499.99,
    FORM_1120_S: 1599.99,
    FORM_1065: 1699.99,
  },

  // Additional Forms (per form)
  ADDITIONAL_FORM_FEE: 76.00,

  // Add-on Fees
  ADDONS: {
    SCHEDULE_C: 150.00,           // Self-employment income
    SCHEDULE_D: 125.00,           // Capital gains/losses
    SCHEDULE_E: 100.00,           // Rental income
    ITEMIZED_DEDUCTIONS: 75.00,   // Instead of standard
    BUSINESS_EXPENSES: 200.00,    // Business related
    FOREIGN_INCOME: 300.00,       // FATCA/FBAR
    CRYPTO_TRANSACTIONS: 250.00,  // Cryptocurrency
    ESTATE_TRUST_COMPLEX: 400.00, // Complex trust issues
  },

  // Bank Product & ERO Fees
  BANK_PRODUCTS: {
    MAX_TOTAL: 325.00,
    RAPID_REFUND: 89.99,
    REFUND_ADVANCE: 149.99,
    SAVINGS_ACCOUNT_OPENING: 0.00, // Free
    PREPAID_CARD: 39.99,
  },

  // Mandatory Service Fees
  TRANSMISSION_FEE: 359.99,        // IRS MeF e-file transmission
  ADMIN_FEE: 150.00,               // Account administration
  RETENTION_FEE: 125.00,           // File retention (7 years)

  // Tax Calculations
  SALES_TAX_RATE: 0.089,           // 8.9% Texas state sales tax

  // Payment Processing Fees (estimated)
  PAYMENT_PROCESSOR_FEES: {
    ACH: 0.00,                     // Free
    EFT: 0.00,                     // Free
    CREDIT_CARD: 0.029 + 0.30,     // 2.9% + $0.30
    DEBIT_CARD: 0.019 + 0.25,      // 1.9% + $0.25
    STRIPE: 0.029 + 0.30,          // 2.9% + $0.30
    CASH_APP: 0.025,               // 2.5%
    ZELLE: 0.00,                   // Free
  },
};

/**
 * Calculate invoice total with all fees
 */
export function calculateInvoiceTotal(options) {
  const {
    baseForm = "1040",
    dependents = 1,
    w2Count = 1,
    additionalForms = [],
    bankProducts = [],
    applyRetentionFee = true,
    includeTransmissionFee = true,
    includeAdminFee = true,
    salesTaxRate = PRICING.SALES_TAX_RATE,
  } = options;

  // 1. Base form price
  let subtotal = PRICING.BASE_RETURN[baseForm] || PRICING.BASE_RETURN.FORM_1040;

  // 2. Additional W-2s (beyond first)
  if (w2Count > 1) {
    subtotal += (w2Count - 1) * PRICING.ADDITIONAL_FORM_FEE;
  }

  // 3. Additional dependents (typically handled in base price, but can add complexity fee)
  if (dependents > 1) {
    subtotal += (dependents - 1) * 25.00; // $25 per additional dependent
  }

  // 4. Additional forms
  for (const form of additionalForms) {
    subtotal += PRICING.ADDONS[form] || 0;
  }

  // 5. Bank product fees (capped at max)
  let bankProductTotal = 0;
  for (const product of bankProducts) {
    bankProductTotal += PRICING.BANK_PRODUCTS[product] || 0;
  }
  bankProductTotal = Math.min(bankProductTotal, PRICING.BANK_PRODUCTS.MAX_TOTAL);
  subtotal += bankProductTotal;

  // 6. Transmission fee (IRS e-file)
  if (includeTransmissionFee) {
    subtotal += PRICING.TRANSMISSION_FEE;
  }

  // 7. Admin fee
  if (includeAdminFee) {
    subtotal += PRICING.ADMIN_FEE;
  }

  // 8. Retention fee
  if (applyRetentionFee) {
    subtotal += PRICING.RETENTION_FEE;
  }

  // 9. Calculate sales tax (8.9%)
  const salesTax = subtotal * salesTaxRate;

  // 10. Total
  const total = subtotal + salesTax;

  return {
    basePrice: PRICING.BASE_RETURN[baseForm] || PRICING.BASE_RETURN.FORM_1040,
    additionalForms: (w2Count - 1) * PRICING.ADDITIONAL_FORM_FEE,
    additionalDependents: (dependents - 1) * 25.00,
    addOns: additionalForms.reduce((sum, form) => sum + (PRICING.ADDONS[form] || 0), 0),
    bankProducts: bankProductTotal,
    transmissionFee: includeTransmissionFee ? PRICING.TRANSMISSION_FEE : 0,
    adminFee: includeAdminFee ? PRICING.ADMIN_FEE : 0,
    retentionFee: applyRetentionFee ? PRICING.RETENTION_FEE : 0,
    subtotal,
    salesTax: parseFloat(salesTax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

/**
 * Get pricing breakdown for display
 */
export function getPricingBreakdown(invoiceTotal) {
  return {
    baseService: invoiceTotal.basePrice,
    additionalForms: invoiceTotal.additionalForms,
    additionalDependents: invoiceTotal.additionalDependents,
    addOns: invoiceTotal.addOns,
    bankProducts: invoiceTotal.bankProducts,
    transmissionFee: invoiceTotal.transmissionFee,
    adminFee: invoiceTotal.adminFee,
    retentionFee: invoiceTotal.retentionFee,
    subtotal: invoiceTotal.subtotal,
    salesTax: invoiceTotal.salesTax,
    total: invoiceTotal.total,
  };
}
