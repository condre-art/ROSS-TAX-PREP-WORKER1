/**
 * Lesson Plans Management System
 * Allows instructors to create, manage, and publish weekly lesson plans
 */

import { Router } from 'itty-router';
import { verifyAuth } from './auth';

interface LessonPlan {
  id: string;
  courseId: string;
  courseName: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  title: string;
  objectives: string[];
  topics: string[];
  lectureOutline: string;
  assignments: {
    name: string;
    description: string;
    dueDate: string;
    pointsValue: number;
  }[];
  readings: string[];
  resources: string[];
  assessments: string;
  notes: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const createLessonPlansRouter = (env: any) => {
  const router = Router();

  /**
   * POST /api/lesson-plans
   * Create new lesson plan
   */
  router.post('/api/lesson-plans', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const {
        classScheduleId,
        courseName,
        weekNumber,
        startDate,
        endDate,
        title,
        objectives,
        topics,
        lectureOutline,
        assignments,
        readings,
        resources,
        assessments,
        notes
      } = await req.json();

      if (!classScheduleId || !courseName || !weekNumber || !title) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400 }
        );
      }

      const planId = `lp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      await env.DB.prepare(
        `INSERT INTO lesson_plans 
         (id, class_schedule_id, course_name, week_number, start_date, end_date, title, 
          objectives, topics, lecture_outline, assignments, readings, resources, assessments, 
          notes, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          planId,
          classScheduleId,
          courseName,
          weekNumber,
          startDate,
          endDate,
          title,
          JSON.stringify(objectives || []),
          JSON.stringify(topics || []),
          lectureOutline || '',
          JSON.stringify(assignments || []),
          JSON.stringify(readings || []),
          JSON.stringify(resources || []),
          assessments || '',
          notes || '',
          'draft',
          userId,
          createdAt,
          createdAt
        )
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('lesson_plan_created', 'lesson_plan', planId, userId, JSON.stringify({ week: weekNumber, course: courseName }), createdAt)
        .run();

      return new Response(
        JSON.stringify({
          id: planId,
          courseName,
          weekNumber,
          title,
          status: 'draft'
        }),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      return new Response(JSON.stringify({ error: 'Failed to create lesson plan' }), { status: 500 });
    }
  });

  /**
   * GET /api/lesson-plans/course/:classScheduleId
   * Get all lesson plans for a course
   */
  router.get('/api/lesson-plans/course/:classScheduleId', verifyAuth(['teacher', 'admin', 'student']), async (req) => {
    try {
      const { classScheduleId } = req.params;

      const plans = await env.DB.prepare(
        `SELECT * FROM lesson_plans 
         WHERE class_schedule_id = ? 
         ORDER BY week_number ASC, start_date ASC`
      )
        .bind(classScheduleId)
        .all();

      // Parse JSON fields
      const parsedPlans = (plans.results || []).map((plan: any) => ({
        ...plan,
        objectives: JSON.parse(plan.objectives || '[]'),
        topics: JSON.parse(plan.topics || '[]'),
        assignments: JSON.parse(plan.assignments || '[]'),
        readings: JSON.parse(plan.readings || '[]'),
        resources: JSON.parse(plan.resources || '[]')
      }));

      return new Response(JSON.stringify(parsedPlans), { status: 200 });
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch lesson plans' }), { status: 500 });
    }
  });

  /**
   * GET /api/lesson-plans/:planId
   * Get single lesson plan
   */
  router.get('/api/lesson-plans/:planId', verifyAuth(['teacher', 'admin', 'student']), async (req) => {
    try {
      const { planId } = req.params;

      const plan = await env.DB.prepare(
        `SELECT * FROM lesson_plans WHERE id = ?`
      )
        .bind(planId)
        .first();

      if (!plan) {
        return new Response(JSON.stringify({ error: 'Lesson plan not found' }), { status: 404 });
      }

      // Parse JSON fields
      const parsedPlan = {
        ...plan,
        objectives: JSON.parse(plan.objectives || '[]'),
        topics: JSON.parse(plan.topics || '[]'),
        assignments: JSON.parse(plan.assignments || '[]'),
        readings: JSON.parse(plan.readings || '[]'),
        resources: JSON.parse(plan.resources || '[]')
      };

      return new Response(JSON.stringify(parsedPlan), { status: 200 });
    } catch (error) {
      console.error('Error fetching lesson plan:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch lesson plan' }), { status: 500 });
    }
  });

  /**
   * PUT /api/lesson-plans/:planId
   * Update lesson plan
   */
  router.put('/api/lesson-plans/:planId', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { planId } = req.params;
      const updates = await req.json();

      const updatedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const allowedFields = ['title', 'objectives', 'topics', 'lecture_outline', 'assignments', 'readings', 'resources', 'assessments', 'notes', 'status'];

      for (const [key, value] of Object.entries(updates)) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (allowedFields.includes(dbKey)) {
          updateFields.push(`${dbKey} = ?`);
          updateValues.push(typeof value === 'object' ? JSON.stringify(value) : value);
        }
      }

      if (updateFields.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid fields to update' }),
          { status: 400 }
        );
      }

      updateFields.push('updated_at = ?');
      updateValues.push(updatedAt);
      updateValues.push(planId);

      await env.DB.prepare(
        `UPDATE lesson_plans SET ${updateFields.join(', ')} WHERE id = ?`
      )
        .bind(...updateValues)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('lesson_plan_updated', 'lesson_plan', planId, userId, JSON.stringify({ updates }), updatedAt)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          planId,
          updatedAt
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error updating lesson plan:', error);
      return new Response(JSON.stringify({ error: 'Failed to update lesson plan' }), { status: 500 });
    }
  });

  /**
   * PATCH /api/lesson-plans/:planId/publish
   * Publish lesson plan (make visible to students)
   */
  router.patch('/api/lesson-plans/:planId/publish', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { planId } = req.params;

      const updatedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      await env.DB.prepare(
        `UPDATE lesson_plans 
         SET status = 'published', updated_at = ? 
         WHERE id = ?`
      )
        .bind(updatedAt, planId)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('lesson_plan_published', 'lesson_plan', planId, userId, JSON.stringify({ publishedAt: updatedAt }), updatedAt)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          planId,
          status: 'published'
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error publishing lesson plan:', error);
      return new Response(JSON.stringify({ error: 'Failed to publish lesson plan' }), { status: 500 });
    }
  });

  /**
   * DELETE /api/lesson-plans/:planId
   * Delete lesson plan (only draft status)
   */
  router.delete('/api/lesson-plans/:planId', verifyAuth(['admin', 'teacher']), async (req) => {
    try {
      const { planId } = req.params;

      // Check status first
      const plan = await env.DB.prepare(
        `SELECT status FROM lesson_plans WHERE id = ?`
      )
        .bind(planId)
        .first();

      if (plan?.status !== 'draft') {
        return new Response(
          JSON.stringify({ error: 'Only draft lesson plans can be deleted' }),
          { status: 400 }
        );
      }

      const deletedAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      await env.DB.prepare(
        `DELETE FROM lesson_plans WHERE id = ?`
      )
        .bind(planId)
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('lesson_plan_deleted', 'lesson_plan', planId, userId, JSON.stringify({ deletedBy: userId }), deletedAt)
        .run();

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      return new Response(JSON.stringify({ error: 'Failed to delete lesson plan' }), { status: 500 });
    }
  });

  /**
   * GET /api/lesson-plans/week/:classScheduleId/:weekNumber
   * Get lesson plan for specific week
   */
  router.get('/api/lesson-plans/week/:classScheduleId/:weekNumber', verifyAuth(['teacher', 'admin', 'student']), async (req) => {
    try {
      const { classScheduleId, weekNumber } = req.params;

      const plan = await env.DB.prepare(
        `SELECT * FROM lesson_plans 
         WHERE class_schedule_id = ? AND week_number = ?`
      )
        .bind(classScheduleId, parseInt(weekNumber))
        .first();

      if (!plan) {
        return new Response(JSON.stringify({ error: 'Lesson plan not found for this week' }), { status: 404 });
      }

      // Parse JSON fields
      const parsedPlan = {
        ...plan,
        objectives: JSON.parse(plan.objectives || '[]'),
        topics: JSON.parse(plan.topics || '[]'),
        assignments: JSON.parse(plan.assignments || '[]'),
        readings: JSON.parse(plan.readings || '[]'),
        resources: JSON.parse(plan.resources || '[]')
      };

      return new Response(JSON.stringify(parsedPlan), { status: 200 });
    } catch (error) {
      console.error('Error fetching weekly lesson plan:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch lesson plan' }), { status: 500 });
    }
  });

  /**
   * POST /api/lesson-plans/:planId/copy
   * Duplicate lesson plan for another week
   */
  router.post('/api/lesson-plans/:planId/copy', verifyAuth(['teacher', 'admin']), async (req) => {
    try {
      const { planId } = req.params;
      const { newWeekNumber, newStartDate, newEndDate } = await req.json();

      // Get existing plan
      const originalPlan = await env.DB.prepare(
        `SELECT * FROM lesson_plans WHERE id = ?`
      )
        .bind(planId)
        .first();

      if (!originalPlan) {
        return new Response(JSON.stringify({ error: 'Original lesson plan not found' }), { status: 404 });
      }

      const newPlanId = `lp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();
      const userId = (req as any).user?.id || 'unknown';

      // Copy plan with new week info
      await env.DB.prepare(
        `INSERT INTO lesson_plans 
         (id, class_schedule_id, course_name, week_number, start_date, end_date, title, 
          objectives, topics, lecture_outline, assignments, readings, resources, assessments, 
          notes, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          newPlanId,
          originalPlan.class_schedule_id,
          originalPlan.course_name,
          newWeekNumber,
          newStartDate,
          newEndDate,
          originalPlan.title,
          originalPlan.objectives,
          originalPlan.topics,
          originalPlan.lecture_outline,
          originalPlan.assignments,
          originalPlan.readings,
          originalPlan.resources,
          originalPlan.assessments,
          originalPlan.notes,
          'draft',
          userId,
          createdAt,
          createdAt
        )
        .run();

      // Log audit
      await env.DB.prepare(
        `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('lesson_plan_copied', 'lesson_plan', newPlanId, userId, JSON.stringify({ copiedFrom: planId }), createdAt)
        .run();

      return new Response(
        JSON.stringify({
          newPlanId,
          weekNumber: newWeekNumber,
          status: 'draft'
        }),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error copying lesson plan:', error);
      return new Response(JSON.stringify({ error: 'Failed to copy lesson plan' }), { status: 500 });
    }
  });

  return router;
};
