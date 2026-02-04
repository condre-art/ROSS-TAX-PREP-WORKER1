// src/routes/proctor.ts
// Proctor-U exam proctoring integration

import { Router } from 'itty-router';
import { verifyAuth } from '../utils/auth';
import { logAudit } from '../utils/audit';

const router = Router();

interface ProctorSession {
  id: string;
  enrollmentId: string;
  examId: string;
  examTitle: string;
  scheduledTime: string;
  sessionId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'flagged';
  recordingUrl?: string;
  proctorNotes?: string;
  examScore?: number;
  flaggedForReview: boolean;
  createdAt: string;
}

/**
 * Get available exam dates/times
 * GET /api/proctor/availability/:examId
 */
router.get('/api/proctor/availability/:examId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { examId } = req.params;

    // Return available time slots for proctored exam
    // In production, this would query Proctor-U's calendar availability
    const availability = {
      examId,
      availableSlots: [
        { time: '2025-02-01T09:00:00Z', slots: 5 },
        { time: '2025-02-01T14:00:00Z', slots: 3 },
        { time: '2025-02-02T09:00:00Z', slots: 5 },
        { time: '2025-02-02T14:00:00Z', slots: 4 },
        { time: '2025-02-03T09:00:00Z', slots: 5 }
      ]
    };

    return new Response(JSON.stringify(availability), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching proctor availability:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Schedule proctor-supervised exam
 * POST /api/proctor/schedule
 */
router.post('/api/proctor/schedule', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { enrollmentId, examId, examTitle, scheduledTime } = body;

    // Validate required fields
    if (!enrollmentId || !examId || !scheduledTime) {
      return new Response(
        JSON.stringify({ error: 'enrollmentId, examId, and scheduledTime required' }),
        { status: 400 }
      );
    }

    const db = env.DB;
    const proctorSessionId = `proctor-${examId}-${enrollmentId}-${Date.now()}`;
    const now = new Date().toISOString();

    // Verify Proctor-U integration enabled
    if (env.PROCTOR_U_ENABLED !== 'true') {
      return new Response(
        JSON.stringify({ error: 'Proctor-U integration not enabled' }),
        { status: 503 }
      );
    }

    // Call Proctor-U API to schedule exam
    const proctorResponse = await scheduleProctorUExam(env, {
      accountId: env.PROCTOR_U_ACCOUNT_ID,
      enrollmentId,
      examId,
      scheduledTime,
      studentEmail: auth.email
    });

    if (!proctorResponse.success) {
      return new Response(
        JSON.stringify({ error: 'Failed to schedule with Proctor-U', details: proctorResponse.error }),
        { status: 400 }
      );
    }

    // Store session in database
    const result = await db
      .prepare(
        `INSERT INTO proctor_sessions
        (id, enrollment_id, exam_id, exam_title, scheduled_time, session_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?)`
      )
      .bind(
        proctorSessionId,
        enrollmentId,
        examId,
        examTitle || `Exam ${examId}`,
        scheduledTime,
        proctorResponse.sessionId,
        now
      )
      .run();

    await logAudit(db, auth.userId, 'SCHEDULE_PROCTOR_EXAM', 'proctor_session', proctorSessionId, {
      examId,
      enrollmentId,
      scheduledTime
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: proctorSessionId,
        proctorSessionId: proctorResponse.sessionId,
        message: 'Exam scheduled with proctor',
        joinUrl: proctorResponse.joinUrl,
        instructions: [
          'Log in 15 minutes early for identity verification',
          'Have valid government ID ready',
          'Ensure camera and microphone working',
          'Use Chrome or Firefox browser',
          'Have backup internet connection available'
        ]
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error scheduling proctor exam:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get proctor session details
 * GET /api/proctor/sessions/:sessionId
 */
router.get('/api/proctor/sessions/:sessionId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { sessionId } = req.params;
    const db = env.DB;

    const session = await db
      .prepare('SELECT * FROM proctor_sessions WHERE id = ?')
      .bind(sessionId)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404
      });
    }

    // Only owner or admin can view
    if (session.enrollment_id !== auth.enrollmentId && auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching proctor session:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get student's proctor sessions
 * GET /api/proctor/my-sessions/:enrollmentId
 */
router.get('/api/proctor/my-sessions/:enrollmentId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { enrollmentId } = req.params;

    // Only student or admin can view their sessions
    if (enrollmentId !== auth.enrollmentId && auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = env.DB;
    const sessions = await db
      .prepare('SELECT * FROM proctor_sessions WHERE enrollment_id = ? ORDER BY scheduled_time DESC')
      .bind(enrollmentId)
      .all();

    return new Response(JSON.stringify(sessions.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching student proctor sessions:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get session status (check if live, completed, etc)
 * GET /api/proctor/sessions/:sessionId/status
 */
router.get('/api/proctor/sessions/:sessionId/status', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { sessionId } = req.params;
    const db = env.DB;

    const session = await db
      .prepare('SELECT id, status, flagged_for_review, exam_score FROM proctor_sessions WHERE id = ?')
      .bind(sessionId)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404
      });
    }

    return new Response(
      JSON.stringify({
        sessionId,
        status: session.status,
        flaggedForReview: session.flagged_for_review === 1,
        examScore: session.exam_score
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error fetching session status:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Receive proctor session completion webhook from Proctor-U
 * POST /webhooks/proctor
 */
router.post('/webhooks/proctor', async (req: any, env: any, ctx: any) => {
  try {
    const body = await req.json();
    const { sessionId, status, recordingUrl, proctorNotes, flagged, examScore } = body;

    const db = env.DB;

    // Update session status
    const updates = ['status = ?'];
    const bindings = [status];

    if (recordingUrl) {
      updates.push('recording_url = ?');
      bindings.push(recordingUrl);
    }

    if (proctorNotes) {
      updates.push('proctor_notes = ?');
      bindings.push(proctorNotes);
    }

    if (flagged !== undefined) {
      updates.push('flagged_for_review = ?');
      bindings.push(flagged ? 1 : 0);
    }

    if (examScore !== undefined) {
      updates.push('exam_score = ?');
      bindings.push(examScore);
    }

    bindings.push(sessionId);

    const query = `UPDATE proctor_sessions SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(query).bind(...bindings).run();

    // If flagged, log for admin review
    if (flagged) {
      await logAudit(db, 'proctor-system', 'EXAM_FLAGGED', 'proctor_session', sessionId, {
        reason: proctorNotes
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Session updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error processing proctor webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Admin: Get flagged exams for review
 * GET /admin/proctor/flagged
 */
router.get('/admin/proctor/flagged', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = env.DB;
    const flagged = await db
      .prepare(
        `SELECT ps.*, e.student_name, e.student_email
         FROM proctor_sessions ps
         JOIN enrollments e ON ps.enrollment_id = e.id
         WHERE ps.flagged_for_review = 1
         ORDER BY ps.created_at DESC`
      )
      .all();

    return new Response(JSON.stringify(flagged.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching flagged exams:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Admin: Review flagged exam
 * POST /admin/proctor/review/:sessionId
 */
router.post('/admin/proctor/review/:sessionId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { sessionId } = req.params;
    const body = await req.json();
    const { decision, notes } = body; // decision: 'approved', 'rejected', 'investigate'

    if (!['approved', 'rejected', 'investigate'].includes(decision)) {
      return new Response(JSON.stringify({ error: 'Invalid decision' }), { status: 400 });
    }

    const db = env.DB;

    await db
      .prepare(
        'UPDATE proctor_sessions SET flagged_for_review = 0, proctor_notes = ? WHERE id = ?'
      )
      .bind(`[ADMIN REVIEW] ${decision}: ${notes}`, sessionId)
      .run();

    await logAudit(db, auth.userId, 'REVIEW_FLAGGED_EXAM', 'proctor_session', sessionId, {
      decision,
      notes
    });

    return new Response(
      JSON.stringify({ success: true, message: `Exam ${decision}` }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error reviewing flagged exam:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Cancel proctor session (student can cancel before exam)
 * DELETE /api/proctor/sessions/:sessionId
 */
router.delete('/api/proctor/sessions/:sessionId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { sessionId } = req.params;
    const db = env.DB;

    const session = await db
      .prepare('SELECT * FROM proctor_sessions WHERE id = ?')
      .bind(sessionId)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404
      });
    }

    // Only allow cancellation if scheduled and not yet started
    if (!['scheduled'].includes(session.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot cancel ${session.status} exam` }),
        { status: 400 }
      );
    }

    // Check time - can only cancel if more than 24 hours before
    const scheduledTime = new Date(session.scheduled_time);
    const hoursUntilExam = (scheduledTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilExam < 24) {
      return new Response(
        JSON.stringify({ error: 'Cannot cancel within 24 hours of exam' }),
        { status: 400 }
      );
    }

    // Call Proctor-U API to cancel
    if (session.session_id) {
      // await cancelProctorUSession(env, session.session_id);
    }

    // Mark as cancelled in database
    await db
      .prepare("UPDATE proctor_sessions SET status = 'cancelled' WHERE id = ?")
      .bind(sessionId)
      .run();

    await logAudit(db, auth.userId, 'CANCEL_PROCTOR_SESSION', 'proctor_session', sessionId, {});

    return new Response(JSON.stringify({ success: true, message: 'Session cancelled' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error cancelling proctor session:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Helper: Schedule exam with Proctor-U API
 */
async function scheduleProctorUExam(env: any, params: any): Promise<any> {
  try {
    const { accountId, enrollmentId, examId, scheduledTime, studentEmail } = params;

    const response = await fetch(
      `${env.PROCTOR_U_ENDPOINT || 'https://api.proctorexam.com/api/v1'}/schedule-exam`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.PROCTOR_U_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Account-ID': accountId
        },
        body: JSON.stringify({
          accountId,
          examId,
          enrollmentId,
          studentEmail,
          scheduledTime,
          settings: {
            requireIdVerification: true,
            requireFaceDetection: true,
            allowCalculator: false,
            allowNotes: false,
            browserLockdown: true,
            recordAudio: true,
            recordVideo: true
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Proctor-U API error: ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      sessionId: data.sessionId,
      joinUrl: data.joinUrl
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export default router;
