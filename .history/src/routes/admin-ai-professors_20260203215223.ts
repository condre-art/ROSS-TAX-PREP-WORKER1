// src/routes/admin-ai-professors.ts
// Admin interface for managing AI instructors

import { Router } from 'itty-router';
import { verifyAuth } from '../utils/auth';
import { logAudit } from '../utils/audit';

const router = Router();

interface AIProfessorConfig {
  id: string;
  courseId: string;
  programId: string;
  professorName: string;
  professorTitle: string;
  bio: string;
  teachingStyle: string;
  specialization: string;
  systemPrompt: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all AI professors
 * GET /admin/ai-professors
 */
router.get('/admin/ai-professors', async (req: any, env: any, ctx: any) => {
  try {
    // Verify admin role
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = env.DB;
    const professors = await db
      .prepare('SELECT * FROM ai_professors ORDER BY course_id')
      .all();

    await logAudit(db, auth.userId, 'VIEW_AI_PROFESSORS', 'ai_professor', null, {
      count: professors.results.length
    });

    return new Response(JSON.stringify(professors.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching AI professors:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get specific AI professor
 * GET /admin/ai-professors/:id
 */
router.get('/admin/ai-professors/:id', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = req.params;
    const db = env.DB;

    const professor = await db
      .prepare('SELECT * FROM ai_professors WHERE id = ?')
      .bind(id)
      .first();

    if (!professor) {
      return new Response(JSON.stringify({ error: 'Professor not found' }), {
        status: 404
      });
    }

    await logAudit(db, auth.userId, 'VIEW_AI_PROFESSOR', 'ai_professor', id, {});

    return new Response(JSON.stringify(professor), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching AI professor:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Create new AI professor
 * POST /admin/ai-professors
 */
router.post('/admin/ai-professors', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const {
      courseId,
      programId,
      professorName,
      professorTitle,
      bio,
      teachingStyle,
      specialization,
      systemPrompt,
      enabled = true
    } = body;

    // Validate required fields
    if (
      !courseId ||
      !programId ||
      !professorName ||
      !systemPrompt
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const db = env.DB;
    const id = `prof-${courseId}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const result = await db
      .prepare(
        `INSERT INTO ai_professors 
        (id, course_id, program_id, professor_name, professor_title, bio, teaching_style, specialization, system_prompt, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        courseId,
        programId,
        professorName,
        professorTitle || null,
        bio || null,
        teachingStyle || null,
        specialization || null,
        systemPrompt,
        enabled ? 1 : 0,
        now,
        now
      )
      .run();

    await logAudit(db, auth.userId, 'CREATE_AI_PROFESSOR', 'ai_professor', id, {
      courseId,
      professorName
    });

    return new Response(
      JSON.stringify({
        success: true,
        id,
        message: 'AI Professor created successfully'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error creating AI professor:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Update AI professor
 * PUT /admin/ai-professors/:id
 */
router.put('/admin/ai-professors/:id', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = req.params;
    const body = await req.json();
    const db = env.DB;
    const now = new Date().toISOString();

    // Check if professor exists
    const existing = await db
      .prepare('SELECT id FROM ai_professors WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Professor not found' }), {
        status: 404
      });
    }

    // Build update query dynamically
    const updates = [];
    const bindings = [];

    if (body.professorName !== undefined) {
      updates.push('professor_name = ?');
      bindings.push(body.professorName);
    }
    if (body.professorTitle !== undefined) {
      updates.push('professor_title = ?');
      bindings.push(body.professorTitle);
    }
    if (body.bio !== undefined) {
      updates.push('bio = ?');
      bindings.push(body.bio);
    }
    if (body.teachingStyle !== undefined) {
      updates.push('teaching_style = ?');
      bindings.push(body.teachingStyle);
    }
    if (body.specialization !== undefined) {
      updates.push('specialization = ?');
      bindings.push(body.specialization);
    }
    if (body.systemPrompt !== undefined) {
      updates.push('system_prompt = ?');
      bindings.push(body.systemPrompt);
    }
    if (body.enabled !== undefined) {
      updates.push('enabled = ?');
      bindings.push(body.enabled ? 1 : 0);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400
      });
    }

    updates.push('updated_at = ?');
    bindings.push(now);
    bindings.push(id);

    const query = `UPDATE ai_professors SET ${updates.join(', ')} WHERE id = ?`;

    await db.prepare(query).bind(...bindings).run();

    await logAudit(db, auth.userId, 'UPDATE_AI_PROFESSOR', 'ai_professor', id, {
      updates: Object.keys(body)
    });

    return new Response(JSON.stringify({ success: true, message: 'Updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error updating AI professor:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Enable/disable AI professor
 * PATCH /admin/ai-professors/:id/status
 */
router.patch('/admin/ai-professors/:id/status', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = req.params;
    const body = await req.json();
    const { enabled } = body;

    if (enabled === undefined) {
      return new Response(JSON.stringify({ error: 'enabled field required' }), {
        status: 400
      });
    }

    const db = env.DB;
    const now = new Date().toISOString();

    await db
      .prepare(
        'UPDATE ai_professors SET enabled = ?, updated_at = ? WHERE id = ?'
      )
      .bind(enabled ? 1 : 0, now, id)
      .run();

    await logAudit(db, auth.userId, 'TOGGLE_AI_PROFESSOR', 'ai_professor', id, {
      enabled
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Professor ${enabled ? 'enabled' : 'disabled'}`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error updating professor status:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Delete AI professor
 * DELETE /admin/ai-professors/:id
 */
router.delete('/admin/ai-professors/:id', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = req.params;
    const db = env.DB;

    // Check if professor exists
    const professor = await db
      .prepare('SELECT professor_name FROM ai_professors WHERE id = ?')
      .bind(id)
      .first();

    if (!professor) {
      return new Response(JSON.stringify({ error: 'Professor not found' }), {
        status: 404
      });
    }

    await db.prepare('DELETE FROM ai_professors WHERE id = ?').bind(id).run();

    await logAudit(db, auth.userId, 'DELETE_AI_PROFESSOR', 'ai_professor', id, {
      professorName: professor.professor_name
    });

    return new Response(JSON.stringify({ success: true, message: 'Deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error deleting AI professor:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Test AI professor on a topic
 * POST /admin/ai-professors/:id/test
 */
router.post('/admin/ai-professors/:id/test', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = req.params;
    const body = await req.json();
    const { topic, level = 'beginner' } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: 'topic required' }), { status: 400 });
    }

    const db = env.DB;
    const professor = await db
      .prepare('SELECT * FROM ai_professors WHERE id = ?')
      .bind(id)
      .first();

    if (!professor) {
      return new Response(JSON.stringify({ error: 'Professor not found' }), {
        status: 404
      });
    }

    // For testing, we would call the AI professor's generateLecture function
    // This is a placeholder for the actual implementation
    const testResult = {
      professorId: id,
      professorName: professor.professor_name,
      topic,
      level,
      status: 'ready',
      message: 'AI Professor is ready to generate lectures on this topic'
    };

    return new Response(JSON.stringify(testResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error testing AI professor:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get professors by course
 * GET /admin/ai-professors/course/:courseId
 */
router.get('/admin/ai-professors/course/:courseId', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { courseId } = req.params;
    const db = env.DB;

    const professors = await db
      .prepare('SELECT * FROM ai_professors WHERE course_id = ?')
      .bind(courseId)
      .all();

    return new Response(JSON.stringify(professors.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching professors for course:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get AI professor dashboard stats
 * GET /admin/ai-professors/stats/dashboard
 */
router.get('/admin/ai-professors/stats/dashboard', async (req: any, env: any, ctx: any) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.authorized || auth.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = env.DB;

    const stats = await db
      .prepare(
        `SELECT 
          COUNT(*) as total_professors,
          SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as enabled_professors,
          SUM(CASE WHEN enabled = 0 THEN 1 ELSE 0 END) as disabled_professors
         FROM ai_professors`
      )
      .first();

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

export default router;
