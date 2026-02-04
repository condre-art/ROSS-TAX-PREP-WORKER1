-- ====================================================================
-- ROSS TAX & BOOKKEEPING - COMPREHENSIVE RBAC SYSTEM
-- Complete Role-Based Access Control for All Features
-- ====================================================================

-- ====================================================================
-- 1. ROLES HIERARCHY TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT UNIQUE NOT NULL,
  role_level INTEGER NOT NULL, -- Hierarchy: 1=client, 2=preparer, 3=ero, 4=admin, 5=owner
  description TEXT,
  can_elevate BOOLEAN DEFAULT 0, -- Can this role grant itself additional permissions
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- Insert role hierarchy
INSERT OR IGNORE INTO roles (role_name, role_level, description, can_elevate, created_at) VALUES
  ('client', 1, 'End client - can file taxes, request services', 0, datetime('now')),
  ('preparer', 2, 'Tax preparer - can prepare returns, manage clients', 0, datetime('now')),
  ('ero', 3, 'Electronic Return Originator - can transmit, approve returns', 0, datetime('now')),
  ('admin', 4, 'System administrator - full access except ownership transfer', 1, datetime('now')),
  ('owner', 5, 'Business owner - unrestricted access to everything', 1, datetime('now'));

-- ====================================================================
-- 2. COMPREHENSIVE PERMISSIONS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permission_key TEXT UNIQUE NOT NULL,
  permission_group TEXT NOT NULL, -- Feature category
  permission_name TEXT NOT NULL,
  description TEXT,
  requires_mfa BOOLEAN DEFAULT 0,
  audit_required BOOLEAN DEFAULT 1,
  is_sensitive BOOLEAN DEFAULT 0,
  created_at TEXT NOT NULL
);

-- ====================================================================
-- 3. ROLE PERMISSIONS MATRIX
-- ====================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  granted_by TEXT, -- User ID who granted this permission
  FOREIGN KEY (role_name) REFERENCES roles(role_name),
  FOREIGN KEY (permission_key) REFERENCES permissions(permission_key),
  UNIQUE(role_name, permission_key)
);

-- ====================================================================
-- 4. USER ROLE ASSIGNMENTS (with effective dates)
-- ====================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'client' or 'staff'
  role_name TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_until TEXT, -- NULL = permanent
  assigned_by TEXT NOT NULL,
  assignment_reason TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (role_name) REFERENCES roles(role_name)
);

-- ====================================================================
-- 5. FEATURE FLAGS TABLE (per-feature enable/disable)
-- ====================================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT 1,
  min_role_level INTEGER DEFAULT 1, -- Minimum role level required
  environment TEXT DEFAULT 'production', -- production, staging, dev
  rollout_percentage INTEGER DEFAULT 100, -- Gradual rollout 0-100%
  updated_at TEXT,
  updated_by TEXT
);

-- ====================================================================
-- INSERT ALL PERMISSIONS (Organized by Feature Group)
-- ====================================================================

