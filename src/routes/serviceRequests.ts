/**
 * Service Request Management Routes
 * Handles client service requests, document uploads, and request tracking
 */

import { IRequest } from 'itty-router';

interface Env {
  DB: D1Database;
  DOCUMENTS_BUCKET: R2Bucket;
}

interface ServiceRequestData {
  client_id: string;
  services: Array<{
    category: string;
    form: string;
    name: string;
    price: string;
    description: string;
  }>;
  documents: Array<{
    name: string;
    url: string;
  }>;
  status: string;
  submitted_at: string;
}

/**
 * Submit a new service request
 * POST /api/services/request
 */
export async function handleServiceRequest(request: IRequest, env: Env): Promise<Response> {
  try {
    const data: ServiceRequestData = await request.json();
    
    // Validate required fields
    if (!data.client_id || !data.services || data.services.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate request ID
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert service request
    const result = await env.DB.prepare(`
      INSERT INTO service_requests (
        request_id, client_id, services_json, documents_json, 
        status, submitted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      requestId,
      data.client_id,
      JSON.stringify(data.services),
      JSON.stringify(data.documents || []),
      data.status || 'pending_approval',
      data.submitted_at,
      new Date().toISOString()
    ).run();
    
    // Log audit trail
    await env.DB.prepare(`
      INSERT INTO audit_logs (
        action, user_id, resource_type, resource_id, details, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      'service_request_submitted',
      data.client_id,
      'service_request',
      requestId,
      JSON.stringify({ service_count: data.services.length }),
      new Date().toISOString()
    ).run();
    
    // TODO: Send notification email to staff
    // await sendEmail({
    //   to: 'CondreR@outlook.com',
    //   subject: `New Service Request: ${requestId}`,
    //   body: `Client ${data.client_id} submitted a request for ${data.services.length} service(s).`
    // });
    
    return new Response(JSON.stringify({
      success: true,
      request_id: requestId,
      message: 'Service request submitted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Service request error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get service request history for a client
 * GET /api/services/history/:clientId
 */
export async function handleServiceHistory(request: IRequest, env: Env): Promise<Response> {
  try {
    const clientId = request.params?.clientId;
    
    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Client ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch service requests for client
    const { results } = await env.DB.prepare(`
      SELECT 
        request_id, services_json, documents_json, status, 
        submitted_at, updated_at, assigned_to, notes
      FROM service_requests
      WHERE client_id = ?
      ORDER BY submitted_at DESC
      LIMIT 50
    `).bind(clientId).all();
    
    const history = results?.map((row: any) => ({
      request_id: row.request_id,
      services: JSON.parse(row.services_json || '[]'),
      documents: JSON.parse(row.documents_json || '[]'),
      status: row.status,
      submitted_at: row.submitted_at,
      updated_at: row.updated_at,
      assigned_to: row.assigned_to,
      notes: row.notes
    })) || [];
    
    return new Response(JSON.stringify({ history }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Service history error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Update service request status (admin/preparer/ero only)
 * PATCH /api/services/request/:requestId
 */
export async function handleUpdateServiceRequest(request: IRequest, env: Env): Promise<Response> {
  try {
    const requestId = request.params?.requestId;
    const data = await request.json() as { status?: string; assigned_to?: string; notes?: string };
    
    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Request ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const bindings: any[] = [];
    
    if (data.status) {
      updates.push('status = ?');
      bindings.push(data.status);
    }
    
    if (data.assigned_to) {
      updates.push('assigned_to = ?');
      bindings.push(data.assigned_to);
    }
    
    if (data.notes) {
      updates.push('notes = ?');
      bindings.push(data.notes);
    }
    
    updates.push('updated_at = ?');
    bindings.push(new Date().toISOString());
    bindings.push(requestId);
    
    await env.DB.prepare(`
      UPDATE service_requests
      SET ${updates.join(', ')}
      WHERE request_id = ?
    `).bind(...bindings).run();
    
    // Log audit trail
    await env.DB.prepare(`
      INSERT INTO audit_logs (
        action, resource_type, resource_id, details, timestamp
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      'service_request_updated',
      'service_request',
      requestId,
      JSON.stringify(data),
      new Date().toISOString()
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Service request updated'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update service request error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Upload document for service request
 * POST /api/documents/upload
 */
export async function handleDocumentUpload(request: IRequest, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('document') as File;
    const clientId = formData.get('client_id') as string;
    const category = formData.get('category') as string || 'service_request';
    
    if (!file || !clientId) {
      return new Response(JSON.stringify({ error: 'Missing file or client ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${category}/${clientId}/${timestamp}_${safeName}`;
    
    // Upload to R2
    await env.DOCUMENTS_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        client_id: clientId,
        category: category,
        uploaded_at: new Date().toISOString()
      }
    });
    
    // Log in database
    await env.DB.prepare(`
      INSERT INTO documents (
        client_id, filename, r2_key, file_type, category, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      clientId,
      file.name,
      key,
      file.type,
      category,
      new Date().toISOString()
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      url: `/api/documents/${key}`,
      filename: file.name
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Document upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
