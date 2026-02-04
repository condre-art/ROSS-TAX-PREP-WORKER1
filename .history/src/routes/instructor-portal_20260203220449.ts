/**
 * Instructor Portal
 * Main portal for teachers with tabs for: Attendance, Lesson Plans, Gradebook, Transcripts
 */

import { Router } from 'itty-router';
import { verifyAuth } from './auth';

interface InstructorDashboard {
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  assignedCourses: Array<{
    classScheduleId: string;
    courseName: string;
    enrolledStudents: number;
    status: string;
  }>;
  pendingTasks: {
    unreadNotifications: number;
    pendingGradebook: number;
    draftLessonPlans: number;
  };
  lastLogin: string;
  availableTabs: string[];
}

export const createInstructorPortalRouter = (env: any) => {
  const router = Router();

  /**
   * GET /api/instructor/dashboard
   * Main instructor portal dashboard
   */
  router.get('/api/instructor/dashboard', verifyAuth(['teacher']), async (req) => {
    try {
      const userId = (req as any).user?.id || 'unknown';

      // Get instructor info
      const instructor = await env.DB.prepare(
        `SELECT user_id, email, first_name, last_name 
         FROM role_emails 
         WHERE user_id = ? AND role = 'teacher'`
      )
        .bind(userId)
        .first();

      if (!instructor) {
        return new Response(JSON.stringify({ error: 'Instructor not found' }), { status: 404 });
      }

      // Get assigned courses
      const courses = await env.DB.prepare(
        `SELECT cs.id, cs.course_name, COUNT(DISTINCT sce.enrollment_id) as enrolled_count, cs.status
         FROM class_schedules cs
         LEFT JOIN student_class_enrollments sce ON cs.id = sce.class_schedule_id
         WHERE cs.ai_professor_id = ? OR cs.id IN (
           SELECT class_schedule_id FROM instructor_assignments WHERE instructor_id = ?
         )
         GROUP BY cs.id, cs.course_name, cs.status`
      )
        .bind(userId, userId)
        .all();

      // Count ungraded assignments
      const ungradedCount = await env.DB.prepare(
        `SELECT COUNT(*) as count 
         FROM assignments a
         WHERE a.class_schedule_id IN (
           SELECT id FROM class_schedules WHERE ai_professor_id = ? OR id IN (
             SELECT class_schedule_id FROM instructor_assignments WHERE instructor_id = ?
           )
         )
         AND NOT EXISTS (
           SELECT 1 FROM grades g WHERE g.assignment_id = a.id
         )`
      )
        .bind(userId, userId)
        .first();

      // Count draft lesson plans
      const draftPlans = await env.DB.prepare(
        `SELECT COUNT(*) as count 
         FROM lesson_plans 
         WHERE created_by = ? AND status = 'draft'`
      )
        .bind(userId)
        .first();

      // Get unread notifications count
      const notifications = await env.DB.prepare(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE recipient_id = ? AND read_at IS NULL`
      )
        .bind(userId)
        .first();

      const dashboard: InstructorDashboard = {
        instructorId: userId,
        instructorName: `${instructor.first_name} ${instructor.last_name}`,
        instructorEmail: instructor.email,
        assignedCourses: (courses.results || []).map((c: any) => ({
          classScheduleId: c.id,
          courseName: c.course_name,
          enrolledStudents: c.enrolled_count,
          status: c.status
        })),
        pendingTasks: {
          unreadNotifications: (notifications?.count as number) || 0,
          pendingGradebook: (ungradedCount?.count as number) || 0,
          draftLessonPlans: (draftPlans?.count as number) || 0
        },
        lastLogin: new Date().toISOString(),
        availableTabs: ['attendance', 'lesson-plans', 'gradebook', 'transcripts']
      };

      return new Response(JSON.stringify(dashboard), { status: 200 });
    } catch (error) {
      console.error('Error loading instructor dashboard:', error);
      return new Response(JSON.stringify({ error: 'Failed to load dashboard' }), { status: 500 });
    }
  });

  /**
   * GET /api/instructor/attendance/:classScheduleId
   * Attendance tab - view class attendance
   */
  router.get('/api/instructor/attendance/:classScheduleId', verifyAuth(['teacher']), async (req) => {
    try {
      const { classScheduleId } = req.params;

      // Get class info
      const courseClass = await env.DB.prepare(
        `SELECT course_name, credits, start_time, end_time FROM class_schedules WHERE id = ?`
      )
        .bind(classScheduleId)
        .first();

      if (!courseClass) {
        return new Response(JSON.stringify({ error: 'Class not found' }), { status: 404 });
      }

      // Get attendance records grouped by session date
      const attendance = await env.DB.prepare(
        `SELECT 
           ar.session_date,
           ar.status,
           COUNT(*) as count,
           sem.first_name,
           sem.last_name,
           ar.check_in_time,
           ar.check_out_time
         FROM attendance_records ar
         JOIN student_email_mappings sem ON ar.enrollment_id = sem.student_id
         WHERE ar.class_schedule_id = ?
         GROUP BY ar.session_date, ar.status, sem.first_name, sem.last_name, ar.check_in_time, ar.check_out_time
         ORDER BY ar.session_date DESC`
      )
        .bind(classScheduleId)
        .all();

      // Get attendance statistics
      const stats = await env.DB.prepare(
        `SELECT 
           COUNT(DISTINCT ar.enrollment_id) as total_students,
           COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
           COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
           COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
           COUNT(CASE WHEN ar.status = 'excused' THEN 1 END) as excused_count,
           ROUND(100.0 * COUNT(CASE WHEN ar.status = 'present' THEN 1 END) / COUNT(*), 2) as avg_attendance
         FROM attendance_records ar
         WHERE ar.class_schedule_id = ?`
      )
        .bind(classScheduleId)
        .first();

      return new Response(
        JSON.stringify({
          classScheduleId,
          courseName: courseClass.course_name,
          attendanceRecords: attendance.results || [],
          statistics: {
            totalStudents: stats?.total_students,
            presentCount: stats?.present_count,
            absentCount: stats?.absent_count,
            lateCount: stats?.late_count,
            excusedCount: stats?.excused_count,
            averageAttendance: stats?.avg_attendance
          }
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error loading attendance tab:', error);
      return new Response(JSON.stringify({ error: 'Failed to load attendance data' }), { status: 500 });
    }
  });

  /**
   * GET /api/instructor/lesson-plans/:classScheduleId
   * Lesson Plans tab - view and manage weekly plans
   */
  router.get('/api/instructor/lesson-plans/:classScheduleId', verifyAuth(['teacher']), async (req) => {
    try {
      const { classScheduleId } = req.params;

      const plans = await env.DB.prepare(
        `SELECT 
           id,
           week_number,
           start_date,
           end_date,
           title,
           status,
           created_at,
           updated_at
         FROM lesson_plans
         WHERE class_schedule_id = ?
         ORDER BY week_number ASC`
      )
        .bind(classScheduleId)
        .all();

      return new Response(
        JSON.stringify({
          classScheduleId,
          lessonPlans: plans.results || [],
          totalPlans: plans.results?.length || 0
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error loading lesson plans tab:', error);
      return new Response(JSON.stringify({ error: 'Failed to load lesson plans' }), { status: 500 });
    }
  });

  /**
   * GET /api/instructor/gradebook/:classScheduleId
   * Gradebook tab - manage grades
   */
  router.get('/api/instructor/gradebook/:classScheduleId', verifyAuth(['teacher']), async (req) => {
    try {
      const { classScheduleId } = req.params;

      // Get all students in class
      const students = await env.DB.prepare(
        `SELECT DISTINCT sce.enrollment_id, sem.first_name, sem.last_name, sem.student_email
         FROM student_class_enrollments sce
         JOIN student_email_mappings sem ON sce.enrollment_id = sem.student_id
         WHERE sce.class_schedule_id = ?
         ORDER BY sem.last_name, sem.first_name`
      )
        .bind(classScheduleId)
        .all();

      // Get all assignments
      const assignments = await env.DB.prepare(
        `SELECT id, assignment_name, max_score, weight, due_date, assignment_type
         FROM assignments
         WHERE class_schedule_id = ?
         ORDER BY due_date ASC`
      )
        .bind(classScheduleId)
        .all();

      // Build gradebook data
      const gradebookData = [];
      for (const student of students.results || []) {
        const grades = await env.DB.prepare(
          `SELECT assignment_id, score, percentage, letter_grade
           FROM grades
           WHERE enrollment_id = ?`
        )
          .bind(student.enrollment_id)
          .all();

        const gradeMap = {};
        for (const g of grades.results || []) {
          (gradeMap as any)[g.assignment_id] = {
            score: g.score,
            percentage: g.percentage,
            letterGrade: g.letter_grade
          };
        }

        gradebookData.push({
          enrollmentId: student.enrollment_id,
          studentName: `${student.first_name} ${student.last_name}`,
          email: student.student_email,
          grades: gradeMap
        });
      }

      return new Response(
        JSON.stringify({
          classScheduleId,
          students: gradebookData,
          assignments: assignments.results || []
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error loading gradebook tab:', error);
      return new Response(JSON.stringify({ error: 'Failed to load gradebook' }), { status: 500 });
    }
  });

  /**
   * GET /api/instructor/transcripts/:classScheduleId
   * Transcripts tab - view student transcripts
   */
  router.get('/api/instructor/transcripts/:classScheduleId', verifyAuth(['teacher']), async (req) => {
    try {
      const { classScheduleId } = req.params;

      // Get all students in class with transcript summaries
      const students = await env.DB.prepare(
        `SELECT 
           sce.enrollment_id,
           sem.first_name,
           sem.last_name,
           sem.student_email,
           ROUND(AVG(CASE WHEN g.letter_grade = 'A' THEN 4.0 
                        WHEN g.letter_grade = 'B' THEN 3.0 
                        WHEN g.letter_grade = 'C' THEN 2.0 
                        WHEN g.letter_grade = 'D' THEN 1.0 
                        ELSE 0.0 END), 2) as current_gpa,
           COUNT(DISTINCT g.assignment_id) as completed_assignments
         FROM student_class_enrollments sce
         JOIN student_email_mappings sem ON sce.enrollment_id = sem.student_id
         LEFT JOIN grades g ON sce.enrollment_id = g.enrollment_id
         WHERE sce.class_schedule_id = ?
         GROUP BY sce.enrollment_id, sem.first_name, sem.last_name, sem.student_email
         ORDER BY sem.last_name, sem.first_name`
      )
        .bind(classScheduleId)
        .all();

      return new Response(
        JSON.stringify({
          classScheduleId,
          students: students.results || [],
          totalStudents: students.results?.length || 0
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error loading transcripts tab:', error);
      return new Response(JSON.stringify({ error: 'Failed to load transcripts' }), { status: 500 });
    }
  });

  /**
   * POST /api/instructor/notifications/mark-read
   * Mark notifications as read
   */
  router.post('/api/instructor/notifications/mark-read', verifyAuth(['teacher']), async (req) => {
    try {
      const { notificationIds } = await req.json();

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return new Response(JSON.stringify({ error: 'No notifications to mark' }), { status: 400 });
      }

      const readAt = new Date().toISOString();

      for (const notifId of notificationIds) {
        await env.DB.prepare(
          `UPDATE notifications SET read_at = ? WHERE id = ?`
        )
          .bind(readAt, notifId)
          .run();
      }

      return new Response(
        JSON.stringify({
          success: true,
          markedCount: notificationIds.length
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error marking notifications:', error);
      return new Response(JSON.stringify({ error: 'Failed to mark notifications' }), { status: 500 });
    }
  });

  /**
   * GET /api/instructor/roster/:classScheduleId
   * Get complete student roster
   */
  router.get('/api/instructor/roster/:classScheduleId', verifyAuth(['teacher']), async (req) => {
    try {
      const { classScheduleId } = req.params;

      const roster = await env.DB.prepare(
        `SELECT 
           sce.enrollment_id,
           sem.first_name,
           sem.last_name,
           sem.student_email,
           sce.enrollment_date,
           sce.status,
           COUNT(DISTINCT ar.id) as sessions_attended,
           COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count
         FROM student_class_enrollments sce
         JOIN student_email_mappings sem ON sce.enrollment_id = sem.student_id
         LEFT JOIN attendance_records ar ON sce.enrollment_id = ar.enrollment_id AND ar.class_schedule_id = sce.class_schedule_id
         WHERE sce.class_schedule_id = ?
         GROUP BY sce.enrollment_id, sem.first_name, sem.last_name, sem.student_email, sce.enrollment_date, sce.status
         ORDER BY sem.last_name, sem.first_name`
      )
        .bind(classScheduleId)
        .all();

      return new Response(
        JSON.stringify({
          classScheduleId,
          roster: roster.results || [],
          totalStudents: roster.results?.length || 0
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error loading roster:', error);
      return new Response(JSON.stringify({ error: 'Failed to load roster' }), { status: 500 });
    }
  });

  /**
   * GET /api/instructor/upcoming
   * Get upcoming tasks (due assignments, ungraded work, etc)
   */
  router.get('/api/instructor/upcoming', verifyAuth(['teacher']), async (req) => {
    try {
      const userId = (req as any).user?.id || 'unknown';

      // Get ungraded assignments due soon
      const dueAssignments = await env.DB.prepare(
        `SELECT 
           a.id,
           a.assignment_name,
           a.due_date,
           cs.course_name,
           COUNT(g.id) as graded_count,
           COUNT(DISTINCT sce.enrollment_id) as total_students
         FROM assignments a
         JOIN class_schedules cs ON a.class_schedule_id = cs.id
         LEFT JOIN grades g ON a.id = g.assignment_id
         LEFT JOIN student_class_enrollments sce ON cs.id = sce.class_schedule_id
         WHERE cs.ai_professor_id = ? OR cs.id IN (
           SELECT class_schedule_id FROM instructor_assignments WHERE instructor_id = ?
         )
         AND a.due_date > CURRENT_DATE
         AND a.due_date <= DATE('now', '+7 days')
         GROUP BY a.id, a.assignment_name, a.due_date, cs.course_name
         ORDER BY a.due_date ASC`
      )
        .bind(userId, userId)
        .all();

      // Get lesson plans due for publication
      const lessonPlansDue = await env.DB.prepare(
        `SELECT 
           id,
           course_name,
           week_number,
           start_date,
           status
         FROM lesson_plans
         WHERE created_by = ? AND status = 'draft' AND start_date <= DATE('now', '+7 days')
         ORDER BY start_date ASC`
      )
        .bind(userId)
        .all();

      return new Response(
        JSON.stringify({
          dueAssignments: dueAssignments.results || [],
          lessonPlansDue: lessonPlansDue.results || [],
          upcomingEventCount: ((dueAssignments.results?.length || 0) + (lessonPlansDue.results?.length || 0))
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error loading upcoming tasks:', error);
      return new Response(JSON.stringify({ error: 'Failed to load upcoming tasks' }), { status: 500 });
    }
  });

  return router;
};
