-- Service Requests Management Schema
-- Adds tables for tracking client service requests, workflow, and permissions

-- Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  services_json TEXT NOT NULL, -- JSON array of requested services
  documents_json TEXT, -- JSON array of uploaded document URLs
  status TEXT NOT NULL DEFAULT 'pending_approval', -- pending_approval, approved, in_progress, completed, rejected
  submitted_at TEXT NOT NULL,
  updated_at TEXT,
  assigned_to TEXT, -- staff member ID
  notes TEXT, -- staff notes
  estimated_total TEXT, -- quoted price
  engagement_letter_url TEXT, -- DocuSign envelope or PDF URL
  payment_status TEXT DEFAULT 'pending', -- pending, paid, partial
  created_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Service Request Comments/Activity Log
CREATE TABLE IF NOT EXISTS service_request_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL, -- client or staff
  user_role TEXT NOT NULL, -- client, preparer, ero, admin
  action TEXT NOT NULL, -- comment, status_change, document_upload, assignment
  message TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES service_requests(request_id)
);

-- Documents Table (if not exists)
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL, -- R2 bucket object key
  file_type TEXT, -- MIME type
  category TEXT, -- service_request, tax_return, irs_notice, etc.
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT, -- user ID
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Service Permissions Matrix
CREATE TABLE IF NOT EXISTS service_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL, -- client, preparer, ero, admin
  permission TEXT NOT NULL, -- services:request, services:approve, services:assign, etc.
  description TEXT,
  UNIQUE(role, permission)
);

-- Insert default permissions
INSERT OR IGNORE INTO service_permissions (role, permission, description) VALUES
  ('client', 'services:request', 'Submit service requests'),
  ('client', 'services:view_own', 'View own service requests'),
  ('client', 'documents:upload', 'Upload documents'),
  ('client', 'portal:access', 'Access client portal'),
  ('preparer', 'services:request', 'Submit service requests'),
  ('preparer', 'services:view_all', 'View all service requests'),
  ('preparer', 'services:assign_self', 'Assign requests to self'),
  ('preparer', 'clients:manage', 'Manage client accounts'),
  ('preparer', 'documents:access', 'Access all client documents'),
  ('ero', 'services:approve', 'Approve service requests'),
  ('ero', 'services:assign', 'Assign requests to staff'),
  ('ero', 'services:view_all', 'View all service requests'),
  ('ero', 'staff:manage', 'Manage staff accounts'),
  ('ero', 'pricing:override', 'Override pricing'),
  ('admin', 'services:*', 'All service permissions'),
  ('admin', 'system:*', 'All system permissions');

-- Service Request Status History
CREATE TABLE IF NOT EXISTS service_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL, -- user ID
  changed_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (request_id) REFERENCES service_requests(request_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned ON service_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_activity_request ON service_request_activity(request_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
