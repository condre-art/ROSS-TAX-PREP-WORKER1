// src/routes/efilePrep.ts
// E-file preparation endpoint triggered by intake form submissions

import { Router } from 'itty-router';
import { v4 as uuid } from 'uuid';
import { encryptPII } from '../utils/encryption';
import { logAudit } from '../utils/audit';

const efilePrepRouter = Router();

/**
 * POST /api/efile/prepare
 * 
 * Initiates e-file return preparation workflow when a client submits intake form
 * Creates client record, return record, and sets up e-file transmission placeholder
 */
efilePrepRouter.post('/prepare', async (req: any, env: any) => {
  try {
    const body = await req.json();
    
    // Validate required fields
    const {
      client_id,
      client_name,
      client_email,
      client_phone,
      service_type,
      return_type = '1040',
      source = 'intake_form',
      notes,
      auto_start = true
    } = body;
    
    if (!client_id || !client_name || !client_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: client_id, client_name, client_email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const now = new Date().toISOString();
    
    // Step 1: Create or update client record (encrypted PII)
    const encName = await encryptPII(client_name, env);
    const encEmail = await encryptPII(client_email, env);
    const encPhone = client_phone ? await encryptPII(client_phone, env) : null;
    
    // Check if client already exists
    const existingClient = await env.DB.prepare(
      'SELECT id FROM clients WHERE email = ?'
    ).bind(encEmail).first();
    
    let clientDbId: number;
    
    if (existingClient) {
      clientDbId = existingClient.id;
      console.log(`[E-file Prep] Client exists with ID ${clientDbId}`);
    } else {
      // Create new client
      const clientResult = await env.DB.prepare(`
        INSERT INTO clients (
          full_name, 
          email, 
          phone, 
          status, 
          source,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, 'intake_submitted', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(encName, encEmail, encPhone, source).run();
      
      clientDbId = clientResult.meta.last_row_id;
      console.log(`[E-file Prep] Created new client with ID ${clientDbId}`);
      
      // Audit log for new client
      await logAudit(env, {
        user_id: 'system',
        action: 'client_created',
        resource: 'clients',
        resource_id: String(clientDbId),
        details: { source, service_type },
        ip_address: req.headers.get('cf-connecting-ip') || 'unknown'
      });
    }
    
    // Step 2: Create tax return record
    const returnId = uuid();
    const taxYear = new Date().getFullYear() - 1; // Previous year by default
    
    const returnResult = await env.DB.prepare(`
      INSERT INTO tax_returns (
        id,
        client_id,
        tax_year,
        return_type,
        status,
        filing_status,
        service_type,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'draft', 'single', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      returnId,
      clientDbId,
      taxYear,
      return_type,
      service_type || 'Tax Preparation',
      notes || 'Created from intake form submission'
    ).run();
    
    console.log(`[E-file Prep] Created return ${returnId} for client ${clientDbId}`);
    
    // Step 3: Create e-file transmission placeholder
    const transmissionId = uuid();
    
    await env.DB.prepare(`
      INSERT INTO efile_transmissions (
        id,
        return_id,
        client_id,
        method,
        status,
        environment,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 'DIY', 'created', 'test', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(transmissionId, returnId, clientDbId).run();
    
    console.log(`[E-file Prep] Created transmission ${transmissionId}`);
    
    // Step 4: Audit log the workflow initiation
    await logAudit(env, {
      user_id: 'system',
      action: 'efile_prep_initiated',
      resource: 'efile_transmissions',
      resource_id: transmissionId,
      details: {
        return_id: returnId,
        client_id: clientDbId,
        return_type,
        service_type,
        source
      },
      ip_address: req.headers.get('cf-connecting-ip') || 'unknown'
    });
    
    // Return success with next steps
    return new Response(
      JSON.stringify({
        success: true,
        message: 'E-file return preparation initiated',
        data: {
          client_id: clientDbId,
          return_id: returnId,
          transmission_id: transmissionId,
          status: 'created',
          next_steps: [
            'Client will receive portal access credentials via email',
            'Client can upload documents securely through portal',
            'Return will be prepared and reviewed',
            'E-file transmission will be submitted to IRS'
          ]
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (err: any) {
    console.error('[E-file Prep] Error:', err);
    
    return new Response(
      JSON.stringify({ 
        error: 'E-file preparation failed',
        message: err.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * GET /api/efile/prepare/:client_id/status
 * 
 * Check preparation status for a client
 */
efilePrepRouter.get('/prepare/:client_id/status', async (req: any, env: any) => {
  try {
    const clientId = req.params.client_id;
    
    // Get latest return and transmission for client
    const result = await env.DB.prepare(`
      SELECT 
        tr.id as return_id,
        tr.return_type,
        tr.status as return_status,
        tr.tax_year,
        et.id as transmission_id,
        et.status as transmission_status,
        et.irs_submission_id,
        tr.created_at
      FROM tax_returns tr
      LEFT JOIN efile_transmissions et ON et.return_id = tr.id
      WHERE tr.client_id = ?
      ORDER BY tr.created_at DESC
      LIMIT 1
    `).bind(clientId).first();
    
    if (!result) {
      return new Response(
        JSON.stringify({ 
          error: 'No return found for client',
          client_id: clientId
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (err: any) {
    console.error('[E-file Prep] Status check error:', err);
    
    return new Response(
      JSON.stringify({ error: 'Status check failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

export default efilePrepRouter;
