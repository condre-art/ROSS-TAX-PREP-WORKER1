/**
 * Form 8879 API Routes
 * Handles electronic signature authorization for tax returns
 */

import { Router } from 'itty-router';
import {
  createForm8879,
  signForm8879AsPreparer,
  signForm8879AsTaxpayer,
  generateForm8879XML,
  getForm8879,
  getForm8879ByReturn,
  listForm8879ByClient,
  issueTaxpayerPin
} from '../form8879';
import { verifyAuth, isAdmin } from '../utils/auth';

const router = Router();

/**
 * POST /api/form-8879/create
 * Create new Form 8879 for a return
 */
router.post('/form-8879/create', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const data = await req.json();

    if (!data.return_id || !data.taxpayer_name || !data.return_form_type) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), { status: 400 });
    }

    const form = await createForm8879(env, {
      return_id: data.return_id,
      client_id: auth.userId!,
      taxpayer_name: data.taxpayer_name,
      taxpayer_ssn_encrypted: data.taxpayer_ssn_encrypted,
      taxpayer_phone: data.taxpayer_phone,
      taxpayer_email: data.taxpayer_email,
      taxpayer_date_of_birth: data.taxpayer_date_of_birth,
      preparer_name: data.preparer_name,
      preparer_efin: data.preparer_efin,
      preparer_ptin: data.preparer_ptin,
      preparer_phone: data.preparer_phone,
      preparer_email: data.preparer_email,
      return_form_type: data.return_form_type,
      tax_year: data.tax_year,
      refund_amount: data.refund_amount,
      tax_due: data.tax_due
    });

    return new Response(JSON.stringify({
      success: true,
      form
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error creating Form 8879:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/form-8879/:formId/issue-pin
 * Issue 4-digit PIN to taxpayer for signature
 */
router.post('/form-8879/:formId/issue-pin', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const data = await req.json();
    const formId = req.params.formId;

    if (!data.email) {
      return new Response(JSON.stringify({
        error: 'Email required to issue PIN'
      }), { status: 400 });
    }

    const pin = await issueTaxpayerPin(env, auth.userId!, data.email, data.phone);

    return new Response(JSON.stringify({
      success: true,
      message: 'PIN issued and sent to email/SMS',
      expires_in_minutes: 15
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error issuing PIN:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/form-8879/:formId/sign-preparer
 * Preparer signs the form
 */
router.post('/form-8879/:formId/sign-preparer', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const formId = req.params.formId;
    const ipAddress = req.headers.get('CF-Connecting-IP') || 'unknown';

    const form = await signForm8879AsPreparer(env, formId, auth.userId!, ipAddress);

    return new Response(JSON.stringify({
      success: true,
      message: 'Form signed by preparer',
      form
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error signing form:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/form-8879/:formId/sign-taxpayer
 * Taxpayer signs the form with PIN
 */
router.post('/form-8879/:formId/sign-taxpayer', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const data = await req.json();
    const formId = req.params.formId;

    if (!data.pin) {
      return new Response(JSON.stringify({
        error: 'PIN required to sign'
      }), { status: 400 });
    }

    const ipAddress = req.headers.get('CF-Connecting-IP') || 'unknown';
    const deviceFingerprint = data.device_fingerprint || 'unknown';

    const form = await signForm8879AsTaxpayer(
      env,
      formId,
      auth.userId!,
      data.pin,
      ipAddress,
      deviceFingerprint
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Form signed by taxpayer - ready for transmission',
      form
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error signing form:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/form-8879/:formId
 * Get Form 8879 details
 */
router.get('/form-8879/:formId', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const formId = req.params.formId;
    const form = await getForm8879(env, formId);

    return new Response(JSON.stringify({
      success: true,
      form
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting form:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/form-8879/return/:returnId
 * Get Form 8879 for a specific return
 */
router.get('/form-8879/return/:returnId', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const returnId = parseInt(req.params.returnId);
    const form = await getForm8879ByReturn(env, returnId);

    return new Response(JSON.stringify({
      success: true,
      form
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting form:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/form-8879/list
 * List all Form 8879s for authenticated client
 */
router.get('/form-8879/list', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(req.url);
    const taxYear = url.searchParams.get('tax_year');
    const status = url.searchParams.get('status');

    const forms = await listForm8879ByClient(env, auth.userId!, {
      tax_year: taxYear ? parseInt(taxYear) : undefined,
      status: status || undefined
    });

    return new Response(JSON.stringify({
      success: true,
      forms,
      count: forms.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error listing forms:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/form-8879/:formId/generate-xml
 * Generate XML for IRS transmission
 */
router.post('/form-8879/:formId/generate-xml', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const formId = req.params.formId;
    const xml = await generateForm8879XML(env, formId);

    return new Response(JSON.stringify({
      success: true,
      message: 'XML generated successfully',
      xml_size: xml.length,
      ready_for_transmission: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error generating XML:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

export default router;
