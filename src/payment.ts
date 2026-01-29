// payment.ts - Payment processing integration module (Stripe/Square ready, extensible for banks/EPS)
// This module provides backend endpoints for initiating and verifying payments.
// Extend with additional providers as needed.

import { Hono } from 'hono';
import { auditPayment } from './utils/audit';

export const paymentRouter = new Hono();

interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  provider: 'stripe' | 'square' | 'bank';
  customer_email: string;
  description?: string;
  metadata?: Record<string, string>;
}

interface PaymentVerifyRequest {
  transaction_id: string;
  provider: 'stripe' | 'square' | 'bank';
}

// POST /api/payment/intent - Create a payment intent (Stripe/Square)
paymentRouter.post('/intent', async (c) => {
  try {
    const body: PaymentIntentRequest = await c.req.json();
    const { amount, currency = 'USD', provider, customer_email, description, metadata } = body;

    // Validate required fields
    if (!amount || !provider || !customer_email) {
      return c.json({ error: 'Missing required fields: amount, provider, customer_email' }, 400);
    }

    if (amount <= 0) {
      return c.json({ error: 'Amount must be greater than 0' }, 400);
    }

    let paymentIntent: any;

    switch (provider) {
      case 'stripe':
        // Stripe integration
        if (!(c.env as any).STRIPE_SECRET_KEY) {
          return c.json({ error: 'Stripe not configured' }, 500);
        }

        const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(c.env as any).STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: (amount * 100).toString(), // Convert to cents
            currency: currency.toLowerCase(),
            'metadata[customer_email]': customer_email,
            'metadata[description]': description || 'Tax preparation service',
            ...Object.entries(metadata || {}).reduce((acc, [key, val]) => ({
              ...acc,
              [`metadata[${key}]`]: val
            }), {})
          })
        });

        if (!stripeResponse.ok) {
          const error = await stripeResponse.json() as any;
          throw new Error(`Stripe error: ${error.error?.message || 'Unknown error'}`);
        }

        paymentIntent = await stripeResponse.json();
        
        // Audit log
        const user = c.get('user') || { id: 0, email: customer_email, role: 'client' };
        await auditPayment((c.env as any), paymentIntent.id, amount, user, 'initiated', c.req.raw);

        return c.json({
          success: true,
          client_secret: paymentIntent.client_secret,
          transaction_id: paymentIntent.id,
          provider: 'stripe'
        });

      case 'square':
        // Square integration
        if (!(c.env as any).SQUARE_ACCESS_TOKEN || !(c.env as any).SQUARE_LOCATION_ID) {
          return c.json({ error: 'Square not configured' }, 500);
        }

        const squareResponse = await fetch('https://connect.squareup.com/v2/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(c.env as any).SQUARE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Square-Version': '2023-12-13'
          },
          body: JSON.stringify({
            idempotency_key: crypto.randomUUID(),
            amount_money: {
              amount: amount * 100, // Convert to cents
              currency
            },
            source_id: 'PLACEHOLDER_SOURCE', // Client provides source_id from Square.js
            location_id: (c.env as any).SQUARE_LOCATION_ID,
            customer_email,
            note: description || 'Tax preparation service'
          })
        });

        if (!squareResponse.ok) {
          const error = await squareResponse.json() as any;
          throw new Error(`Square error: ${error.errors?.[0]?.detail || 'Unknown error'}`);
        }

        paymentIntent = await squareResponse.json();
        
        return c.json({
          success: true,
          transaction_id: paymentIntent.payment.id,
          provider: 'square',
          status: paymentIntent.payment.status
        });

      case 'bank':
        // Bank ACH transfer (placeholder - requires bank integration)
        return c.json({
          success: true,
          message: 'Bank ACH integration - manual processing required',
          transaction_id: `BANK_${Date.now()}`,
          provider: 'bank',
          instructions: 'Bank transfer details will be sent to your email'
        });

      default:
        return c.json({ error: 'Unsupported payment provider' }, 400);
    }
  } catch (error: any) {
    console.error('Payment intent error:', error);
    return c.json({ error: error.message || 'Payment processing failed' }, 500);
  }
});

// POST /api/payment/verify - Verify payment status
paymentRouter.post('/verify', async (c) => {
  try {
    const body: PaymentVerifyRequest = await c.req.json();
    const { transaction_id, provider } = body;

    if (!transaction_id || !provider) {
      return c.json({ error: 'Missing required fields: transaction_id, provider' }, 400);
    }

    let paymentStatus: any;

    switch (provider) {
      case 'stripe':
        if (!(c.env as any).STRIPE_SECRET_KEY) {
          return c.json({ error: 'Stripe not configured' }, 500);
        }

        const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${transaction_id}`, {
          headers: {
            'Authorization': `Bearer ${(c.env as any).STRIPE_SECRET_KEY}`,
          }
        });

        if (!stripeResponse.ok) {
          const error = await stripeResponse.json() as any;
          throw new Error(`Stripe error: ${error.error?.message || 'Unknown error'}`);
        }

        paymentStatus = await stripeResponse.json();
        
        // Audit log
        const user = c.get('user') || { id: 0, email: 'unknown', role: 'system' };
        const status = paymentStatus.status === 'succeeded' ? 'completed' : 'failed';
        await auditPayment((c.env as any), transaction_id, paymentStatus.amount / 100, user, status, c.req.raw);

        return c.json({
          success: true,
          status: paymentStatus.status,
          amount: paymentStatus.amount / 100,
          currency: paymentStatus.currency,
          verified: paymentStatus.status === 'succeeded'
        });

      case 'square':
        if (!(c.env as any).SQUARE_ACCESS_TOKEN) {
          return c.json({ error: 'Square not configured' }, 500);
        }

        const squareResponse = await fetch(`https://connect.squareup.com/v2/payments/${transaction_id}`, {
          headers: {
            'Authorization': `Bearer ${(c.env as any).SQUARE_ACCESS_TOKEN}`,
            'Square-Version': '2023-12-13'
          }
        });

        if (!squareResponse.ok) {
          const error = await squareResponse.json() as any;
          throw new Error(`Square error: ${error.errors?.[0]?.detail || 'Unknown error'}`);
        }

        paymentStatus = await squareResponse.json();

        return c.json({
          success: true,
          status: paymentStatus.payment.status,
          amount: paymentStatus.payment.amount_money.amount / 100,
          currency: paymentStatus.payment.amount_money.currency,
          verified: paymentStatus.payment.status === 'COMPLETED'
        });

      case 'bank':
        // Bank payment verification (manual process)
        return c.json({
          success: true,
          status: 'pending_verification',
          message: 'Bank payments require manual verification',
          verified: false
        });

      default:
        return c.json({ error: 'Unsupported payment provider' }, 400);
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return c.json({ error: error.message || 'Payment verification failed' }, 500);
  }
});

// Extend with additional endpoints for EPS, banks, etc.
