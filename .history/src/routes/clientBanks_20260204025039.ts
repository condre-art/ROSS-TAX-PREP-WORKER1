/**
 * Client Bank Management API Routes
 * 
 * Allows clients to manage their linked bank accounts,
 * select bank products, and verify accounts
 */

import { Router } from 'itty-router';
import { D1Database } from '@cloudflare/workers-types';
import { verifyAuth } from '../utils/auth';
import {
  linkBankAccount,
  getClientBanks,
  verifyBankAccount,
  selectBankProduct,
  setPrimaryBank,
  removeBankAccount,
  getBankProducts,
  getBankProduct,
  validateRoutingNumber,
} from '../services/clientBankService';

const clientBankRouter = Router();

// GET /api/client/banks - Get all linked banks for client
clientBankRouter.get('/client/banks', async (req, env, context) => {
  const db = env.DB as D1Database;

  try {
    const user = await verifyAuth(req, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const banks = await getClientBanks(db, user.id.toString());

    return new Response(JSON.stringify({ success: true, banks, count: banks.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to get banks: ${error}` }), { status: 500 });
  }
});

// POST /api/client/banks/link - Link new bank account
clientBankRouter.post('/client/banks/link', async (req, env, context) => {
  const db = env.DB as D1Database;

  try {
    const user = await verifyAuth(req, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = (await req.json()) as {
      bank_name: string;
      account_type: 'checking' | 'savings';
      account_number: string;
      routing_number: string;
      account_holder_name: string;
    };

    if (!body.bank_name || !body.account_type || !body.account_number || !body.routing_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: bank_name, account_type, account_number, routing_number' }),
        { status: 400 }
      );
    }

    // Validate routing number
    const routingValidation = validateRoutingNumber(body.routing_number);
    if (!routingValidation.valid) {
      return new Response(JSON.stringify({ error: routingValidation.message }), { status: 400 });
    }

    const bank = await linkBankAccount(db, {
      client_id: user.id.toString(),
      bank_name: body.bank_name,
      account_type: body.account_type,
      account_number: body.account_number,
      routing_number: body.routing_number,
      account_holder_name: body.account_holder_name,
    });

    return new Response(
      JSON.stringify({
        success: true,
        bank,
        message: 'Bank account linked successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to link bank: ${error}` }), { status: 500 });
  }
});

// POST /api/client/banks/:bankId/verify - Verify bank account
clientBankRouter.post('/client/banks/:bankId/verify', async (req, env, context) => {
  const db = env.DB as D1Database;
  const { bankId } = req.params;

  try {
    const user = await verifyAuth(req, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = (await req.json()) as {
      method: 'micro_deposit' | 'instant' | 'manual';
      amount1?: number;
      amount2?: number;
    };

    const verified = await verifyBankAccount(db, bankId, user.id.toString(), body.method, {
      amount1: body.amount1,
      amount2: body.amount2,
    });

    return new Response(
      JSON.stringify({
        success: verified,
        message: verified ? 'Bank account verified successfully' : 'Verification failed',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to verify bank: ${error}` }), { status: 500 });
  }
});

// POST /api/client/banks/:bankId/product - Select bank product
clientBankRouter.post('/client/banks/:bankId/product', async (req, env, context) => {
  const db = env.DB as D1Database;
  const { bankId } = req.params;

  try {
    const user = await verifyAuth(req, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = (await req.json()) as { product_code: 'RA' | 'EPS' | 'SBTPG' | 'Refundo' };

    if (!body.product_code) {
      return new Response(JSON.stringify({ error: 'Missing required field: product_code' }), { status: 400 });
    }

    // Validate product code
    const validProducts = ['RA', 'EPS', 'SBTPG', 'Refundo'];
    if (!validProducts.includes(body.product_code)) {
      return new Response(JSON.stringify({ error: 'Invalid product code' }), { status: 400 });
    }

    await selectBankProduct(db, user.id.toString(), bankId, body.product_code);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bank product ${body.product_code} selected successfully`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to select product: ${error}` }), { status: 500 });
  }
});

// POST /api/client/banks/:bankId/set-primary - Set as primary bank
clientBankRouter.post('/client/banks/:bankId/set-primary', async (req, env, context) => {
  const db = env.DB as D1Database;
  const { bankId } = req.params;

  try {
    const user = await verifyAuth(req, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await setPrimaryBank(db, user.id.toString(), bankId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Primary bank account updated',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to set primary bank: ${error}` }), { status: 500 });
  }
});

// DELETE /api/client/banks/:bankId - Remove bank account
clientBankRouter.delete('/client/banks/:bankId', async (req, env, context) => {
  const db = env.DB as D1Database;
  const { bankId } = req.params;

  try {
    const user = await verifyAuth(req, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await removeBankAccount(db, user.id.toString(), bankId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bank account removed successfully',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to remove bank: ${error}` }), { status: 500 });
  }
});

// GET /api/client/banks/products - Get available bank products
clientBankRouter.get('/client/banks/products', async (req, env, context) => {
  try {
    const products = getBankProducts();

    return new Response(JSON.stringify({ success: true, products, count: products.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to get products: ${error}` }), { status: 500 });
  }
});

// GET /api/client/banks/products/:code - Get specific bank product details
clientBankRouter.get('/client/banks/products/:code', async (req, env, context) => {
  const { code } = req.params;

  try {
    const product = getBankProduct(code);

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, product }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to get product: ${error}` }), { status: 500 });
  }
});

// POST /api/client/banks/validate-routing - Validate routing number
clientBankRouter.post('/client/banks/validate-routing', async (req, env, context) => {
  try {
    const body = (await req.json()) as { routing_number: string };

    if (!body.routing_number) {
      return new Response(JSON.stringify({ error: 'Missing required field: routing_number' }), { status: 400 });
    }

    const validation = validateRoutingNumber(body.routing_number);

    return new Response(JSON.stringify({ success: validation.valid, ...validation }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to validate routing: ${error}` }), { status: 500 });
  }
});

export default clientBankRouter;
