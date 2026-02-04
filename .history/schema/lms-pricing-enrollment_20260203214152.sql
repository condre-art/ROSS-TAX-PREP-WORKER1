-- ROSS TAX ACADEMY - PRICING & ENROLLMENT SCHEMA
-- Comprehensive tuition, bundles, enrollment agreements, and payment tracking

-- ============================================================================
-- TUITION PRICING & BUNDLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_tuition_pricing (
  id TEXT PRIMARY KEY,
  program_code TEXT NOT NULL, -- 'cert1', 'cert2', 'tax-practitioner', 'audit-agent', 'ea-prep'
  program_name TEXT NOT NULL,
  tuition_amount REAL NOT NULL,
  enrollment_fee REAL DEFAULT 0,
  materials_fee REAL DEFAULT 0,
  total_price REAL NOT NULL, -- tuition + enrollment + materials
  payment_plan_available INTEGER DEFAULT 1,
  payment_plan_down_payment REAL, -- Required down payment
  payment_plan_installments INTEGER, -- Number of installments
  effective_date TEXT NOT NULL, -- When this price takes effect
  price_lock_policy TEXT NOT NULL, -- Price lock terms
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'upcoming')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Bundle pricing (multiple programs)
CREATE TABLE IF NOT EXISTS lms_bundle_pricing (
  id TEXT PRIMARY KEY,
  bundle_code TEXT UNIQUE NOT NULL, -- 'tax-pro-bundle', 'practitioner-track', 'ea-track'
  bundle_name TEXT NOT NULL,
  bundle_description TEXT,
  included_programs TEXT NOT NULL, -- JSON array of program codes
  bundle_price REAL NOT NULL,
  individual_price_total REAL NOT NULL, -- Sum of individual prices
  savings_amount REAL NOT NULL, -- individual_price_total - bundle_price
  payment_plan_available INTEGER DEFAULT 1,
  payment_plan_down_payment REAL,
  payment_plan_installments INTEGER,
  effective_date TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STUDENT ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_enrollments (
  id TEXT PRIMARY KEY,
  student_id INTEGER NOT NULL, -- References clients table
  enrollment_type TEXT NOT NULL CHECK(enrollment_type IN ('single', 'bundle')),
  program_code TEXT, -- For single enrollment
  bundle_code TEXT, -- For bundle enrollment
  
  -- Pricing snapshot (locked at enrollment)
  tuition_locked REAL NOT NULL,
  enrollment_fee_locked REAL DEFAULT 0,
  materials_fee_locked REAL DEFAULT 0,
  total_price_locked REAL NOT NULL,
  
  -- Payment info
  payment_method TEXT NOT NULL, -- 'full', 'payment-plan'
  payment_plan_down_payment REAL,
  payment_plan_installments INTEGER,
  payment_plan_interval TEXT, -- 'weekly', 'biweekly', 'monthly'
  
  -- Enrollment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed', 'withdrawn', 'suspended')),
  enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
  access_granted_at TEXT,
  completion_date TEXT,
  withdrawn_at TEXT,
  
  -- Enrollment agreement
  agreement_signed INTEGER DEFAULT 0,
  agreement_docusign_envelope_id TEXT,
  agreement_signed_at TEXT,
  
  -- Refund tracking
  refund_eligible INTEGER DEFAULT 1,
  refund_requested_at TEXT,
  refund_processed_at TEXT,
  refund_amount REAL,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_enrollments_student ON lms_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_status ON lms_enrollments(status);

-- ============================================================================
-- ENROLLMENT DETAILS (Student Information & Acknowledgments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_enrollment_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  dob TEXT,
  start_date TEXT,
  
  -- Textbook Selection
  textbook_format TEXT CHECK(textbook_format IN ('physical', 'ebook', 'bundled')),
  textbook_access_code TEXT, -- Generated after purchase
  textbook_access_granted_at TEXT,
  
  -- Compliance Acknowledgments (Seven Required)
  acknowledgment_policies INTEGER DEFAULT 0,
  acknowledgment_conduct INTEGER DEFAULT 0,
  acknowledgment_accreditation INTEGER DEFAULT 0,
  acknowledgment_financial_aid INTEGER DEFAULT 0,
  acknowledgment_identity INTEGER DEFAULT 0,
  acknowledgment_data INTEGER DEFAULT 0,
  acknowledgment_absence INTEGER DEFAULT 0,
  all_acknowledgments_accepted_at TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (enrollment_id) REFERENCES lms_enrollments(id)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_details_enrollment ON lms_enrollment_details(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_details_email ON lms_enrollment_details(email);

-- ============================================================================
-- PAYMENT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_payments (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- Payment details
  payment_type TEXT NOT NULL CHECK(payment_type IN ('down-payment', 'installment', 'full-payment', 'refund')),
  amount REAL NOT NULL,
  due_date TEXT,
  paid_at TEXT,
  
  -- Payment method & gateway
  payment_method TEXT, -- 'card', 'ach', 'eft', 'afterpay', 'zelle', 'cashapp', 'cash', 'barcode'
  payment_gateway TEXT, -- 'stripe', 'square', 'plaid', 'afterpay', 'manual'
  transaction_id TEXT,
  gateway_reference TEXT,
  
  -- Barcode payment (for Walgreens, CVS, etc.)
  barcode_number TEXT,
  barcode_type TEXT, -- 'code128', 'upca', 'ean13'
  barcode_expires_at TEXT,
  barcode_image_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Failure tracking
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (enrollment_id) REFERENCES lms_enrollments(id),
  FOREIGN KEY (student_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_payments_enrollment ON lms_payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lms_payments_student ON lms_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_payments_status ON lms_payments(status);
CREATE INDEX IF NOT EXISTS idx_lms_payments_due_date ON lms_payments(due_date);

-- ============================================================================
-- ENROLLMENT AGREEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_enrollment_agreements (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- Agreement content
  agreement_type TEXT NOT NULL DEFAULT 'enrollment', -- 'enrollment', 'payment-plan', 'refund-waiver'
  agreement_version TEXT NOT NULL, -- e.g., 'v2025.1'
  agreement_html TEXT NOT NULL, -- Full HTML agreement text
  agreement_pdf_url TEXT, -- Stored PDF copy
  
  -- DocuSign integration
  docusign_envelope_id TEXT,
  docusign_status TEXT, -- 'sent', 'delivered', 'signed', 'completed', 'voided'
  docusign_sent_at TEXT,
  docusign_signed_at TEXT,
  docusign_completed_at TEXT,
  
  -- Signature tracking
  signed INTEGER DEFAULT 0,
  signed_at TEXT,
  signed_ip_address TEXT,
  signed_user_agent TEXT,
  
  -- Terms agreed to
  terms_version TEXT NOT NULL,
  price_lock_acknowledged INTEGER DEFAULT 0,
  refund_policy_acknowledged INTEGER DEFAULT 0,
  irs_disclaimer_acknowledged INTEGER DEFAULT 0,
  state_compliance_acknowledged INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (enrollment_id) REFERENCES lms_enrollments(id),
  FOREIGN KEY (student_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_agreements_enrollment ON lms_enrollment_agreements(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lms_agreements_docusign ON lms_enrollment_agreements(docusign_envelope_id);

-- ============================================================================
-- REFUND REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_refund_requests (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- Request details
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  
  -- Refund calculation
  tuition_paid REAL NOT NULL,
  refundable_amount REAL NOT NULL,
  administrative_fee REAL DEFAULT 0,
  net_refund REAL NOT NULL,
  
  -- Eligibility
  within_cancellation_window INTEGER, -- Within 3 business days?
  course_access_granted INTEGER, -- Has student accessed LMS?
  coursework_commenced INTEGER, -- Has student started coursework?
  refund_eligible INTEGER NOT NULL,
  ineligibility_reason TEXT,
  
  -- Processing
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'denied', 'processed')),
  approved_at TEXT,
  denied_at TEXT,
  processed_at TEXT,
  refund_transaction_id TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (enrollment_id) REFERENCES lms_enrollments(id),
  FOREIGN KEY (student_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_refunds_enrollment ON lms_refund_requests(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lms_refunds_status ON lms_refund_requests(status);

-- ============================================================================
-- PAYMENT GATEWAY CREDENTIALS (Encrypted)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_gateway_credentials (
  id TEXT PRIMARY KEY,
  gateway_name TEXT UNIQUE NOT NULL, -- 'stripe', 'square', 'plaid', 'afterpay'
  encrypted_api_key TEXT NOT NULL,
  encrypted_secret_key TEXT,
  encrypted_webhook_secret TEXT,
  
  -- Gateway config
  is_live INTEGER DEFAULT 0, -- 0 = test mode, 1 = live mode
  currency TEXT DEFAULT 'USD',
  
  -- Status
  enabled INTEGER DEFAULT 1,
  last_tested_at TEXT,
  last_error TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BARCODE PAYMENTS (CVS, Walgreens, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_barcode_payments (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  enrollment_id TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- Barcode details
  barcode_number TEXT UNIQUE NOT NULL, -- Unique barcode ID
  barcode_type TEXT NOT NULL DEFAULT 'code128', -- 'code128', 'upca', 'ean13'
  barcode_image_url TEXT, -- URL to barcode image (for display)
  
  -- Payment details
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Retail partner
  retail_partner TEXT, -- 'walgreens', 'cvs', 'walmart', 'any'
  retail_location TEXT, -- Specific store, if applicable
  
  -- Expiration
  expires_at TEXT NOT NULL, -- Barcode expiration date
  
  -- Payment tracking
  paid_at TEXT,
  payment_confirmed_at TEXT,
  payment_reference TEXT, -- Retail transaction reference
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'expired', 'cancelled')),
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (payment_id) REFERENCES lms_payments(id),
  FOREIGN KEY (enrollment_id) REFERENCES lms_enrollments(id),
  FOREIGN KEY (student_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_barcode_payment ON lms_barcode_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_lms_barcode_number ON lms_barcode_payments(barcode_number);
CREATE INDEX IF NOT EXISTS idx_lms_barcode_status ON lms_barcode_payments(status);

-- ============================================================================
-- SEED TUITION PRICING DATA
-- ============================================================================

-- Tax Professional Certificate - Level 1
INSERT OR IGNORE INTO lms_tuition_pricing (
  id, program_code, program_name, tuition_amount, enrollment_fee, materials_fee, total_price,
  payment_plan_available, payment_plan_down_payment, payment_plan_installments,
  effective_date, price_lock_policy, status
) VALUES (
  'price-cert1-2026', 'cert1', 'Tax Professional Certificate - Level 1',
  599.00, 0, 50.00, 649.00,
  1, 149.00, 4,
  '2026-01-01', 'Tuition rates are locked at the time of enrollment. Once a student enrolls and submits payment or enters into an approved payment arrangement, the tuition price for that program will not increase for the duration of the enrolled course.',
  'active'
);

-- Tax Professional Certificate - Level 2
INSERT OR IGNORE INTO lms_tuition_pricing (
  id, program_code, program_name, tuition_amount, enrollment_fee, materials_fee, total_price,
  payment_plan_available, payment_plan_down_payment, payment_plan_installments,
  effective_date, price_lock_policy, status
) VALUES (
  'price-cert2-2026', 'cert2', 'Tax Professional Certificate - Level 2',
  849.00, 0, 75.00, 924.00,
  1, 224.00, 4,
  '2026-01-01', 'Tuition rates are locked at the time of enrollment. Once a student enrolls and submits payment or enters into an approved payment arrangement, the tuition price for that program will not increase for the duration of the enrolled course.',
  'active'
);

-- Tax Practitioner Certificate
INSERT OR IGNORE INTO lms_tuition_pricing (
  id, program_code, program_name, tuition_amount, enrollment_fee, materials_fee, total_price,
  payment_plan_available, payment_plan_down_payment, payment_plan_installments,
  effective_date, price_lock_policy, status
) VALUES (
  'price-tax-practitioner-2026', 'tax-practitioner', 'Tax Practitioner Certificate',
  1199.00, 0, 100.00, 1299.00,
  1, 324.00, 5,
  '2026-01-01', 'Tuition rates are locked at the time of enrollment. Once a student enrolls and submits payment or enters into an approved payment arrangement, the tuition price for that program will not increase for the duration of the enrolled course.',
  'active'
);

-- Audit Agent Certificate
INSERT OR IGNORE INTO lms_tuition_pricing (
  id, program_code, program_name, tuition_amount, enrollment_fee, materials_fee, total_price,
  payment_plan_available, payment_plan_down_payment, payment_plan_installments,
  effective_date, price_lock_policy, status
) VALUES (
  'price-audit-agent-2026', 'audit-agent', 'Audit Agent Certificate',
  1499.00, 0, 125.00, 1624.00,
  1, 405.00, 5,
  '2026-01-01', 'Tuition rates are locked at the time of enrollment. Once a student enrolls and submits payment or enters into an approved payment arrangement, the tuition price for that program will not increase for the duration of the enrolled course.',
  'active'
);

-- EA / UEA Exam Preparation Course
INSERT OR IGNORE INTO lms_tuition_pricing (
  id, program_code, program_name, tuition_amount, enrollment_fee, materials_fee, total_price,
  payment_plan_available, payment_plan_down_payment, payment_plan_installments,
  effective_date, price_lock_policy, status
) VALUES (
  'price-ea-prep-2026', 'ea-prep', 'EA / UEA Exam Preparation Course',
  1799.00, 0, 150.00, 1949.00,
  1, 487.00, 6,
  '2026-01-01', 'Tuition rates are locked at the time of enrollment. Once a student enrolls and submits payment or enters into an approved payment arrangement, the tuition price for that program will not increase for the duration of the enrolled course.',
  'active'
);

-- ============================================================================
-- SEED BUNDLE PRICING DATA
-- ============================================================================

-- Tax Professional Certification Bundle (Cert 1 + Cert 2)
INSERT OR IGNORE INTO lms_bundle_pricing (
  id, bundle_code, bundle_name, bundle_description,
  included_programs, bundle_price, individual_price_total, savings_amount,
  payment_plan_available, payment_plan_down_payment, payment_plan_installments,
  effective_date, status
) VALUES (
  'bundle-tax-pro-2026', 'tax-pro-bundle', 'Tax Professional Certification Bundle',
  'Complete foundational and advanced individual tax preparation training. Includes Tax Professional Certificate Level 1 and Level 2.',
  '["cert1", "cert2"]', 1399.00, 1573.00, 174.00,
  1, 349.00, 5,
  '2026-01-01', 'active'
);

-- Tax Practitioner Career Track (Cert 1 + Cert 2 + Tax Practitioner)
INSERT OR IGNORE INTO lms_bundle_pricing (
  id, bundle_code, bundle_name, bundle_description,
  included_programs, bundle_price, individual_price_total, savings_amount,
  payment_plan_available, payment_plan_down_payment, payment_plan_installments,
  effective_date, status
) VALUES (
  'bundle-practitioner-track-2026', 'practitioner-track', 'Tax Practitioner Career Track',
  'Complete pathway to professional tax practice. Includes Tax Professional Certificates Level 1 & 2 plus Tax Practitioner Certificate.',
  '["cert1", "cert2", "tax-practitioner"]', 2299.00, 2872.00, 573.00,
  1, 575.00, 6,
  '2026-01-01', 'active'
);

-- EA / IRS Representation Track (All 4 programs + EA Prep)
INSERT OR IGNORE INTO lms_bundle_pricing (
  id, bundle_code, bundle_name, bundle_description,
  included_programs, bundle_price, individual_price_total, savings_amount,
  payment_plan_available, payment_plan_down_payment, payment_plan_installments,
  effective_date, status
) VALUES (
  'bundle-ea-track-2026', 'ea-track', 'EA / IRS Representation Track',
  'Comprehensive IRS representation preparation. Includes all four certificate programs plus EA/UEA Exam Preparation Course.',
  '["cert1", "cert2", "tax-practitioner", "audit-agent", "ea-prep"]', 3499.00, 5445.00, 1946.00,
  1, 875.00, 8,
  '2026-01-01', 'active'
);
