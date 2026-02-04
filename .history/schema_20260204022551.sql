-- STAFF (internal users)
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'supervisor', 'lead', 'associate', 'ptin_holder', 'ero', 'staff')),
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  mfa_method TEXT, -- 'totp', 'email', 'sms'
  mfa_backup_codes TEXT, -- JSON array
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- CLIENTS (portal users)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,  -- UUID for client_id
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT,
  username TEXT UNIQUE,
  role TEXT DEFAULT 'client' CHECK(role IN ('client', 'preparer', 'ero')),
  permissions TEXT, -- JSON array of permissions
  verified INTEGER DEFAULT 0, -- Identity verified via 2FA
  ssn_encrypted TEXT, -- Encrypted SSN
  id_type TEXT, -- DL, Passport, StateID
  id_number_encrypted TEXT, -- Encrypted ID number
  dob TEXT, -- Date of birth
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  mfa_method TEXT, -- 'totp', 'email', 'sms'
  mfa_backup_codes TEXT, -- JSON array
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- MFA CODES (temporary verification codes)
CREATE TABLE IF NOT EXISTS mfa_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- ROLE ASSIGNMENTS & AUDIT
CREATE TABLE IF NOT EXISTS role_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  assigned_role TEXT NOT NULL,
  assigned_by TEXT, -- admin who assigned
  permissions TEXT, -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- RETURNS (tax return tracking)
CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  form_type TEXT, -- '1040', '1040X' (amended), '1120', etc.
  is_amended INTEGER DEFAULT 0, -- 0 = original, 1 = amended
  original_return_id INTEGER, -- links amended to original
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (original_return_id) REFERENCES returns(id)
);

-- MESSAGES (client ↔ staff)
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('client', 'staff', 'admin')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- INVOICES (Admin invoicing system)
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  client_id TEXT NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  items_json TEXT NOT NULL, -- JSON array of {description, quantity, unit_price, line_total}
  subtotal REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled')),
  sent_at TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES staff(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_admin ON invoices(admin_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- DOCUMENTS (R2 uploads)
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
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
  client_id TEXT NOT NULL,
  envelope_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- EFILE_SUBMISSIONS (e-file tracking for IRS acknowledgments)
CREATE TABLE IF NOT EXISTS efile_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  return_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  ack_timestamp TEXT,
  errors TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

-- PAYMENTS (payment tracking for workflow webhooks)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- CLIENT_CREDENTIALS (encrypted credential storage)
CREATE TABLE IF NOT EXISTS client_credentials (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  return_id INTEGER,
  credential_type TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

-- IRS_MEMOS (IRS memo tracking - realtime integration)
CREATE TABLE IF NOT EXISTS irs_memos (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  irs_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  full_text TEXT,
  published_at TEXT,
  url TEXT,
  tags_json TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- IRS_SCHEMA_FIELDS (IRS schema field tracking - realtime integration)
CREATE TABLE IF NOT EXISTS irs_schema_fields (
  id TEXT PRIMARY KEY,
  form_type TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  field_name TEXT NOT NULL,
  field_path TEXT,
  field_type TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  detected_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- IRS_MEMO_LINKS (linking memos to clients/returns)
CREATE TABLE IF NOT EXISTS irs_memo_links (
  id TEXT PRIMARY KEY,
  memo_id TEXT NOT NULL,
  client_id INTEGER,
  return_id INTEGER,
  topic TEXT,
  note TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memo_id) REFERENCES irs_memos(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
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
  client_id TEXT NOT NULL,
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

-- COMPREHENSIVE USER PROFILES (All roles with secure identity data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL CHECK(user_type IN ('client', 'staff', 'admin', 'ero')),
  
  -- Encrypted Personal Identifiers
  encrypted_ssn TEXT NOT NULL,
  encrypted_dob TEXT NOT NULL,
  encrypted_mothers_maiden_name TEXT NOT NULL,
  occupation TEXT,
  
  -- Encrypted Address
  encrypted_street_address TEXT NOT NULL,
  encrypted_city TEXT NOT NULL,
  encrypted_state TEXT NOT NULL,
  encrypted_zip_code TEXT NOT NULL,
  
  -- Encrypted ID Verification
  id_type TEXT NOT NULL CHECK(id_type IN ('drivers_license', 'state_id', 'passport')),
  encrypted_id_state TEXT NOT NULL,
  encrypted_id_number TEXT NOT NULL,
  encrypted_id_issue_date TEXT NOT NULL,
  encrypted_id_expiration_date TEXT NOT NULL,
  
  -- Filing Status (for clients)
  filing_status TEXT CHECK(filing_status IN ('single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_widow')),
  
  -- Staff Info (for staff/ERO/admin)
  staff_role TEXT,
  ptin_number TEXT,
  hire_date TEXT,
  department TEXT,
  
  -- Verification Status
  identity_verified INTEGER DEFAULT 0,
  verification_method TEXT,
  verified_at TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id, user_type);

-- AI CHAT SYSTEM
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  message TEXT NOT NULL,
  intent TEXT,
  confidence REAL,
  metadata TEXT, -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_session ON ai_chat_messages(session_id);

CREATE TABLE IF NOT EXISTS ai_chat_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  intent TEXT NOT NULL,
  confidence REAL,
  user_message_length INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_intent ON ai_chat_analytics(intent);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_date ON ai_chat_analytics(created_at);

-- AI TRANSFER REQUESTS (AI → Live Agent)
CREATE TABLE IF NOT EXISTS ai_transfer_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'completed', 'expired')),
  assigned_ero_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_ero_id) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_transfers_status ON ai_transfer_requests(status);

-- ERO MESSAGING (Encrypted preparer-to-client and coworker communication)
CREATE TABLE IF NOT EXISTS ero_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  transfer_request_id TEXT,
  sender_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('client', 'staff', 'ero', 'admin')),
  recipient_id INTEGER,
  recipient_type TEXT CHECK(recipient_type IN ('client', 'staff', 'ero', 'admin')),
  message TEXT NOT NULL,
  encrypted INTEGER DEFAULT 0,
  read_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transfer_request_id) REFERENCES ai_transfer_requests(id)
);

