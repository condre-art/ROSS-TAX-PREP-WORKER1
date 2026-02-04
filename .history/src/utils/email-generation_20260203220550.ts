/**
 * Email Generation System
 * Generates @rosstaxprepandbookkeeping.com email addresses for students, teachers, and admins
 * Ensures uniqueness, handles email conflicts, and maintains student-email mappings
 */

import { Database } from '@cloudflare/workers-types';

const DOMAIN = 'rosstaxprepandbookkeeping.com';
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@rosstaxprepandbookkeeping\.com$/i;

interface EmailGenerationResult {
  studentId: string;
  email: string;
  status: 'created' | 'existing' | 'conflict_resolved';
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface RoleEmail {
  userId: string;
  role: 'student' | 'teacher' | 'admin';
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  createdAt: string;
}

/**
 * Generate unique email from student name
 * Format: firstname.lastname@rosstaxprepandbookkeeping.com
 * On conflict: firstname.lastnameN@rosstaxprepandbookkeeping.com (N = incrementing number)
 */
export async function generateStudentEmail(
  db: Database,
  studentId: string,
  firstName: string,
  lastName: string
): Promise<EmailGenerationResult> {
  // Sanitize names: lowercase, remove special characters, replace spaces with dots
  const sanitizeString = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const firstNameSanitized = sanitizeString(firstName);
  const lastNameSanitized = sanitizeString(lastName);

  if (!firstNameSanitized || !lastNameSanitized) {
    throw new Error('Invalid first or last name provided');
  }

  // Check if student already has email assigned
  const existing = await db
    .prepare(
      `SELECT student_email 
       FROM student_email_mappings 
       WHERE student_id = ?`
    )
    .bind(studentId)
    .first();

  if (existing) {
    return {
      studentId,
      email: existing.student_email as string,
      status: 'existing',
      firstName,
      lastName,
      createdAt: new Date().toISOString()
    };
  }

  // Generate base email
  let proposedEmail = `${firstNameSanitized}.${lastNameSanitized}@${DOMAIN}`;
  let counter = 1;
  let isUnique = false;

  // Check uniqueness and increment if needed
  while (!isUnique) {
    const exists = await db
      .prepare(
        `SELECT student_id 
         FROM student_email_mappings 
         WHERE student_email = ?`
      )
      .bind(proposedEmail)
      .first();

    if (!exists) {
      isUnique = true;
      break;
    }

    // Increment and try again
    proposedEmail = `${firstNameSanitized}.${lastNameSanitized}${counter}@${DOMAIN}`;
    counter++;

    // Safety check: prevent infinite loops
    if (counter > 999) {
      throw new Error('Unable to generate unique email after 999 attempts');
    }
  }

  // Store email mapping
  const createdAt = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO student_email_mappings 
       (student_id, student_email, first_name, last_name, created_at, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`
    )
    .bind(studentId, proposedEmail, firstName, lastName, createdAt)
    .run();

  // Log audit trail
  await db
    .prepare(
      `INSERT INTO email_generation_audit 
       (student_id, email, action, status_code, timestamp) 
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(studentId, proposedEmail, 'email_generated', 'success', createdAt)
    .run();

  return {
    studentId,
    email: proposedEmail,
    status: counter === 1 ? 'created' : 'conflict_resolved',
    firstName,
    lastName,
    createdAt
  };
}

/**
 * Generate teacher/professor email
 * Format: prof.firstname.lastname@rosstaxprepandbookkeeping.com
 */
export async function generateTeacherEmail(
  db: Database,
  teacherId: string,
  firstName: string,
  lastName: string,
  department: string
): Promise<RoleEmail> {
  const sanitizeString = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const firstNameSanitized = sanitizeString(firstName);
  const lastNameSanitized = sanitizeString(lastName);

  // Check if teacher already has email
  const existing = await db
    .prepare(
      `SELECT email 
       FROM role_emails 
       WHERE user_id = ? AND role = 'teacher'`
    )
    .bind(teacherId)
    .first();

  if (existing) {
    return {
      userId: teacherId,
      role: 'teacher',
      email: existing.email as string,
      firstName,
      lastName,
      department,
      createdAt: new Date().toISOString()
    };
  }

  let proposedEmail = `prof.${firstNameSanitized}.${lastNameSanitized}@${DOMAIN}`;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const exists = await db
      .prepare(
        `SELECT user_id 
         FROM role_emails 
         WHERE email = ? AND role = 'teacher'`
      )
      .bind(proposedEmail)
      .first();

    if (!exists) {
      isUnique = true;
      break;
    }

    proposedEmail = `prof.${firstNameSanitized}.${lastNameSanitized}${counter}@${DOMAIN}`;
    counter++;

    if (counter > 999) {
      throw new Error('Unable to generate unique teacher email');
    }
  }

  const createdAt = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO role_emails 
       (user_id, role, email, first_name, last_name, department, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(teacherId, 'teacher', proposedEmail, firstName, lastName, department, createdAt)
    .run();

  return {
    userId: teacherId,
    role: 'teacher',
    email: proposedEmail,
    firstName,
    lastName,
    department,
    createdAt
  };
}

/**
 * Generate admin email
 * Format: admin.firstname.lastname@rosstaxprepandbookkeeping.com
 */
export async function generateAdminEmail(
  db: Database,
  adminId: string,
  firstName: string,
  lastName: string,
  department: string
): Promise<RoleEmail> {
  const sanitizeString = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const firstNameSanitized = sanitizeString(firstName);
  const lastNameSanitized = sanitizeString(lastName);

  const existing = await db
    .prepare(
      `SELECT email 
       FROM role_emails 
       WHERE user_id = ? AND role = 'admin'`
    )
    .bind(adminId)
    .first();

  if (existing) {
    return {
      userId: adminId,
      role: 'admin',
      email: existing.email as string,
      firstName,
      lastName,
      department,
      createdAt: new Date().toISOString()
    };
  }

  let proposedEmail = `admin.${firstNameSanitized}.${lastNameSanitized}@${DOMAIN}`;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const exists = await db
      .prepare(
        `SELECT user_id 
         FROM role_emails 
         WHERE email = ? AND role = 'admin'`
      )
      .bind(proposedEmail)
      .first();

    if (!exists) {
      isUnique = true;
      break;
    }

    proposedEmail = `admin.${firstNameSanitized}.${lastNameSanitized}${counter}@${DOMAIN}`;
    counter++;

    if (counter > 999) {
      throw new Error('Unable to generate unique admin email');
    }
  }

  const createdAt = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO role_emails 
       (user_id, role, email, first_name, last_name, department, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(adminId, 'admin', proposedEmail, firstName, lastName, department, createdAt)
    .run();

  return {
    userId: adminId,
    role: 'admin',
    email: proposedEmail,
    firstName,
    lastName,
    department,
    createdAt
  };
}

/**
 * Get email for user by ID and role
 */
export async function getUserEmail(
  db: Database,
  userId: string,
  role: 'student' | 'teacher' | 'admin'
): Promise<string | null> {
  if (role === 'student') {
    const result = await db
      .prepare(
        `SELECT student_email 
         FROM student_email_mappings 
         WHERE student_id = ? AND status = 'active'`
      )
      .bind(userId)
      .first();

    return (result?.student_email as string) || null;
  }

  const result = await db
    .prepare(
      `SELECT email 
       FROM role_emails 
       WHERE user_id = ? AND role = ?`
    )
    .bind(userId, role)
    .first();

  return (result?.email as string) || null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/**
 * Deactivate student email (on account closure)
 */
export async function deactivateStudentEmail(db: Database, studentId: string): Promise<void> {
  const deactivatedAt = new Date().toISOString();
  await db
    .prepare(
      `UPDATE student_email_mappings 
       SET status = 'deactivated', deactivated_at = ? 
       WHERE student_id = ?`
    )
    .bind(deactivatedAt, studentId)
    .run();

  const email = await getUserEmail(db, studentId, 'student');
  if (email) {
    await db
      .prepare(
        `INSERT INTO email_generation_audit 
         (student_id, email, action, status_code, timestamp) 
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(studentId, email, 'email_deactivated', 'success', deactivatedAt)
      .run();
  }
}

/**
 * Get all emails for a user (across all roles they may have)
 */
export async function getAllUserEmails(
  db: Database,
  userId: string
): Promise<{ role: string; email: string }[]> {
  const emails = [];

  // Check if student
  const studentEmail = await db
    .prepare(
      `SELECT student_email 
       FROM student_email_mappings 
       WHERE student_id = ? AND status = 'active'`
    )
    .bind(userId)
    .first();

  if (studentEmail) {
    emails.push({
      role: 'student',
      email: studentEmail.student_email as string
    });
  }

  // Check role emails
  const roleEmails = await db
    .prepare(
      `SELECT role, email 
       FROM role_emails 
       WHERE user_id = ?`
    )
    .bind(userId)
    .all();

  if (roleEmails.results) {
    emails.push(
      ...roleEmails.results.map((r: any) => ({
        role: r.role,
        email: r.email
      }))
    );
  }

  return emails;
}

/**
 * Bulk generate emails for newly enrolled students
 */
export async function bulkGenerateStudentEmails(
  db: Database,
  enrollments: Array<{ studentId: string; firstName: string; lastName: string }>
): Promise<EmailGenerationResult[]> {
  const results: EmailGenerationResult[] = [];

  for (const enrollment of enrollments) {
    try {
      const result = await generateStudentEmail(
        db,
        enrollment.studentId,
        enrollment.firstName,
        enrollment.lastName
      );
      results.push(result);
    } catch (error) {
      console.error(`Failed to generate email for student ${enrollment.studentId}:`, error);
    }
  }

  return results;
}
