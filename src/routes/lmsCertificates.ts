// src/routes/lmsCertificates.ts
// Certificate Revocation, Verification, and Management

import { Router } from 'itty-router';
import { logAudit } from '../utils/audit';
import { decryptPII } from '../utils/encryption';

const lmsCertificatesRouter = Router();

/**
 * Revoke a certificate
 * POST /api/lms/certificates/:id/revoke
 * Requires: Super Admin or Admin role
 */
lmsCertificatesRouter.post('/:id/revoke', async (req, env) => {
  try {
    const certificateId = req.params.id;
    const body = await req.json();
    const { reason, revokedBy } = body;

    if (!reason) {
      return new Response(JSON.stringify({ error: 'Revocation reason required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if certificate exists
    const cert = await env.DB.prepare(
      'SELECT * FROM lms_certificates WHERE id = ? OR certificate_number = ?'
    ).bind(certificateId, certificateId).first();

    if (!cert) {
      return new Response(JSON.stringify({ error: 'Certificate not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (cert.revoked === 1) {
      return new Response(JSON.stringify({ error: 'Certificate already revoked' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Revoke certificate
    await env.DB.prepare(`
      UPDATE lms_certificates 
      SET revoked = 1, 
          revoked_at = CURRENT_TIMESTAMP, 
          revoked_reason = ?
      WHERE id = ?
    `).bind(reason, cert.id).run();

    // Log audit trail
    await logAudit(env, {
      user_id: null,
      action: 'lms_certificate_revoked',
      entity: 'lms_certificates',
      entity_id: cert.id,
      details: JSON.stringify({
        certificate_number: cert.certificate_number,
        student_id: cert.student_id,
        reason: reason,
        revoked_by: revokedBy || 'admin'
      }),
      ip_address: req.headers.get('cf-connecting-ip') || 'unknown'
    });

    // Log to verification table
    await env.DB.prepare(`
      INSERT INTO lms_certificate_verifications 
      (certificate_id, verification_code, verified_at, verified_by_ip, verified_by_user_agent, verification_result)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, 'revoked')
    `).bind(
      cert.id,
      cert.verification_code,
      req.headers.get('cf-connecting-ip') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      certificateId: cert.id,
      certificateNumber: cert.certificate_number,
      revoked: true,
      revokedAt: new Date().toISOString(),
      reason: reason
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Certificate revocation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Download certificate PDF
 * GET /api/lms/certificates/:id/download
 */
lmsCertificatesRouter.get('/:id/download', async (req, env) => {
  try {
    const certificateId = req.params.id;

    const cert = await env.DB.prepare(
      'SELECT * FROM lms_certificates WHERE id = ? OR certificate_number = ?'
    ).bind(certificateId, certificateId).first();

    if (!cert) {
      return new Response('Certificate not found', { status: 404 });
    }

    if (cert.revoked === 1) {
      return new Response('Certificate has been revoked', { status: 403 });
    }

    // If PDF stored in R2
    if (cert.certificate_pdf_key && env.DOCUMENTS_BUCKET) {
      const pdfObject = await env.DOCUMENTS_BUCKET.get(cert.certificate_pdf_key);
      if (pdfObject) {
        return new Response(pdfObject.body, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Ross_Tax_Certificate_${cert.certificate_number}.pdf"`
          }
        });
      }
    }

    // Otherwise, return certificate data for PDF generation
    const studentName = await decryptPII(cert.student_name_encrypted, env);
    
    return new Response(JSON.stringify({
      certificateNumber: cert.certificate_number,
      studentName: studentName,
      programName: cert.program_name,
      issueDate: cert.issue_date,
      completionDate: cert.completion_date,
      verificationUrl: cert.verification_url
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Certificate download error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

/**
 * Get certificate verification logs
 * GET /api/lms/certificates/:id/verification-logs
 * Requires: Admin role
 */
lmsCertificatesRouter.get('/:id/verification-logs', async (req, env) => {
  try {
    const certificateId = req.params.id;

    const logs = await env.DB.prepare(`
      SELECT 
        verified_at,
        verified_by_ip,
        verification_result
      FROM lms_certificate_verifications
      WHERE certificate_id = ?
      ORDER BY verified_at DESC
      LIMIT 100
    `).bind(certificateId).all();

    return new Response(JSON.stringify({
      certificateId: certificateId,
      verificationCount: logs.results?.length || 0,
      verifications: logs.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verification logs error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export default lmsCertificatesRouter;
