import { Router } from 'itty-router';
import { requireStaff } from '../middleware/auth';
import { isValidEmail, validateRequiredFields } from '../middleware/validation';
import { logAudit } from '../utils/audit';

const lmsRouter = Router();

// In-memory LMS data (replace with DB in production)
const courses = [
  {
    id: 'c1',
    title: 'Tax Preparer Onboarding',
    modules: [
      { id: 'm1', title: 'Compliance & Ethics', duration: '30m', status: 'Live' },
      { id: 'm2', title: 'Client Intake & KYC', duration: '20m', status: 'Live' },
      { id: 'm3', title: 'E-File Procedures', duration: '25m', status: 'Live' },
      { id: 'm4', title: 'Data Security', duration: '15m', status: 'Live' }
    ]
  }
];
const students = [
  { id: 's1', name: 'Jane Doe', email: 'jane@example.com', courses: ['c1'] }
];
const enrollments = [
  { id: 'e1', studentId: 's1', courseId: 'c1', status: 'active' }
];

// Theme/branding config
let lmsConfig = {
  theme: {
    primary: '#11233B',
    accent: '#C9A24D',
    background: '#F5F5F5',
    font: 'Inter, Arial, sans-serif',
    logo: '/public/rtb-logo.png'
  },
  orgName: 'Ross Tax Prep & Bookkeeping',
  compliance: ['IRS', 'SOC2', 'ADA'],
  year: 2026
};

// GET /api/lms/courses
lmsRouter.get('/courses', (req, env) => {
  return new Response(JSON.stringify(courses), { headers: { 'Content-Type': 'application/json' } });
});

// GET /api/lms/courses/:id
lmsRouter.get('/courses/:id', (req, env) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(course), { headers: { 'Content-Type': 'application/json' } });
});

// POST /api/lms/courses
lmsRouter.post('/courses', async (req, env) => {
  try {
    const body = await req.json();
    const { valid, errors } = validateRequiredFields(body, ['title']);
    if (!valid) return new Response(JSON.stringify({ error: errors }), { status: 400 });
    const id = 'c' + (courses.length + 1);
    const course = { id, title: body.title, modules: [] };
    courses.push(course);
    await logAudit(env, { action: 'lms_course_create', entity: 'courses', entity_id: id });
    return new Response(JSON.stringify(course), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('LMS create course error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create course' }), { status: 500 });
  }
});

// PUT /api/lms/courses/:id
lmsRouter.put('/courses/:id', async (req, env) => {
  try {
    const body = await req.json();
    const course = courses.find(c => c.id === req.params.id);
    if (!course) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    course.title = body.title || course.title;
    course.modules = body.modules || course.modules;
    await logAudit(env, { action: 'lms_course_update', entity: 'courses', entity_id: course.id });
    return new Response(JSON.stringify(course), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('LMS update course error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update course' }), { status: 500 });
  }
});

// DELETE /api/lms/courses/:id
lmsRouter.delete('/courses/:id', async (req, env) => {
  try {
    const idx = courses.findIndex(c => c.id === req.params.id);
    if (idx === -1) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    const [removed] = courses.splice(idx, 1);
    await logAudit(env, { action: 'lms_course_delete', entity: 'courses', entity_id: removed.id });
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('LMS delete course error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete course' }), { status: 500 });
  }
});

// GET /api/lms/students
lmsRouter.get('/students', (req, env) => {
  return new Response(JSON.stringify(students), { headers: { 'Content-Type': 'application/json' } });
});

// GET /api/lms/students/:id
lmsRouter.get('/students/:id', (req, env) => {
  const student = students.find(s => s.id === req.params.id);
  if (!student) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(student), { headers: { 'Content-Type': 'application/json' } });
});

// POST /api/lms/students
lmsRouter.post('/students', async (req, env) => {
  try {
    const body = (await req.json()) as { name: string; email: string };
    const { valid, errors } = validateRequiredFields(body, ['name', 'email']);
    if (!valid || !isValidEmail(body.email)) return new Response(JSON.stringify({ error: errors }), { status: 400 });
    const studentId = 's' + (students.length + 1);
    const student = { id: studentId, name: body.name, email: body.email, courses: [] };
    students.push(student);
    await logAudit(env, { action: 'lms_student_create', entity: 'students', entity_id: studentId });
    return new Response(JSON.stringify(student), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('LMS create student error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create student' }), { status: 500 });
  }
});