-- ====================================================================
-- GROUP: AUTHENTICATION & ACCOUNT
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('auth:login', 'authentication', 'Login', 'Can log into the system', 0, 1, 0, datetime('now')),
  ('auth:logout', 'authentication', 'Logout', 'Can log out of the system', 0, 1, 0, datetime('now')),
  ('auth:mfa_setup', 'authentication', 'Setup MFA', 'Can configure multi-factor authentication', 0, 1, 0, datetime('now')),
  ('auth:mfa_verify', 'authentication', 'Verify MFA', 'Can verify MFA codes', 0, 1, 0, datetime('now')),
  ('auth:password_change', 'authentication', 'Change Password', 'Can change own password', 0, 1, 0, datetime('now')),
  ('auth:password_reset', 'authentication', 'Reset Password', 'Can reset passwords for others', 1, 1, 1, datetime('now')),
  ('account:view_own', 'account', 'View Own Account', 'Can view own account details', 0, 0, 0, datetime('now')),
  ('account:edit_own', 'account', 'Edit Own Account', 'Can edit own account details', 0, 1, 0, datetime('now')),
  ('account:delete_own', 'account', 'Delete Own Account', 'Can delete own account', 1, 1, 1, datetime('now')),
  ('account:view_all', 'account', 'View All Accounts', 'Can view all user accounts', 0, 1, 1, datetime('now')),
  ('account:edit_all', 'account', 'Edit All Accounts', 'Can edit any user account', 1, 1, 1, datetime('now')),
  ('account:delete_all', 'account', 'Delete All Accounts', 'Can delete any user account', 1, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: EFILE & TAX TRANSMISSION
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('efile:create_own', 'efile', 'Create Own E-File', 'Can create own tax returns', 0, 1, 0, datetime('now')),
  ('efile:view_own', 'efile', 'View Own E-File', 'Can view own tax returns', 0, 0, 0, datetime('now')),
  ('efile:edit_own', 'efile', 'Edit Own E-File', 'Can edit own tax returns', 0, 1, 0, datetime('now')),
  ('efile:delete_own', 'efile', 'Delete Own E-File', 'Can delete own tax returns', 0, 1, 0, datetime('now')),
  ('efile:create', 'efile', 'Create E-File', 'Can create tax returns for clients', 0, 1, 0, datetime('now')),
  ('efile:view_all', 'efile', 'View All E-Files', 'Can view all tax returns', 0, 1, 1, datetime('now')),
  ('efile:edit_all', 'efile', 'Edit All E-Files', 'Can edit any tax return', 0, 1, 1, datetime('now')),
  ('efile:delete_all', 'efile', 'Delete All E-Files', 'Can delete any tax return', 1, 1, 1, datetime('now')),
  ('efile:submit', 'efile', 'Submit E-File', 'Can submit returns to IRS', 0, 1, 1, datetime('now')),
  ('efile:approve', 'efile', 'Approve E-File', 'Can approve returns for transmission', 1, 1, 1, datetime('now')),
  ('efile:transmit', 'efile', 'Transmit to IRS', 'Can transmit returns to IRS MeF', 1, 1, 1, datetime('now')),
  ('efile:acknowledge', 'efile', 'Process Acknowledgments', 'Can process IRS acknowledgments', 0, 1, 1, datetime('now')),
  ('efile:reject_handling', 'efile', 'Handle Rejections', 'Can handle rejected returns', 0, 1, 0, datetime('now')),
  ('efile:amend', 'efile', 'Amend Returns', 'Can file amended returns (1040-X)', 0, 1, 1, datetime('now')),
  ('efile:extension', 'efile', 'File Extensions', 'Can file tax extensions', 0, 1, 0, datetime('now')),
  ('efile:status_check', 'efile', 'Check Status', 'Can check e-file status', 0, 0, 0, datetime('now'));

-- ====================================================================
-- GROUP: IRS MEF & TRANSMISSION
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('mef:configure', 'mef', 'Configure MeF', 'Can configure IRS MeF settings', 1, 1, 1, datetime('now')),
  ('mef:credentials', 'mef', 'Manage Credentials', 'Can manage MeF certificates & credentials', 1, 1, 1, datetime('now')),
  ('mef:test_mode', 'mef', 'Use Test Mode', 'Can transmit to IRS test environment', 0, 1, 0, datetime('now')),
  ('mef:production_mode', 'mef', 'Use Production Mode', 'Can transmit to IRS production', 1, 1, 1, datetime('now')),
  ('mef:bulk_transmit', 'mef', 'Bulk Transmit', 'Can transmit multiple returns at once', 1, 1, 1, datetime('now')),
  ('mef:ack_download', 'mef', 'Download Acknowledgments', 'Can download IRS acknowledgments', 0, 1, 0, datetime('now')),
  ('mef:error_logs', 'mef', 'View Error Logs', 'Can view MeF error logs', 0, 1, 0, datetime('now')),
  ('mef:schema_update', 'mef', 'Update Schemas', 'Can update IRS schemas', 1, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: CLIENTS & CRM
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('clients:view_own', 'clients', 'View Own Data', 'Can view own client data', 0, 0, 0, datetime('now')),
  ('clients:create', 'clients', 'Create Client', 'Can create new client accounts', 0, 1, 0, datetime('now')),
  ('clients:view_all', 'clients', 'View All Clients', 'Can view all client records', 0, 1, 1, datetime('now')),
  ('clients:edit', 'clients', 'Edit Clients', 'Can edit client information', 0, 1, 1, datetime('now')),
  ('clients:delete', 'clients', 'Delete Clients', 'Can delete client accounts', 1, 1, 1, datetime('now')),
  ('clients:export', 'clients', 'Export Client Data', 'Can export client database', 1, 1, 1, datetime('now')),
  ('clients:merge', 'clients', 'Merge Clients', 'Can merge duplicate client records', 0, 1, 1, datetime('now')),
  ('crm:intakes', 'crm', 'Manage Intakes', 'Can manage client intake forms', 0, 1, 0, datetime('now')),
  ('crm:notes', 'crm', 'Client Notes', 'Can add notes to client records', 0, 1, 0, datetime('now')),
  ('crm:communications', 'crm', 'View Communications', 'Can view client communication history', 0, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: DOCUMENTS & FILE MANAGEMENT
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('documents:upload_own', 'documents', 'Upload Own Documents', 'Can upload own documents', 0, 1, 0, datetime('now')),
  ('documents:view_own', 'documents', 'View Own Documents', 'Can view own documents', 0, 0, 0, datetime('now')),
  ('documents:delete_own', 'documents', 'Delete Own Documents', 'Can delete own documents', 0, 1, 0, datetime('now')),
  ('documents:upload_all', 'documents', 'Upload All Documents', 'Can upload documents for any client', 0, 1, 0, datetime('now')),
  ('documents:view_all', 'documents', 'View All Documents', 'Can view all client documents', 0, 1, 1, datetime('now')),
  ('documents:delete_all', 'documents', 'Delete All Documents', 'Can delete any document', 1, 1, 1, datetime('now')),
  ('documents:download', 'documents', 'Download Documents', 'Can download documents', 0, 1, 1, datetime('now')),
  ('documents:share', 'documents', 'Share Documents', 'Can share documents externally', 0, 1, 1, datetime('now')),
  ('documents:r2_access', 'documents', 'R2 Bucket Access', 'Can access R2 storage directly', 1, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: SERVICES & REQUESTS
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('services:view', 'services', 'View Services', 'Can view service catalog', 0, 0, 0, datetime('now')),
  ('services:request', 'services', 'Request Services', 'Can submit service requests', 0, 1, 0, datetime('now')),
  ('services:view_own', 'services', 'View Own Requests', 'Can view own service requests', 0, 0, 0, datetime('now')),
  ('services:view_all', 'services', 'View All Requests', 'Can view all service requests', 0, 1, 0, datetime('now')),
  ('services:approve', 'services', 'Approve Requests', 'Can approve service requests', 0, 1, 0, datetime('now')),
  ('services:reject', 'services', 'Reject Requests', 'Can reject service requests', 0, 1, 0, datetime('now')),
  ('services:assign', 'services', 'Assign Requests', 'Can assign requests to staff', 0, 1, 0, datetime('now')),
  ('services:pricing', 'services', 'Manage Pricing', 'Can modify service pricing', 1, 1, 1, datetime('now')),
  ('services:pricing_override', 'services', 'Override Pricing', 'Can override quoted prices', 1, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: BOOKKEEPING
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('bookkeeping:view_own', 'bookkeeping', 'View Own Books', 'Can view own bookkeeping records', 0, 0, 0, datetime('now')),
  ('bookkeeping:create', 'bookkeeping', 'Create Records', 'Can create bookkeeping entries', 0, 1, 0, datetime('now')),
  ('bookkeeping:edit', 'bookkeeping', 'Edit Records', 'Can edit bookkeeping entries', 0, 1, 1, datetime('now')),
  ('bookkeeping:delete', 'bookkeeping', 'Delete Records', 'Can delete bookkeeping entries', 1, 1, 1, datetime('now')),
  ('bookkeeping:reconcile', 'bookkeeping', 'Reconcile Accounts', 'Can perform account reconciliations', 0, 1, 0, datetime('now')),
  ('bookkeeping:reports', 'bookkeeping', 'Generate Reports', 'Can generate financial reports', 0, 1, 0, datetime('now')),
  ('bookkeeping:export', 'bookkeeping', 'Export Data', 'Can export bookkeeping data', 0, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: INVOICING & PAYMENTS
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('invoicing:view_own', 'invoicing', 'View Own Invoices', 'Can view own invoices', 0, 0, 0, datetime('now')),
  ('invoicing:create', 'invoicing', 'Create Invoices', 'Can create invoices', 0, 1, 0, datetime('now')),
  ('invoicing:edit', 'invoicing', 'Edit Invoices', 'Can edit invoices', 0, 1, 0, datetime('now')),
  ('invoicing:delete', 'invoicing', 'Delete Invoices', 'Can delete invoices', 1, 1, 1, datetime('now')),
  ('invoicing:send', 'invoicing', 'Send Invoices', 'Can send invoices to clients', 0, 1, 0, datetime('now')),
  ('invoicing:view_all', 'invoicing', 'View All Invoices', 'Can view all invoices', 0, 1, 1, datetime('now')),
  ('payments:process', 'payments', 'Process Payments', 'Can process client payments', 0, 1, 1, datetime('now')),
  ('payments:refund', 'payments', 'Issue Refunds', 'Can issue payment refunds', 1, 1, 1, datetime('now')),
  ('payments:view_all', 'payments', 'View All Payments', 'Can view all payment records', 0, 1, 1, datetime('now')),
  ('payments:configure', 'payments', 'Configure Payment Settings', 'Can configure payment processors', 1, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: REFUND TRACKING
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('refunds:track_own', 'refunds', 'Track Own Refund', 'Can track own tax refund status', 0, 0, 0, datetime('now')),
  ('refunds:track_all', 'refunds', 'Track All Refunds', 'Can track all client refunds', 0, 1, 1, datetime('now')),
  ('refunds:update_status', 'refunds', 'Update Refund Status', 'Can update refund status information', 0, 1, 1, datetime('now')),
  ('refunds:bank_products', 'refunds', 'Manage Bank Products', 'Can manage refund bank products', 0, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: LMS & EDUCATION
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('lms:view_catalog', 'lms', 'View Course Catalog', 'Can view available courses', 0, 0, 0, datetime('now')),
  ('lms:enroll', 'lms', 'Enroll in Courses', 'Can enroll in courses', 0, 1, 0, datetime('now')),
  ('lms:view_own', 'lms', 'View Own Courses', 'Can view own enrolled courses', 0, 0, 0, datetime('now')),
  ('lms:complete', 'lms', 'Complete Courses', 'Can mark courses as complete', 0, 1, 0, datetime('now')),
  ('lms:create_courses', 'lms', 'Create Courses', 'Can create new courses', 0, 1, 0, datetime('now')),
  ('lms:edit_courses', 'lms', 'Edit Courses', 'Can edit course content', 0, 1, 0, datetime('now')),
  ('lms:delete_courses', 'lms', 'Delete Courses', 'Can delete courses', 1, 1, 1, datetime('now')),
  ('lms:certificates', 'lms', 'Issue Certificates', 'Can issue completion certificates', 0, 1, 0, datetime('now')),
  ('lms:analytics', 'lms', 'View Analytics', 'Can view course analytics', 0, 1, 0, datetime('now')),
  ('lms:purchase_textbooks', 'lms', 'Purchase Textbooks', 'Can purchase course textbooks', 0, 1, 0, datetime('now'));

-- ====================================================================
-- GROUP: STAFF & TEAM MANAGEMENT
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('staff:view', 'staff', 'View Staff', 'Can view staff directory', 0, 0, 0, datetime('now')),
  ('staff:create', 'staff', 'Create Staff', 'Can create new staff accounts', 1, 1, 1, datetime('now')),
  ('staff:edit', 'staff', 'Edit Staff', 'Can edit staff information', 1, 1, 1, datetime('now')),
  ('staff:delete', 'staff', 'Delete Staff', 'Can delete staff accounts', 1, 1, 1, datetime('now')),
  ('staff:roles', 'staff', 'Manage Roles', 'Can assign roles to staff', 1, 1, 1, datetime('now')),
  ('staff:permissions', 'staff', 'Manage Permissions', 'Can grant/revoke permissions', 1, 1, 1, datetime('now')),
  ('staff:schedule', 'staff', 'Manage Schedules', 'Can manage staff schedules', 0, 1, 0, datetime('now'));

-- ====================================================================
-- GROUP: COMPLIANCE & CERTIFICATIONS
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('compliance:view', 'compliance', 'View Compliance', 'Can view compliance status', 0, 0, 0, datetime('now')),
  ('compliance:certificates', 'compliance', 'Manage Certificates', 'Can manage compliance certificates', 1, 1, 1, datetime('now')),
  ('compliance:ptin', 'compliance', 'PTIN Management', 'Can manage PTIN requirements', 1, 1, 1, datetime('now')),
  ('compliance:efin', 'compliance', 'EFIN Management', 'Can manage EFIN credentials', 1, 1, 1, datetime('now')),
  ('compliance:ce_credits', 'compliance', 'CE Credits', 'Can track continuing education', 0, 1, 0, datetime('now')),
  ('compliance:audits', 'compliance', 'Compliance Audits', 'Can perform compliance audits', 1, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: REPORTING & ANALYTICS
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('reports:view_own', 'reports', 'View Own Reports', 'Can view own reports', 0, 0, 0, datetime('now')),
  ('reports:generate', 'reports', 'Generate Reports', 'Can generate standard reports', 0, 1, 0, datetime('now')),
  ('reports:custom', 'reports', 'Custom Reports', 'Can create custom reports', 0, 1, 0, datetime('now')),
  ('reports:export', 'reports', 'Export Reports', 'Can export report data', 0, 1, 1, datetime('now')),
  ('reports:financial', 'reports', 'Financial Reports', 'Can view financial reports', 0, 1, 1, datetime('now')),
  ('analytics:view', 'analytics', 'View Analytics', 'Can view analytics dashboards', 0, 1, 0, datetime('now')),
  ('analytics:advanced', 'analytics', 'Advanced Analytics', 'Can access advanced analytics', 0, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: SYSTEM ADMINISTRATION
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('system:settings', 'system', 'System Settings', 'Can modify system settings', 1, 1, 1, datetime('now')),
  ('system:backup', 'system', 'Backup System', 'Can create system backups', 1, 1, 1, datetime('now')),
  ('system:restore', 'system', 'Restore System', 'Can restore from backups', 1, 1, 1, datetime('now')),
  ('system:logs', 'system', 'View System Logs', 'Can view system logs', 0, 1, 1, datetime('now')),
  ('system:audit', 'system', 'Audit Logs', 'Can view audit logs', 0, 1, 1, datetime('now')),
  ('system:database', 'system', 'Database Access', 'Can access database directly', 1, 1, 1, datetime('now')),
  ('system:api_keys', 'system', 'API Keys', 'Can manage API keys', 1, 1, 1, datetime('now')),
  ('system:environment', 'system', 'Environment Config', 'Can modify environment variables', 1, 1, 1, datetime('now')),
  ('system:maintenance', 'system', 'Maintenance Mode', 'Can enable maintenance mode', 1, 1, 1, datetime('now'));

-- ====================================================================
-- GROUP: INTEGRATIONS & APIS
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('integration:docusign', 'integrations', 'DocuSign', 'Can use DocuSign integration', 0, 1, 0, datetime('now')),
  ('integration:mailchannels', 'integrations', 'Email Service', 'Can send emails via MailChannels', 0, 1, 0, datetime('now')),
  ('integration:stripe', 'integrations', 'Stripe Payments', 'Can process Stripe payments', 0, 1, 1, datetime('now')),
  ('integration:plaid', 'integrations', 'Plaid Banking', 'Can use Plaid bank connections', 0, 1, 1, datetime('now')),
  ('integration:social_media', 'integrations', 'Social Media', 'Can post to social media', 0, 1, 0, datetime('now')),
  ('integration:google_business', 'integrations', 'Google Business', 'Can manage Google Business', 0, 1, 0, datetime('now')),
  ('api:create_key', 'api', 'Create API Key', 'Can create API keys', 1, 1, 1, datetime('now')),
  ('api:revoke_key', 'api', 'Revoke API Key', 'Can revoke API keys', 1, 1, 1, datetime('now')),
  ('api:view_usage', 'api', 'View API Usage', 'Can view API usage stats', 0, 1, 0, datetime('now'));

-- ====================================================================
-- GROUP: NOTIFICATIONS & COMMUNICATIONS
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('notifications:receive', 'notifications', 'Receive Notifications', 'Can receive system notifications', 0, 0, 0, datetime('now')),
  ('notifications:send', 'notifications', 'Send Notifications', 'Can send notifications to users', 0, 1, 0, datetime('now')),
  ('notifications:broadcast', 'notifications', 'Broadcast', 'Can broadcast to all users', 1, 1, 1, datetime('now')),
  ('email:send_client', 'email', 'Email Clients', 'Can send emails to clients', 0, 1, 0, datetime('now')),
  ('email:send_all', 'email', 'Email All', 'Can send emails to all users', 1, 1, 1, datetime('now')),
  ('sms:send', 'sms', 'Send SMS', 'Can send SMS messages', 0, 1, 0, datetime('now'));

-- ====================================================================
-- GROUP: AVALON TAX CALCULATIONS
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('avalon:calculate', 'avalon', 'Calculate Taxes', 'Can use Avalon tax calculator', 0, 1, 0, datetime('now')),
  ('avalon:advanced', 'avalon', 'Advanced Calculations', 'Can use advanced tax features', 0, 1, 0, datetime('now')),
  ('avalon:override', 'avalon', 'Override Calculations', 'Can override calculated values', 1, 1, 1, datetime('now')),
  ('avalon:multistate', 'avalon', 'Multi-State Calculations', 'Can calculate multi-state taxes', 0, 1, 0, datetime('now')),
  ('avalon:credits', 'avalon', 'Tax Credits', 'Can calculate tax credits', 0, 1, 0, datetime('now'));

-- ====================================================================
-- GROUP: PORTAL & UI FEATURES
-- ====================================================================
INSERT OR IGNORE INTO permissions (permission_key, permission_group, permission_name, description, requires_mfa, audit_required, is_sensitive, created_at) VALUES
  ('portal:access', 'portal', 'Portal Access', 'Can access client portal', 0, 0, 0, datetime('now')),
  ('portal:dashboard', 'portal', 'Dashboard Access', 'Can view dashboard', 0, 0, 0, datetime('now')),
  ('portal:settings', 'portal', 'Portal Settings', 'Can modify portal settings', 0, 1, 0, datetime('now')),
  ('ui:admin_panel', 'ui', 'Admin Panel', 'Can access admin panel', 0, 1, 1, datetime('now')),
  ('ui:advanced_features', 'ui', 'Advanced Features', 'Can access advanced UI features', 0, 0, 0, datetime('now'));

-- ====================================================================
-- ASSIGN PERMISSIONS TO ROLES
-- ====================================================================

-- CLIENT ROLE PERMISSIONS (Level 1)
INSERT OR IGNORE INTO role_permissions (role_name, permission_key, granted_at) SELECT 'client', permission_key, datetime('now') FROM permissions WHERE permission_key IN (
  'auth:login', 'auth:logout', 'auth:mfa_setup', 'auth:mfa_verify', 'auth:password_change',
  'account:view_own', 'account:edit_own',
  'efile:create_own', 'efile:view_own', 'efile:edit_own', 'efile:submit', 'efile:status_check',
  'clients:view_own',
  'documents:upload_own', 'documents:view_own', 'documents:delete_own', 'documents:download',
  'services:view', 'services:request', 'services:view_own',
  'bookkeeping:view_own',
  'invoicing:view_own',
  'payments:process',
  'refunds:track_own',
  'lms:view_catalog', 'lms:enroll', 'lms:view_own', 'lms:complete', 'lms:purchase_textbooks',
  'reports:view_own',
  'notifications:receive',
  'portal:access', 'portal:dashboard'
);

-- PREPARER ROLE PERMISSIONS (Level 2) - Inherits Client + Additional
INSERT OR IGNORE INTO role_permissions (role_name, permission_key, granted_at) SELECT 'preparer', permission_key, datetime('now') FROM permissions WHERE permission_key IN (
  -- All client permissions
  'auth:login', 'auth:logout', 'auth:mfa_setup', 'auth:mfa_verify', 'auth:password_change',
  'account:view_own', 'account:edit_own',
  -- Preparer-specific permissions
  'efile:create', 'efile:view_all', 'efile:edit_all', 'efile:submit', 'efile:reject_handling', 'efile:amend', 'efile:extension', 'efile:status_check',
  'clients:create', 'clients:view_all', 'clients:edit', 'clients:merge',
  'crm:intakes', 'crm:notes', 'crm:communications',
  'documents:upload_all', 'documents:view_all', 'documents:download', 'documents:share',
  'services:view', 'services:request', 'services:view_all', 'services:assign',
  'bookkeeping:create', 'bookkeeping:edit', 'bookkeeping:reconcile', 'bookkeeping:reports',
  'invoicing:create', 'invoicing:edit', 'invoicing:send', 'invoicing:view_all',
  'payments:view_all',
  'refunds:track_all', 'refunds:update_status',
  'lms:view_catalog', 'lms:enroll', 'lms:view_own', 'lms:complete', 'lms:certificates',
  'staff:view',
  'compliance:view', 'compliance:ptin', 'compliance:ce_credits',
  'reports:generate', 'reports:custom', 'reports:export',
  'analytics:view',
  'notifications:receive', 'notifications:send',
  'email:send_client',
  'avalon:calculate', 'avalon:advanced', 'avalon:multistate', 'avalon:credits',
  'portal:access', 'portal:dashboard', 'portal:settings'
);

-- ERO ROLE PERMISSIONS (Level 3) - Inherits Preparer + Additional
INSERT OR IGNORE INTO role_permissions (role_name, permission_key, granted_at) SELECT 'ero', permission_key, datetime('now') FROM permissions WHERE permission_key LIKE 'efile:%' 
  OR permission_key LIKE 'mef:%' 
  OR permission_key LIKE 'clients:%'
  OR permission_key LIKE 'services:%'
  OR permission_key LIKE 'staff:%'
  OR permission_key LIKE 'compliance:%'
  OR permission_key LIKE 'integration:%'
  OR permission_key LIKE 'reports:%'
  OR permission_key LIKE 'analytics:%'
  OR permission_key LIKE 'notifications:%'
  OR permission_key LIKE 'email:%'
  OR permission_key IN (
    'auth:login', 'auth:logout', 'auth:mfa_setup', 'auth:mfa_verify', 'auth:password_change',
    'account:view_all', 'account:edit_all',
    'documents:view_all', 'documents:delete_all', 'documents:download', 'documents:share',
    'bookkeeping:delete', 'bookkeeping:export',
    'invoicing:delete', 'payments:refund', 'payments:configure',
    'refunds:bank_products',
    'lms:create_courses', 'lms:edit_courses', 'lms:analytics',
    'system:logs', 'system:audit',
    'api:view_usage',
    'avalon:override',
    'portal:access', 'portal:dashboard', 'ui:admin_panel'
  );

-- ADMIN ROLE PERMISSIONS (Level 4) - Near-Complete Access
INSERT OR IGNORE INTO role_permissions (role_name, permission_key, granted_at) SELECT 'admin', permission_key, datetime('now') FROM permissions WHERE permission_key NOT LIKE 'system:restore' AND permission_key NOT LIKE 'system:database';

-- OWNER ROLE PERMISSIONS (Level 5) - Complete Access
INSERT OR IGNORE INTO role_permissions (role_name, permission_key, granted_at) SELECT 'owner', permission_key, datetime('now') FROM permissions;

-- ====================================================================
-- FEATURE FLAGS (Enable/Disable Features)
-- ====================================================================
INSERT OR IGNORE INTO feature_flags (feature_key, feature_name, is_enabled, min_role_level, environment, rollout_percentage, updated_at) VALUES
  ('efile_transmission', 'E-File Transmission', 1, 2, 'production', 100, datetime('now')),
  ('mef_production', 'MeF Production Mode', 1, 3, 'production', 100, datetime('now')),
  ('diy_efile', 'DIY E-File Wizard', 1, 1, 'production', 100, datetime('now')),
  ('lms_platform', 'Learning Management System', 1, 1, 'production', 100, datetime('now')),
  ('bookkeeping_module', 'Bookkeeping Module', 1, 2, 'production', 100, datetime('now')),
  ('payment_processing', 'Payment Processing', 1, 1, 'production', 100, datetime('now')),
  ('docusign_integration', 'DocuSign Integration', 1, 2, 'production', 100, datetime('now')),
  ('social_media', 'Social Media Integration', 1, 3, 'production', 100, datetime('now')),
  ('advanced_reporting', 'Advanced Reporting', 1, 2, 'production', 100, datetime('now')),
  ('multi_state_filing', 'Multi-State Filing', 1, 2, 'production', 100, datetime('now')),
  ('bulk_operations', 'Bulk Operations', 0, 3, 'staging', 50, datetime('now')),
  ('ai_assistant', 'AI Tax Assistant', 0, 1, 'beta', 25, datetime('now'));

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_effective ON user_roles(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_permissions_group ON permissions(permission_group);
CREATE INDEX IF NOT EXISTS idx_permissions_sensitive ON permissions(is_sensitive);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- ====================================================================
-- AUDIT TRIGGER: Log all role assignments
-- ====================================================================
CREATE TRIGGER IF NOT EXISTS audit_role_assignment
AFTER INSERT ON user_roles
BEGIN
  INSERT INTO audit_logs (action, user_id, resource_type, resource_id, details, timestamp)
  VALUES (
    'role_assigned',
    NEW.assigned_by,
    'user_role',
    NEW.user_id,
    json_object('role', NEW.role_name, 'reason', NEW.assignment_reason),
    datetime('now')
  );
END;

-- ====================================================================
-- AUDIT TRIGGER: Log permission grants
-- ====================================================================
CREATE TRIGGER IF NOT EXISTS audit_permission_grant
AFTER INSERT ON role_permissions
BEGIN
  INSERT INTO audit_logs (action, resource_type, resource_id, details, timestamp)
  VALUES (
    'permission_granted',
    'role',
    NEW.role_name,
    json_object('permission', NEW.permission_key, 'granted_by', NEW.granted_by),
    datetime('now')
  );
END;

-- ====================================================================
-- END OF RBAC SCHEMA
-- ====================================================================
