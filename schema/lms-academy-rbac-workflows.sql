-- ============================================================================
-- ROSS TAX ACADEMY - COMPREHENSIVE LMS SYSTEM
-- Roles, Permissions, Workflows, Content Libraries, AI Instructors, Proctored Exams
-- ============================================================================

-- ============================================================================
-- ROLES & PERMISSIONS SYSTEM (RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_roles (
  id TEXT PRIMARY KEY,
  role_name TEXT UNIQUE NOT NULL, -- 'student', 'instructor', 'proctor', 'administrator', 'support_staff', 'content_creator'
  role_description TEXT,
  is_system_role INTEGER DEFAULT 0, -- Cannot be deleted
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_permissions (
  id TEXT PRIMARY KEY,
  permission_name TEXT UNIQUE NOT NULL, -- 'view_courses', 'edit_courses', 'grade_exams', 'create_content', etc.
  permission_category TEXT NOT NULL, -- 'courses', 'exams', 'users', 'content', 'support', 'system'
  permission_description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_role_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  granted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  granted_by TEXT, -- admin user_id
  FOREIGN KEY (role_id) REFERENCES lms_roles(id),
  FOREIGN KEY (permission_id) REFERENCES lms_permissions(id),
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS lms_user_roles (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL, -- FK to clients table
  user_type TEXT NOT NULL, -- 'client', 'staff'
  role_id TEXT NOT NULL,
  assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  assigned_by TEXT,
  expires_at TEXT, -- Optional expiration
  FOREIGN KEY (role_id) REFERENCES lms_roles(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_user_roles_user ON lms_user_roles(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_lms_user_roles_role ON lms_user_roles(role_id);

-- ============================================================================
-- WORKFLOW AUTOMATION SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_workflows (
  id TEXT PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  workflow_type TEXT NOT NULL, -- 'enrollment', 'course_completion', 'exam', 'support_ticket', 'content_review'
  description TEXT,
  trigger_event TEXT NOT NULL, -- 'enrollment_created', 'payment_completed', 'exam_submitted', etc.
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_workflow_steps (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL, -- 'auto_assign_role', 'send_email', 'create_task', 'grant_access', 'schedule_exam'
  step_config TEXT, -- JSON config for step execution
  requires_approval INTEGER DEFAULT 0,
  approver_role_id TEXT,
  auto_execute INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES lms_workflows(id),
  FOREIGN KEY (approver_role_id) REFERENCES lms_roles(id)
);

CREATE TABLE IF NOT EXISTS lms_workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'enrollment', 'exam', 'support_ticket'
  entity_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
  current_step_id TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  error_message TEXT,
  FOREIGN KEY (workflow_id) REFERENCES lms_workflows(id),
  FOREIGN KEY (current_step_id) REFERENCES lms_workflow_steps(id)
);

CREATE TABLE IF NOT EXISTS lms_workflow_tasks (
  id TEXT PRIMARY KEY,
  workflow_execution_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  assigned_to_role TEXT,
  assigned_to_user_id INTEGER,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  completed_at TEXT,
  completed_by TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_execution_id) REFERENCES lms_workflow_executions(id),
  FOREIGN KEY (step_id) REFERENCES lms_workflow_steps(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_workflow_tasks_assigned ON lms_workflow_tasks(assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_lms_workflow_tasks_role ON lms_workflow_tasks(assigned_to_role, status);

-- ============================================================================
-- CONTENT LIBRARY SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_content_libraries (
  id TEXT PRIMARY KEY,
  library_name TEXT NOT NULL,
  library_type TEXT NOT NULL, -- 'faq', 'tax_law', 'legal_resources', 'study_materials', 'lecture_notes'
  description TEXT,
  access_level TEXT NOT NULL DEFAULT 'enrolled_students', -- 'public', 'enrolled_students', 'instructors', 'administrators'
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_content_items (
  id TEXT PRIMARY KEY,
  library_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'article', 'video', 'pdf', 'link', 'faq', 'case_study', 'statute', 'regulation'
  content_text TEXT,
  content_url TEXT,
  content_file_key TEXT, -- R2 storage key
  tags TEXT, -- JSON array
  category TEXT,
  author TEXT,
  source TEXT, -- 'IRS', 'TSU Law Library', 'Internal Revenue Code', 'Tax Court Cases'
  published_at TEXT,
  view_count INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  requires_approval INTEGER DEFAULT 0,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (library_id) REFERENCES lms_content_libraries(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_content_items_library ON lms_content_items(library_id);
CREATE INDEX IF NOT EXISTS idx_lms_content_items_type ON lms_content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_lms_content_items_category ON lms_content_items(category);

-- ============================================================================
-- FAQ SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_faq_categories (
  id TEXT PRIMARY KEY,
  category_name TEXT NOT NULL,
  category_order INTEGER DEFAULT 0,
  icon TEXT, -- Icon name or URL
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_faq_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES lms_faq_categories(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_faq_items_category ON lms_faq_items(category_id);

-- ============================================================================
-- SUPPORT TICKET SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_support_tickets (
  id TEXT PRIMARY KEY,
  student_id INTEGER NOT NULL,
  ticket_number TEXT UNIQUE NOT NULL, -- Auto-generated (e.g., TICKET-20260203-0001)
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'technical', 'billing', 'course_content', 'exam', 'general'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'pending_student', 'resolved', 'closed'
  assigned_to TEXT,
  assigned_to_role TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  closed_at TEXT,
  FOREIGN KEY (student_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS lms_support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL, -- 'student', 'staff'
  message TEXT NOT NULL,
  is_internal_note INTEGER DEFAULT 0, -- Only visible to staff
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES lms_support_tickets(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_support_tickets_student ON lms_support_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_support_tickets_status ON lms_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_lms_support_tickets_assigned ON lms_support_tickets(assigned_to);

-- ============================================================================
-- AI INSTRUCTOR SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_ai_instructors (
  id TEXT PRIMARY KEY,
  instructor_name TEXT NOT NULL,
  instructor_title TEXT NOT NULL, -- 'EA, CPA', 'Former IRS Agent', 'Tax Attorney', etc.
  instructor_bio TEXT,
  instructor_avatar_url TEXT,
  instructor_specialty TEXT, -- 'Individual Tax', 'Business Tax', 'IRS Audits', 'Tax Law'
  voice_model TEXT, -- 'openai-tts-1', 'elevenlabs-voice-id', etc.
  personality_profile TEXT, -- JSON with teaching style, tone, emphasis areas
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_weekly_lectures (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL, -- FK to course/program
  instructor_id TEXT NOT NULL,
  lecture_number INTEGER NOT NULL,
  lecture_title TEXT NOT NULL,
  lecture_topic TEXT NOT NULL,
  lecture_week INTEGER NOT NULL, -- Week 1, 2, 3, etc.
  lecture_script TEXT NOT NULL, -- Full transcript
  lecture_audio_url TEXT, -- Generated audio file
  lecture_video_url TEXT, -- Optional video with slides
  lecture_slides_url TEXT, -- PDF slides
  lecture_duration_minutes INTEGER,
  learning_objectives TEXT, -- JSON array
  key_concepts TEXT, -- JSON array
  assigned_reading TEXT,
  is_published INTEGER DEFAULT 0,
  published_at TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES lms_ai_instructors(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_weekly_lectures_course ON lms_weekly_lectures(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_weekly_lectures_week ON lms_weekly_lectures(lecture_week);

-- ============================================================================
-- PROCTORED EXAM SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_exams (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  exam_type TEXT NOT NULL, -- 'quiz', 'midterm', 'final', 'certification'
  exam_weight REAL NOT NULL DEFAULT 0.0, -- Percentage of final grade (e.g., 20.0 for 20%)
  total_points INTEGER NOT NULL,
  passing_score REAL NOT NULL, -- Percentage (e.g., 70.0 for 70%)
  time_limit_minutes INTEGER, -- NULL = no time limit
  attempts_allowed INTEGER DEFAULT 1,
  proctoring_required INTEGER DEFAULT 0,
  proctoring_type TEXT, -- 'live', 'recorded', 'lockdown_browser', 'ai_monitoring'
  open_book INTEGER DEFAULT 0,
  randomize_questions INTEGER DEFAULT 1,
  show_results_immediately INTEGER DEFAULT 0,
  available_from TEXT,
  available_until TEXT,
  instructions TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_exam_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'calculation'
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  topic_area TEXT,
  learning_objective TEXT,
  correct_answer TEXT, -- JSON for multiple choice options
  answer_explanation TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES lms_exams(id)
);

CREATE TABLE IF NOT EXISTS lms_exam_attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  attempt_number INTEGER NOT NULL,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  time_elapsed_seconds INTEGER,
  score REAL, -- Percentage
  points_earned REAL,
  total_points REAL,
  passed INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'graded', 'flagged'
  proctoring_session_id TEXT,
  proctoring_recording_url TEXT,
  violations_detected TEXT, -- JSON array of detected violations
  proctor_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  FOREIGN KEY (exam_id) REFERENCES lms_exams(id),
  FOREIGN KEY (student_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS lms_exam_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  student_answer TEXT,
  is_correct INTEGER,
  points_awarded REAL,
  grader_feedback TEXT,
  graded_by TEXT,
  graded_at TEXT,
  time_spent_seconds INTEGER,
  FOREIGN KEY (attempt_id) REFERENCES lms_exam_attempts(id),
  FOREIGN KEY (question_id) REFERENCES lms_exam_questions(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_exam_attempts_student ON lms_exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_exam_attempts_exam ON lms_exam_attempts(exam_id);

-- ============================================================================
-- BACHELOR'S DEGREE PROGRAM STRUCTURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_degree_programs (
  id TEXT PRIMARY KEY,
  program_name TEXT NOT NULL,
  degree_type TEXT NOT NULL, -- 'Bachelor of Science in Tax Accounting', 'Bachelor of Business Administration in Tax'
  degree_abbreviation TEXT, -- 'B.S. Tax Accounting', 'B.B.A. Tax'
  total_credits_required INTEGER NOT NULL,
  total_semesters INTEGER NOT NULL,
  program_description TEXT,
  accreditation_status TEXT, -- 'pending', 'accredited', 'unaccredited'
  accrediting_body TEXT,
  tuition_per_credit REAL,
  tuition_total REAL,
  delivery_method TEXT DEFAULT 'online', -- 'online', 'hybrid', 'on-campus'
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_degree_courses (
  id TEXT PRIMARY KEY,
  course_code TEXT UNIQUE NOT NULL, -- 'ACCT-1301', 'TAX-2101', 'BUS-3301'
  course_name TEXT NOT NULL,
  course_description TEXT,
  credit_hours INTEGER NOT NULL,
  course_level TEXT NOT NULL, -- '100-level', '200-level', '300-level', '400-level'
  course_type TEXT NOT NULL, -- 'core', 'major', 'elective', 'general_education'
  prerequisites TEXT, -- JSON array of course_codes
  lecture_hours_per_week INTEGER,
  lab_hours_per_week INTEGER DEFAULT 0,
  total_contact_hours INTEGER,
  syllabus_url TEXT,
  textbook_required TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_degree_curriculum (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  semester_number INTEGER NOT NULL, -- 1-8 for 4-year program
  is_required INTEGER DEFAULT 1,
  course_order INTEGER DEFAULT 0,
  FOREIGN KEY (program_id) REFERENCES lms_degree_programs(id),
  FOREIGN KEY (course_id) REFERENCES lms_degree_courses(id)
);

CREATE TABLE IF NOT EXISTS lms_degree_enrollments (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  enrollment_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'probation', 'suspended', 'graduated', 'withdrawn'
  current_semester INTEGER DEFAULT 1,
  total_credits_completed REAL DEFAULT 0.0,
  cumulative_gpa REAL DEFAULT 0.0,
  expected_graduation_date TEXT,
  actual_graduation_date TEXT,
  degree_conferred INTEGER DEFAULT 0,
  diploma_issued_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES lms_degree_programs(id),
  FOREIGN KEY (student_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS lms_student_course_enrollments (
  id TEXT PRIMARY KEY,
  degree_enrollment_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  semester_enrolled INTEGER NOT NULL,
  enrollment_date TEXT DEFAULT CURRENT_TIMESTAMP,
  completion_date TEXT,
  final_grade TEXT, -- 'A', 'B', 'C', 'D', 'F', 'W', 'I', 'P'
  grade_points REAL, -- GPA calculation (A=4.0, B=3.0, etc.)
  credits_earned REAL,
  status TEXT NOT NULL DEFAULT 'enrolled', -- 'enrolled', 'in_progress', 'completed', 'withdrawn', 'failed'
  FOREIGN KEY (degree_enrollment_id) REFERENCES lms_degree_enrollments(id),
  FOREIGN KEY (course_id) REFERENCES lms_degree_courses(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_degree_enrollments_student ON lms_degree_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_student_course_enrollments_degree ON lms_student_course_enrollments(degree_enrollment_id);

-- ============================================================================
-- DISCLAIMERS & DISCLOSURES
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_legal_disclosures (
  id TEXT PRIMARY KEY,
  disclosure_type TEXT NOT NULL, -- 'accreditation', 'ai_instructor', 'degree_recognition', 'state_compliance', 'tsu_library_usage'
  disclosure_title TEXT NOT NULL,
  disclosure_text TEXT NOT NULL,
  is_required_acknowledgment INTEGER DEFAULT 1,
  applies_to TEXT NOT NULL, -- 'all_students', 'degree_students', 'certificate_students'
  effective_date TEXT NOT NULL,
  version TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_student_acknowledgments (
  id TEXT PRIMARY KEY,
  student_id INTEGER NOT NULL,
  disclosure_id TEXT NOT NULL,
  acknowledged_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (student_id) REFERENCES clients(id),
  FOREIGN KEY (disclosure_id) REFERENCES lms_legal_disclosures(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_student_acknowledgments_student ON lms_student_acknowledgments(student_id);

-- ============================================================================
-- SEED DATA: ROLES & PERMISSIONS
-- ============================================================================

-- Roles
INSERT INTO lms_roles (id, role_name, role_description, is_system_role) VALUES
('role-student', 'Student', 'Enrolled student with access to courses, exams, and support', 1),
('role-instructor', 'Instructor', 'Course instructor with grading and content management permissions', 1),
('role-proctor', 'Exam Proctor', 'Monitors proctored exams and reviews flagged sessions', 1),
('role-support', 'Support Staff', 'Handles student support tickets and technical issues', 1),
('role-content-creator', 'Content Creator', 'Creates and manages course content, lectures, and materials', 1),
('role-administrator', 'Administrator', 'Full system access and user management', 1);

-- Permissions
INSERT INTO lms_permissions (id, permission_name, permission_category, permission_description) VALUES
('perm-view-courses', 'view_courses', 'courses', 'View course content and materials'),
('perm-enroll-courses', 'enroll_courses', 'courses', 'Enroll in courses'),
('perm-edit-courses', 'edit_courses', 'courses', 'Edit course content and structure'),
('perm-create-courses', 'create_courses', 'courses', 'Create new courses'),
('perm-delete-courses', 'delete_courses', 'courses', 'Delete courses'),
('perm-take-exams', 'take_exams', 'exams', 'Take exams and quizzes'),
('perm-grade-exams', 'grade_exams', 'exams', 'Grade student exams and assignments'),
('perm-create-exams', 'create_exams', 'exams', 'Create exams and questions'),
('perm-proctor-exams', 'proctor_exams', 'exams', 'Monitor and proctor exams'),
('perm-view-grades', 'view_grades', 'exams', 'View own grades'),
('perm-view-all-grades', 'view_all_grades', 'exams', 'View all student grades'),
('perm-access-library', 'access_library', 'content', 'Access content libraries'),
('perm-create-content', 'create_content', 'content', 'Create library content'),
('perm-approve-content', 'approve_content', 'content', 'Approve content for publication'),
('perm-create-tickets', 'create_tickets', 'support', 'Create support tickets'),
('perm-view-own-tickets', 'view_own_tickets', 'support', 'View own support tickets'),
('perm-manage-tickets', 'manage_tickets', 'support', 'Manage all support tickets'),
('perm-manage-users', 'manage_users', 'users', 'Manage user accounts'),
('perm-assign-roles', 'assign_roles', 'users', 'Assign roles to users'),
('perm-view-reports', 'view_reports', 'system', 'View system reports and analytics'),
('perm-manage-workflows', 'manage_workflows', 'system', 'Create and manage workflows');

-- Role-Permission Assignments
-- Student Permissions
INSERT INTO lms_role_permissions (id, role_id, permission_id) VALUES
('rp-student-1', 'role-student', 'perm-view-courses'),
('rp-student-2', 'role-student', 'perm-enroll-courses'),
('rp-student-3', 'role-student', 'perm-take-exams'),
('rp-student-4', 'role-student', 'perm-view-grades'),
('rp-student-5', 'role-student', 'perm-access-library'),
('rp-student-6', 'role-student', 'perm-create-tickets'),
('rp-student-7', 'role-student', 'perm-view-own-tickets');

-- Instructor Permissions
INSERT INTO lms_role_permissions (id, role_id, permission_id) VALUES
('rp-instructor-1', 'role-instructor', 'perm-view-courses'),
('rp-instructor-2', 'role-instructor', 'perm-edit-courses'),
('rp-instructor-3', 'role-instructor', 'perm-create-exams'),
('rp-instructor-4', 'role-instructor', 'perm-grade-exams'),
('rp-instructor-5', 'role-instructor', 'perm-view-all-grades'),
('rp-instructor-6', 'role-instructor', 'perm-create-content'),
('rp-instructor-7', 'role-instructor', 'perm-access-library');

-- Proctor Permissions
INSERT INTO lms_role_permissions (id, role_id, permission_id) VALUES
('rp-proctor-1', 'role-proctor', 'perm-proctor-exams'),
('rp-proctor-2', 'role-proctor', 'perm-view-all-grades');

-- Support Staff Permissions
INSERT INTO lms_role_permissions (id, role_id, permission_id) VALUES
('rp-support-1', 'role-support', 'perm-manage-tickets'),
('rp-support-2', 'role-support', 'perm-view-courses'),
('rp-support-3', 'role-support', 'perm-access-library');

-- Content Creator Permissions
INSERT INTO lms_role_permissions (id, role_id, permission_id) VALUES
('rp-content-1', 'role-content-creator', 'perm-create-content'),
('rp-content-2', 'role-content-creator', 'perm-create-courses'),
('rp-content-3', 'role-content-creator', 'perm-edit-courses'),
('rp-content-4', 'role-content-creator', 'perm-access-library');

-- Administrator Permissions (ALL)
INSERT INTO lms_role_permissions (id, role_id, permission_id) 
SELECT 
  'rp-admin-' || substr(id, 6) as id,
  'role-administrator' as role_id,
  id as permission_id
FROM lms_permissions;

-- ============================================================================
-- SEED DATA: WORKFLOWS
-- ============================================================================

-- Enrollment Workflow
INSERT INTO lms_workflows (id, workflow_name, workflow_type, description, trigger_event) VALUES
('workflow-enrollment', 'Student Enrollment Workflow', 'enrollment', 'Automates student enrollment process from payment to course access', 'payment_completed');

INSERT INTO lms_workflow_steps (id, workflow_id, step_order, step_name, step_type, step_config) VALUES
('step-enroll-1', 'workflow-enrollment', 1, 'Assign Student Role', 'auto_assign_role', '{"role_id": "role-student"}'),
('step-enroll-2', 'workflow-enrollment', 2, 'Grant LMS Access', 'grant_access', '{"access_type": "lms", "access_level": "student"}'),
('step-enroll-3', 'workflow-enrollment', 3, 'Send Welcome Email', 'send_email', '{"template": "welcome_student", "include_login_instructions": true}'),
('step-enroll-4', 'workflow-enrollment', 4, 'Schedule Orientation', 'create_task', '{"task_type": "orientation", "due_days": 7}'),
('step-enroll-5', 'workflow-enrollment', 5, 'Assign First Week Lecture', 'grant_access', '{"content_type": "lecture", "week": 1}');

-- Exam Submission Workflow
INSERT INTO lms_workflows (id, workflow_name, workflow_type, description, trigger_event) VALUES
('workflow-exam', 'Exam Grading Workflow', 'exam', 'Automates exam grading and feedback process', 'exam_submitted');

INSERT INTO lms_workflow_steps (id, workflow_id, step_order, step_name, step_type, step_config, requires_approval, approver_role_id) VALUES
('step-exam-1', 'workflow-exam', 1, 'Auto-Grade Multiple Choice', 'auto_grade', '{"question_types": ["multiple_choice", "true_false"]}', 0, NULL),
('step-exam-2', 'workflow-exam', 2, 'Assign to Instructor for Review', 'create_task', '{"assigned_to_role": "role-instructor", "task_type": "grade_essay_questions"}', 1, 'role-instructor'),
('step-exam-3', 'workflow-exam', 3, 'Calculate Final Score', 'calculate_score', '{"include_weighted_average": true}', 0, NULL),
('step-exam-4', 'workflow-exam', 4, 'Send Grade Notification', 'send_email', '{"template": "exam_graded", "include_feedback": true}', 0, NULL);

-- ============================================================================
-- SEED DATA: CONTENT LIBRARIES
-- ============================================================================

INSERT INTO lms_content_libraries (id, library_name, library_type, description, access_level) VALUES
('lib-faq', 'FAQ & Help Center', 'faq', 'Frequently asked questions and common issues', 'public'),
('lib-tax-law', 'Tax Law Library', 'tax_law', 'Curated tax statutes, regulations, and cases', 'enrolled_students'),
('lib-tsu-law', 'TSU Law Library Resources', 'legal_resources', 'Texas Southern University Thurgood Marshall School of Law resources (with permission)', 'enrolled_students'),
('lib-irs-pubs', 'IRS Publications', 'legal_resources', 'Official IRS publications, forms, and instructions', 'enrolled_students'),
('lib-study-guides', 'Study Materials', 'study_materials', 'Supplemental study guides and exam prep materials', 'enrolled_students');

-- ============================================================================
-- SEED DATA: FAQ CATEGORIES & ITEMS
-- ============================================================================

INSERT INTO lms_faq_categories (id, category_name, category_order, icon) VALUES
('faq-cat-enrollment', 'Enrollment & Payment', 1, 'credit-card'),
('faq-cat-courses', 'Courses & Curriculum', 2, 'book-open'),
('faq-cat-exams', 'Exams & Grading', 3, 'clipboard-check'),
('faq-cat-technical', 'Technical Support', 4, 'laptop'),
('faq-cat-degree', 'Degree Programs', 5, 'graduation-cap'),
('faq-cat-credentials', 'Credentials & Certification', 6, 'certificate');

INSERT INTO lms_faq_items (id, category_id, question, answer, display_order, is_featured) VALUES
('faq-enroll-1', 'faq-cat-enrollment', 'How do I enroll in a course?', 'To enroll, visit the course page, select your payment option (full payment or payment plan), and complete the checkout process. You will receive immediate LMS access upon payment confirmation.', 1, 1),
('faq-enroll-2', 'faq-cat-enrollment', 'What payment methods are accepted?', 'We accept credit/debit cards, ACH bank transfers, Afterpay, Zelle, CashApp, and cash payments via barcode at Walgreens, CVS, and Walmart.', 2, 1),
('faq-enroll-3', 'faq-cat-enrollment', 'Is my tuition price locked?', 'Yes! Your tuition is locked at the rate shown at enrollment. Once you enroll and submit payment (or enter a payment plan), your tuition will not increase during your course.', 3, 1),
('faq-enroll-4', 'faq-cat-enrollment', 'What is your refund policy?', 'You may cancel within 3 business days for a full refund. After LMS access is granted or coursework begins, no refunds are available. See your enrollment agreement for complete details.', 4, 1),

('faq-course-1', 'faq-cat-courses', 'How are courses delivered?', 'All courses are delivered online through our Learning Management System (LMS). You can access lectures, assignments, and exams 24/7 from any device.', 1, 1),
('faq-course-2', 'faq-cat-courses', 'Who are the instructors?', 'Courses feature weekly lectures from AI-generated instructors modeled after real tax professionals (EAs, CPAs, Former IRS Agents, Tax Attorneys). All content is verified for accuracy and IRS compliance.', 2, 1),
('faq-course-3', 'faq-cat-courses', 'How long do I have to complete a course?', 'Certificate courses range from 16-24 hours and must be completed within the specified enrollment period. Bachelor''s degree courses follow standard semester schedules.', 3, 0),

('faq-exam-1', 'faq-cat-exams', 'Are exams proctored?', 'Yes. Certification exams and final exams for degree courses require proctoring to maintain academic integrity. Proctoring may be live, recorded, or AI-monitored depending on the exam.', 1, 1),
('faq-exam-2', 'faq-cat-exams', 'How many times can I retake an exam?', 'Most exams allow 1-2 attempts. Check your course syllabus for specific exam policies. Additional retake fees may apply.', 2, 0),
('faq-exam-3', 'faq-cat-exams', 'When will I receive my exam results?', 'Multiple choice questions are graded instantly. Essay and calculation questions are graded within 5-7 business days. You will receive an email notification when grades are posted.', 3, 0),

('faq-tech-1', 'faq-cat-technical', 'What are the technical requirements?', 'You need a computer or tablet with internet access, a modern web browser (Chrome, Firefox, Safari, Edge), and for proctored exams, a webcam and microphone.', 1, 1),
('faq-tech-2', 'faq-cat-technical', 'How do I reset my password?', 'Click "Forgot Password" on the login page. You will receive a password reset link via email within 5 minutes.', 2, 0),
('faq-tech-3', 'faq-cat-technical', 'Who do I contact for technical support?', 'Submit a support ticket through your LMS dashboard, email support@rosstaxprepandbookkeeping.com, or call (512) 489-6749 during business hours.', 3, 1),

('faq-degree-1', 'faq-cat-degree', 'Do you offer bachelor''s degree programs?', 'Yes! We offer a Bachelor of Science in Tax Accounting program delivered fully online with college-level workloads and accredited curriculum.', 1, 1),
('faq-degree-2', 'faq-cat-degree', 'Is the degree program accredited?', 'Our degree program follows standard accreditation guidelines. Accreditation status and recognition vary by state. See our full accreditation disclosure for details.', 2, 1),
('faq-degree-3', 'faq-cat-degree', 'How long does it take to complete the degree?', 'The Bachelor of Science in Tax Accounting is a 4-year program (120 credit hours) designed for full-time students. Part-time and accelerated options may be available.', 3, 0),

('faq-cred-1', 'faq-cat-credentials', 'Will this course qualify me for IRS representation?', 'No. Completion of coursework does NOT authorize you to represent taxpayers before the IRS. You must independently meet all IRS eligibility and credentialing requirements (EA exam, PTIN, Circular 230 compliance).', 1, 1),
('faq-cred-2', 'faq-cat-credentials', 'Does course completion guarantee certification?', 'No. Course completion does not guarantee licensure, certification, employment, or IRS credential approval. You are responsible for meeting all federal and state requirements.', 2, 1),
('faq-cred-3', 'faq-cat-credentials', 'What credentials does Ross Tax Academy hold?', 'Ross Tax Academy is operated by Condre Ross, PTIN P03215544, an active tax preparer. Instructors include EAs, CPAs, Former IRS Agents (AI-generated personas based on real professionals).', 3, 0);

-- ============================================================================
-- SEED DATA: AI INSTRUCTORS
-- ============================================================================

INSERT INTO lms_ai_instructors (id, instructor_name, instructor_title, instructor_bio, instructor_specialty, personality_profile) VALUES
('ai-instructor-1', 'Prof. Sarah Martinez, EA', 'Enrolled Agent, Former IRS Revenue Agent', 'With 15 years at the IRS and 10 years in private practice, Prof. Martinez specializes in individual tax preparation and audit defense. She brings real-world audit experience to every lecture.', 'Individual Tax & Audit Defense', '{"teaching_style": "practical", "tone": "authoritative but approachable", "emphasis": "IRS procedures and real audit scenarios"}'),

('ai-instructor-2', 'Dr. Michael Chen, CPA, JD', 'CPA, Tax Attorney, Former Tax Court Litigator', 'Dr. Chen practiced tax law for 20 years, representing clients in Tax Court and advising on complex business structures. His lectures focus on business taxation and tax planning strategies.', 'Business Tax & Tax Law', '{"teaching_style": "analytical", "tone": "academic", "emphasis": "legal reasoning and tax planning"}'),

('ai-instructor-3', 'James Thompson, EA, CFP', 'Enrolled Agent, Certified Financial Planner', 'James has prepared over 5,000 tax returns and specializes in retirement planning, self-employment tax, and small business accounting. His lectures emphasize practical client scenarios.', 'Small Business & Retirement', '{"teaching_style": "conversational", "tone": "friendly mentor", "emphasis": "client communication and practical examples"}'),

('ai-instructor-4', 'Prof. Angela Rodriguez, CPA', 'CPA, Corporate Tax Manager', 'Prof. Rodriguez managed corporate tax compliance for Fortune 500 companies before transitioning to education. She specializes in corporate taxation, consolidated returns, and international tax.', 'Corporate Tax & Compliance', '{"teaching_style": "structured", "tone": "professional", "emphasis": "compliance and documentation"}');

-- ============================================================================
-- SEED DATA: LEGAL DISCLOSURES
-- ============================================================================

INSERT INTO lms_legal_disclosures (id, disclosure_type, disclosure_title, disclosure_text, is_required_acknowledgment, applies_to, effective_date, version) VALUES
('disclosure-ai-instructor', 'ai_instructor', 'AI-Generated Instructor Disclosure', 
'IMPORTANT NOTICE: This course features weekly lectures delivered by AI-generated instructors. These instructors are digital personas modeled after real tax professionals (EAs, CPAs, Former IRS Agents, Tax Attorneys). While the instructors are AI-generated, all course content has been developed and verified by licensed tax professionals and is compliant with IRS standards (Circular 230, Publication 4557). The use of AI instructors allows us to deliver consistent, high-quality instruction at scale while maintaining affordability. If you have questions about course content, you may contact our live support team at any time.', 
1, 'all_students', '2026-02-01', 'v1.0'),

('disclosure-accreditation', 'accreditation', 'Accreditation & Degree Recognition Disclosure', 
'ACCREDITATION DISCLOSURE: Ross Tax Academy degree programs are designed to meet standard accreditation guidelines for post-secondary education. Accreditation status and degree recognition vary by state, employer, and professional licensing board. Students are responsible for verifying that our degree program meets their specific educational requirements for licensure, certification, or employment. Ross Tax Academy does not guarantee that completion of degree coursework will satisfy all state or federal requirements for professional tax practice. For questions about accreditation or degree recognition in your jurisdiction, contact your state education department or professional licensing board.', 
1, 'degree_students', '2026-02-01', 'v1.0'),

('disclosure-tsu-library', 'tsu_library_usage', 'TSU Law Library Usage Agreement', 
'LIBRARY USAGE AGREEMENT: Ross Tax Academy provides access to selected legal resources from the Texas Southern University Thurgood Marshall School of Law Library with permission for educational purposes only. All materials remain the intellectual property of TSU and/or their original publishers. Students may access these resources solely for academic research and course completion. Commercial use, redistribution, or unauthorized copying is strictly prohibited. TSU''s provision of library access does not constitute endorsement of Ross Tax Academy programs, nor does it imply any affiliation, partnership, or academic credit transfer agreement between TSU and Ross Tax Academy.', 
1, 'all_students', '2026-02-01', 'v1.0'),

('disclosure-degree-recognition', 'degree_recognition', 'Degree Recognition & Employment Disclaimer', 
'EMPLOYMENT & LICENSURE DISCLAIMER: Completion of a bachelor''s degree program from Ross Tax Academy does not guarantee employment, licensure, or certification as a tax professional. Employers, state licensing boards, and professional organizations have independent standards for hiring and credentialing. Students should verify that our degree program meets their intended career goals and regulatory requirements BEFORE enrolling. Ross Tax Academy provides education and training but cannot guarantee job placement, salary outcomes, or acceptance by third-party credentialing bodies. Some states require degrees from regionally accredited institutions for professional licensure. Verify requirements with your state board.', 
1, 'degree_students', '2026-02-01', 'v1.0'),

('disclosure-state-compliance', 'state_compliance', 'State Authorization & Compliance Notice', 
'STATE AUTHORIZATION: Ross Tax Academy operates as a private educational training provider and may be subject to state-specific authorization, registration, or disclosure requirements. Students are responsible for verifying that our programs meet applicable state education regulations in their jurisdiction. Refund policies, program disclosures, and student rights may vary by state. For state-specific information, contact your state education department or consumer protection agency. Ross Tax Academy complies with applicable federal and state regulations governing private post-secondary education.', 
1, 'all_students', '2026-02-01', 'v1.0');

