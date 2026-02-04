/**
 * Gradebook System
 * Manages grades, assignments, and weighted grade calculations
 */

import { Router } from 'itty-router';
import { verifyAuth } from './auth';

interface Grade {
  id: string;
  enrollmentId: string;
  assignmentId: string;
  courseName: string;
  assignmentName: string;
  score: number;
  maxScore: number;
  letterGrade: string;
  feedback?: string;
  gradedBy: string;
  gradedAt: string;
}

interface GradeDistribution {
  assignmentType: string;
  weight: number;
  grades: Grade[];
}

interface StudentGradeSummary {
  enrollmentId: string;
  studentName: string;
  courseName: string;
  currentGPA: number;
  totalPoints: number;
  maxPoints: number;
  percentageGrade: number;
  letterGrade: string;
  gradeBreakdown: {
    assignmentType: string;
    weight: number;
    weightedGrade: number;
  }[];
  lastUpdated: string;
}

/**
 * Calculate letter grade from percentage
 */
function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Calculate GPA (4.0 scale)
 */
function calculateGPA(letterGrade: string): number {
  const gradeMap: { [key: string]: number } = {
    A: 4.0,
    B: 3.0,
    C: 2.0,
    D: 1.0,
    F: 0.0
  };
  return gradeMap[letterGrade] || 0.0;
}

