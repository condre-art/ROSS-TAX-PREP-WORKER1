-- Database Schema for Education Institution Compliance
-- Tables for: Attendance, Grades, Transcripts, Lesson Plans, Email Management
-- Run with: npx wrangler d1 execute DB --file=schema/compliance-schema.sql

-- ============================================================
-- EMAIL MANAGEMENT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS student_email_mappings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  student_id TEXT NOT NULL UNIQUE,
  student_email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'deactivated')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deactivated_at DATETIME,
  FOREIGN KEY(student_id) REFERENCES lms_enrollments(id)
);

CREATE INDEX idx_student_email_mappings_student_id ON student_email_mappings(student_id);
CREATE INDEX idx_student_email_mappings_email ON student_email_mappings(student_email);
CREATE INDEX idx_student_email_mappings_status ON student_email_mappings(status);

CREATE TABLE IF NOT EXISTS role_emails (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role),
  FOREIGN KEY(user_id) REFERENCES lms_enrollments(id)
);

CREATE INDEX idx_role_emails_user_id ON role_emails(user_id);
CREATE INDEX idx_role_emails_email ON role_emails(email);
CREATE INDEX idx_role_emails_role ON role_emails(role);

CREATE TABLE IF NOT EXISTS email_generation_audit (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  student_id TEXT NOT NULL,
  email TEXT NOT NULL,
  action TEXT NOT NULL,
  status_code TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES student_email_mappings(student_id)
);

CREATE INDEX idx_email_audit_student ON email_generation_audit(student_id);
CREATE INDEX idx_email_audit_timestamp ON email_generation_audit(timestamp);

-- ============================================================
-- ATTENDANCE TRACKING TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  enrollment_id TEXT NOT NULL,
  class_schedule_id TEXT NOT NULL,
  session_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('present', 'absent', 'late', 'excused', 'pending')),
  check_in_time DATETIME,
  check_out_time DATETIME,
  notes TEXT,
  recorded_by TEXT,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(enrollment_id) REFERENCES student_email_mappings(student_id),
  FOREIGN KEY(class_schedule_id) REFERENCES class_schedules(id),
  UNIQUE(enrollment_id, class_schedule_id, session_date)
);

CREATE INDEX idx_attendance_enrollment ON attendance_records(enrollment_id);
CREATE INDEX idx_attendance_class ON attendance_records(class_schedule_id);
CREATE INDEX idx_attendance_session_date ON attendance_records(session_date);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- ============================================================
-- GRADEBOOK TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  class_schedule_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  assignment_name TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT DEFAULT 'general' CHECK(assignment_type IN ('homework', 'quiz', 'exam', 'project', 'participation', 'general')),
  max_score REAL NOT NULL,
  weight REAL NOT NULL DEFAULT 0,
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(class_schedule_id) REFERENCES class_schedules(id)
);

CREATE INDEX idx_assignments_class ON assignments(class_schedule_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_type ON assignments(assignment_type);

CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  enrollment_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  score REAL NOT NULL,
  max_score REAL NOT NULL,
  percentage REAL NOT NULL,
  letter_grade TEXT CHECK(letter_grade IN ('A', 'B', 'C', 'D', 'F')),
  feedback TEXT,
  graded_by TEXT,
  graded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(enrollment_id, assignment_id),
  FOREIGN KEY(enrollment_id) REFERENCES student_email_mappings(student_id),
  FOREIGN KEY(assignment_id) REFERENCES assignments(id)
);

CREATE INDEX idx_grades_enrollment ON grades(enrollment_id);
CREATE INDEX idx_grades_assignment ON grades(assignment_id);
CREATE INDEX idx_grades_letter_grade ON grades(letter_grade);
CREATE INDEX idx_grades_graded_at ON grades(graded_at);

-- ============================================================
-- TRANSCRIPT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS transcripts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  transcript_type TEXT NOT NULL CHECK(transcript_type IN ('official', 'unofficial')),
  cumulative_gpa REAL,
  total_credits_earned INTEGER DEFAULT 0,
  total_credits_attempted INTEGER DEFAULT 0,
  degree_status TEXT,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  generated_by TEXT,
  is_official INTEGER DEFAULT 0,
  issued_at DATETIME,
  sealed INTEGER DEFAULT 0,
  request_id TEXT,
  FOREIGN KEY(student_id) REFERENCES student_email_mappings(student_id)
);

CREATE INDEX idx_transcripts_student ON transcripts(student_id);
CREATE INDEX idx_transcripts_type ON transcripts(transcript_type);
CREATE INDEX idx_transcripts_issued_at ON transcripts(issued_at);

CREATE TABLE IF NOT EXISTS transcript_requests (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  student_id TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'official_transcript',
  mailed_to TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'sent')),
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  requested_by TEXT,
  approved_at DATETIME,
  approved_by TEXT,
  transcript_id TEXT,
  tracking_number TEXT,
  FOREIGN KEY(student_id) REFERENCES student_email_mappings(student_id),
  FOREIGN KEY(transcript_id) REFERENCES transcripts(id)
);

CREATE INDEX idx_transcript_requests_student ON transcript_requests(student_id);
CREATE INDEX idx_transcript_requests_status ON transcript_requests(status);
CREATE INDEX idx_transcript_requests_requested_at ON transcript_requests(requested_at);

-- ============================================================
-- LESSON PLANS TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  class_schedule_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  title TEXT NOT NULL,
  objectives TEXT DEFAULT '[]',
  topics TEXT DEFAULT '[]',
  lecture_outline TEXT,
  assignments TEXT DEFAULT '[]',
  readings TEXT DEFAULT '[]',
  resources TEXT DEFAULT '[]',
  assessments TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_schedule_id, week_number),
  FOREIGN KEY(class_schedule_id) REFERENCES class_schedules(id)
);

