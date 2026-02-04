/**
 * Transcripts System
 * Generates official and unofficial transcripts for compliance and student records
 */

import { Router } from 'itty-router';
import { verifyAuth } from './auth';

interface TranscriptRecord {
  courseName: string;
  courseId: string;
  credits: number;
  grade: string;
  gpa: number;
  completionDate: string;
  status: 'completed' | 'in-progress' | 'dropped';
}

interface Transcript {
  id: string;
  studentName: string;
  studentId: string;
  studentEmail: string;
  transcriptType: 'official' | 'unofficial';
  cumulativeGPA: number;
  totalCreditsEarned: number;
  totalCreditsAttempted: number;
  degreeStatus: string;
  courses: TranscriptRecord[];
  generatedAt: string;
  generatedBy: string;
  issuedAt?: string;
  sealed?: boolean;
  requestId: string;
}

export const createTranscriptsRouter = (env: any) => {
  const router = Router();

  /**
   * POST /api/transcripts/unofficial
   * Generate unofficial transcript for student (not sealed, self-request)
   */
  router.post('/api/transcripts/unofficial', verifyAuth(['student', 'teacher', 'admin']), async (req) => {
    try {
      const { enrollmentId } = await req.json();

      if (!enrollmentId) {
        return new Response(
          JSON.stringify({ error: 'enrollmentId required' }),
          { status: 400 }
        );
      }

      // Get student info
      const student = await env.DB.prepare(
        `SELECT * FROM student_email_mappings 
         WHERE student_id = ?`
      )
        .bind(enrollmentId)
        .first();

      if (!student) {
        return new Response(JSON.stringify({ error: 'Student not found' }), { status: 404 });
      }

      // Get all courses and grades
      const courses = await env.DB.prepare(
        `SELECT 
           cs.course_name,
           cs.id as course_id,
           cs.credits,
           MAX(g.letter_grade) as grade,
           MAX(g.graded_at) as completion_date,
           CASE 
             WHEN MAX(g.graded_at) IS NOT NULL THEN 'completed'
             WHEN sce.status = 'dropped' THEN 'dropped'
             ELSE 'in-progress'
           END as status
         FROM student_class_enrollments sce
         LEFT JOIN class_schedules cs ON sce.class_schedule_id = cs.id
         LEFT JOIN grades g ON sce.enrollment_id = g.enrollment_id
         WHERE sce.enrollment_id = ?
         GROUP BY cs.id, cs.course_name, cs.credits, sce.status
         ORDER BY MAX(g.graded_at) DESC NULLS LAST`
      )
        .bind(enrollmentId)
        .all();

      // Calculate GPA
      let totalGPA = 0;
      let totalCredits = 0;
      let completedCredits = 0;
      const courseRecords: TranscriptRecord[] = [];

      const gradeToGPA: { [key: string]: number } = {
        'A': 4.0,
        'B': 3.0,
        'C': 2.0,
        'D': 1.0,
        'F': 0.0
      };

      for (const course of courses.results || []) {
        const gpa = gradeToGPA[course.grade as string] || 0;
        const credits = (course.credits as number) || 0;

        if (course.status === 'completed') {
          totalGPA += gpa * credits;
          completedCredits += credits;
        }

        totalCredits += credits;

        courseRecords.push({
          courseName: course.course_name,
          courseId: course.course_id,
          credits,
          grade: course.grade || 'In Progress',
          gpa,
          completionDate: course.completion_date ? new Date(course.completion_date).toLocaleDateString() : 'N/A',
          status: course.status as 'completed' | 'in-progress' | 'dropped'
        });
      }

      const cumulativeGPA = completedCredits > 0 ? totalGPA / completedCredits : 0;
      const transcriptId = `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const generatedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      // Store transcript record
      await env.DB.prepare(
        `INSERT INTO transcripts 
         (id, student_id, student_name, student_email, transcript_type, cumulative_gpa, total_credits_earned, 
          total_credits_attempted, degree_status, generated_at, generated_by, is_official)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          transcriptId,
          enrollmentId,
          `${student.first_name} ${student.last_name}`,
          student.student_email,
          'unofficial',
          cumulativeGPA.toFixed(2),
          completedCredits,
          totalCredits,
          completedCredits >= totalCredits ? 'Completed' : 'In Progress',
          generatedAt,
          userId,
          0
        )
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('transcript_generated', 'transcript', transcriptId, userId, JSON.stringify({ type: 'unofficial' }), generatedAt)
        .run();

      const transcript: Transcript = {
        id: transcriptId,
        studentName: `${student.first_name} ${student.last_name}`,
        studentId: enrollmentId,
        studentEmail: student.student_email,
        transcriptType: 'unofficial',
        cumulativeGPA: parseFloat(cumulativeGPA.toFixed(2)),
        totalCreditsEarned: completedCredits,
        totalCreditsAttempted: totalCredits,
        degreeStatus: completedCredits >= totalCredits ? 'Completed' : 'In Progress',
        courses: courseRecords,
        generatedAt,
        generatedBy: userId,
        sealed: false,
        requestId: transcriptId
      };

      return new Response(JSON.stringify(transcript), { status: 201 });
    } catch (error) {
      console.error('Error generating unofficial transcript:', error);
      return new Response(JSON.stringify({ error: 'Failed to generate transcript' }), { status: 500 });
    }
  });

  /**
   * POST /api/transcripts/official
   * Request official sealed transcript (admin approval required)
   */
  router.post('/api/transcripts/official', verifyAuth(['student']), async (req) => {
    try {
      const { enrollmentId, mailedTo } = await req.json();

      if (!enrollmentId) {
        return new Response(
          JSON.stringify({ error: 'enrollmentId required' }),
          { status: 400 }
        );
      }

      // Create transcript request (pending admin approval)
      const requestId = `treq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const requestedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      await env.DB.prepare(
        `INSERT INTO transcript_requests 
         (id, student_id, request_type, mailed_to, status, requested_at, requested_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(requestId, enrollmentId, 'official_transcript', mailedTo || null, 'pending', requestedAt, userId)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('official_transcript_requested', 'transcript_request', requestId, userId, JSON.stringify({ enrollmentId }), requestedAt)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          requestId,
          status: 'pending',
          message: 'Your official transcript request has been submitted. An administrator will process it within 2 business days.'
        }),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error requesting official transcript:', error);
      return new Response(JSON.stringify({ error: 'Failed to submit request' }), { status: 500 });
    }
  });

  /**
   * GET /api/transcripts/requests
   * Get pending transcript requests (admin view)
   */
  router.get('/api/transcripts/requests', verifyAuth(['admin']), async (req) => {
    try {
      const requests = await env.DB.prepare(
        `SELECT tr.*, sem.first_name, sem.last_name, sem.student_email
         FROM transcript_requests tr
         JOIN student_email_mappings sem ON tr.student_id = sem.student_id
         WHERE tr.status = 'pending'
         ORDER BY tr.requested_at ASC`
      )
        .all();

      return new Response(JSON.stringify(requests.results || []), { status: 200 });
    } catch (error) {
      console.error('Error fetching transcript requests:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch requests' }), { status: 500 });
    }
  });

  /**
   * POST /api/transcripts/requests/:requestId/approve
   * Approve and generate official sealed transcript
   */
  router.post('/api/transcripts/requests/:requestId/approve', verifyAuth(['admin']), async (req) => {
    try {
      const { requestId } = req.params;
      const { mailedTo, trackingNumber } = await req.json();

      // Get request details
      const request = await env.DB.prepare(
        `SELECT * FROM transcript_requests WHERE id = ?`
      )
        .bind(requestId)
        .first();

      if (!request) {
        return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404 });
      }

      const enrollmentId = request.student_id;

      // Get student info
      const student = await env.DB.prepare(
        `SELECT * FROM student_email_mappings WHERE student_id = ?`
      )
        .bind(enrollmentId)
        .first();

      // Get courses and grades (same logic as unofficial)
      const courses = await env.DB.prepare(
        `SELECT 
           cs.course_name,
           cs.id as course_id,
           cs.credits,
           MAX(g.letter_grade) as grade,
           MAX(g.graded_at) as completion_date,
           'completed' as status
         FROM student_class_enrollments sce
         LEFT JOIN class_schedules cs ON sce.class_schedule_id = cs.id
         LEFT JOIN grades g ON sce.enrollment_id = g.enrollment_id
         WHERE sce.enrollment_id = ? AND g.id IS NOT NULL
         GROUP BY cs.id, cs.course_name, cs.credits
         ORDER BY MAX(g.graded_at) DESC`
      )
        .bind(enrollmentId)
        .all();

      // Calculate GPA
      let totalGPA = 0;
      let completedCredits = 0;
      const courseRecords: TranscriptRecord[] = [];

      const gradeToGPA: { [key: string]: number } = {
        'A': 4.0,
        'B': 3.0,
        'C': 2.0,
        'D': 1.0,
        'F': 0.0
      };

      for (const course of courses.results || []) {
        const gpa = gradeToGPA[course.grade as string] || 0;
        const credits = (course.credits as number) || 0;
        totalGPA += gpa * credits;
        completedCredits += credits;

        courseRecords.push({
          courseName: course.course_name,
          courseId: course.course_id,
          credits,
          grade: course.grade,
          gpa,
          completionDate: new Date(course.completion_date).toLocaleDateString(),
          status: 'completed'
        });
      }

      const cumulativeGPA = completedCredits > 0 ? totalGPA / completedCredits : 0;
      const transcriptId = `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const issuedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      // Store official transcript
      await env.DB.prepare(
        `INSERT INTO transcripts 
         (id, student_id, student_name, student_email, transcript_type, cumulative_gpa, total_credits_earned, 
          total_credits_attempted, degree_status, generated_at, generated_by, is_official, issued_at, sealed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          transcriptId,
          enrollmentId,
          `${student.first_name} ${student.last_name}`,
          student.student_email,
          'official',
          cumulativeGPA.toFixed(2),
          completedCredits,
          completedCredits,
          completedCredits > 0 ? 'Completed' : 'In Progress',
          issuedAt,
          userId,
          1,
          issuedAt,
          1
        )
        .run();

      // Update request status
      const approvedAt = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE transcript_requests 
         SET status = 'approved', approved_at = ?, approved_by = ?, transcript_id = ?, mailed_to = ?, tracking_number = ?
         WHERE id = ?`
      )
        .bind(approvedAt, userId, transcriptId, mailedTo || null, trackingNumber || null, requestId)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('official_transcript_approved', 'transcript_request', requestId, userId, JSON.stringify({ transcriptId }), approvedAt)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          transcriptId,
          status: 'approved',
          issuedAt
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error approving transcript:', error);
      return new Response(JSON.stringify({ error: 'Failed to approve transcript' }), { status: 500 });
    }
  });

  /**
   * GET /api/transcripts/:studentId
   * Get transcript history for student
   */
  router.get('/api/transcripts/:studentId', verifyAuth(['student', 'teacher', 'admin']), async (req) => {
    try {
      const { studentId } = req.params;

      const transcripts = await env.DB.prepare(
        `SELECT id, student_name, transcript_type, cumulative_gpa, total_credits_earned, 
                generated_at, issued_at, sealed, request_id
         FROM transcripts 
         WHERE student_id = ? 
         ORDER BY generated_at DESC`
      )
        .bind(studentId)
        .all();

      return new Response(JSON.stringify(transcripts.results || []), { status: 200 });
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch transcripts' }), { status: 500 });
    }
  });

  /**
   * GET /api/transcripts/detail/:transcriptId
   * Get full transcript details
   */
  router.get('/api/transcripts/detail/:transcriptId', verifyAuth(['student', 'teacher', 'admin']), async (req) => {
    try {
      const { transcriptId } = req.params;

      const transcript = await env.DB.prepare(
        `SELECT * FROM transcripts WHERE id = ?`
      )
        .bind(transcriptId)
        .first();

      if (!transcript) {
        return new Response(JSON.stringify({ error: 'Transcript not found' }), { status: 404 });
      }

      return new Response(JSON.stringify(transcript), { status: 200 });
    } catch (error) {
      console.error('Error fetching transcript:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch transcript' }), { status: 500 });
    }
  });

  /**
   * POST /api/transcripts/export/:transcriptId
   * Export transcript as PDF or text
   */
  router.post('/api/transcripts/export/:transcriptId', verifyAuth(['admin']), async (req) => {
    try {
      const { transcriptId } = req.params;
      const { format } = await req.json();

      if (!['pdf', 'text'].includes(format || 'pdf')) {
        return new Response(JSON.stringify({ error: 'Invalid format' }), { status: 400 });
      }

      const transcript = await env.DB.prepare(
        `SELECT * FROM transcripts WHERE id = ?`
      )
        .bind(transcriptId)
        .first();

      if (!transcript) {
        return new Response(JSON.stringify({ error: 'Transcript not found' }), { status: 404 });
      }

      const exportedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      // Log export
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('transcript_exported', 'transcript', transcriptId, userId, JSON.stringify({ format }), exportedAt)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          transcriptId,
          format,
          downloadUrl: `/transcripts/${transcriptId}/download?format=${format}`,
          exportedAt
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error exporting transcript:', error);
      return new Response(JSON.stringify({ error: 'Failed to export transcript' }), { status: 500 });
    }
  });

  return router;
};
