/**
 * Attendance Tracking System
 * Manages student attendance records for compliance and academic progress
 */

import { Router } from 'itty-router';
import { verifyAuth } from './auth';

interface AttendanceRecord {
  id: string;
  enrollmentId: string;
  classScheduleId: string;
  sessionDate: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'pending';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

interface AttendanceReport {
  enrollmentId: string;
  studentName: string;
  courseName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  status: 'good' | 'warning' | 'critical';
  lastUpdated: string;
}

export const createAttendanceRouter = (env: any) => {
  const router = Router();

  /**
   * POST /api/attendance/record
   * Record attendance for a student in a class session
   */
  router.post('/api/attendance/record', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const {
        enrollmentId,
        classScheduleId,
        sessionDate,
        status,
        checkInTime,
        checkOutTime,
        notes
      } = await req.json();

      if (!enrollmentId || !classScheduleId || !sessionDate || !status) {
        return new Response(
          JSON.stringify({
            error: 'Missing required fields: enrollmentId, classScheduleId, sessionDate, status'
          }),
          { status: 400 }
        );
      }

      // Validate status
      const validStatuses = ['present', 'absent', 'late', 'excused', 'pending'];
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
          { status: 400 }
        );
      }

      const recordId = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const recordedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      await env.DB.prepare(
        `INSERT INTO attendance_records 
         (id, enrollment_id, class_schedule_id, session_date, status, check_in_time, check_out_time, notes, recorded_by, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(recordId, enrollmentId, classScheduleId, sessionDate, status, checkInTime || null, checkOutTime || null, notes || null, userId, recordedAt)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('attendance_recorded', 'attendance', recordId, userId, JSON.stringify({ enrollmentId, status }), recordedAt)
        .run();

      return new Response(
        JSON.stringify({
          id: recordId,
          enrollmentId,
          status,
          recordedAt
        }),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error recording attendance:', error);
      return new Response(JSON.stringify({ error: 'Failed to record attendance' }), { status: 500 });
    }
  });

  /**
   * GET /api/attendance/student/:enrollmentId
   * Get attendance records for a specific student
   */
  router.get('/api/attendance/student/:enrollmentId', verifyAuth(['teacher', 'admin', 'student']), async (req) => {
    try {
      const { enrollmentId } = req.params;

      const records = await env.DB.prepare(
        `SELECT * FROM attendance_records 
         WHERE enrollment_id = ? 
         ORDER BY session_date DESC`
      )
        .bind(enrollmentId)
        .all();

      return new Response(JSON.stringify(records.results || []), { status: 200 });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch attendance records' }), {
        status: 500
      });
    }
  });

  /**
   * GET /api/attendance/class/:classScheduleId
   * Get attendance for entire class
   */
  router.get('/api/attendance/class/:classScheduleId', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { classScheduleId } = req.params;

      const records = await env.DB.prepare(
        `SELECT ar.*, se.first_name, se.last_name, se.student_email
         FROM attendance_records ar
         JOIN student_email_mappings se ON ar.enrollment_id = se.student_id
         WHERE ar.class_schedule_id = ?
         ORDER BY ar.session_date DESC, se.last_name ASC`
      )
        .bind(classScheduleId)
        .all();

      return new Response(JSON.stringify(records.results || []), { status: 200 });
    } catch (error) {
      console.error('Error fetching class attendance:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch class attendance' }), { status: 500 });
    }
  });

  /**
   * GET /api/attendance/report/:enrollmentId
   * Get attendance report for a student
   */
  router.get('/api/attendance/report/:enrollmentId', verifyAuth(['teacher', 'admin', 'student']), async (req) => {
    try {
      const { enrollmentId } = req.params;

      // Get student info
      const student = await env.DB.prepare(
        `SELECT sem.first_name, sem.last_name, cs.course_name, cs.id as class_id
         FROM student_email_mappings sem
         JOIN student_class_enrollments sce ON sem.student_id = sce.enrollment_id
         JOIN class_schedules cs ON sce.class_schedule_id = cs.id
         WHERE sem.student_id = ?
         LIMIT 1`
      )
        .bind(enrollmentId)
        .first();

      if (!student) {
        return new Response(JSON.stringify({ error: 'Student not found' }), { status: 404 });
      }

      // Get attendance statistics
      const stats = await env.DB.prepare(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
           SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
           SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
           SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_count
         FROM attendance_records
         WHERE enrollment_id = ?`
      )
        .bind(enrollmentId)
        .first();

