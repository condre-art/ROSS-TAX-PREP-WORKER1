-- ROSS TAX ACADEMY - CERTIFICATES SCHEMA
-- Certificate generation, verification, and tracking

-- ============================================================================
-- CERTIFICATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_certificates (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  student_name_encrypted TEXT NOT NULL, -- Encrypted full name on certificate
  program_code TEXT NOT NULL,
  program_name TEXT NOT NULL,
  
  -- Certificate details
  certificate_number TEXT UNIQUE NOT NULL, -- Format: RTA-{timestamp}-{random}
  issue_date TEXT NOT NULL,
  completion_date TEXT NOT NULL,
  
  -- Verification
  verification_code TEXT UNIQUE NOT NULL, -- QR code data
  verification_url TEXT NOT NULL, -- https://rosstaxprep.com/verify/{verification_code}
  is_verified INTEGER DEFAULT 1,
  revoked INTEGER DEFAULT 0,
  revoked_at TEXT,
  revoked_reason TEXT,
  
  -- PDF storage
  certificate_pdf_url TEXT, -- R2 bucket URL
  certificate_pdf_key TEXT, -- R2 object key
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT, -- Staff member who issued (if manual)
  
  FOREIGN KEY (enrollment_id) REFERENCES lms_enrollments(id),
  FOREIGN KEY (student_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_certificates_student ON lms_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_certificates_enrollment ON lms_certificates(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lms_certificates_verification ON lms_certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_lms_certificates_number ON lms_certificates(certificate_number);

-- ============================================================================
-- CERTIFICATE VERIFICATION LOG (audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lms_certificate_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_id TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified_at TEXT DEFAULT CURRENT_TIMESTAMP,
  verified_by_ip TEXT,
  verified_by_user_agent TEXT,
  verification_result TEXT CHECK(verification_result IN ('valid', 'revoked', 'not_found')),
  
  FOREIGN KEY (certificate_id) REFERENCES lms_certificates(id)
);

CREATE INDEX IF NOT EXISTS idx_cert_verifications_cert ON lms_certificate_verifications(certificate_id);
CREATE INDEX IF NOT EXISTS idx_cert_verifications_code ON lms_certificate_verifications(verification_code);
