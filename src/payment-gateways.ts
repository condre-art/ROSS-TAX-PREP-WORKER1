/**
 * Payment Gateway Integration Configuration
 * Stripe, Zelle, Cash App, Chime, ACH, Wire Transfer
 */

export const PAYMENT_GATEWAYS = {
  stripe: {
    name: "Stripe",
    type: "credit_card",
    enabled: true,
    config: {
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || "",
      secret_key: process.env.STRIPE_SECRET_KEY || "",
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || ""
    },
    fees: {
      online: 0.029, // 2.9%
      fixed: 0.30,    // $0.30
      international: 0.039 // 3.9%
    },
    methods: ["credit_card", "debit_card", "apple_pay", "google_pay"],
    description: "Credit and debit card payments"
  },

  zelle: {
    name: "Zelle",
    type: "bank_transfer",
    enabled: true,
    config: {
      bank_routing_number: process.env.ZELLE_ROUTING_NUMBER || "",
      bank_account_number: process.env.ZELLE_ACCOUNT_NUMBER || "",
      account_name: "Ross Tax Prep & Bookkeeping LLC"
    },
    fees: {
      incoming: 0,
      outgoing: 0
    },
    timeline: "1-3 business days",
    description: "Fast, secure bank-to-bank transfers via Zelle"
  },

  cashApp: {
    name: "Cash App",
    type: "digital_wallet",
    enabled: true,
    config: {
      cashtag: "$RossTaxPrep",
      account_id: process.env.CASHAPP_ACCOUNT_ID || ""
    },
    fees: {
      incoming: 0,
      outgoing: 0
    },
    timeline: "Instant to 1 business day",
    description: "Quick mobile payments via Cash App"
  },

  chime: {
    name: "Chime",
    type: "digital_wallet",
    enabled: true,
    config: {
      api_key: process.env.CHIME_API_KEY || "",
      merchant_id: process.env.CHIME_MERCHANT_ID || ""
    },
    fees: {
      incoming: 0,
      outgoing: 0
    },
    timeline: "Instant",
    description: "Instant payments via Chime card or account"
  },

  ach: {
    name: "ACH Transfer",
    type: "bank_transfer",
    enabled: true,
    config: {
      routing_number: process.env.ACH_ROUTING_NUMBER || "",
      account_number: process.env.ACH_ACCOUNT_NUMBER || "",
      account_type: "checking",
      company_name: "Ross Tax Prep & Bookkeeping LLC"
    },
    fees: {
      incoming: 0,
      outgoing: 0
    },
    timeline: "3-5 business days",
    limits: {
      min_amount: 0.01,
      max_amount: 25000
    },
    description: "Automated Clearing House bank transfers"
  },

  wire: {
    name: "Wire Transfer",
    type: "bank_transfer",
    enabled: true,
    config: {
      bank_name: process.env.WIRE_BANK_NAME || "",
      routing_number: process.env.WIRE_ROUTING_NUMBER || "",
      account_number: process.env.WIRE_ACCOUNT_NUMBER || "",
      swift_code: process.env.WIRE_SWIFT_CODE || ""
    },
    fees: {
      incoming: 0,
      outgoing: 15.00
    },
    timeline: "Same day (before cutoff)",
    limits: {
      min_amount: 100,
      max_amount: 1000000
    },
    description: "High-value wire transfers"
  }
};

export const REFUND_METHODS = {
  ach_direct_deposit: {
    name: "ACH Direct Deposit",
    type: "bank_account",
    enabled: true,
    timeline: "5-7 business days",
    description: "Direct deposit to any US bank account",
    requirements: ["routing_number", "account_number", "account_type"],
    fees: 0
  },

  chime_card: {
    name: "Chime Card",
    type: "digital_wallet",
    enabled: true,
    timeline: "2-3 business days (typically fastest)",
    description: "Instant refund deposits to Chime checking account",
    requirements: ["chime_user_id"],
    fees: 0
  },

  zelle_transfer: {
    name: "Zelle Transfer",
    type: "bank_transfer",
    enabled: true,
    timeline: "3-5 business days",
    description: "Fast bank transfer via Zelle network",
    requirements: ["zelle_user_id", "phone_or_email"],
    fees: 0
  },

  check_by_mail: {
    name: "Check by Mail",
    type: "check",
    enabled: true,
    timeline: "7-14 business days",
    description: "IRS mails refund check",
    requirements: ["mailing_address"],
    fees: 0
  }
};

export const PAYMENT_WORKFLOW = {
  // Client Payment for Services Workflow
  service_payment: {
    step1: "Client selects service (tax prep, e-file, amendment)",
    step2: "System calculates fee based on service type",
    step3: "Client chooses payment method (Stripe, Chime, Cash App, etc.)",
    step4: "Payment processed through selected gateway",
    step5: "Receipt and confirmation emailed to client",
    step6: "Payment recorded in database with audit trail",
    step7: "Service marked as 'paid' in workflow"
  },

  // Refund Tracking Workflow
  refund_tracking: {
    step1: "Return filed with IRS",
    step2: "System queries IRS for refund status",
    step3: "Client provides refund method preference",
    step4: "IRS accepts return and processes refund",
    step5: "System receives refund status update",
    step6: "Client notified of refund timeline",
    step7: "Refund deposited to client account",
    step8: "Confirmation sent to client"
  }
};

/**
 * Stripe Integration Setup
 */
export async function initializeStripe(env: any) {
  const stripe = require('stripe');
  return stripe(PAYMENT_GATEWAYS.stripe.config.secret_key);
}

/**
 * Create Stripe Payment Intent
 */
export async function createPaymentIntent(
  env: any,
  amount: number,
  currency: string = "usd",
  metadata?: Record<string, any>
) {
  const stripe = await initializeStripe(env);
  
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    payment_method_types: ["card"],
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Process Refund via Bank Account
 */
export async function processACHRefund(
  env: any,
  clientId: number,
  amount: number,
  routingNumber: string,
  accountNumber: string
) {
  const now = new Date().toISOString();
  
  // Create refund record
  const refund = {
    id: `REFUND-${clientId}-${Date.now()}`,
    client_id: clientId,
    amount,
    method: "ACH",
    routing_number: routingNumber,
    account_number: accountNumber,
    status: "pending",
    created_at: now
  };
  
  // In production, would call ACH processor
  // For now, mark as initiated
  
  return refund;
}

/**
 * Payment Gateway Error Handling
 */
export function handlePaymentError(error: any, gateway: string) {
  const errorMap: Record<string, string> = {
    stripe_card_declined: "Card was declined. Please use a different card.",
    stripe_insufficient_funds: "Insufficient funds. Please try another method.",
    stripe_lost_card: "Card reported as lost. Please contact your bank.",
    stripe_stolen_card: "Card reported as stolen. Please contact your bank.",
    stripe_expired_card: "Card has expired. Please use a different card.",
    zelle_invalid_account: "Invalid Zelle account. Please verify details.",
    chime_rate_limit: "Too many attempts. Please try again later.",
    ach_invalid_routing: "Invalid routing number. Please verify.",
    wire_amount_exceeded: "Amount exceeds wire transfer limit."
  };

  const errorKey = `${gateway}_${error.type}`;
  return errorMap[errorKey] || error.message || "Payment processing failed. Please try again.";
}