CREATE INDEX IF NOT EXISTS idx_ero_messages_conversation ON ero_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ero_messages_sender ON ero_messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_ero_messages_recipient ON ero_messages(recipient_id, recipient_type);

-- INTAKE FORMS (Routed to info@rosstaxandbookkeeping.com)
CREATE TABLE IF NOT EXISTS intake_forms (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  encrypted_data TEXT NOT NULL,
  source TEXT DEFAULT 'web',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'contacted', 'converted', 'closed')),
  assigned_to INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_intake_status ON intake_forms(status);
CREATE INDEX IF NOT EXISTS idx_intake_created ON intake_forms(created_at);

-- ADMIN BROADCASTS
CREATE TABLE IF NOT EXISTS admin_broadcasts (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  recipients TEXT NOT NULL, -- 'all', 'clients', 'staff'
  sent_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT LOG (Comprehensive)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  user_id INTEGER,
  user_role TEXT,
  user_email TEXT,
  details TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at);

-- RETURNS TABLE EXTENSION (Add assigned_ero_id)
ALTER TABLE returns ADD COLUMN assigned_ero_id INTEGER REFERENCES staff(id);

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

-- WORKFLOW TASKS (Task assignment and tracking)
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  client_id TEXT NOT NULL,
  task_type TEXT NOT NULL, -- document_request, prepare_return, review_return, etc.
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  assigned_to INTEGER, -- staff.id
  assigned_by INTEGER, -- staff.id who assigned
  due_date TEXT,
  completed_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (assigned_to) REFERENCES staff(id),
  FOREIGN KEY (assigned_by) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_return ON workflow_tasks(return_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_priority ON workflow_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_due ON workflow_tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_mef_logs_level ON mef_logs(level);
CREATE INDEX IF NOT EXISTS idx_mef_logs_operation ON mef_logs(operation);
CREATE INDEX IF NOT EXISTS idx_mef_logs_submission ON mef_logs(submission_id);

-- BANK PRODUCT SELECTIONS (Refund Transfer, Refund Advance, etc.)
CREATE TABLE IF NOT EXISTS bank_product_selections (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  client_id TEXT NOT NULL,
  product_id TEXT NOT NULL, -- direct_deposit, refund_transfer, refund_advance, check
  product_name TEXT NOT NULL,
  
  -- Bank account info (encrypted)
  routing_number_encrypted TEXT,
  account_number_encrypted TEXT,
  account_type TEXT, -- checking, savings
  
  -- Refund advance specific
  advance_amount REAL,
  advance_status TEXT, -- pending, approved, denied, disbursed
  advance_disbursed_at TEXT,
  
  -- Fees
  product_fee REAL NOT NULL,
  total_fees REAL NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, completed, cancelled
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_bank_products_return ON bank_product_selections(return_id);
CREATE INDEX IF NOT EXISTS idx_bank_products_client ON bank_product_selections(client_id);
CREATE INDEX IF NOT EXISTS idx_bank_products_status ON bank_product_selections(status);

-- BANK PRODUCT TRANSMISSIONS (Refund Advantage Partnership API)
CREATE TABLE IF NOT EXISTS bank_product_transmissions (
  transmission_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  return_id INTEGER,
  product_type TEXT NOT NULL CHECK(product_type IN ('RT', 'RA', 'LOAN')), -- Refund Transfer, Refund Advance, Instant Loan
  routing_number_encrypted TEXT NOT NULL, -- Encrypted bank routing
  account_number_encrypted TEXT NOT NULL, -- Encrypted account number
  account_type TEXT NOT NULL CHECK(account_type IN ('checking', 'savings')),
  account_holder_name TEXT NOT NULL,
  refund_amount REAL DEFAULT 0, -- IRS refund amount for RT
  advance_amount REAL DEFAULT 0, -- Advance amount for RA/LOAN
  fee REAL NOT NULL, -- Partnership fee
  net_amount REAL NOT NULL, -- Amount after fee
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'transmitted', 'processed', 'failed')) DEFAULT 'pending',
  transmission_date TEXT, -- When transmitted to bank
  expected_deposit_date TEXT, -- Expected deposit date
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_bank_transmissions_client ON bank_product_transmissions(client_id);
CREATE INDEX IF NOT EXISTS idx_bank_transmissions_return ON bank_product_transmissions(return_id);
CREATE INDEX IF NOT EXISTS idx_bank_transmissions_status ON bank_product_transmissions(status);
CREATE INDEX IF NOT EXISTS idx_bank_transmissions_type ON bank_product_transmissions(product_type);

-- NOTIFICATIONS (Real-time multi-channel notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- return_accepted, refund_approved, task_assigned, etc.
  recipient_id TEXT NOT NULL, -- client_id, staff_id, or 'admin'
  recipient_type TEXT NOT NULL, -- client, staff, admin
  title TEXT,
  message TEXT NOT NULL,
  urgent INTEGER DEFAULT 0, -- 1 for urgent (triggers SMS)
  data TEXT, -- JSON additional data
  channels TEXT, -- JSON array: ["email", "sms", "push", "websocket"]
  read INTEGER DEFAULT 0,
  read_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_urgent ON notifications(urgent);

-- JOB POSTINGS (Career opportunities)
CREATE TABLE IF NOT EXISTS job_postings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Compensation
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  hourly_rate_min REAL,
  hourly_rate_max REAL,
  
  employment_type TEXT NOT NULL, -- full_time, part_time, contract, hourly
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, closed, filled
  
  -- Job details
  requirements TEXT, -- JSON array
  responsibilities TEXT, -- JSON array
  location TEXT,
  remote INTEGER DEFAULT 0,
  
  -- PDF generation
  pdf_url TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON job_postings(department);

-- FORM 8879 (IRS e-Signature Authorization for electronic filing)
CREATE TABLE IF NOT EXISTS form_8879 (
  form_id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  client_id TEXT NOT NULL,
  
  -- Taxpayer Information
  taxpayer_name TEXT NOT NULL,
  taxpayer_ssn_encrypted TEXT NOT NULL,
  taxpayer_phone TEXT NOT NULL,
  taxpayer_email TEXT NOT NULL,
  taxpayer_date_of_birth TEXT NOT NULL,
  
  -- Spouse Information (if applicable)
  spouse_name TEXT,
  spouse_ssn_encrypted TEXT,
  spouse_date_of_birth TEXT,
  
  -- Preparer Information
  preparer_name TEXT NOT NULL,
  preparer_efin TEXT NOT NULL,
  preparer_ptin TEXT NOT NULL,
  preparer_npi TEXT,
  preparer_phone TEXT NOT NULL,
  preparer_email TEXT NOT NULL,
  preparer_signature_date TEXT,
  
  -- Signature Details
  signature_method TEXT NOT NULL, -- digital_signature, esignature, facsimile
  taxpayer_signature_method TEXT, -- digital_signature, pin_plus_password, voice_signature
  taxpayer_signature_date TEXT,
  taxpayer_signature_ip_address TEXT,
  taxpayer_signature_device_fingerprint TEXT,
  
  -- Spouse Signature
  spouse_signature_method TEXT,
  spouse_signature_date TEXT,
  spouse_signature_ip_address TEXT,
  
  -- Declarations & Document Info
  declaration_of_representative TEXT,
  declaration_of_taxpayer TEXT,
  return_form_type TEXT NOT NULL, -- 1040, 1040-ES, 1065, etc.
  tax_year INTEGER NOT NULL,
  refund_amount REAL,
  tax_due REAL,
  
  -- Form Data
  form_8879_version TEXT NOT NULL,
  form_8879_xml TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK(status IN ('draft', 'signed_by_preparer', 'signed_by_taxpayer', 'ready_for_transmission', 'transmitted', 'acknowledged', 'rejected')) DEFAULT 'draft',
  signature_completion_percentage INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  transmitted_at TEXT,
  acknowledged_at TEXT,
  preparer_signed_at TEXT,
  taxpayer_signed_at TEXT,
  
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_form8879_return ON form_8879(return_id);
CREATE INDEX IF NOT EXISTS idx_form8879_client ON form_8879(client_id);
CREATE INDEX IF NOT EXISTS idx_form8879_status ON form_8879(status);
CREATE INDEX IF NOT EXISTS idx_form8879_tax_year ON form_8879(tax_year);

-- TAXPAYER PINS (Temporary 4-digit codes for Form 8879 signature authorization)
CREATE TABLE IF NOT EXISTS taxpayer_pins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  pin TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_taxpayer_pins_client ON taxpayer_pins(client_id);
CREATE INDEX IF NOT EXISTS idx_taxpayer_pins_expires ON taxpayer_pins(expires_at);

-- FINANCIAL INSTITUTION ACCOUNTS (Custom FI for RT, RA, Loans)
CREATE TABLE IF NOT EXISTS fi_accounts (
  account_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN ('savings', 'checking', 'loan', 'sweep')),
  account_number TEXT NOT NULL UNIQUE,
  routing_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  available_balance REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('active', 'suspended', 'closed')) DEFAULT 'active',
  fdic_insured INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_fi_accounts_client ON fi_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_status ON fi_accounts(status);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_type ON fi_accounts(account_type);

-- FINANCIAL INSTITUTION TRANSACTIONS (Deposits, withdrawals, transfers)
CREATE TABLE IF NOT EXISTS fi_transactions (
  transaction_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('debit', 'credit', 'transfer', 'reversal')),
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'posted', 'reversed', 'failed')) DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  posted_at TEXT,
  FOREIGN KEY (account_id) REFERENCES fi_accounts(account_id)
);

