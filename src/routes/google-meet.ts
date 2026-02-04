// src/routes/google-meet.ts
// Google Meet integration for live lectures and office hours

import { Router } from 'itty-router';
import { verifyAuth } from '../utils/auth';
import { logAudit } from '../utils/audit';

const router = Router();

interface MeetingSession {
  id: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  meetingType: 'lecture' | 'office-hours' | 'study-group';
  scheduledTime: string;
  duration: number; // minutes
  meetUrl: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  instructorId: string;
  maxParticipants?: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

/**
 * Create lecture meeting
 * POST /api/meet/create-lecture
 */
router.post('/api/meet/create-lecture', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || (auth.role !== 'instructor' && auth.role !== 'admin')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const {
      courseId,
      lessonId,
      lessonTitle,
      scheduledTime,
      duration = 60,
      recordingEnabled = true
    } = body;

    if (!courseId || !lessonId || !scheduledTime) {
      return new Response(
        JSON.stringify({ error: 'courseId, lessonId, and scheduledTime required' }),
        { status: 400 }
      );
    }

    // Verify Google Meet integration enabled
    if (env.GOOGLE_MEET_ENABLED !== 'true') {
      return new Response(
        JSON.stringify({ error: 'Google Meet integration not enabled' }),
        { status: 503 }
      );
    }

    const db = env.DB;
    const meetingId = `meet-${courseId}-${lessonId}-${Date.now()}`;
    const now = new Date().toISOString();

    // Create calendar event with Google Meet
    const meetingResponse = await createGoogleMeet(env, {
      courseId,
      lessonId,
      lessonTitle,
      scheduledTime,
      duration,
      recordingEnabled
    });

    if (!meetingResponse.success) {
      return new Response(
        JSON.stringify({ error: 'Failed to create Google Meet', details: meetingResponse.error }),
        { status: 400 }
      );
    }

    // Store meeting in database
    await db
      .prepare(
        `INSERT INTO google_meet_sessions
        (id, course_id, lesson_id, lesson_title, meeting_type, scheduled_time, duration, meet_url, instructor_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'lecture', ?, ?, ?, ?, 'scheduled', ?, ?)`
      )
      .bind(
        meetingId,
        courseId,
        lessonId,
        lessonTitle,
        scheduledTime,
        duration,
        meetingResponse.meetUrl,
        auth.userId,
        now,
        now
      )
      .run();

    await logAudit(db, auth.userId, 'CREATE_LECTURE_MEETING', 'google_meet_session', meetingId, {
      courseId,
      lessonId,
      scheduledTime
    });

    return new Response(
      JSON.stringify({
        success: true,
        meetingId,
        meetUrl: meetingResponse.meetUrl,
        inviteLink: meetingResponse.meetUrl,
        message: 'Lecture meeting created'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error creating lecture meeting:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get lecture meeting details
 * GET /api/meet/lectures/:meetingId
 */
router.get('/api/meet/lectures/:meetingId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { meetingId } = req.params;
    const db = env.DB;

    const meeting = await db
      .prepare('SELECT * FROM google_meet_sessions WHERE id = ?')
      .bind(meetingId)
      .first();

    if (!meeting) {
      return new Response(JSON.stringify({ error: 'Meeting not found' }), {
        status: 404
      });
    }

    return new Response(JSON.stringify(meeting), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching meeting:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get all lectures for course
 * GET /api/meet/courses/:courseId/lectures
 */
router.get('/api/meet/courses/:courseId/lectures', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { courseId } = req.params;
    const db = env.DB;

    const lectures = await db
      .prepare(
        `SELECT * FROM google_meet_sessions
         WHERE course_id = ? AND meeting_type = 'lecture'
         ORDER BY scheduled_time`
      )
      .bind(courseId)
      .all();

    return new Response(JSON.stringify(lectures.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching lectures:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Schedule office hours meeting
 * POST /api/meet/office-hours
 */
router.post('/api/meet/office-hours', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || (auth.role !== 'instructor' && auth.role !== 'admin')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { courseId, title, scheduledTime, duration = 60 } = body;

    if (!courseId || !scheduledTime) {
      return new Response(
        JSON.stringify({ error: 'courseId and scheduledTime required' }),
        { status: 400 }
      );
    }

    const db = env.DB;
    const meetingId = `office-hours-${courseId}-${Date.now()}`;
    const now = new Date().toISOString();

    // Create Google Meet
    const meetingResponse = await createGoogleMeet(env, {
      courseId,
      lessonId: `office-hours-${courseId}`,
      lessonTitle: title || `Office Hours - ${courseId}`,
      scheduledTime,
      duration,
      recordingEnabled: false
    });

    if (!meetingResponse.success) {
      return new Response(
        JSON.stringify({ error: 'Failed to create office hours meeting' }),
        { status: 400 }
      );
    }

    // Store in database
    await db
      .prepare(
        `INSERT INTO google_meet_sessions
        (id, course_id, lesson_id, lesson_title, meeting_type, scheduled_time, duration, meet_url, instructor_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'office-hours', ?, ?, ?, ?, 'scheduled', ?, ?)`
      )
      .bind(
        meetingId,
        courseId,
        `office-hours-${courseId}`,
        title || `Office Hours - ${courseId}`,
        scheduledTime,
        duration,
        meetingResponse.meetUrl,
        auth.userId,
        now,
        now
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        meetingId,
        meetUrl: meetingResponse.meetUrl
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error creating office hours:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get upcoming lectures (student view)
 * GET /api/meet/my-lectures/:enrollmentId
 */
router.get('/api/meet/my-lectures/:enrollmentId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { enrollmentId } = req.params;
    const db = env.DB;

    // Get student's enrolled courses
    const enrollments = await db
      .prepare(
        `SELECT DISTINCT cs.course_id
         FROM student_class_enrollments sce
         JOIN class_schedules cs ON sce.class_schedule_id = cs.id
         WHERE sce.enrollment_id = ? AND sce.status = 'active'`
      )
      .bind(enrollmentId)
      .all();

    const courseIds = enrollments.results.map((e: any) => e.course_id);

    if (courseIds.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get upcoming lectures for enrolled courses
    const placeholders = courseIds.map(() => '?').join(',');
    const lectures = await db
      .prepare(
        `SELECT * FROM google_meet_sessions
         WHERE course_id IN (${placeholders}) AND meeting_type = 'lecture' AND scheduled_time > datetime('now')
         ORDER BY scheduled_time`
      )
      .bind(...courseIds)
      .all();

    return new Response(JSON.stringify(lectures.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching student lectures:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Upload pre-recorded lecture
 * POST /api/meet/upload-recording
 */
router.post('/api/meet/upload-recording', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || (auth.role !== 'instructor' && auth.role !== 'admin')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const {
      courseId,
      lessonId,
      lessonTitle,
      recordingUrl, // YouTube, Vimeo, or direct URL
      transcriptUrl,
      duration
    } = body;

    if (!courseId || !lessonId || !recordingUrl) {
      return new Response(
        JSON.stringify({ error: 'courseId, lessonId, and recordingUrl required' }),
        { status: 400 }
      );
    }

    const db = env.DB;
    const meetingId = `pre-recorded-${courseId}-${lessonId}-${Date.now()}`;
    const now = new Date().toISOString();

    // Create entry for pre-recorded lecture (no live scheduling)
    await db
      .prepare(
        `INSERT INTO google_meet_sessions
        (id, course_id, lesson_id, lesson_title, meeting_type, scheduled_time, duration, meet_url, recording_url, transcript_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'lecture', ?, ?, ?, ?, ?, 'completed', ?, ?)`
      )
      .bind(
        meetingId,
        courseId,
        lessonId,
        lessonTitle,
        now,
        duration || 0,
        recordingUrl,
        recordingUrl,
        transcriptUrl || null,
        now,
        now
      )
      .run();

    await logAudit(db, auth.userId, 'UPLOAD_RECORDING', 'google_meet_session', meetingId, {
      courseId,
      lessonId
    });

    return new Response(
      JSON.stringify({
        success: true,
        meetingId,
        message: 'Pre-recorded lecture uploaded'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error uploading recording:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get recorded lecture with transcript
 * GET /api/meet/recordings/:courseId/:lessonId
 */
router.get('/api/meet/recordings/:courseId/:lessonId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { courseId, lessonId } = req.params;
    const db = env.DB;

    const recording = await db
      .prepare(
        `SELECT * FROM google_meet_sessions
         WHERE course_id = ? AND lesson_id = ? AND recording_url IS NOT NULL`
      )
      .bind(courseId, lessonId)
      .first();

    if (!recording) {
      return new Response(JSON.stringify({ error: 'Recording not found' }), {
        status: 404
      });
    }

    return new Response(JSON.stringify(recording), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching recording:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Mark lecture as live (update status when instructor starts)
 * PATCH /api/meet/lectures/:meetingId/start
 */
router.patch('/api/meet/lectures/:meetingId/start', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { meetingId } = req.params;
    const db = env.DB;

    await db
      .prepare("UPDATE google_meet_sessions SET status = 'live' WHERE id = ?")
      .bind(meetingId)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Lecture started' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error starting lecture:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Mark lecture as completed
 * PATCH /api/meet/lectures/:meetingId/complete
 */
router.patch('/api/meet/lectures/:meetingId/complete', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { meetingId } = req.params;
    const body = await req.json();
    const { recordingUrl, participantCount } = body;

    const db = env.DB;

    const updates = ["status = 'completed'"];
    const bindings = [];

    if (recordingUrl) {
      updates.push('recording_url = ?');
      bindings.push(recordingUrl);
    }

    if (participantCount !== undefined) {
      updates.push('participants_count = ?');
      bindings.push(participantCount);
    }

    bindings.push(meetingId);

    const query = `UPDATE google_meet_sessions SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(query).bind(...bindings).run();

    return new Response(
      JSON.stringify({ success: true, message: 'Lecture completed' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error completing lecture:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Cancel lecture
 * DELETE /api/meet/lectures/:meetingId
 */
router.delete('/api/meet/lectures/:meetingId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || (auth.role !== 'instructor' && auth.role !== 'admin')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { meetingId } = req.params;
    const db = env.DB;

    await db
      .prepare("UPDATE google_meet_sessions SET status = 'cancelled' WHERE id = ?")
      .bind(meetingId)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Lecture cancelled' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error cancelling lecture:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Helper: Create Google Meet via Calendar API
 */
async function createGoogleMeet(env: any, params: any): Promise<any> {
  try {
    const { courseId, lessonId, lessonTitle, scheduledTime, duration, recordingEnabled } = params;

    const startDateTime = new Date(scheduledTime);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GOOGLE_REFRESH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: `${lessonTitle}`,
          description: `Course: ${courseId}\nLesson: ${lessonId}`,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          conferenceData: {
            createRequest: {
              requestId: `${courseId}-${lessonId}-${Date.now()}`
            }
          },
          attendees: [],
          visibility: recordingEnabled ? 'private' : 'public'
        })
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Google Calendar API error: ${response.status}`
      };
    }

    const data = await response.json();
    const meetUrl = data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri;

    return {
      success: true,
      meetUrl: meetUrl || data.htmlLink,
      eventId: data.id
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export default router;
