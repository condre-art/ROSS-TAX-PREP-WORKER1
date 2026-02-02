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

export default lmsRouter;
