/**
 * Payment Gateway Integration Service
 * Supports: Stripe, Cash App, Zelle, ACH/EFT, Langley Federal CU
 * Card processing via Stripe for credit/debit cards
 */

export const PAYMENT_METHODS = {
  STRIPE: {
    id: "stripe",
    name: "Credit Card (Visa, Mastercard, AmEx)",
    icon: "💳",
    fee: 0.029 + 0.30, // 2.9% + $0.30
    processingTime: "1-3 business days",
    enabled: true,
    types: ["credit", "debit"]
  },
  ACH: {
    id: "ach",
    name: "ACH Bank Transfer (Free)",
    icon: "🏦",
    fee: 0.00,
    processingTime: "3-5 business days",
    enabled: true,
    types: ["bank_transfer"]
  },
  EFT: {
    id: "eft",
    name: "EFT / Wire Transfer",
    icon: "⚡",
    fee: 0.00,
    processingTime: "Same day",
    enabled: true,
    types: ["wire"]
  },
  CASH_APP: {
    id: "cash_app",
    name: "Cash App",
    icon: "📱",
    fee: 0.025, // 2.5%
    processingTime: "Instant to 24 hours",
    enabled: true,
    types: ["mobile_wallet"]
  },
  ZELLE: {
    id: "zelle",
    name: "Zelle Bank Transfer (Free)",
    icon: "💰",
    fee: 0.00,
    processingTime: "1-2 business days",
    enabled: true,
    types: ["bank_transfer"]
  },
  LANGLEY_FCU: {
    id: "langley_fcu",
    name: "Langley Federal Credit Union",
    icon: "🏧",
    fee: 0.00,
    processingTime: "1-2 business days",
    enabled: true,
    types: ["credit_union"]
  }
};

/**
 * Payment Gateway Configuration
 */
export const PAYMENT_GATEWAY_CONFIG = {
  // Stripe Configuration
  STRIPE: {
    publicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY || "",
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    endpoint: "https://api.stripe.com/v1",
  },

  // Cash App Configuration
  CASH_APP: {
    apiKey: process.env.CASH_APP_API_KEY || "",
    endpoint: "https://api.cashapp.com/v1",
    webhookSecret: process.env.CASH_APP_WEBHOOK_SECRET || "",
  },

  // ACH/EFT Configuration
  ACH_EFT: {
    apiKey: process.env.ACH_EFT_API_KEY || "",
    endpoint: "https://api.achdemo.com/v1",
    companyId: process.env.ACH_COMPANY_ID || "",
  },

  // Zelle Configuration
  ZELLE: {
    bankCode: process.env.ZELLE_BANK_CODE || "",
    endpoint: "https://api.zellepay.com/v1",
  },

  // Langley Federal Credit Union Configuration
  LANGLEY_FCU: {
    routingNumber: "256075957",
    accountingId: process.env.LANGLEY_FCU_ACCOUNT_ID || "",
    apiKey: process.env.LANGLEY_FCU_API_KEY || "",
    endpoint: "https://api.langley-fcu.org/v1",
  },
};

/**
 * Create payment intent
 */
export async function createPaymentIntent(amount, method, metadata = {}) {
  const payload = {
    amount: Math.round(amount * 100), // Convert to cents
    currency: "usd",
    paymentMethod: method,
    metadata: {
      clientId: metadata.clientId,
      invoiceId: metadata.invoiceId,
      returnId: metadata.returnId,
      ...metadata
    },
  };

  switch (method) {
    case "stripe":
      return createStripePaymentIntent(payload);
    case "cash_app":
      return createCashAppPaymentIntent(payload);
    case "ach":
      return createACHPaymentIntent(payload);
    case "eft":
      return createEFTPaymentIntent(payload);
    case "zelle":
      return createZellePaymentIntent(payload);
    case "langley_fcu":
      return createLangleyFCUPaymentIntent(payload);
    default:
      throw new Error(`Unsupported payment method: ${method}`);
  }
}

/**
 * Stripe Payment Integration
 */
