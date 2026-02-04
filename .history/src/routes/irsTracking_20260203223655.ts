/**
 * IRS Refund & Amended Return API Routes
 * 
 * Endpoints:
 * - GET  /api/irs/refund-status/:clientId/:taxYear
 * - GET  /api/irs/amended-status/:clientId/:taxYear  
 * - POST /api/irs/update-refund-status
 * - GET  /api/irs/wheres-my-refund (redirect helper)
 * - GET  /api/irs/wheres-my-amended-return (redirect helper)
 */

import { Router } from 'itty-router';
import {
  checkRefundStatus,
  checkAmendedReturnStatus,
  updateRefundStatus,
  getWhereIsMyRefundUrl,
  getWhereIsMyAmendedReturnUrl,
  formatRefundAmount
} from '../irsRefundTracking';
import { decryptPII } from '../utils/encryption';
import { logAudit } from '../utils/audit';

const router = Router();

/**
 * GET /api/irs/refund-status/:clientId/:taxYear
 * Check refund status for a client's tax year
 */
router.get('/api/irs/refund-status/:clientId/:taxYear', async (req: Request, env: any) => {
  try {
    const { clientId, taxYear } = req.params;

    if (!clientId || !taxYear) {
      return new Response(JSON.stringify({ error: 'Client ID and tax year required' }), { 
        status: 400 
      });
    }

    const status = await checkRefundStatus(env, clientId, parseInt(taxYear));

    if (!status) {
      return new Response(JSON.stringify({ 
        error: 'No refund found for this tax year',
        message: 'Return may not have been filed or accepted yet'
      }), { 
        status: 404 
      });
    }

    await logAudit(env, {
      action: 'refund_status_checked',
      resource_type: 'efile_transmission',
      resource_id: status.transmissionId,
      user_id: clientId,
      details: { taxYear, status: status.status }
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...status,
        refundAmountFormatted: formatRefundAmount(status.refundAmount)
      },
      message: status.statusDescription,
      irsLink: {
        url: status.irsToolUrl,
        label: "Check on IRS.gov (Where's My Refund)",
        instructions: 'You will need your SSN, filing status, and exact refund amount'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Refund status check error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * GET /api/irs/amended-status/:clientId/:taxYear
 * Check amended return status
 */
router.get('/api/irs/amended-status/:clientId/:taxYear', async (req: Request, env: any) => {
  try {
    const { clientId, taxYear } = req.params;

    if (!clientId || !taxYear) {
      return new Response(JSON.stringify({ error: 'Client ID and tax year required' }), { 
        status: 400 
      });
    }

    const status = await checkAmendedReturnStatus(env, clientId, parseInt(taxYear));

    if (!status) {
      return new Response(JSON.stringify({ 
        error: 'No amended return found for this tax year',
        message: 'Amended return may not have been filed yet'
      }), { 
        status: 404 
      });
    }

    await logAudit(env, {
      action: 'amended_return_status_checked',
      resource_type: 'efile_transmission',
      resource_id: status.transmissionId,
      user_id: clientId,
      details: { taxYear, status: status.status }
    });

    return new Response(JSON.stringify({
      success: true,
      data: status,
      message: status.statusDescription,
      irsLink: {
        url: status.irsToolUrl,
        label: "Check on IRS.gov (Where's My Amended Return)",
        instructions: 'You will need your SSN, date of birth, and ZIP code',
        processingTime: status.estimatedProcessingTime
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Amended return status check error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * POST /api/irs/update-refund-status
 * Update refund status (staff/admin only)
 */
router.post('/api/irs/update-refund-status', async (req: Request, env: any) => {
  try {
    const { transmissionId, statusUpdate } = await req.json();

    if (!transmissionId || !statusUpdate) {
      return new Response(JSON.stringify({ error: 'Transmission ID and status update required' }), { 
        status: 400 
      });
    }

    // Verify transmission exists
    const transmission = await env.DB.prepare(
      'SELECT id, client_id FROM efile_transmissions WHERE id = ?'
    ).bind(transmissionId).first();

    if (!transmission) {
      return new Response(JSON.stringify({ error: 'Transmission not found' }), { 
        status: 404 
      });
    }

    await updateRefundStatus(env, transmissionId, statusUpdate);

    await logAudit(env, {
      action: 'refund_status_updated',
      resource_type: 'efile_transmission',
      resource_id: transmissionId,
      details: statusUpdate
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Refund status updated successfully',
      transmissionId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Refund status update error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * GET /api/irs/wheres-my-refund?ssn=XXX&filingStatus=XXX&refundAmount=XXX&taxYear=XXX
 * Redirect helper with pre-filled info modal
 */
router.get('/api/irs/wheres-my-refund', async (req: Request, env: any) => {
  const url = new URL(req.url);
  const ssn = url.searchParams.get('ssn');
  const filingStatus = url.searchParams.get('filingStatus');
  const refundAmount = url.searchParams.get('refundAmount');
  const taxYear = url.searchParams.get('taxYear');

  const irsUrl = getWhereIsMyRefundUrl({
    ssn: ssn || '',
    filingStatus: (filingStatus as any) || 'single',
    refundAmount: parseFloat(refundAmount || '0'),
    taxYear: parseInt(taxYear || new Date().getFullYear().toString())
  });

  // Return HTML page with instructions before redirecting
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to IRS.gov - Where's My Refund</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1B365D;
      font-size: 24px;
    }
    .info {
      background: #e8f4f8;
      border-left: 4px solid #1B365D;
      padding: 15px;
      margin: 20px 0;
    }
    .info strong {
      display: block;
      margin-bottom: 10px;
      color: #1B365D;
    }
    .btn {
      display: inline-block;
      background: #1B365D;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    .btn:hover {
      background: #C4A962;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔍 Where's My Refund?</h1>
    <p>You will be redirected to the official IRS.gov "Where's My Refund" tool.</p>
    
    <div class="info">
      <strong>You will need the following information:</strong>
      <ul>
        <li>Social Security Number: ***-**-${ssn?.slice(-4) || 'XXXX'}</li>
        <li>Filing Status: ${filingStatus || 'Unknown'}</li>
        <li>Exact Refund Amount: ${formatRefundAmount(parseFloat(refundAmount || '0'))}</li>
        <li>Tax Year: ${taxYear || new Date().getFullYear()}</li>
      </ul>
    </div>

    <p><strong>Note:</strong> Refund information is typically available 24 hours after e-filing or 4 weeks after mailing a paper return.</p>

    <a href="${irsUrl}" class="btn" target="_blank">Continue to IRS.gov →</a>
  </div>

  <script>
    // Auto-redirect after 3 seconds
    setTimeout(() => {
      window.location.href = "${irsUrl}";
    }, 5000);
  </script>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
});

/**
 * GET /api/irs/wheres-my-amended-return?ssn=XXX&dob=XXX&zipCode=XXX&taxYear=XXX
 * Redirect helper for amended returns
 */
router.get('/api/irs/wheres-my-amended-return', async (req: Request, env: any) => {
  const url = new URL(req.url);
  const ssn = url.searchParams.get('ssn');
  const dob = url.searchParams.get('dob');
  const zipCode = url.searchParams.get('zipCode');
  const taxYear = url.searchParams.get('taxYear');

  const irsUrl = getWhereIsMyAmendedReturnUrl({
    ssn: ssn || '',
    dob: dob || '',
    zipCode: zipCode || '',
    taxYear: parseInt(taxYear || new Date().getFullYear().toString())
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to IRS.gov - Where's My Amended Return</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1B365D;
      font-size: 24px;
    }
    .info {
      background: #fff3cd;
      border-left: 4px solid #C4A962;
      padding: 15px;
      margin: 20px 0;
    }
    .info strong {
      display: block;
      margin-bottom: 10px;
      color: #1B365D;
    }
    .btn {
      display: inline-block;
      background: #1B365D;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    .btn:hover {
      background: #C4A962;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>📝 Where's My Amended Return?</h1>
    <p>You will be redirected to the official IRS.gov "Where's My Amended Return" tool.</p>
    
    <div class="info">
      <strong>You will need the following information:</strong>
      <ul>
        <li>Social Security Number: ***-**-${ssn?.slice(-4) || 'XXXX'}</li>
        <li>Date of Birth: ${dob || 'YYYY-MM-DD'}</li>
        <li>ZIP Code: ${zipCode || 'XXXXX'}</li>
        <li>Tax Year: ${taxYear || new Date().getFullYear()}</li>
      </ul>
    </div>

    <p><strong>Note:</strong> Amended return processing typically takes up to 16 weeks. Information is available 3 weeks after filing Form 1040-X.</p>

    <a href="${irsUrl}" class="btn" target="_blank">Continue to IRS.gov →</a>
  </div>

  <script>
    setTimeout(() => {
      window.location.href = "${irsUrl}";
    }, 5000);
  </script>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
});

export default router;