CREATE INDEX IF NOT EXISTS idx_fi_transactions_account ON fi_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_status ON fi_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_created ON fi_transactions(created_at);

-- ADVANCE ORIGINATIONS (Refund Advances managed by custom FI)
CREATE TABLE IF NOT EXISTS advance_originations (
  advance_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  return_id INTEGER NOT NULL,
  requested_amount REAL NOT NULL,
  approved_amount REAL NOT NULL,
  fee REAL NOT NULL,
  net_deposit REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'funded', 'repaid', 'defaulted')) DEFAULT 'pending',
  refund_offset_amount REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  funded_at TEXT,
  repaid_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_advance_originations_client ON advance_originations(client_id);
CREATE INDEX IF NOT EXISTS idx_advance_originations_return ON advance_originations(return_id);
CREATE INDEX IF NOT EXISTS idx_advance_originations_status ON advance_originations(status);

-- LOAN ORIGINATIONS (Short-term loans managed by custom FI)
CREATE TABLE IF NOT EXISTS loan_originations (
  loan_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  requested_amount REAL NOT NULL,
  approved_amount REAL NOT NULL,
  apr REAL NOT NULL,
  term_days INTEGER NOT NULL,
  fee REAL NOT NULL,
  total_payback REAL NOT NULL,
  monthly_payment REAL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'funded', 'active', 'repaid', 'defaulted')) DEFAULT 'pending',
  co_borrower_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  funded_at TEXT,
  due_date TEXT,
  repaid_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (co_borrower_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_loan_originations_client ON loan_originations(client_id);
CREATE INDEX IF NOT EXISTS idx_loan_originations_status ON loan_originations(status);
CREATE INDEX IF NOT EXISTS idx_loan_originations_due_date ON loan_originations(due_date);

-- JOB APPLICATIONS (Applicant tracking)
CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  
  -- Applicant info
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  
  -- Application materials
  resume_url TEXT,
  cover_letter TEXT,
  
  -- Tracking
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, under_review, interview, offered, hired, rejected
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_id) REFERENCES job_postings(id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(applicant_email);

-- BADGES (Client achievement badges - 14 types across 5 categories)
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN (
    'payment_method_verified',
    'form_8879_signed',
    'bank_product_selected',
    'bank_routing_verified',
    'payment_settled',
    'payment_election_made',
    'identification_verified',
    'documents_completed',
    'compliance_passed',
    'efile_transmitted',
    'efile_accepted',
    'refund_calculated',
    'refund_approved',
    'refund_disbursed'
  )),
  category TEXT NOT NULL CHECK(category IN ('payment', 'documentation', 'compliance', 'transmission', 'refund')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired')),
  is_required INTEGER DEFAULT 1,
  awarded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  metadata TEXT, -- JSON metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_badges_client ON badges(client_id);
CREATE INDEX IF NOT EXISTS idx_badges_type ON badges(type);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_status ON badges(status);