export const createGradebookRouter = (env: any) => {
  const router = Router();

  /**
   * POST /api/gradebook/assignment
   * Create assignment with weight/percentage for course
   */
  router.post('/api/gradebook/assignment', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { classScheduleId, courseName, assignmentName, description, assignmentType, maxScore, weight, dueDate } = await req.json();

      if (!classScheduleId || !assignmentName || !maxScore || !weight) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400 }
        );
      }

      const assignmentId = `asgn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      await env.DB.prepare(
        `INSERT INTO assignments 
         (id, class_schedule_id, course_name, assignment_name, description, assignment_type, max_score, weight, due_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(assignmentId, classScheduleId, courseName, assignmentName, description || null, assignmentType || 'general', maxScore, weight, dueDate || null, createdAt)
        .run();

      return new Response(
        JSON.stringify({
          assignmentId,
          assignmentName,
          maxScore,
          weight
        }),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating assignment:', error);
      return new Response(JSON.stringify({ error: 'Failed to create assignment' }), { status: 500 });
    }
  });

  /**
   * POST /api/gradebook/grade
   * Post grade for student assignment
   */
  router.post('/api/gradebook/grade', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { enrollmentId, assignmentId, score, feedback } = await req.json();

      if (!enrollmentId || !assignmentId || score === undefined) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400 }
        );
      }

      // Get assignment details
      const assignment = await env.DB.prepare(
        `SELECT * FROM assignments WHERE id = ?`
      )
        .bind(assignmentId)
        .first();

      if (!assignment) {
        return new Response(JSON.stringify({ error: 'Assignment not found' }), { status: 404 });
      }

      // Validate score
      if (score < 0 || score > (assignment.max_score as number)) {
        return new Response(
          JSON.stringify({ error: `Score must be between 0 and ${assignment.max_score}` }),
          { status: 400 }
        );
      }

      const gradeId = `grd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const percentage = (score / (assignment.max_score as number)) * 100;
      const letterGrade = getLetterGrade(percentage);
      const gradedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      await env.DB.prepare(
        `INSERT INTO grades 
         (id, enrollment_id, assignment_id, score, max_score, percentage, letter_grade, feedback, graded_by, graded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(gradeId, enrollmentId, assignmentId, score, assignment.max_score, percentage, letterGrade, feedback || null, userId, gradedAt)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('grade_posted', 'grade', gradeId, userId, JSON.stringify({ enrollmentId, assignmentId, score, letterGrade }), gradedAt)
        .run();

      return new Response(
        JSON.stringify({
          gradeId,
          enrollmentId,
          score,
          letterGrade,
          percentage: percentage.toFixed(2),
          feedback: feedback || null
        }),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error posting grade:', error);
      return new Response(JSON.stringify({ error: 'Failed to post grade' }), { status: 500 });
    }
  });

  /**
   * GET /api/gradebook/student/:enrollmentId
   * Get all grades for student
   */
  router.get('/api/gradebook/student/:enrollmentId', verifyAuth(['teacher', 'admin', 'student']), async (req) => {
    try {
      const { enrollmentId } = req.params;

      const grades = await env.DB.prepare(
        `SELECT g.*, a.assignment_name, a.assignment_type, a.course_name, a.max_score
         FROM grades g
         JOIN assignments a ON g.assignment_id = a.id
         WHERE g.enrollment_id = ?
         ORDER BY a.due_date DESC, g.graded_at DESC`
      )
        .bind(enrollmentId)
        .all();

      return new Response(JSON.stringify(grades.results || []), { status: 200 });
    } catch (error) {
      console.error('Error fetching student grades:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch grades' }), { status: 500 });
    }
  });

  /**
   * GET /api/gradebook/class/:classScheduleId
   * Get gradebook for entire class
   */
  router.get('/api/gradebook/class/:classScheduleId', verifyAuth(['teacher', 'admin']), async (req) => {
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

      // Get all assignments for class
      const assignments = await env.DB.prepare(
        `SELECT * FROM assignments 
         WHERE class_schedule_id = ? 
         ORDER BY due_date ASC, created_at ASC`
      )
        .bind(classScheduleId)
        .all();

      // Build gradebook grid
      const gradebook = [];
      for (const student of students.results || []) {
        const studentGrades: { [key: string]: Grade | null } = {};

        for (const assignment of assignments.results || []) {
          const grade = await env.DB.prepare(
            `SELECT * FROM grades 
             WHERE enrollment_id = ? AND assignment_id = ?`
          )
            .bind(student.enrollment_id, assignment.id)
            .first();

          studentGrades[assignment.id] = grade || null;
        }

        gradebook.push({
          enrollmentId: student.enrollment_id,
          studentName: `${student.first_name} ${student.last_name}`,
          email: student.student_email,
          grades: studentGrades
        });
      }

      return new Response(
        JSON.stringify({
          classScheduleId,
          assignments: assignments.results || [],
          students: gradebook
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error fetching class gradebook:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch gradebook' }), { status: 500 });
    }
  });

  /**
   * GET /api/gradebook/summary/:enrollmentId
   * Get grade summary with weighted calculations
   */
  router.get('/api/gradebook/summary/:enrollmentId', verifyAuth(['teacher', 'admin', 'student']), async (req) => {
    try {
      const { enrollmentId } = req.params;

      // Get student info
      const student = await env.DB.prepare(
        `SELECT sem.first_name, sem.last_name, cs.course_name
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

      // Get all grades grouped by type
      const gradesByType = await env.DB.prepare(
        `SELECT a.assignment_type, a.weight, g.percentage, g.letter_grade, COUNT(g.id) as count
         FROM grades g
         JOIN assignments a ON g.assignment_id = a.id
         WHERE g.enrollment_id = ?
         GROUP BY a.assignment_type, a.weight
         ORDER BY a.weight DESC`
      )
        .bind(enrollmentId)
        .all();

      // Calculate weighted grade
      let totalWeightedGrade = 0;
      let totalWeight = 0;
      const breakdown = [];

      for (const type of gradesByType.results || []) {
        const avgPercentage = (type.percentage as number) || 0;
        const weight = (type.weight as number) || 0;
        const weightedGrade = (avgPercentage * weight) / 100;

        totalWeightedGrade += weightedGrade;
        totalWeight += weight;

        breakdown.push({
          assignmentType: type.assignment_type,
          weight,
          weightedGrade: parseFloat(weightedGrade.toFixed(2))
        });
      }

      const currentGPA = calculateGPA(getLetterGrade(totalWeightedGrade));
      const summary: StudentGradeSummary = {
        enrollmentId,
        studentName: `${student.first_name} ${student.last_name}`,
        courseName: student.course_name,
        currentGPA: parseFloat(currentGPA.toFixed(2)),
        totalPoints: 0, // Would need to sum all earned points
        maxPoints: 0, // Would need to sum all max points
        percentageGrade: parseFloat(totalWeightedGrade.toFixed(2)),
        letterGrade: getLetterGrade(totalWeightedGrade),
        gradeBreakdown: breakdown,
        lastUpdated: new Date().toISOString()
      };

      return new Response(JSON.stringify(summary), { status: 200 });
    } catch (error) {
      console.error('Error generating grade summary:', error);
      return new Response(JSON.stringify({ error: 'Failed to generate summary' }), { status: 500 });
    }
  });

  /**
   * PUT /api/gradebook/grade/:gradeId
   * Update existing grade
   */
  router.put('/api/gradebook/grade/:gradeId', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { gradeId } = req.params;
      const { score, feedback } = await req.json();

      // Get existing grade
      const existingGrade = await env.DB.prepare(
        `SELECT * FROM grades WHERE id = ?`
      )
        .bind(gradeId)
        .first();

      if (!existingGrade) {
        return new Response(JSON.stringify({ error: 'Grade not found' }), { status: 404 });
      }

      const newScore = score !== undefined ? score : existingGrade.score;
      const percentage = (newScore / (existingGrade.max_score as number)) * 100;
      const letterGrade = getLetterGrade(percentage);
      const updatedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      await env.DB.prepare(
        `UPDATE grades 
         SET score = ?, percentage = ?, letter_grade = ?, feedback = ?
         WHERE id = ?`
      )
        .bind(newScore, percentage, letterGrade, feedback || existingGrade.feedback, gradeId)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('grade_updated', 'grade', gradeId, userId, JSON.stringify({ newScore, letterGrade }), updatedAt)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          gradeId,
          score: newScore,
          letterGrade,
          percentage: percentage.toFixed(2)
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error updating grade:', error);
      return new Response(JSON.stringify({ error: 'Failed to update grade' }), { status: 500 });
    }
  });

  /**
   * DELETE /api/gradebook/grade/:gradeId
   * Remove a grade
   */
  router.delete('/api/gradebook/grade/:gradeId', verifyAuth(['admin']), async (req) => {
    try {
      const { gradeId } = req.params;
      const userId = (req as any).user?.id || 'unknown';
      const deletedAt = new Date().toISOString();

      await env.DB.prepare(
        `DELETE FROM grades WHERE id = ?`
      )
        .bind(gradeId)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('grade_deleted', 'grade', gradeId, userId, JSON.stringify({ deletedBy: userId }), deletedAt)
        .run();

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      console.error('Error deleting grade:', error);
      return new Response(JSON.stringify({ error: 'Failed to delete grade' }), { status: 500 });
    }
  });

  /**
   * GET /api/gradebook/statistics/:classScheduleId
   * Get class statistics
   */
  router.get('/api/gradebook/statistics/:classScheduleId', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { classScheduleId } = req.params;

      const stats = await env.DB.prepare(
        `SELECT 
           a.assignment_name,
           COUNT(g.id) as graded_count,
           AVG(g.percentage) as avg_percentage,
           MIN(g.percentage) as min_percentage,
           MAX(g.percentage) as max_percentage,
           STDDEV_POP(g.percentage) as std_dev
         FROM assignments a
         LEFT JOIN grades g ON a.id = g.assignment_id
         WHERE a.class_schedule_id = ?
         GROUP BY a.id, a.assignment_name
         ORDER BY a.created_at ASC`
      )
        .bind(classScheduleId)
        .all();

      return new Response(JSON.stringify(stats.results || []), { status: 200 });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch statistics' }), { status: 500 });
    }
  });

  return router;
};