      const total = (stats?.total || 0) as number;
      const presentCount = (stats?.present_count || 0) as number;
      const attendancePercentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

      // Determine status
      let status: 'good' | 'warning' | 'critical' = 'good';
      if (attendancePercentage < 70) status = 'critical';
      else if (attendancePercentage < 85) status = 'warning';

      const report: AttendanceReport = {
        enrollmentId,
        studentName: `${student.first_name} ${student.last_name}`,
        courseName: student.course_name,
        totalSessions: total,
        presentCount,
        absentCount: (stats?.absent_count || 0) as number,
        lateCount: (stats?.late_count || 0) as number,
        excusedCount: (stats?.excused_count || 0) as number,
        attendancePercentage,
        status,
        lastUpdated: new Date().toISOString()
      };

      return new Response(JSON.stringify(report), { status: 200 });
    } catch (error) {
      console.error('Error generating attendance report:', error);
      return new Response(JSON.stringify({ error: 'Failed to generate report' }), { status: 500 });
    }
  });

  /**
   * PUT /api/attendance/:recordId
   * Update attendance record
   */
  router.put('/api/attendance/:recordId', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { recordId } = req.params;
      const { status, notes, checkInTime, checkOutTime } = await req.json();

      const validStatuses = ['present', 'absent', 'late', 'excused', 'pending'];
      if (status && !validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
          { status: 400 }
        );
      }

      const updatedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      await env.DB.prepare(
        `UPDATE attendance_records 
         SET status = ?, notes = ?, check_in_time = ?, check_out_time = ?
         WHERE id = ?`
      )
        .bind(status || null, notes || null, checkInTime || null, checkOutTime || null, recordId)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('attendance_updated', 'attendance', recordId, userId, JSON.stringify({ status }), updatedAt)
        .run();

      return new Response(JSON.stringify({ success: true, recordId }), { status: 200 });
    } catch (error) {
      console.error('Error updating attendance:', error);
      return new Response(JSON.stringify({ error: 'Failed to update attendance' }), { status: 500 });
    }
  });

  /**
   * POST /api/attendance/bulk
   * Bulk record attendance for entire class
   */
  router.post('/api/attendance/bulk', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { classScheduleId, sessionDate, records } = await req.json();

      if (!classScheduleId || !sessionDate || !Array.isArray(records)) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400 }
        );
      }

      const userId = (req as any).user?.id || 'unknown';
      const recordedAt = new Date().toISOString();
      const createdRecords = [];

      for (const record of records) {
        const recordId = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await env.DB.prepare(
          `INSERT INTO attendance_records 
           (id, enrollment_id, class_schedule_id, session_date, status, check_in_time, check_out_time, notes, recorded_by, recorded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            recordId,
            record.enrollmentId,
            classScheduleId,
            sessionDate,
            record.status,
            record.checkInTime || null,
            record.checkOutTime || null,
            record.notes || null,
            userId,
            recordedAt
          )
          .run();

        createdRecords.push(recordId);
      }

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('attendance_bulk_recorded', 'attendance', classScheduleId, userId, JSON.stringify({ count: records.length }), recordedAt)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          recordsCreated: createdRecords.length,
          recordIds: createdRecords
        }),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error bulk recording attendance:', error);
      return new Response(JSON.stringify({ error: 'Failed to bulk record attendance' }), {
        status: 500
      });
    }
  });

  /**
   * GET /api/attendance/warning
   * Get students with attendance warnings
   */
  router.get('/api/attendance/warning', verifyAuth(['admin', 'teacher']), async (req) => {
    try {
      const students = await env.DB.prepare(
        `SELECT 
           sem.student_id,
           sem.first_name,
           sem.last_name,
           sem.student_email,
           COUNT(ar.id) as total_sessions,
           SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
           ROUND(100.0 * SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) / COUNT(ar.id), 2) as attendance_percentage
         FROM student_email_mappings sem
         LEFT JOIN attendance_records ar ON sem.student_id = ar.enrollment_id
         GROUP BY sem.student_id, sem.first_name, sem.last_name, sem.student_email
         HAVING attendance_percentage < 85 OR attendance_percentage IS NULL
         ORDER BY attendance_percentage ASC`
      )
        .all();

      return new Response(JSON.stringify(students.results || []), { status: 200 });
    } catch (error) {
      console.error('Error fetching attendance warnings:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch warnings' }), { status: 500 });
    }
  });

  return router;
};
