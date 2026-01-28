-- STAFF (internal users)
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  mfa_method TEXT, -- 'totp', 'email', 'sms'
  mfa_backup_codes TEXT, -- JSON array
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- CLIENTS (portal users)
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT,
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  mfa_method TEXT, -- 'totp', 'email', 'sms'
  mfa_backup_codes TEXT, -- JSON array
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- RETURNS (tax return tracking)
CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  tax_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- MESSAGES (client ↔ staff)
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('client', 'staff', 'admin')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- DOCUMENTS (R2 uploads)
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- TASKS (internal workflow)
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT,
  assigned_to INTEGER,
  due_date TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES staff(id)
);

-- SIGNATURES (DocuSign envelopes tracking)
CREATE TABLE IF NOT EXISTS signatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  envelope_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- TRAINING MODULE
CREATE TABLE IF NOT EXISTS training_courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  duration TEXT,        -- e.g., "6 weeks", "Self-paced"
  delivery TEXT,        -- 'self-paced' | 'online' | '1:1' | 'hybrid'
  price_cents INTEGER,
  instructor TEXT,      -- e.g., "Condre Ross PTIN P03215544"
  tags_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES training_courses(id),
  student_email TEXT NOT NULL,
  student_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending | active | completed | cancelled
  enrolled_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_training_courses_delivery ON training_courses(delivery);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_course_id ON training_enrollments(course_id);
-- EFILE TRANSMISSIONS (IRS e-file + refund tracking)
CREATE TABLE IF NOT EXISTS efile_transmissions (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  preparer_id INTEGER,
  method TEXT,
  status TEXT,
  irs_submission_id TEXT,
  ack_code TEXT,
  ack_message TEXT,
  dcn TEXT,  -- Document Control Number from IRS
  efin TEXT, -- EFIN used for transmission
  etin TEXT, -- ETIN used for transmission
  environment TEXT, -- 'ATS' or 'Production'
  bank_product_id TEXT,
  payment_method TEXT,
  payment_details_json TEXT,
  -- Refund tracker fields
  irs_refund_status TEXT, -- e.g. "sent to bank", "disbursed", "check mailed", "pending", "rejected"
  refund_method TEXT,     -- "ACH", "EFT", "Check", "Direct Deposit", etc.
  refund_amount REAL,
  refund_disbursed_at TEXT,
  refund_trace_id TEXT,
  refund_notes TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (preparer_id) REFERENCES staff(id)
);

-- MeF Submissions Tracking
CREATE TABLE IF NOT EXISTS mef_submissions (
  submission_id TEXT PRIMARY KEY,
  efin TEXT NOT NULL,
  etin TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT NOT NULL,
  return_type TEXT,
  tax_year TEXT,
  environment TEXT,
  request_xml TEXT,
  response_xml TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mef_submissions_status ON mef_submissions(status);
CREATE INDEX IF NOT EXISTS idx_mef_submissions_env ON mef_submissions(environment);

-- MeF Acknowledgment History
CREATE TABLE IF NOT EXISTS mef_acknowledgments (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  ack_id TEXT,
  status TEXT,
  dcn TEXT,
  tax_year TEXT,
  return_type TEXT,
  errors_json TEXT, -- JSON array of error objects
  received_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mef_ack_submission ON mef_acknowledgments(submission_id);
CREATE INDEX IF NOT EXISTS idx_mef_ack_status ON mef_acknowledgments(status);

-- MeF Logs for Monitoring
CREATE TABLE IF NOT EXISTS mef_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  level TEXT NOT NULL, -- DEBUG, INFO, WARN, ERROR
  operation TEXT NOT NULL,
  submission_id TEXT,
  environment TEXT,
  message TEXT,
  details_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mef_logs_level ON mef_logs(level);
CREATE INDEX IF NOT EXISTS idx_mef_logs_operation ON mef_logs(operation);
CREATE INDEX IF NOT EXISTS idx_mef_logs_submission ON mef_logs(submission_id);

