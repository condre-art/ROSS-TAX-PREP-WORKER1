/**
 * Jobs API Routes
 * 
 * Endpoints:
 * - GET /api/jobs - List all published job postings
 * - GET /api/jobs/:jobId - Get specific job posting
 * - POST /api/jobs/:jobId/apply - Submit job application
 * - GET /api/jobs/admin/all - Get all postings (admin)
 * - POST /api/jobs/admin/create - Create job posting (admin)
 */

import { Router } from 'itty-router';
import {
  getPublishedJobs,
  getJobPosting,
  submitJobApplication,
  createJobPosting,
  publishJobPosting,
  getJobApplications
} from '../jobs';
import { verifyAuth, isAdmin } from '../utils/auth';

const router = Router();

/**
 * GET /api/jobs
 * List all published job postings
 */
router.get('/jobs', async (req, env) => {
  try {
    const jobs = await getPublishedJobs(env);
    
    return new Response(JSON.stringify({
      success: true,
      count: jobs.length,
      jobs
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error listing jobs:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/jobs/:jobId
 * Get specific job posting
 */
router.get('/jobs/:jobId', async (req, env) => {
  try {
    const jobId = req.params.jobId;
    const job = await getJobPosting(env, jobId);
    
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({
      success: true,
      job
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting job:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/jobs/:jobId/apply
 * Submit job application
 */
router.post('/jobs/:jobId/apply', async (req, env) => {
  try {
    const jobId = req.params.jobId;
    const data = await req.json();
    
    // Validate job exists
    const job = await getJobPosting(env, jobId);
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
    }
    
    // Validate required fields
    if (!data.applicant_name || !data.applicant_email || !data.applicant_phone) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: applicant_name, applicant_email, applicant_phone'
      }), { status: 400 });
    }
    
    // Submit application
    const application = await submitJobApplication(env, {
      job_id: jobId,
      applicant_name: data.applicant_name,
      applicant_email: data.applicant_email,
      applicant_phone: data.applicant_phone,
      resume_url: data.resume_url,
      cover_letter: data.cover_letter
    });
    
    return new Response(JSON.stringify({
      success: true,
      application
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error submitting application:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/jobs/admin/all
 * Get all job postings (admin)
 */
router.get('/jobs/admin/all', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid || !isAdmin(auth)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    
    const result = await env.DB.prepare(
      'SELECT * FROM job_postings ORDER BY created_at DESC'
    ).all();
    
    return new Response(JSON.stringify({
      success: true,
      count: result.results.length,
      jobs: result.results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error listing all jobs:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/jobs/admin/create
 * Create job posting (admin)
 */
router.post('/jobs/admin/create', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid || !isAdmin(auth)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    
    const data = await req.json();
    
    if (!data.title || !data.department || !data.employment_type) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: title, department, employment_type'
      }), { status: 400 });
    }
    
    const job = await createJobPosting(env, {
      title: data.title,
      department: data.department,
      description: data.description,
      salary_range_min: data.salary_range_min,
      salary_range_max: data.salary_range_max,
      hourly_rate_min: data.hourly_rate_min,
      hourly_rate_max: data.hourly_rate_max,
      employment_type: data.employment_type,
      requirements: data.requirements || [],
      responsibilities: data.responsibilities || [],
      location: data.location,
      remote: data.remote || false
    });
    
    return new Response(JSON.stringify({
      success: true,
      job
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error creating job:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/jobs/:jobId/admin/publish
 * Publish job posting (admin)
 */
router.post('/jobs/:jobId/admin/publish', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid || !isAdmin(auth)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    
    const jobId = req.params.jobId;
    await publishJobPosting(env, jobId);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Job posted'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error publishing job:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/jobs/:jobId/admin/applications
 * Get all applications for a job (admin)
 */
router.get('/jobs/:jobId/admin/applications', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid || !isAdmin(auth)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    
    const jobId = req.params.jobId;
    const applications = await getJobApplications(env, jobId);
    
    return new Response(JSON.stringify({
      success: true,
      count: applications.length,
      applications
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error listing applications:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

export default router;
