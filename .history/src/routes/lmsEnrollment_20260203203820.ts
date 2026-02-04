// src/routes/lmsEnrollment.ts
// LMS Enrollment, Certificate Generation, and Payment Processing

import { Router } from 'itty-router';
import { v4 as uuid } from 'uuid';
import { encryptPII } from '../utils/encryption';
import { logAudit } from '../utils/audit';

const lmsEnrollmentRouter = Router();

// Course catalog (matches courses.json)
const COURSES = {
  'TP-101': { title: 'Tax Preparer Certification Program', price: 599, hours: 60, ce_credits: 0 },
  'TP-201': { title: 'Advanced Tax Preparation', price: 799, hours: 75, ce_credits: 15 },
  'BT-301': { title: 'Business Tax & Bookkeeping', price: 699, hours: 65, ce_credits: 12 },
  'EA-401': { title: 'Enrolled Agent Exam Preparation', price: 899, hours: 90, ce_credits: 0 },
  'AI-501': { title: 'AI-Assisted Tax Learning', price: 399, hours: 30, ce_credits: 6 }
};

/**
 * POST /api/lms/enroll
 * 
 * Submit enrollment application
 */
lmsEnrollmentRouter.post('/enroll', async (req: any, env: any) => {
  try {
    const body = await req.json();
    
    // Validate required fields
    const required = ['first_name', 'last_name', 'email', 'phone', 'course_id', 'start_date', 'payment_method'];
    const missing = required.filter(field => !body[field]);
    
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missing.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate course
    const course = COURSES[body.course_id as keyof typeof COURSES];
    if (!course) {
      return new Response(
        JSON.stringify({ error: 'Invalid course ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const enrollmentId = uuid();
    const now = new Date().toISOString();
    
    // Encrypt PII
    const encFirstName = await encryptPII(body.first_name, env);
    const encLastName = await encryptPII(body.last_name, env);
    const encEmail = await encryptPII(body.email, env);
    const encPhone = await encryptPII(body.phone, env);
    
    // Create or find student record
    const existingStudent = await env.DB.prepare(
      'SELECT id FROM clients WHERE email = ?'
    ).bind(encEmail).first();
    
    let studentId: number;
    
    if (existingStudent) {
      studentId = existingStudent.id;
    } else {
      const studentResult = await env.DB.prepare(`
        INSERT INTO clients (
          full_name, 
          email, 
          phone, 
          status, 
          source,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, 'lms_applicant', 'academy_enrollment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        await encryptPII(`${body.first_name} ${body.last_name}`, env),
        encEmail,
        encPhone
      ).run();
      
      studentId = studentResult.meta.last_row_id;
    }
    
    // Create enrollment record
    await env.DB.prepare(`
      INSERT INTO lms_enrollments (
        id,
        student_id,
        enrollment_type,
        program_code,
        tuition_locked,
        enrollment_fee_locked,
        total_price_locked,
        payment_method,
        payment_plan_installments,
        status,
        enrolled_at,
        created_at,
        updated_at
      ) VALUES (?, ?, 'single', ?, ?, 0, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      enrollmentId,
      studentId,
      body.course_id,
      course.price,
      course.price,
      body.payment_method,
      body.payment_plan_months || null
    ).run();
    
    // Store enrollment details
    await env.DB.prepare(`
      INSERT INTO lms_enrollment_details (
        enrollment_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        state,
        zip,
        dob,
        start_date,
        financial_aid,
        employer_name,
        employer_email,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      enrollmentId,
      encFirstName,
      encLastName,
      encEmail,
      encPhone,
      body.address ? await encryptPII(body.address, env) : null,
      body.city || null,
      body.state || null,
      body.zip || null,
      body.dob || null,
      body.start_date,
      body.financial_aid || 'no',
      body.employer_name ? await encryptPII(body.employer_name, env) : null,
      body.employer_email ? await encryptPII(body.employer_email, env) : null
    ).run();
    
    // Log audit trail
    await logAudit(env, {
      user_id: null,
      action: 'lms_enrollment_submitted',
      entity: 'lms_enrollments',
      entity_id: enrollmentId,
      details: JSON.stringify({
        course_id: body.course_id,
        course_title: course.title,
        payment_method: body.payment_method,
        tuition: course.price
      }),
      ip_address: req.headers.get('cf-connecting-ip') || 'unknown'
    });
    
    // Send notification email (if configured)
    await sendEnrollmentNotification(env, body, course, enrollmentId);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Enrollment application submitted successfully',
        data: {
          enrollment_id: enrollmentId,
          student_id: studentId,
          course_title: course.title,
          tuition: course.price,
          status: 'pending',
          next_steps: [
            'We will review your application within 24 hours',
            'You will receive payment instructions via email',
            'Portal access will be granted after payment confirmation',
            'Course materials will be available on your start date'
          ]
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (err: any) {
    console.error('[LMS Enrollment] Error:', err);
    
    return new Response(
      JSON.stringify({ 
        error: 'Enrollment submission failed',
        message: err.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * GET /api/lms/enrollments/:id
 * 
 * Get enrollment details
 */
lmsEnrollmentRouter.get('/enrollments/:id', async (req: any, env: any) => {
  try {
    const enrollmentId = req.params.id;
    
    const enrollment = await env.DB.prepare(`
      SELECT 
        e.id,
        e.student_id,
        e.program_code,
        e.tuition_locked,
        e.total_price_locked,
        e.payment_method,
        e.status,
        e.enrolled_at,
        e.access_granted_at,
        e.completion_date
      FROM lms_enrollments e
      WHERE e.id = ?
    `).bind(enrollmentId).first();
    
    if (!enrollment) {
      return new Response(
        JSON.stringify({ error: 'Enrollment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data: enrollment }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (err: any) {
    console.error('[LMS Enrollment] Get error:', err);
    
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve enrollment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * POST /api/lms/certificates/generate
 * 
 * Generate completion certificate
 */
lmsEnrollmentRouter.post('/certificates/generate', async (req: any, env: any) => {
  try {
    const body = await req.json();
    
    const { enrollment_id, student_name, course_title, completion_date, hours_completed, instructor_name } = body;
    
    if (!enrollment_id || !student_name || !course_title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const certificateId = uuid();
    const verificationCode = generateVerificationCode();
    const now = new Date().toISOString();
    
    // Create certificate record
    await env.DB.prepare(`
      INSERT INTO lms_certificates (
        id,
        enrollment_id,
        student_name,
        course_title,
        completion_date,
        hours_completed,
        instructor_name,
        verification_code,
        issued_at,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'active', CURRENT_TIMESTAMP)
    `).bind(
      certificateId,
      enrollment_id,
      await encryptPII(student_name, env),
      course_title,
      completion_date || now,
      hours_completed || 0,
      instructor_name || 'Ross Tax Academy',
      verificationCode
    ).run();
    
    // Update enrollment status
    await env.DB.prepare(`
      UPDATE lms_enrollments 
      SET status = 'completed', completion_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(completion_date || now, enrollment_id).run();
    
    // Log audit trail
    await logAudit(env, {
      user_id: null,
      action: 'lms_certificate_issued',
      entity: 'lms_certificates',
      entity_id: certificateId,
      details: JSON.stringify({
        enrollment_id,
        course_title,
        verification_code: verificationCode
      }),
      ip_address: req.headers.get('cf-connecting-ip') || 'unknown'
    });
    
    // Generate certificate data
    const certificateData = {
      certificate_id: certificateId,
      student_name: student_name,
      course_title: course_title,
      completion_date: completion_date || now,
      hours_completed: hours_completed || 0,
      verification_code: verificationCode,
      verification_url: `https://rosstaxacademy.com/verify?code=${verificationCode}`,
      qr_code_data: `${verificationCode}|${course_title}|${student_name}`,
      instructor_name: instructor_name || 'Ross Tax Academy',
      issued_date: now
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Certificate generated successfully',
        data: certificateData
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (err: any) {
    console.error('[LMS Certificate] Generation error:', err);
    
    return new Response(
      JSON.stringify({ 
        error: 'Certificate generation failed',
        message: err.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * GET /api/lms/certificates/verify/:code
 * 
 * Verify certificate authenticity
 */
lmsEnrollmentRouter.get('/certificates/verify/:code', async (req: any, env: any) => {
  try {
    const verificationCode = req.params.code;
    
    const certificate = await env.DB.prepare(`
      SELECT 
        id,
        course_title,
        completion_date,
        hours_completed,
        issued_at,
        status
      FROM lms_certificates
      WHERE verification_code = ?
    `).bind(verificationCode).first();
    
    if (!certificate) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          message: 'Certificate not found or invalid verification code'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (certificate.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          valid: false,
          message: 'Certificate has been revoked or is no longer active'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        valid: true,
        message: 'Certificate verified successfully',
        data: {
          certificate_id: certificate.id,
          course_title: certificate.course_title,
          completion_date: certificate.completion_date,
          hours_completed: certificate.hours_completed,
          issued_at: certificate.issued_at,
          verified_at: new Date().toISOString()
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (err: any) {
    console.error('[LMS Certificate] Verification error:', err);
    
    return new Response(
      JSON.stringify({ error: 'Verification failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Generate verification code
function generateVerificationCode(): string {
  const prefix = 'RTA';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Helper: Send enrollment notification
async function sendEnrollmentNotification(env: any, enrollmentData: any, course: any, enrollmentId: string): Promise<void> {
  try {
    // If MailChannels or notification system is configured
    if (!env.TO_EMAIL) return;
    
    const emailHtml = `
      <h2>New Academy Enrollment</h2>
      <p><strong>Enrollment ID:</strong> ${enrollmentId}</p>
      <p><strong>Student:</strong> ${enrollmentData.first_name} ${enrollmentData.last_name}</p>
      <p><strong>Email:</strong> ${enrollmentData.email}</p>
      <p><strong>Phone:</strong> ${enrollmentData.phone}</p>
      <p><strong>Course:</strong> ${course.title}</p>
      <p><strong>Tuition:</strong> $${course.price}</p>
      <p><strong>Payment Method:</strong> ${enrollmentData.payment_method}</p>
      <p><strong>Start Date:</strong> ${enrollmentData.start_date}</p>
      <p><strong>Financial Aid:</strong> ${enrollmentData.financial_aid || 'None'}</p>
    `;
    
    // Send via configured notification system
    console.log('[LMS] Enrollment notification:', emailHtml);
    
  } catch (err) {
    console.error('[LMS] Notification error:', err);
  }
}

export default lmsEnrollmentRouter;
