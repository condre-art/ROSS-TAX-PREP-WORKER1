/**
 * Job Posting & Recruitment Management
 * 
 * Handles job postings, applications, and candidate tracking
 * Generates branded PDF job descriptions
 */

import { v4 as uuid } from 'uuid';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  description: string;
  salary_range_min?: number;
  salary_range_max?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'hourly';
  status: 'draft' | 'published' | 'closed' | 'filled';
  requirements: string[]; // JSON array
  responsibilities: string[]; // JSON array
  location?: string;
  remote?: boolean;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  resume_url?: string;
  cover_letter?: string;
  status: 'submitted' | 'under_review' | 'interview' | 'offered' | 'hired' | 'rejected';
  applied_at: string;
  updated_at: string;
}

/**
 * Create job posting
 */
export async function createJobPosting(
  env: any,
  data: {
    title: string;
    department: string;
    description: string;
    salary_range_min?: number;
    salary_range_max?: number;
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    employment_type: 'full_time' | 'part_time' | 'contract' | 'hourly';
    requirements: string[];
    responsibilities: string[];
    location?: string;
    remote?: boolean;
  }
): Promise<JobPosting> {
  const jobId = uuid();
  const now = new Date().toISOString();
  
  const job: JobPosting = {
    id: jobId,
    title: data.title,
    department: data.department,
    description: data.description,
    salary_range_min: data.salary_range_min,
    salary_range_max: data.salary_range_max,
    hourly_rate_min: data.hourly_rate_min,
    hourly_rate_max: data.hourly_rate_max,
    employment_type: data.employment_type,
    status: 'draft',
    requirements: data.requirements,
    responsibilities: data.responsibilities,
    location: data.location,
    remote: data.remote || false,
    created_at: now,
    updated_at: now
  };
  
  await env.DB.prepare(`
    INSERT INTO job_postings (
      id, title, department, description,
      salary_range_min, salary_range_max,
      hourly_rate_min, hourly_rate_max,
      employment_type, status,
      requirements, responsibilities,
      location, remote, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    job.id,
    job.title,
    job.department,
    job.description,
    job.salary_range_min || null,
    job.salary_range_max || null,
    job.hourly_rate_min || null,
    job.hourly_rate_max || null,
    job.employment_type,
    job.status,
    JSON.stringify(job.requirements),
    JSON.stringify(job.responsibilities),
    job.location || null,
    job.remote ? 1 : 0,
    job.created_at,
    job.updated_at
  ).run();
  
  return job;
}

/**
 * Publish job posting
 */
export async function publishJobPosting(
  env: any,
  jobId: string
): Promise<void> {
  await env.DB.prepare(`
    UPDATE job_postings
    SET status = 'published', updated_at = ?
    WHERE id = ?
  `).bind(new Date().toISOString(), jobId).run();
}

/**
 * Get job posting by ID
 */
export async function getJobPosting(
  env: any,
  jobId: string
): Promise<JobPosting | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM job_postings WHERE id = ?'
  ).bind(jobId).first();
  
  if (result) {
    return {
      ...result,
      requirements: JSON.parse(result.requirements || '[]'),
      responsibilities: JSON.parse(result.responsibilities || '[]'),
      remote: result.remote === 1
    } as JobPosting;
  }
  
  return null;
}

/**
 * Get all published job postings
 */
export async function getPublishedJobs(env: any): Promise<JobPosting[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM job_postings WHERE status = ? ORDER BY created_at DESC'
  ).bind('published').all();
  
  return result.results.map((job: any) => ({
    ...job,
    requirements: JSON.parse(job.requirements || '[]'),
    responsibilities: JSON.parse(job.responsibilities || '[]'),
    remote: job.remote === 1
  })) as JobPosting[];
}

/**
 * Submit job application
 */
export async function submitJobApplication(
  env: any,
  data: {
    job_id: string;
    applicant_name: string;
    applicant_email: string;
    applicant_phone: string;
    resume_url?: string;
    cover_letter?: string;
  }
): Promise<JobApplication> {
  const appId = uuid();
  const now = new Date().toISOString();
  
  const application: JobApplication = {
    id: appId,
    job_id: data.job_id,
    applicant_name: data.applicant_name,
    applicant_email: data.applicant_email,
    applicant_phone: data.applicant_phone,
    resume_url: data.resume_url,
    cover_letter: data.cover_letter,
    status: 'submitted',
    applied_at: now,
    updated_at: now
  };
  
  await env.DB.prepare(`
    INSERT INTO job_applications (
      id, job_id, applicant_name, applicant_email, applicant_phone,
      resume_url, cover_letter, status, applied_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    application.id,
    application.job_id,
    application.applicant_name,
    application.applicant_email,
    application.applicant_phone,
    application.resume_url || null,
    application.cover_letter || null,
    application.status,
    application.applied_at,
    application.updated_at
  ).run();
  
  // Send notification to HR
  await sendHRNotification(env, {
    type: 'new_application',
    job_title: (await getJobPosting(env, data.job_id))?.title,
    applicant_name: data.applicant_name,
    applicant_email: data.applicant_email
  });
  
  return application;
}

/**
 * Get applications for job
 */
export async function getJobApplications(
  env: any,
  jobId: string
): Promise<JobApplication[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM job_applications WHERE job_id = ? ORDER BY applied_at DESC'
  ).bind(jobId).all();
  
  return result.results as JobApplication[];
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  env: any,
  applicationId: string,
  status: 'submitted' | 'under_review' | 'interview' | 'offered' | 'hired' | 'rejected'
): Promise<void> {
  await env.DB.prepare(`
    UPDATE job_applications
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).bind(status, new Date().toISOString(), applicationId).run();
}

// Helper function
async function sendHRNotification(env: any, data: any): Promise<void> {
  console.log(`[HR NOTIFICATION] ${data.type}:`, data);
  // TODO: Send email to HR@rosstaxprepandbookkeeping.com
}