CREATE INDEX idx_lesson_plans_class ON lesson_plans(class_schedule_id);
CREATE INDEX idx_lesson_plans_week ON lesson_plans(week_number);
CREATE INDEX idx_lesson_plans_status ON lesson_plans(status);
CREATE INDEX idx_lesson_plans_created_by ON lesson_plans(created_by);

-- ============================================================
-- INSTRUCTOR MANAGEMENT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS instructor_assignments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  instructor_id TEXT NOT NULL,
  class_schedule_id TEXT NOT NULL,
  role TEXT DEFAULT 'instructor' CHECK(role IN ('primary', 'co-instructor', 'assistant')),
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  removed_at DATETIME,
  UNIQUE(instructor_id, class_schedule_id),
  FOREIGN KEY(instructor_id) REFERENCES role_emails(user_id),
  FOREIGN KEY(class_schedule_id) REFERENCES class_schedules(id)
);

CREATE INDEX idx_instructor_assignments_instructor ON instructor_assignments(instructor_id);
CREATE INDEX idx_instructor_assignments_class ON instructor_assignments(class_schedule_id);

-- ============================================================
-- NOTIFICATION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  recipient_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_resource TEXT,
  related_resource_id TEXT,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(recipient_id) REFERENCES role_emails(user_id)
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================
-- COMPLIANCE AUDIT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  record_type TEXT NOT NULL,
  student_id TEXT,
  course_id TEXT,
  record_data TEXT NOT NULL,
  retention_until DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES student_email_mappings(student_id),
  FOREIGN KEY(course_id) REFERENCES class_schedules(id)
);

CREATE INDEX idx_compliance_record_type ON compliance_records(record_type);
CREATE INDEX idx_compliance_student ON compliance_records(student_id);
CREATE INDEX idx_compliance_retention ON compliance_records(retention_until);

-- ============================================================
-- UPDATES TO EXISTING TABLES
-- ============================================================

-- Add columns to class_schedules if they don't exist
-- (Run these as ALTER TABLE only if needed in migration)
-- ALTER TABLE class_schedules ADD COLUMN credits INTEGER DEFAULT 3;
-- ALTER TABLE class_schedules ADD COLUMN instructor_id TEXT REFERENCES role_emails(user_id);

-- ============================================================
-- VIEWS FOR REPORTING
-- ============================================================

CREATE VIEW IF NOT EXISTS student_attendance_summary AS
SELECT 
  sem.student_id,
  sem.first_name || ' ' || sem.last_name as student_name,
  cs.course_name,
  COUNT(*) as total_sessions,
  SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
  SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
  SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late_count,
  ROUND(100.0 * SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) / COUNT(*), 2) as attendance_percentage
FROM student_email_mappings sem
LEFT JOIN attendance_records ar ON sem.student_id = ar.enrollment_id
LEFT JOIN class_schedules cs ON ar.class_schedule_id = cs.id
GROUP BY sem.student_id, sem.first_name, sem.last_name, cs.course_name;

CREATE VIEW IF NOT EXISTS student_grade_summary AS
SELECT 
  g.enrollment_id,
  sem.first_name || ' ' || sem.last_name as student_name,
  a.course_name,
  COUNT(g.id) as assignments_graded,
  AVG(g.percentage) as average_percentage,
  GROUP_CONCAT(DISTINCT g.letter_grade) as letters_earned,
  ROUND(AVG(CASE WHEN g.letter_grade = 'A' THEN 4.0 
                  WHEN g.letter_grade = 'B' THEN 3.0 
                  WHEN g.letter_grade = 'C' THEN 2.0 
                  WHEN g.letter_grade = 'D' THEN 1.0 
                  ELSE 0.0 END), 2) as current_gpa
FROM grades g
JOIN student_email_mappings sem ON g.enrollment_id = sem.student_id
JOIN assignments a ON g.assignment_id = a.id
GROUP BY g.enrollment_id, sem.first_name, sem.last_name, a.course_name;

CREATE VIEW IF NOT EXISTS lesson_plan_status AS
SELECT 
  lp.course_name,
  lp.class_schedule_id,
  COUNT(*) as total_plans,
  SUM(CASE WHEN lp.status = 'draft' THEN 1 ELSE 0 END) as draft_count,
  SUM(CASE WHEN lp.status = 'published' THEN 1 ELSE 0 END) as published_count,
  SUM(CASE WHEN lp.status = 'archived' THEN 1 ELSE 0 END) as archived_count
FROM lesson_plans lp
GROUP BY lp.course_name, lp.class_schedule_id;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_grade_percentage ON grades(percentage);
CREATE INDEX idx_assignment_max_score ON assignments(max_score);
CREATE INDEX idx_attendance_check_in ON attendance_records(check_in_time);
CREATE INDEX idx_lesson_plan_published ON lesson_plans(status) WHERE status = 'published';
CREATE INDEX idx_transcript_sealed ON transcripts(sealed) WHERE sealed = 1;

-- ============================================================
-- TRIGGERS FOR DATA INTEGRITY
-- ============================================================

-- Update lesson_plans.updated_at when record is modified
CREATE TRIGGER IF NOT EXISTS lesson_plans_update_timestamp
AFTER UPDATE ON lesson_plans
BEGIN
  UPDATE lesson_plans SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- Cascade transcript requests cleanup
CREATE TRIGGER IF NOT EXISTS cleanup_transcript_requests
AFTER DELETE ON transcripts
BEGIN
  DELETE FROM transcript_requests WHERE transcript_id = OLD.id;
END;