export async function createStripePaymentIntent(payload) {
  const endpoint = "https://api.stripe.com/v1/payment_intents";
  
  const formData = new URLSearchParams();
  formData.append("amount", payload.amount);
  formData.append("currency", payload.currency);
  formData.append("metadata[clientId]", payload.metadata.clientId);
  formData.append("metadata[invoiceId]", payload.metadata.invoiceId);
  formData.append("confirm", "false");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYMENT_GATEWAY_CONFIG.STRIPE.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      method: "stripe",
      paymentId: data.id,
      clientSecret: data.client_secret,
      amount: payload.amount / 100,
      status: data.status,
      url: `/payment/confirm?paymentId=${data.id}`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Cash App Payment Integration
 */
export async function createCashAppPaymentIntent(payload) {
  try {
    const response = await fetch(`${PAYMENT_GATEWAY_CONFIG.CASH_APP.endpoint}/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYMENT_GATEWAY_CONFIG.CASH_APP.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: payload.amount,
        currency: payload.currency,
        metadata: payload.metadata,
        redirectUrl: `${window.location.origin}/payment/callback`
      })
    });

    if (!response.ok) {
      throw new Error(`Cash App API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      method: "cash_app",
      paymentId: data.id,
      amount: payload.amount / 100,
      status: "pending",
      redirectUrl: data.paymentUrl
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * ACH Bank Transfer
 */
export async function createACHPaymentIntent(payload) {
  try {
    const response = await fetch(`${PAYMENT_GATEWAY_CONFIG.ACH_EFT.endpoint}/transfers`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYMENT_GATEWAY_CONFIG.ACH_EFT.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: payload.amount / 100,
        type: "debit",
        companyId: PAYMENT_GATEWAY_CONFIG.ACH_EFT.companyId,
        metadata: payload.metadata
      })
    });

    if (!response.ok) {
      throw new Error(`ACH API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      method: "ach",
      paymentId: data.id,
      amount: payload.amount / 100,
      status: "initiated",
      bankDetails: {
        routingNumber: data.routingNumber,
        accountNumber: data.accountNumber,
        amount: payload.amount / 100
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * EFT / Wire Transfer
 */
export async function createEFTPaymentIntent(payload) {
  try {
    const response = await fetch(`${PAYMENT_GATEWAY_CONFIG.ACH_EFT.endpoint}/wires`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYMENT_GATEWAY_CONFIG.ACH_EFT.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: payload.amount / 100,
        metadata: payload.metadata,
        priority: "high"
      })
    });

    if (!response.ok) {
      throw new Error(`EFT API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      method: "eft",
      paymentId: data.id,
      amount: payload.amount / 100,
      status: "initiated",
      processingTime: "same-day"
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Zelle Bank Transfer
 */
export async function createZellePaymentIntent(payload) {
  try {
    const response = await fetch(`${PAYMENT_GATEWAY_CONFIG.ZELLE.endpoint}/transfers`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.ZELLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: payload.amount / 100,
        bankCode: PAYMENT_GATEWAY_CONFIG.ZELLE.bankCode,
        metadata: payload.metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Zelle API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      method: "zelle",
      paymentId: data.id,
      amount: payload.amount / 100,
      status: "initiated",
      reference: data.reference
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Langley Federal Credit Union
 */
export async function createLangleyFCUPaymentIntent(payload) {
  try {
    const response = await fetch(`${PAYMENT_GATEWAY_CONFIG.LANGLEY_FCU.endpoint}/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYMENT_GATEWAY_CONFIG.LANGLEY_FCU.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: payload.amount / 100,
        accountId: PAYMENT_GATEWAY_CONFIG.LANGLEY_FCU.accountingId,
        metadata: payload.metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Langley FCU API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      method: "langley_fcu",
      paymentId: data.id,
      amount: payload.amount / 100,
      status: "initiated",
      memberNumber: data.memberNumber
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Calculate payment with fees
 */
export function calculatePaymentWithFees(amount, method) {
  const methodConfig = PAYMENT_METHODS[method.toUpperCase()];
  if (!methodConfig) {
    throw new Error(`Unknown payment method: ${method}`);
  }

  let fee = 0;
  if (typeof methodConfig.fee === 'number' && methodConfig.fee > 0) {
    if (methodConfig.fee < 1) {
      // Percentage-based fee
      fee = amount * methodConfig.fee;
    } else {
      // Fixed fee
      fee = methodConfig.fee;
    }
  }

  return {
    amount: amount,
    fee: parseFloat(fee.toFixed(2)),
    total: parseFloat((amount + fee).toFixed(2)),
    method: method,
    processingTime: methodConfig.processingTime
  };
}
