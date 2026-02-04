-- ============================================================================
-- ROSS TAX & BOOKKEEPING - STAFF ACCESS MANAGEMENT & SEAT LICENSING
-- TaxSlayer Pro Integration + IRS Pub 4557 Compliance
-- ============================================================================

-- ============================================================================
-- FIRM PROFILE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS firm_profile (
    firm_id INTEGER PRIMARY KEY AUTOINCREMENT,
    firm_name TEXT NOT NULL DEFAULT 'ROSS Tax Prep & Bookkeeping',
    efin TEXT UNIQUE NOT NULL,
    efin_status TEXT CHECK(efin_status IN ('pending', 'approved', 'active', 'suspended', 'revoked')) DEFAULT 'active',
    efin_approved_date TEXT,
    efin_expiration_date TEXT,
    firm_status TEXT CHECK(firm_status IN ('inactive', 'active', 'suspended')) DEFAULT 'active',
    owner_user_id INTEGER,
    business_structure TEXT CHECK(business_structure IN ('sole_proprietor', 'llc', 'corporation', 's_corp', 'partnership')),
    tax_id_ein TEXT,
    ptin TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Insert default firm profile (Ross Tax & Bookkeeping)
INSERT OR IGNORE INTO firm_profile (
    firm_name, 
    efin, 
    efin_status, 
    firm_status,
    business_structure,
    state
) VALUES (
    'ROSS Tax Prep & Bookkeeping',
    'EFIN_PLACEHOLDER',
    'active',
    'active',
    'llc',
    'TX'
);

-- ============================================================================
-- SOFTWARE SEATS / LICENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS software_seats (
    seat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    firm_id INTEGER NOT NULL DEFAULT 1,
    seat_license_key TEXT UNIQUE,
    seat_type TEXT CHECK(seat_type IN ('full', 'preparer', 'reviewer', 'assistant', 'seasonal')) NOT NULL,
    purchase_date TEXT NOT NULL,
    activation_date TEXT,
    expiration_date TEXT,
    renewal_date TEXT,
    seat_status TEXT CHECK(seat_status IN ('available', 'assigned', 'suspended', 'expired')) DEFAULT 'available',
    assigned_user_id INTEGER,
    assigned_date TEXT,
    cost_amount REAL,
    billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'annual', 'seasonal', 'lifetime')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (firm_id) REFERENCES firm_profile(firm_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Insert default owner seat
INSERT OR IGNORE INTO software_seats (
    firm_id,
    seat_license_key,
    seat_type,
    purchase_date,
    activation_date,
    seat_status,
    billing_cycle,
    cost_amount
) VALUES (
    1,
    'SEAT-OWNER-001',
    'full',
    date('now'),
    date('now'),
    'available',
    'annual',
    0.00
);

CREATE INDEX IF NOT EXISTS idx_seats_firm ON software_seats(firm_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON software_seats(seat_status);
CREATE INDEX IF NOT EXISTS idx_seats_assigned_user ON software_seats(assigned_user_id);

-- ============================================================================
-- STAFF MEMBERS TABLE (Extended user management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_members (
    staff_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    firm_id INTEGER NOT NULL DEFAULT 1,
    employee_id TEXT UNIQUE,
    
    -- Employment Details
    employment_type TEXT CHECK(employment_type IN ('full_time', 'part_time', 'seasonal', 'contractor', 'owner')) NOT NULL,
    hire_date TEXT NOT NULL,
    termination_date TEXT,
    employment_status TEXT CHECK(employment_status IN ('active', 'inactive', 'suspended', 'terminated')) DEFAULT 'active',
    
    -- Seasonal Access (if applicable)
    is_seasonal BOOLEAN DEFAULT 0,
    seasonal_start_date TEXT,
    seasonal_end_date TEXT,
    seasonal_max_access_date TEXT DEFAULT '2026-04-30',
    
    -- TaxSlayer Pro Role
    taxslayer_role TEXT CHECK(taxslayer_role IN (
        'firm_administrator',
        'office_administrator', 
        'preparer',
        'reviewer',
        'assistant'
    )),
    taxslayer_username TEXT UNIQUE,
    taxslayer_user_id TEXT,
    
    -- Software Seat Assignment
    assigned_seat_id INTEGER,
    seat_assigned_date TEXT,
    
    -- Compliance Documents
    nda_signed BOOLEAN DEFAULT 0,
    nda_signed_date TEXT,
    engagement_agreement_signed BOOLEAN DEFAULT 0,
    engagement_agreement_date TEXT,
    background_check_completed BOOLEAN DEFAULT 0,
    background_check_date TEXT,
    background_check_status TEXT CHECK(background_check_status IN ('pending', 'passed', 'failed', 'not_required')),
    
    -- Access Restrictions
    can_transmit_returns BOOLEAN DEFAULT 0,
    can_access_bank_products BOOLEAN DEFAULT 0,
    can_view_firm_reports BOOLEAN DEFAULT 0,
    can_access_admin_panel BOOLEAN DEFAULT 0,
    access_level TEXT CHECK(access_level IN ('full', 'limited', 'read_only')) DEFAULT 'limited',
    
    -- Contact Info
    work_email TEXT,
    work_phone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    
    -- Audit Trail
    created_by INTEGER,
    approved_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (firm_id) REFERENCES firm_profile(firm_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_seat_id) REFERENCES software_seats(seat_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_user ON staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_firm ON staff_members(firm_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff_members(employment_status);
CREATE INDEX IF NOT EXISTS idx_staff_seasonal ON staff_members(is_seasonal);

-- ============================================================================
-- STAFF ACCESS REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_access_requests (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_number TEXT UNIQUE NOT NULL,
    
    -- Request Details
    requested_for_user_id INTEGER,
    requested_for_name TEXT NOT NULL,
    requested_for_email TEXT NOT NULL,
    requested_role TEXT NOT NULL,
    requested_access_level TEXT CHECK(requested_access_level IN ('full', 'limited', 'read_only')) NOT NULL,
    access_duration_type TEXT CHECK(access_duration_type IN ('permanent', 'seasonal', 'temporary', 'project_based')),
    access_start_date TEXT NOT NULL,
    access_end_date TEXT,
    
    -- Business Justification
    business_justification TEXT NOT NULL,
    department TEXT,
    reports_to_user_id INTEGER,
    expected_workload TEXT,
    
    -- Request Management
    request_status TEXT CHECK(request_status IN ('pending', 'under_review', 'approved', 'denied', 'cancelled')) DEFAULT 'pending',
    requested_by INTEGER NOT NULL,
    requested_date TEXT DEFAULT (datetime('now')),
    reviewed_by INTEGER,
    reviewed_date TEXT,
    approved_by INTEGER,
    approved_date TEXT,
    denial_reason TEXT,
    
    -- Seat Assignment
    requires_seat_purchase BOOLEAN DEFAULT 1,
    seat_purchased BOOLEAN DEFAULT 0,
    seat_assigned_id INTEGER,
    
    -- Compliance Checks
    nda_required BOOLEAN DEFAULT 1,
    nda_completed BOOLEAN DEFAULT 0,
    agreement_required BOOLEAN DEFAULT 1,
    agreement_completed BOOLEAN DEFAULT 0,
    background_check_required BOOLEAN DEFAULT 0,
    background_check_completed BOOLEAN DEFAULT 0,
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (requested_for_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (reports_to_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (seat_assigned_id) REFERENCES software_seats(seat_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status ON staff_access_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_access_requests_requested_by ON staff_access_requests(requested_by);

-- ============================================================================
-- ROLE ALIGNMENT TABLE (TaxSlayer ↔ CRM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_alignment (
    alignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    taxslayer_role TEXT UNIQUE NOT NULL,
    crm_role TEXT NOT NULL,
    system_role_name TEXT NOT NULL,
    role_level INTEGER NOT NULL,
    
    -- Access Permissions
    crm_permissions TEXT NOT NULL, -- JSON array
    can_view_all_clients BOOLEAN DEFAULT 0,
    can_edit_clients BOOLEAN DEFAULT 0,
    can_transmit_returns BOOLEAN DEFAULT 0,
    can_access_billing BOOLEAN DEFAULT 0,
    can_manage_staff BOOLEAN DEFAULT 0,
    
    -- CRM Tags Required
    required_crm_tags TEXT, -- JSON array: ["ROLE:PREPARER", "ACCESS-LEVEL:LIMITED"]
    
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Insert role alignment mappings
INSERT OR IGNORE INTO role_alignment (
    taxslayer_role, crm_role, system_role_name, role_level,
    crm_permissions, can_view_all_clients, can_edit_clients, 
    can_transmit_returns, can_access_billing, can_manage_staff,
    required_crm_tags, description
) VALUES
('firm_administrator', 'OWNER', 'owner', 5, 
 '["full_visibility","billing","contracts","system_admin"]', 
 1, 1, 1, 1, 1,
 '["ROLE:OWNER","ACCESS-LEVEL:FULL","STATUS:ACTIVE"]',
 'Full system access - Firm owner with all permissions'),

('office_administrator', 'OPERATIONS', 'admin', 4,
 '["client_status","workflow","reporting","staff_schedule"]',
 1, 1, 0, 1, 1,
 '["ROLE:OPERATIONS","ACCESS-LEVEL:FULL","STATUS:ACTIVE"]',
 'Operations manager - Client workflow and reporting'),

('preparer', 'TAX-PREPARER', 'preparer', 2,
 '["assigned_clients_only","document_upload","return_creation"]',
 0, 1, 0, 0, 0,
 '["ROLE:PREPARER","ACCESS-LEVEL:LIMITED","STATUS:ACTIVE"]',
 'Tax preparer - Assigned clients only'),

('reviewer', 'QA-REVIEWER', 'ero', 3,
 '["read_only","review_notes","quality_assurance","transmission"]',
 1, 0, 1, 0, 0,
 '["ROLE:REVIEWER","ACCESS-LEVEL:READ-ONLY","STATUS:ACTIVE"]',
 'Quality reviewer - Read-only with review and transmission rights'),

('assistant', 'INTAKE', 'client', 1,
 '["intake_forms_only","no_ssn_access","basic_data_entry"]',
 0, 0, 0, 0, 0,
 '["ROLE:INTAKE","ACCESS-LEVEL:LIMITED","STATUS:ACTIVE"]',
 'Intake assistant - Forms only, no sensitive data');

-- ============================================================================
-- ACCESS AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_access_audit (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    audit_event_type TEXT CHECK(audit_event_type IN (
        'access_granted',
        'access_revoked',
        'access_suspended',
        'role_changed',
        'seat_assigned',
        'seat_unassigned',
        'login_attempt',
        'permission_escalation',
        'compliance_violation',
        'seasonal_expiration',
        'offboarding_complete'
    )) NOT NULL,
    
    event_details TEXT, -- JSON
    previous_value TEXT,
    new_value TEXT,
    
    performed_by INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    
    compliance_flag BOOLEAN DEFAULT 0,
    requires_review BOOLEAN DEFAULT 0,
    
    timestamp TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_access_audit_staff ON staff_access_audit(staff_id);
CREATE INDEX IF NOT EXISTS idx_access_audit_event_type ON staff_access_audit(audit_event_type);
CREATE INDEX IF NOT EXISTS idx_access_audit_timestamp ON staff_access_audit(timestamp);

-- ============================================================================
-- SEASONAL ACCESS TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seasonal_access_tracking (
    tracking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    
    -- Season Details
    tax_season_year INTEGER NOT NULL,
    onboard_date TEXT NOT NULL,
    earliest_allowed_date TEXT DEFAULT '2025-11-01',
    latest_onboard_date TEXT DEFAULT '2026-01-15',
    
    -- Access Period
    access_granted_date TEXT,
    access_expires_date TEXT DEFAULT '2026-04-30',
    extension_requested BOOLEAN DEFAULT 0,
    extension_approved BOOLEAN DEFAULT 0,
    extension_until_date TEXT,
    extension_justification TEXT,
    
    -- Compliance Checklist
    same_day_access_blocked BOOLEAN DEFAULT 1,
    nda_signed BOOLEAN DEFAULT 0,
    engagement_signed BOOLEAN DEFAULT 0,
    background_check_done BOOLEAN DEFAULT 0,
    role_approved BOOLEAN DEFAULT 0,
    seat_purchased BOOLEAN DEFAULT 0,
    
    -- Prohibitions Enforced
    no_admin_access BOOLEAN DEFAULT 1,
    no_transmission_rights BOOLEAN DEFAULT 1,
    no_bank_product_access BOOLEAN DEFAULT 1,
    no_firm_reports_access BOOLEAN DEFAULT 1,
    
    -- Offboarding
    offseason_access_revoked BOOLEAN DEFAULT 0,
    access_revoked_date TEXT,
    rehire_status TEXT CHECK(rehire_status IN ('not_applicable', 'eligible', 'rehired', 'not_rehired')),
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_seasonal_staff ON seasonal_access_tracking(staff_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_year ON seasonal_access_tracking(tax_season_year);

-- ============================================================================
-- STAFF ONBOARDING CHECKLIST TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_onboarding_checklist (
    checklist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    
    -- Pre-Access Phase
    seat_purchased BOOLEAN DEFAULT 0,
    seat_purchased_date TEXT,
    role_approved BOOLEAN DEFAULT 0,
    role_approved_date TEXT,
    role_approved_by INTEGER,
    nda_signed BOOLEAN DEFAULT 0,
    nda_signed_date TEXT,
    agreement_signed BOOLEAN DEFAULT 0,
    agreement_signed_date TEXT,
    crm_role_assigned BOOLEAN DEFAULT 0,
    crm_role_assigned_date TEXT,
    
    -- Active Access Phase
    unique_login_issued BOOLEAN DEFAULT 0,
    login_issued_date TEXT,
    role_matches_duties BOOLEAN DEFAULT 1,
    no_excess_permissions BOOLEAN DEFAULT 1,
    activity_monitored BOOLEAN DEFAULT 1,
    
    -- Offboarding Phase
    access_revoked BOOLEAN DEFAULT 0,
    access_revoked_date TEXT,
    password_reset BOOLEAN DEFAULT 0,
    password_reset_date TEXT,
    crm_status_updated BOOLEAN DEFAULT 0,
    crm_status_updated_date TEXT,
    exit_logged BOOLEAN DEFAULT 0,
    exit_logged_date TEXT,
    
    -- Audit Defense
    can_produce_user_list BOOLEAN DEFAULT 1,
    can_produce_role_assignments BOOLEAN DEFAULT 1,
    can_produce_access_dates BOOLEAN DEFAULT 1,
    can_produce_termination_dates BOOLEAN DEFAULT 1,
    
    checklist_status TEXT CHECK(checklist_status IN ('incomplete', 'in_progress', 'complete')) DEFAULT 'incomplete',
    completion_percentage INTEGER DEFAULT 0,
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_onboarding_staff ON staff_onboarding_checklist(staff_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON staff_onboarding_checklist(checklist_status);

-- ============================================================================
-- SEAT PURCHASE TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seat_purchases (
    purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
    firm_id INTEGER NOT NULL DEFAULT 1,
    
    purchase_order_number TEXT UNIQUE,
    purchase_date TEXT NOT NULL,
    vendor TEXT DEFAULT 'TaxSlayer Pro',
    
    -- Seat Details
    quantity_purchased INTEGER NOT NULL DEFAULT 1,
    seat_type TEXT CHECK(seat_type IN ('full', 'preparer', 'reviewer', 'assistant', 'seasonal')) NOT NULL,
    unit_price REAL NOT NULL,
    total_cost REAL NOT NULL,
    billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'annual', 'seasonal', 'lifetime')),
    
    -- Payment
    payment_method TEXT CHECK(payment_method IN ('credit_card', 'ach', 'wire', 'check', 'invoice')),
    payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
    payment_date TEXT,
    transaction_id TEXT,
    
    -- Assignment
    seats_assigned INTEGER DEFAULT 0,
    seats_available INTEGER,
    
    -- Renewal
    renewal_date TEXT,
    auto_renew BOOLEAN DEFAULT 0,
    
    notes TEXT,
    purchased_by INTEGER,
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (firm_id) REFERENCES firm_profile(firm_id) ON DELETE CASCADE,
    FOREIGN KEY (purchased_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_firm ON seat_purchases(firm_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON seat_purchases(purchase_date);

-- ============================================================================
-- COMPLIANCE VIOLATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS compliance_violations (
    violation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER,
    user_id INTEGER,
    
    violation_type TEXT CHECK(violation_type IN (
        'shared_login',
        'unauthorized_access',
        'missing_audit_trail',
        'excessive_permissions',
        'no_seat_license',
        'expired_credentials',
        'seasonal_overstay',
        'missing_nda',
        'failed_background_check'
    )) NOT NULL,
    
    violation_severity TEXT CHECK(violation_severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    violation_description TEXT NOT NULL,
    
    detected_date TEXT DEFAULT (datetime('now')),
    detected_by TEXT, -- 'system' or user_id
    
    resolved BOOLEAN DEFAULT 0,
    resolved_date TEXT,
    resolved_by INTEGER,
    resolution_notes TEXT,
    
    irs_reportable BOOLEAN DEFAULT 0,
    reported_to_irs BOOLEAN DEFAULT 0,
    report_date TEXT,
    
    FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_violations_staff ON compliance_violations(staff_id);
CREATE INDEX IF NOT EXISTS idx_violations_severity ON compliance_violations(violation_severity);
CREATE INDEX IF NOT EXISTS idx_violations_resolved ON compliance_violations(resolved);

-- ============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

-- Trigger: Log seat assignment
CREATE TRIGGER IF NOT EXISTS log_seat_assignment
AFTER UPDATE OF assigned_user_id ON software_seats
WHEN NEW.assigned_user_id IS NOT NULL
BEGIN
    INSERT INTO staff_access_audit (
        staff_id, user_id, audit_event_type, event_details, new_value, performed_by
    )
    SELECT 
        sm.staff_id,
        NEW.assigned_user_id,
        'seat_assigned',
        json_object('seat_id', NEW.seat_id, 'seat_type', NEW.seat_type),
        NEW.seat_license_key,
        NULL
    FROM staff_members sm
    WHERE sm.user_id = NEW.assigned_user_id;
END;

-- Trigger: Log staff status changes
CREATE TRIGGER IF NOT EXISTS log_staff_status_change
AFTER UPDATE OF employment_status ON staff_members
WHEN OLD.employment_status != NEW.employment_status
BEGIN
    INSERT INTO staff_access_audit (
        staff_id, user_id, audit_event_type, previous_value, new_value
    ) VALUES (
        NEW.staff_id,
        NEW.user_id,
        'role_changed',
        OLD.employment_status,
        NEW.employment_status
    );
END;

-- Trigger: Auto-expire seasonal access
CREATE TRIGGER IF NOT EXISTS check_seasonal_expiration
AFTER UPDATE ON seasonal_access_tracking
WHEN NEW.access_expires_date < date('now') AND NEW.offseason_access_revoked = 0
BEGIN
    UPDATE seasonal_access_tracking
    SET offseason_access_revoked = 1,
        access_revoked_date = date('now')
    WHERE tracking_id = NEW.tracking_id;
    
    UPDATE staff_members
    SET employment_status = 'inactive'
    WHERE staff_id = NEW.staff_id;
    
    INSERT INTO staff_access_audit (
        staff_id, user_id, audit_event_type, event_details
    ) VALUES (
        NEW.staff_id,
        NEW.user_id,
        'seasonal_expiration',
        json_object('expires_date', NEW.access_expires_date, 'auto_revoked', 1)
    );
END;

-- ============================================================================
-- VIEW: Active Staff Summary
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_active_staff_summary AS
SELECT 
    sm.staff_id,
    sm.user_id,
    u.email,
    u.first_name || ' ' || u.last_name AS full_name,
    sm.employment_type,
    sm.taxslayer_role,
    sm.access_level,
    sm.is_seasonal,
    ss.seat_license_key,
    ss.seat_type,
    ra.crm_role,
    sm.employment_status,
    sm.hire_date,
    CASE 
        WHEN sm.is_seasonal = 1 THEN sm.seasonal_end_date
        ELSE NULL
    END AS access_expires,
    sm.nda_signed,
    sm.engagement_agreement_signed,
    sm.background_check_completed
FROM staff_members sm
JOIN users u ON sm.user_id = u.user_id
LEFT JOIN software_seats ss ON sm.assigned_seat_id = ss.seat_id
LEFT JOIN role_alignment ra ON sm.taxslayer_role = ra.taxslayer_role
WHERE sm.employment_status = 'active';

-- ============================================================================
-- VIEW: Seat Utilization
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_seat_utilization AS
SELECT 
    seat_type,
    COUNT(*) AS total_seats,
    SUM(CASE WHEN seat_status = 'assigned' THEN 1 ELSE 0 END) AS seats_assigned,
    SUM(CASE WHEN seat_status = 'available' THEN 1 ELSE 0 END) AS seats_available,
    SUM(CASE WHEN seat_status = 'expired' THEN 1 ELSE 0 END) AS seats_expired,
    ROUND(CAST(SUM(CASE WHEN seat_status = 'assigned' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 2) AS utilization_percentage
FROM software_seats
GROUP BY seat_type;

-- ============================================================================
-- END OF STAFF ACCESS MANAGEMENT SCHEMA
-- ============================================================================
