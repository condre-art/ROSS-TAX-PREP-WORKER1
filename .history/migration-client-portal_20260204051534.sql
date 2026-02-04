-- Migration: Client Portal and Refund Transfer Tables
-- Date: 2026-02-04
-- Description: Adds 13 tables for client portal, refund transfer center, and messaging

-- TAX_RETURNS (Client tax return tracking)
CREATE TABLE IF NOT EXISTS tax_returns (
  return_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL CHECK(filing_status IN ('single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_widow')),
  status TEXT NOT NULL CHECK(status IN ("draft", "in_progress", "pending_review", "submitted", "accepted", "rejected", "archived", "withdrawn")),
  preparer_id INTEGER,
  reviewer_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  accepted_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (preparer_id) REFERENCES staff(id),
  FOREIGN KEY (reviewer_id) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_tax_returns_client ON tax_returns(client_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_year ON tax_returns(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_returns_status ON tax_returns(status);
CREATE INDEX IF NOT EXISTS idx_tax_returns_preparer ON tax_returns(preparer_id);

-- CLIENT_TASKS (Pending actions for clients)
CREATE TABLE IF NOT EXISTS client_tasks (
  task_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK(task_type IN ('document_upload', 'signature_required', 'information_needed', 'schedule_appointment', 'payment_due')),
  description TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by INTEGER,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (created_by) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_client_tasks_client ON client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status ON client_tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_tasks_due ON client_tasks(due_date);

-- CLIENT_NOTIFICATIONS (System notifications for clients)
CREATE TABLE IF NOT EXISTS client_notifications (
  notification_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('status_change', 'document_received', 'refund_processed', 'action_required', 'message_received')),
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_client_notifications_client ON client_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_read ON client_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_client_notifications_created ON client_notifications(created_at);

-- CLIENT_DOCUMENTS (Document metadata and tracking)
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
  reviewed_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (uploaded_by) REFERENCES clients(id),
  FOREIGN KEY (reviewed_by) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_status ON client_documents(status);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded ON client_documents(uploaded_at);

-- MESSAGE_THREADS (Secure messaging between clients and staff)
CREATE TABLE IF NOT EXISTS message_threads (
  thread_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed', 'archived')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_message_threads_client ON message_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_status ON message_threads(status);
CREATE INDEX IF NOT EXISTS idx_message_threads_updated ON message_threads(updated_at);

-- MESSAGES (Individual messages in threads)
CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('client', 'staff')),
  message_text TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT,
  FOREIGN KEY (thread_id) REFERENCES message_threads(thread_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- CLIENT_ACTIVITY_LOG (90-day client activity tracking)
CREATE TABLE IF NOT EXISTS client_activity_log (
  activity_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK(activity_type IN ('login', 'document_upload', 'document_download', 'message_sent', 'profile_update', 'consent_signed')),
  description TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_client_activity_client ON client_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_type ON client_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_client_activity_created ON client_activity_log(created_at);

-- REFUND_TRANSFERS (Refund transfer tracking with SoD enforcement)
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
  submitted_by TEXT NOT NULL,
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  approved_by TEXT,
  approved_at TEXT,
  approval_notes TEXT,
  client_consent INTEGER NOT NULL DEFAULT 0,
  expected_date TEXT,
  irs_acknowledgment_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES tax_returns(return_id),
  FOREIGN KEY (submitted_by) REFERENCES staff(id),
  FOREIGN KEY (approved_by) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_refund_transfers_return ON refund_transfers(return_id);
CREATE INDEX IF NOT EXISTS idx_refund_transfers_status ON refund_transfers(status);
CREATE INDEX IF NOT EXISTS idx_refund_transfers_submitted ON refund_transfers(submitted_by);
CREATE INDEX IF NOT EXISTS idx_refund_transfers_approved ON refund_transfers(approved_by);

-- TRANSFER_TIMELINE (Refund transfer event history)
CREATE TABLE IF NOT EXISTS transfer_timeline (
  event_id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('submitted', 'approved', 'rejected', 'sent_to_partner', 'irs_accepted', 'funds_released', 'completed', 'cancelled')),
  description TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transfer_id) REFERENCES refund_transfers(transfer_id)
);

CREATE INDEX IF NOT EXISTS idx_transfer_timeline_transfer ON transfer_timeline(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_timeline_type ON transfer_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_transfer_timeline_created ON transfer_timeline(created_at);

-- REFUND_TRANSFER_FEES (Fee disclosure)
CREATE TABLE IF NOT EXISTS refund_transfer_fees (
  fee_id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  fee_amount REAL NOT NULL,
  description TEXT NOT NULL,
  effective_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refund_transfer_fees_active ON refund_transfer_fees(is_active);
CREATE INDEX IF NOT EXISTS idx_refund_transfer_fees_effective ON refund_transfer_fees(effective_date);

-- Seed initial fee schedule
INSERT OR IGNORE INTO refund_transfer_fees (fee_id, product_name, fee_amount, description, effective_date, is_active)
VALUES 
  ('rt-fee-2025', 'Refund Transfer 2025', 35.00, 'Electronic refund deposit processing fee', '2025-01-01', 1),
  ('ra-fee-2025', 'Refund Advance 2025', 49.95, 'Refund advance processing fee', '2025-01-01', 1);
