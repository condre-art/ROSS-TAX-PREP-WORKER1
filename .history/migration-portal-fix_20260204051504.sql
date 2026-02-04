-- Migration: Fix Portal Tables (Safe Migration - No Conflicts)
-- Step 1: Rename existing messages table to preserve data
ALTER TABLE messages RENAME TO messages_legacy;

-- Step 2: Create all new portal tables
CREATE TABLE IF NOT EXISTS tax_returns (
  return_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL CHECK(filing_status IN ('single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_widow')),
  status TEXT NOT NULL CHECK(status IN ('draft', 'in_progress', 'pending_review', 'submitted', 'accepted', 'rejected', 'archived', 'withdrawn')),
  preparer_id INTEGER,
  reviewer_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  accepted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tax_returns_client ON tax_returns(client_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_year ON tax_returns(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_returns_status ON tax_returns(status);
CREATE INDEX IF NOT EXISTS idx_tax_returns_preparer ON tax_returns(preparer_id);

CREATE TABLE IF NOT EXISTS client_tasks (
  task_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK(task_type IN ('document_upload', 'signature_required', 'information_needed', 'schedule_appointment', 'payment_due')),
  description TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by INTEGER,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_tasks_client ON client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status ON client_tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_tasks_due ON client_tasks(due_date);

CREATE TABLE IF NOT EXISTS client_notifications (
  notification_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('status_change', 'document_received', 'refund_processed', 'action_required', 'message_received')),
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_client_notifications_client ON client_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_read ON client_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_client_notifications_created ON client_notifications(created_at);

CREATE TABLE IF NOT EXISTS client_documents (
  doc_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('w2', '1099', 'tax_return', 'engagement_letter', 'consent_form', 'id_verification', 'other')),
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'approved', 'rejected', 'archived')),
  reviewed_by INTEGER,
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_status ON client_documents(status);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded ON client_documents(uploaded_at);

CREATE TABLE IF NOT EXISTS message_threads (
  thread_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed', 'archived')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_threads_client ON message_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_status ON message_threads(status);
CREATE INDEX IF NOT EXISTS idx_message_threads_updated ON message_threads(updated_at);

CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('client', 'staff')),
  message_text TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

CREATE TABLE IF NOT EXISTS client_activity_log (
  activity_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK(activity_type IN ('login', 'document_upload', 'document_download', 'message_sent', 'profile_update', 'consent_signed')),
  description TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_activity_client ON client_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_type ON client_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_client_activity_created ON client_activity_log(created_at);

CREATE TABLE IF NOT EXISTS refund_transfers (
  transfer_id TEXT PRIMARY KEY,
  return_id TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  fee REAL NOT NULL,
  partner_bank TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_supervisor_approval' CHECK(status IN (
    'pending_supervisor_approval',
    'approved',
    'submitted_to_partner',
    'irs_accepted',
    'funds_released',
    'completed',
    'rejected',
    'cancelled'
  )),
  submitted_by INTEGER NOT NULL,
  approved_by INTEGER,
  rejection_reason TEXT,
  partner_confirmation TEXT,
  account_number TEXT,
  routing_number TEXT,
  client_account TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refund_transfers_return ON refund_transfers(return_id);
CREATE INDEX IF NOT EXISTS idx_refund_transfers_status ON refund_transfers(status);
CREATE INDEX IF NOT EXISTS idx_refund_transfers_submitted ON refund_transfers(submitted_by);
CREATE INDEX IF NOT EXISTS idx_refund_transfers_approved ON refund_transfers(approved_by);

CREATE TABLE IF NOT EXISTS transfer_timeline (
  event_id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('submitted', 'approved', 'rejected', 'sent_to_partner', 'irs_accepted', 'funds_released', 'completed', 'cancelled')),
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_timeline_transfer ON transfer_timeline(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_timeline_event ON transfer_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_transfer_timeline_created ON transfer_timeline(created_at);

CREATE TABLE IF NOT EXISTS refund_transfer_fees (
  fee_id TEXT PRIMARY KEY,
  product_code TEXT NOT NULL CHECK(product_code IN ('RT', 'RA')),
  fee_amount REAL NOT NULL,
  effective_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refund_transfer_fees_active ON refund_transfer_fees(is_active);
CREATE INDEX IF NOT EXISTS idx_refund_transfer_fees_effective ON refund_transfer_fees(effective_date);

-- Insert fee schedule (2025 pricing)
INSERT INTO refund_transfer_fees (fee_id, product_code, fee_amount, effective_date, description, is_active) 
VALUES 
  ('fee_rt_2025', 'RT', 35.00, '2025-01-01', 'Refund Transfer fee for 2025 tax year', 1),
  ('fee_ra_2025', 'RA', 49.95, '2025-01-01', 'Refund Advantage fee for 2025 tax year', 1);