// PATCH /api/lms/students/:id
lmsRouter.patch('/students/:id', async (req, env) => {
  try {
    const body = (await req.json()) as { name?: string; email?: string; courses?: any[] };
    const student = students.find(s => s.id === req.params.id);
    if (!student) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    student.name = body.name || student.name;
    student.email = body.email || student.email;
    student.courses = body.courses || student.courses;
    await logAudit(env, { action: 'lms_student_update', entity: 'students', entity_id: student.id });
    return new Response(JSON.stringify(student), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('LMS update student error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update student' }), { status: 500 });
  }
});

// DELETE /api/lms/students/:id
lmsRouter.delete('/students/:id', async (req, env) => {
  try {
    const idx = students.findIndex(s => s.id === req.params.id);
    if (idx === -1) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    const [removed] = students.splice(idx, 1);
    await logAudit(env, { action: 'lms_student_delete', entity: 'students', entity_id: removed.id });
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('LMS delete student error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete student' }), { status: 500 });
  }
});

// POST /api/lms/enroll
lmsRouter.post('/enroll', async (req, env) => {
  try {
    const body = (await req.json()) as { name?: string; email?: string; studentId?: string; courseId?: string };
    // Support both student creation and enrollment
    if (body.name && body.email) {
      const { valid, errors } = validateRequiredFields(body, ['name', 'email']);
      if (!valid || !isValidEmail(body.email)) return new Response(JSON.stringify({ error: errors }), { status: 400 });
      const id = 's' + (students.length + 1);
      const student = { id, name: body.name, email: body.email, courses: [] };
      students.push(student);
      await logAudit(env, { action: 'lms_student_create', entity: 'students', entity_id: id });
      return new Response(JSON.stringify(student), { headers: { 'Content-Type': 'application/json' } });
    }
    if (body.studentId && body.courseId) {
      const enrollmentId = 'e' + (enrollments.length + 1);
      enrollments.push({ id: enrollmentId, studentId: body.studentId, courseId: body.courseId, status: 'active' });
      await logAudit(env, { action: 'lms_enroll', entity: 'enrollments', entity_id: enrollmentId });
      return new Response(JSON.stringify({ success: true, id: enrollmentId }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  } catch (error) {
    console.error('LMS enroll error:', error);
    return new Response(JSON.stringify({ error: 'Failed to enroll student' }), { status: 500 });
  }
});

// GET /api/lms/enrollments
lmsRouter.get('/enrollments', (req, env) => {
  return new Response(JSON.stringify(enrollments), { headers: { 'Content-Type': 'application/json' } });
});

// GET /api/lms/enrollments/:id
lmsRouter.get('/enrollments/:id', (req, env) => {
  const enr = enrollments.find(e => e.id === req.params.id);
  if (!enr) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(enr), { headers: { 'Content-Type': 'application/json' } });
});

// LMS THEME/CONFIGURATION ENDPOINT
// GET /api/lms/config
lmsRouter.get('/config', (req, env) => {
  return new Response(JSON.stringify(lmsConfig), { headers: { 'Content-Type': 'application/json' } });
});
// PUT /api/lms/config (staff only)
lmsRouter.put('/config', requireStaff, async (req, env) => {
  const body = (await req.json()) as Partial<typeof lmsConfig>;
  lmsConfig = { ...lmsConfig, ...(typeof body === 'object' && body !== null ? body : {}) };
  await logAudit(env, { action: 'lms_config_update', entity: 'lms_config', entity_id: 'lms' });
  return new Response(JSON.stringify(lmsConfig), { headers: { 'Content-Type': 'application/json' } });
});

// ============================================================================
// ACADEMY LMS SYSTEM - RBAC, WORKFLOWS, CONTENT, EXAMS, DEGREE PROGRAM
// ============================================================================

/**
 * HELPER FUNCTIONS
 */

async function hasPermission(env: any, userId: number, userType: string, permissionName: string): Promise<boolean> {
  if (!env.DB) return false;
  
  try {
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_role_permissions
      WHERE role_id IN (
        SELECT role_id FROM lms_user_roles 
        WHERE user_id = ? AND user_type = ?
      )
      AND permission_id IN (
        SELECT id FROM lms_permissions 
        WHERE permission_name = ?
      )
    `).bind(userId, userType, permissionName).first();
    
    return result && result.count > 0;
  } catch (e) {
    console.error('Permission check failed:', e);
    return false;
  }
}

async function getUserRoles(env: any, userId: number, userType: string): Promise<any[]> {
  if (!env.DB) return [];
  
  try {
    const result = await env.DB.prepare(`
      SELECT r.* FROM lms_roles r
      JOIN lms_user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ? AND ur.user_type = ?
    `).bind(userId, userType).all();
    
    return result?.results || [];
  } catch (e) {
    console.error('Get roles failed:', e);
    return [];
  }
}

async function executeWorkflow(env: any, workflowId: string, entityType: string, entityId: string): Promise<any> {
  if (!env.DB) return null;
  
  try {
    const workflow = await env.DB.prepare('SELECT * FROM lms_workflows WHERE id = ?').bind(workflowId).first();
    if (!workflow) return null;
    
    const steps = await env.DB.prepare(`
      SELECT * FROM lms_workflow_steps 
      WHERE workflow_id = ? 
      ORDER BY step_order ASC
    `).bind(workflowId).all();
    
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    for (const step of steps?.results || []) {
      await env.DB.prepare(`
        INSERT INTO lms_workflow_executions 
        (id, workflow_id, entity_type, entity_id, execution_status, created_at)
        VALUES (?, ?, ?, ?, 'pending', datetime('now'))
      `).bind(executionId, workflowId, entityType, entityId).run();
      
      if (step.auto_execute === 1) {
        await executeWorkflowStep(env, executionId, step, entityType, entityId);
      }
    }
    
    return executionId;
  } catch (e) {
    console.error('Workflow execution failed:', e);
    return null;
  }
}

async function executeWorkflowStep(env: any, executionId: string, step: any, entityType: string, entityId: string): Promise<void> {
  if (!env.DB) return;
  
  try {
    if (step.step_type === 'auto_assign_role') {
      const roles = await env.DB.prepare(`
        SELECT * FROM lms_roles WHERE role_name = 'student'
      `).first();
      
      if (roles) {
        await env.DB.prepare(`
          INSERT INTO lms_user_roles (user_id, role_id, user_type, assigned_at)
          VALUES (?, ?, 'client', datetime('now'))
        `).bind(parseInt(entityId), roles.id).run();
      }
    } else if (step.step_type === 'grant_access') {
      await env.DB.prepare(`
        INSERT INTO lms_content_items (id, library_id, title, content_type, view_count, created_at)
        VALUES (?, ?, ?, 'welcome', 0, datetime('now'))
      `).bind(`item-${entityId}`, 'lib-faq', `Welcome ${entityId}`).run();
    } else if (step.step_type === 'send_email') {
      console.log(`[WORKFLOW] Sending email for ${entityType}:${entityId}`);
    } else if (step.step_type === 'create_task') {
      console.log(`[WORKFLOW] Creating task for ${entityType}:${entityId}`);
    }
    
    await env.DB.prepare(`
      UPDATE lms_workflow_executions 
      SET execution_status = 'completed' 
      WHERE id = ?
    `).bind(executionId).run();
  } catch (e) {
    console.error('Workflow step execution failed:', e);
  }
}

/**
 * ENROLLMENT ENDPOINTS
 */

// POST /api/lms/enroll - Enroll student in program
lmsRouter.post('/enroll', async (req, env) => {
  try {
    const body = (await req.json()) as Record<string, any>;
    const { student_id, student_email, program_id } = body;
    
    if (!student_id || !program_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const enrollmentId = `enroll-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    await env.DB.prepare(`
      INSERT INTO lms_degree_enrollments 
      (id, program_id, student_id, enrollment_status, current_semester, total_credits_completed, cumulative_gpa)
      VALUES (?, ?, ?, 'active', 1, 0.0, 0.0)
    `).bind(enrollmentId, program_id, student_id).run();
    
    // Trigger enrollment workflow
    await executeWorkflow(env, 'workflow-enrollment', 'degree_enrollment', enrollmentId);
    
    await logAudit(env, {
      action: 'enrollment_created',
      entity: 'degree_enrollment',
      entity_id: enrollmentId,
      details: JSON.stringify({ student_id, program_id })
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      enrollment_id: enrollmentId,
      message: 'Enrollment successful. Workflow triggered.'
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Enrollment error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// GET /api/lms/enrollments/:studentId - Get student enrollments
lmsRouter.get('/enrollments/:studentId', async (req, env) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    const enrollments = await env.DB.prepare(`
      SELECT de.*, dp.program_name, dp.degree_type, dp.total_credits_required
      FROM lms_degree_enrollments de
      JOIN lms_degree_programs dp ON de.program_id = dp.id
      WHERE de.student_id = ?
      ORDER BY de.created_at DESC
    `).bind(studentId).all();
    
    return new Response(JSON.stringify(enrollments?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Get enrollments error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * RBAC ENDPOINTS
 */

// GET /api/lms/roles - List all roles
lmsRouter.get('/roles', async (req, env) => {
  try {
    const roles = await env.DB.prepare('SELECT * FROM lms_roles ORDER BY role_name ASC').all();
    return new Response(JSON.stringify(roles?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// GET /api/lms/user-roles/:userId/:userType - Get user's roles
lmsRouter.get('/user-roles/:userId/:userType', async (req, env) => {
  try {
    const userId = parseInt(req.params.userId);
    const userType = req.params.userType;
    
    const roles = await getUserRoles(env, userId, userType);
    
    return new Response(JSON.stringify(roles), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// POST /api/lms/assign-role - Assign role to user
lmsRouter.post('/assign-role', async (req, env) => {
  try {
    const body = (await req.json()) as Record<string, any>;
    const { user_id, user_type, role_id, expiration_date } = body;
    
    if (!user_id || !user_type || !role_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const assignmentId = `assign-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    await env.DB.prepare(`
      INSERT INTO lms_user_roles 
      (id, user_id, role_id, user_type, assigned_at, expiration_date)
      VALUES (?, ?, ?, ?, datetime('now'), ?)
    `).bind(assignmentId, user_id, role_id, user_type, expiration_date || null).run();
    
    await logAudit(env, {
      action: 'role_assigned',
      entity: 'user_role',
      entity_id: assignmentId,
      user_id,
      details: JSON.stringify({ role_id, user_type })
    });
    
    return new Response(JSON.stringify({ success: true, assignment_id: assignmentId }), { status: 201 });
  } catch (error: any) {
    console.error('Assign role error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// GET /api/lms/check-permission/:userId/:userType/:permissionName
lmsRouter.get('/check-permission/:userId/:userType/:permissionName', async (req, env) => {
  try {
    const userId = parseInt(req.params.userId);
    const userType = req.params.userType;
    const permissionName = req.params.permissionName;
    
    const hasPermissionResult = await hasPermission(env, userId, userType, permissionName);
    
    return new Response(JSON.stringify({ 
      user_id: userId,
      user_type: userType,
      permission: permissionName,
      has_permission: hasPermissionResult
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * CONTENT LIBRARY ENDPOINTS
 */

// GET /api/lms/libraries - List all content libraries
lmsRouter.get('/libraries', async (req, env) => {
  try {
    const libraries = await env.DB.prepare(`
      SELECT cl.*, COUNT(ci.id) as item_count
      FROM lms_content_libraries cl
      LEFT JOIN lms_content_items ci ON cl.id = ci.library_id
      GROUP BY cl.id
      ORDER BY cl.library_name ASC
    `).all();
    
    return new Response(JSON.stringify(libraries?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// GET /api/lms/library/:libraryId/items - Get library items with search/filter
lmsRouter.get('/library/:libraryId/items', async (req, env) => {
  try {
    const libraryId = req.params.libraryId;
    const search = new URL(req.url).searchParams.get('search') || '';
    const category = new URL(req.url).searchParams.get('category') || '';
    const limit = parseInt(new URL(req.url).searchParams.get('limit') || '50');
    
    let query = `
      SELECT * FROM lms_content_items
      WHERE library_id = ?
    `;
    const params = [libraryId];
    
    if (search) {
      query += ` AND (title LIKE ? OR content_type LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY view_count DESC LIMIT ?`;
    params.push(limit);
    
    const items = await env.DB.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify(items?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// POST /api/lms/library/item - Create content item (with approval workflow)
lmsRouter.post('/library/item', async (req, env) => {
  try {
    const body = (await req.json()) as Record<string, any>;
    const { library_id, title, content_type, requires_approval } = body;
    
    if (!library_id || !title) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const itemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    await env.DB.prepare(`
      INSERT INTO lms_content_items 
      (id, library_id, title, content_type, requires_approval, view_count, created_at)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
    `).bind(itemId, library_id, title, content_type || 'document', requires_approval ? 1 : 0).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      item_id: itemId,
      requires_approval: requires_approval || false
    }), { status: 201 });
  } catch (error: any) {
    console.error('Create content error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * FAQ ENDPOINTS
 */

// GET /api/lms/faq - Get all FAQs grouped by category
lmsRouter.get('/faq', async (req, env) => {
  try {
    const categories = await env.DB.prepare(`
      SELECT fc.*, COUNT(fi.id) as item_count
      FROM lms_faq_categories fc
      LEFT JOIN lms_faq_items fi ON fc.id = fi.category_id
      GROUP BY fc.id
      ORDER BY fc.category_order ASC
    `).all();
    
    const result = [];
    for (const cat of categories?.results || []) {
      const items = await env.DB.prepare(`
        SELECT * FROM lms_faq_items
        WHERE category_id = ?
        ORDER BY is_featured DESC
      `).bind(cat.id).all();
      
      result.push({
        category: cat,
        items: items?.results || []
      });
    }
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// POST /api/lms/faq/:faqId/helpful - Vote on FAQ helpfulness
lmsRouter.post('/faq/:faqId/helpful', async (req, env) => {
  try {
    const faqId = req.params.faqId;
    const body = (await req.json()) as Record<string, any>;
    const { is_helpful } = body;
    
    if (typeof is_helpful !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Invalid helpful flag' }), { status: 400 });
    }
    
    if (is_helpful) {
      await env.DB.prepare(`
        UPDATE lms_faq_items 
        SET helpful_count = helpful_count + 1 
        WHERE id = ?
      `).bind(faqId).run();
    } else {
      await env.DB.prepare(`
        UPDATE lms_faq_items 
        SET not_helpful_count = not_helpful_count + 1 
        WHERE id = ?
      `).bind(faqId).run();
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * SUPPORT TICKET ENDPOINTS
 */

// POST /api/lms/support/ticket - Create support ticket
lmsRouter.post('/support/ticket', async (req, env) => {
  try {
    const body = (await req.json()) as Record<string, any>;
    const { student_id, subject, category, priority } = body;
    
    if (!student_id || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const ticketNumber = `TICKET-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;
    
    await env.DB.prepare(`
      INSERT INTO lms_support_tickets 
      (id, ticket_number, student_id, subject, category, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'))
    `).bind(ticketId, ticketNumber, student_id, subject, category || 'general', priority || 'normal').run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      ticket_id: ticketId,
      ticket_number: ticketNumber
    }), { status: 201 });
  } catch (error: any) {
    console.error('Create ticket error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// GET /api/lms/support/tickets/:studentId - Get student's support tickets
lmsRouter.get('/support/tickets/:studentId', async (req, env) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    const tickets = await env.DB.prepare(`
      SELECT * FROM lms_support_tickets
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(studentId).all();
    
    return new Response(JSON.stringify(tickets?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// POST /api/lms/support/ticket/:ticketId/message - Add message to ticket
lmsRouter.post('/support/ticket/:ticketId/message', async (req, env) => {
  try {
    const ticketId = req.params.ticketId;
    const body = (await req.json()) as Record<string, any>;
    const { sender_id, sender_type, message, is_internal_note } = body;
    
    if (!sender_id || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    await env.DB.prepare(`
      INSERT INTO lms_support_messages 
      (id, ticket_id, sender_id, sender_type, message, is_internal_note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(messageId, ticketId, sender_id, sender_type || 'student', message, is_internal_note ? 1 : 0).run();
    
    // Auto-update ticket status if staff replied
    if (sender_type === 'staff') {
      await env.DB.prepare(`
        UPDATE lms_support_tickets 
        SET status = 'in_progress', updated_at = datetime('now')
        WHERE id = ? AND status = 'open'
      `).bind(ticketId).run();
    }
    
    return new Response(JSON.stringify({ success: true, message_id: messageId }), { status: 201 });
  } catch (error: any) {
    console.error('Add message error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * AI INSTRUCTOR ENDPOINTS
 */

// GET /api/lms/instructors - List AI instructors
lmsRouter.get('/instructors', async (req, env) => {
  try {
    const instructors = await env.DB.prepare(`
      SELECT * FROM lms_ai_instructors
      ORDER BY instructor_name ASC
    `).all();
    
    return new Response(JSON.stringify(instructors?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// GET /api/lms/lectures/:courseId - Get weekly lectures for course
lmsRouter.get('/lectures/:courseId', async (req, env) => {
  try {
    const courseId = req.params.courseId;
    
    const lectures = await env.DB.prepare(`
      SELECT wl.*, ai.instructor_name, ai.instructor_title, ai.voice_model
      FROM lms_weekly_lectures wl
      JOIN lms_ai_instructors ai ON wl.instructor_id = ai.id
      WHERE wl.course_id = ?
      ORDER BY wl.lecture_week ASC
    `).bind(courseId).all();
    
    return new Response(JSON.stringify(lectures?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * EXAM ENDPOINTS
 */

// GET /api/lms/exams/:courseId - List exams for course
lmsRouter.get('/exams/:courseId', async (req, env) => {
  try {
    const courseId = req.params.courseId;
    
    const exams = await env.DB.prepare(`
      SELECT * FROM lms_exams
      WHERE course_id = ?
      ORDER BY exam_type DESC
    `).bind(courseId).all();
    
    return new Response(JSON.stringify(exams?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// POST /api/lms/exam/:examId/attempt - Start exam attempt
lmsRouter.post('/exam/:examId/attempt', async (req, env) => {
  try {
    const examId = req.params.examId;
    const body = (await req.json()) as Record<string, any>;
    const { student_id } = body;
    
    if (!student_id) {
      return new Response(JSON.stringify({ error: 'Missing student_id' }), { status: 400 });
    }
    
    // Check if exam exists and get attempt limit
    const exam = await env.DB.prepare('SELECT * FROM lms_exams WHERE id = ?').bind(examId).first();
    if (!exam) {
      return new Response(JSON.stringify({ error: 'Exam not found' }), { status: 404 });
    }
    
    // Check attempt count
    const attemptCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_exam_attempts
      WHERE exam_id = ? AND student_id = ? AND status IN ('submitted', 'graded')
    `).bind(examId, student_id).first();
    
    if (attemptCount && attemptCount.count >= exam.attempts_allowed) {
      return new Response(JSON.stringify({ error: 'Attempt limit reached' }), { status: 400 });
    }
    
    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const attemptNumber = (attemptCount?.count || 0) + 1;
    
    await env.DB.prepare(`
      INSERT INTO lms_exam_attempts 
      (id, exam_id, student_id, attempt_number, status, started_at)
      VALUES (?, ?, ?, ?, 'in_progress', datetime('now'))
    `).bind(attemptId, examId, student_id, attemptNumber).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      attempt_id: attemptId,
      attempt_number: attemptNumber
    }), { status: 201 });
  } catch (error: any) {
    console.error('Start exam error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// POST /api/lms/exam/attempt/:attemptId/submit - Submit exam
lmsRouter.post('/exam/attempt/:attemptId/submit', async (req, env) => {
  try {
    const attemptId = req.params.attemptId;
    const body = (await req.json()) as Record<string, any>;
    const { answers } = body;
    
    if (!Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: 'Invalid answers format' }), { status: 400 });
    }
    
    // Get exam attempt details
    const attempt = await env.DB.prepare(`
      SELECT ea.*, le.total_points
      FROM lms_exam_attempts ea
      JOIN lms_exams le ON ea.exam_id = le.id
      WHERE ea.id = ?
    `).bind(attemptId).first();
    
    if (!attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), { status: 404 });
    }
    
    // Store answers and auto-grade multiple choice
    let pointsEarned = 0;
    
    for (const answer of answers) {
      const { question_id, student_answer } = answer;
      
      const question = await env.DB.prepare(`
        SELECT * FROM lms_exam_questions WHERE id = ?
      `).bind(question_id).first();
      
      if (question) {
        let isCorrect = 0;
        let pointsAwarded = 0;
        
        if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
          isCorrect = student_answer === question.correct_answer ? 1 : 0;
          pointsAwarded = isCorrect ? question.points : 0;
          pointsEarned += pointsAwarded;
        }
        
        const answerId = `ans-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        
        await env.DB.prepare(`
          INSERT INTO lms_exam_answers 
          (id, attempt_id, question_id, student_answer, is_correct, points_awarded)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(answerId, attemptId, question_id, student_answer, isCorrect, pointsAwarded).run();
      }
    }
    
    // Calculate score percentage
    const scorePercentage = (pointsEarned / attempt.total_points) * 100;
    
    // Update attempt status
    await env.DB.prepare(`
      UPDATE lms_exam_attempts 
      SET status = 'submitted', submitted_at = datetime('now'), score = ?
      WHERE id = ?
    `).bind(scorePercentage, attemptId).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      points_earned: pointsEarned,
      total_points: attempt.total_points,
      score_percentage: scorePercentage.toFixed(2),
      message: 'Exam submitted. Auto-graded items scored.'
    }), { status: 200 });
  } catch (error: any) {
    console.error('Submit exam error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * DEGREE PROGRAM ENDPOINTS
 */

// GET /api/lms/degree-programs - List degree programs
lmsRouter.get('/degree-programs', async (req, env) => {
  try {
    const programs = await env.DB.prepare(`
      SELECT * FROM lms_degree_programs
      ORDER BY program_name ASC
    `).all();
    
    return new Response(JSON.stringify(programs?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// GET /api/lms/degree-program/:programId/curriculum - Get curriculum by semester
lmsRouter.get('/degree-program/:programId/curriculum', async (req, env) => {
  try {
    const programId = req.params.programId;
    
    const curriculum = await env.DB.prepare(`
      SELECT dc.*, dlc.course_name, dlc.credit_hours, dlc.course_level
      FROM lms_degree_curriculum dc
      JOIN lms_degree_courses dlc ON dc.course_id = dlc.id
      WHERE dc.program_id = ?
      ORDER BY dc.semester_number ASC, dc.course_order ASC
    `).bind(programId).all();
    
    // Group by semester
    const grouped: Record<string, any[]> = {};
    for (const course of curriculum?.results || []) {
      if (!grouped[course.semester_number]) {
        grouped[course.semester_number] = [];
      }
      grouped[course.semester_number].push(course);
    }
    
    return new Response(JSON.stringify(grouped), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// GET /api/lms/student/:studentId/degree-progress - Get degree progress
lmsRouter.get('/student/:studentId/degree-progress', async (req, env) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    const enrollment = await env.DB.prepare(`
      SELECT de.*, dp.program_name, dp.total_credits_required
      FROM lms_degree_enrollments de
      JOIN lms_degree_programs dp ON de.program_id = dp.id
      WHERE de.student_id = ?
    `).bind(studentId).first();
    
    if (!enrollment) {
      return new Response(JSON.stringify({ error: 'No enrollment found' }), { status: 404 });
    }
    
    const completedCourses = await env.DB.prepare(`
      SELECT * FROM lms_student_course_enrollments
      WHERE degree_enrollment_id = ? AND status = 'completed'
    `).bind(enrollment.id).all();
    
    const creditPercentage = (enrollment.total_credits_completed / enrollment.total_credits_required) * 100;
    
    return new Response(JSON.stringify({
      enrollment,
      completed_courses: completedCourses?.results || [],
      credits_earned: enrollment.total_credits_completed,
      credits_required: enrollment.total_credits_required,
      progress_percentage: creditPercentage.toFixed(2),
      cumulative_gpa: enrollment.cumulative_gpa.toFixed(2),
      current_semester: enrollment.current_semester
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * LEGAL DISCLOSURE ENDPOINTS
 */

// GET /api/lms/disclosures - Get required disclosures
lmsRouter.get('/disclosures', async (req, env) => {
  try {
    const userType = new URL(req.url).searchParams.get('user_type') || 'all_students';
    
    const disclosures = await env.DB.prepare(`
      SELECT * FROM lms_legal_disclosures
      WHERE applies_to = 'all_students' OR applies_to = ?
      ORDER BY disclosure_type ASC
    `).bind(userType).all();
    
    return new Response(JSON.stringify(disclosures?.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// POST /api/lms/disclosure/acknowledge - Log disclosure acknowledgment
lmsRouter.post('/disclosure/acknowledge', async (req, env) => {
  try {
    const body = (await req.json()) as Record<string, any>;
    const { student_id, disclosure_id, ip_address, user_agent } = body;
    
    if (!student_id || !disclosure_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const ackId = `ack-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    await env.DB.prepare(`
      INSERT INTO lms_student_acknowledgments 
      (id, student_id, disclosure_id, acknowledged_at, ip_address, user_agent)
      VALUES (?, ?, ?, datetime('now'), ?, ?)
    `).bind(ackId, student_id, disclosure_id, ip_address || 'unknown', user_agent || 'unknown').run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      acknowledgment_id: ackId
    }), { status: 201 });
  } catch (error: any) {
    console.error('Acknowledge disclosure error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

export default lmsRouter;
