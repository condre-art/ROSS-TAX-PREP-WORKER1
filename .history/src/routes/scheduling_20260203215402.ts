// src/routes/scheduling.ts
// Day/night class scheduling system with student enrollment

import { Router } from 'itty-router';
import { verifyAuth } from '../utils/auth';
import { logAudit } from '../utils/audit';

const router = Router();

interface ClassSection {
  id: string;
  courseId: string;
  sectionNumber: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  daysOfWeek: string; // MWF, TR, MTWRF
  termId: string;
  aiProfessorId?: string;
  maxStudents: number;
  enrolledCount: number;
  status: 'open' | 'full' | 'cancelled';
  createdAt: string;
}

/**
 * Get all class schedules
 * GET /api/schedule/classes
 */
router.get('/api/schedule/classes', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = env.DB;
    const classes = await db
      .prepare(
        `SELECT cs.*, ap.professor_name
         FROM class_schedules cs
         LEFT JOIN ai_professors ap ON cs.ai_professor_id = ap.id
         ORDER BY cs.start_time, cs.course_id`
      )
      .all();

    return new Response(JSON.stringify(classes.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get schedules for specific course
 * GET /api/schedule/classes/:courseId
 */
router.get('/api/schedule/classes/:courseId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { courseId } = req.params;
    const db = env.DB;

    const classes = await db
      .prepare(
        `SELECT cs.*, ap.professor_name
         FROM class_schedules cs
         LEFT JOIN ai_professors ap ON cs.ai_professor_id = ap.id
         WHERE cs.course_id = ?
         ORDER BY cs.start_time`
      )
      .bind(courseId)
      .all();

    return new Response(JSON.stringify(classes.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching course schedules:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get available time slots (by time of day)
 * GET /api/schedule/available?timeOfDay=morning&courseId=tax-1101
 */
router.get('/api/schedule/available', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { timeOfDay, courseId } = req.query;

    if (!timeOfDay || !courseId) {
      return new Response(
        JSON.stringify({ error: 'timeOfDay and courseId required' }),
        { status: 400 }
      );
    }

    const db = env.DB;
    const available = await db
      .prepare(
        `SELECT * FROM class_schedules
         WHERE course_id = ? AND time_of_day = ? AND status IN ('open', 'available')
         ORDER BY start_time`
      )
      .bind(courseId, timeOfDay)
      .all();

    return new Response(JSON.stringify(available.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching available slots:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Create new class section (admin only)
 * POST /api/schedule/classes
 */
router.post('/api/schedule/classes', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin' && auth.role !== 'manager') {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const {
      courseId,
      sectionNumber,
      timeOfDay,
      startTime,
      endTime,
      daysOfWeek,
      termId,
      aiProfessorId,
      maxStudents = 30
    } = body;

    // Validate required fields
    if (!courseId || !sectionNumber || !timeOfDay || !startTime || !endTime || !daysOfWeek || !termId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Validate timeOfDay
    if (!['morning', 'afternoon', 'evening'].includes(timeOfDay)) {
      return new Response(
        JSON.stringify({ error: 'Invalid timeOfDay (morning, afternoon, evening)' }),
        { status: 400 }
      );
    }

    const db = env.DB;
    const id = `class-${courseId}-${sectionNumber}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const result = await db
      .prepare(
        `INSERT INTO class_schedules
        (id, course_id, section_number, time_of_day, start_time, end_time, days_of_week, term_id, ai_professor_id, max_students, enrolled_count, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'open', ?)`
      )
      .bind(
        id,
        courseId,
        sectionNumber,
        timeOfDay,
        startTime,
        endTime,
        daysOfWeek,
        termId,
        aiProfessorId || null,
        maxStudents,
        now
      )
      .run();

    await logAudit(db, auth.userId, 'CREATE_CLASS_SCHEDULE', 'class_schedule', id, {
      courseId,
      timeOfDay,
      sectionNumber
    });

    return new Response(
      JSON.stringify({
        success: true,
        id,
        message: 'Class section created successfully'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error creating class schedule:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Enroll student in class section
 * POST /api/schedule/enroll
 */
router.post('/api/schedule/enroll', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { classScheduleId, enrollmentId, studentId } = body;

    if (!classScheduleId || !enrollmentId) {
      return new Response(
        JSON.stringify({ error: 'classScheduleId and enrollmentId required' }),
        { status: 400 }
      );
    }

    const db = env.DB;

    // Check class availability
    const classSchedule = await db
      .prepare('SELECT * FROM class_schedules WHERE id = ?')
      .bind(classScheduleId)
      .first();

    if (!classSchedule) {
      return new Response(JSON.stringify({ error: 'Class not found' }), {
        status: 404
      });
    }

    if (classSchedule.status !== 'open') {
      return new Response(
        JSON.stringify({ error: `Class is ${classSchedule.status}` }),
        { status: 400 }
      );
    }

    if (classSchedule.enrolled_count >= classSchedule.max_students) {
      // Update status to full
      await db
        .prepare('UPDATE class_schedules SET status = ? WHERE id = ?')
        .bind('full', classScheduleId)
        .run();

      return new Response(
        JSON.stringify({ error: 'Class is full' }),
        { status: 400 }
      );
    }

    // Check if student already enrolled in this class
    const existing = await db
      .prepare(
        'SELECT id FROM student_class_enrollments WHERE class_schedule_id = ? AND enrollment_id = ?'
      )
      .bind(classScheduleId, enrollmentId)
      .first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Student already enrolled in this class' }),
        { status: 400 }
      );
    }

    // Enroll student
    const enrollmentId_class = `enroll-${classScheduleId}-${enrollmentId}`;
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO student_class_enrollments
        (id, class_schedule_id, enrollment_id, student_id, enrolled_at, status)
        VALUES (?, ?, ?, ?, ?, 'active')`
      )
      .bind(enrollmentId_class, classScheduleId, enrollmentId, studentId || null, now)
      .run();

    // Increment enrolled count
    await db
      .prepare(
        'UPDATE class_schedules SET enrolled_count = enrolled_count + 1 WHERE id = ?'
      )
      .bind(classScheduleId)
      .run();

    await logAudit(db, auth.userId, 'ENROLL_CLASS', 'class_enrollment', enrollmentId_class, {
      classScheduleId,
      enrollmentId
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully enrolled in class',
        classScheduleId,
        timeOfDay: classSchedule.time_of_day
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error enrolling in class:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get student's enrolled classes
 * GET /api/schedule/my-classes/:enrollmentId
 */
router.get('/api/schedule/my-classes/:enrollmentId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { enrollmentId } = req.params;
    const db = env.DB;

    const classes = await db
      .prepare(
        `SELECT cs.*, ap.professor_name
         FROM student_class_enrollments sce
         JOIN class_schedules cs ON sce.class_schedule_id = cs.id
         LEFT JOIN ai_professors ap ON cs.ai_professor_id = ap.id
         WHERE sce.enrollment_id = ? AND sce.status = 'active'
         ORDER BY cs.start_time`
      )
      .bind(enrollmentId)
      .all();

    return new Response(JSON.stringify(classes.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching student classes:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Drop class (student)
 * DELETE /api/schedule/classes/:classScheduleId/drop/:enrollmentId
 */
router.delete('/api/schedule/classes/:classScheduleId/drop/:enrollmentId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { classScheduleId, enrollmentId } = req.params;
    const db = env.DB;

    // Mark as dropped
    await db
      .prepare(
        'UPDATE student_class_enrollments SET status = ? WHERE class_schedule_id = ? AND enrollment_id = ?'
      )
      .bind('dropped', classScheduleId, enrollmentId)
      .run();

    // Decrement enrolled count
    await db
      .prepare('UPDATE class_schedules SET enrolled_count = enrolled_count - 1 WHERE id = ?')
      .bind(classScheduleId)
      .run();

    // Update class status if needed
    const classSchedule = await db
      .prepare('SELECT * FROM class_schedules WHERE id = ?')
      .bind(classScheduleId)
      .first();

    if (classSchedule && classSchedule.status === 'full') {
      await db
        .prepare('UPDATE class_schedules SET status = ? WHERE id = ?')
        .bind('open', classScheduleId)
        .run();
    }

    await logAudit(db, auth.userId, 'DROP_CLASS', 'class_enrollment', classScheduleId, {
      enrollmentId
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Successfully dropped class' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error dropping class:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Update class schedule (admin)
 * PUT /api/schedule/classes/:id
 */
router.put('/api/schedule/classes/:id', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin' && auth.role !== 'manager') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = req.params;
    const body = await req.json();
    const db = env.DB;

    // Build update query
    const updates = [];
    const bindings = [];

    if (body.aiProfessorId !== undefined) {
      updates.push('ai_professor_id = ?');
      bindings.push(body.aiProfessorId);
    }
    if (body.maxStudents !== undefined) {
      updates.push('max_students = ?');
      bindings.push(body.maxStudents);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      bindings.push(body.status);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400
      });
    }

    bindings.push(id);
    const query = `UPDATE class_schedules SET ${updates.join(', ')} WHERE id = ?`;

    await db.prepare(query).bind(...bindings).run();

    await logAudit(db, auth.userId, 'UPDATE_CLASS_SCHEDULE', 'class_schedule', id, {
      updates: Object.keys(body)
    });

    return new Response(JSON.stringify({ success: true, message: 'Updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error updating class schedule:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Cancel class (admin only)
 * PATCH /api/schedule/classes/:id/cancel
 */
router.patch('/api/schedule/classes/:id/cancel', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = req.params;
    const body = await req.json();
    const { reason } = body;

    const db = env.DB;

    await db
      .prepare('UPDATE class_schedules SET status = ? WHERE id = ?')
      .bind('cancelled', id)
      .run();

    await logAudit(db, auth.userId, 'CANCEL_CLASS', 'class_schedule', id, {
      reason
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Class cancelled' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error cancelling class:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

export default router;
