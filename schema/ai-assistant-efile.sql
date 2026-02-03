-- ============================================================================
-- AI TAX ASSISTANT DATABASE SCHEMA
-- Supports intelligent guidance during e-file flow
-- ============================================================================

-- AI Assistant Sessions
CREATE TABLE IF NOT EXISTS ai_assistant_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  return_id INTEGER,
  current_form TEXT,
  current_step TEXT,
  session_data TEXT, -- JSON: return data, context
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_assistant_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_return ON ai_assistant_sessions(return_id);

-- AI Assistant Messages (Conversation History)
CREATE TABLE IF NOT EXISTS ai_assistant_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  form_context TEXT,
  suggestions TEXT, -- JSON array
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES ai_assistant_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_assistant_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_assistant_messages(created_at);

-- Income Forms Storage
CREATE TABLE IF NOT EXISTS income_forms (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  form_type TEXT NOT NULL CHECK(form_type IN ('W2', '1099-NEC', '1099-INT', '1099-DIV', '1099-MISC', '1099-G', '1099-R', '1099-K', '1098', '1098-T', 'SSA-1099')),
  form_data TEXT NOT NULL, -- JSON: complete form data
  payer_name TEXT,
  payer_tin TEXT,
  amount REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_income_forms_return ON income_forms(return_id);
CREATE INDEX IF NOT EXISTS idx_income_forms_type ON income_forms(form_type);

-- Form 1040 Returns
CREATE TABLE IF NOT EXISTS returns_1040 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  
  -- Form 1040 complete data
  form_data TEXT NOT NULL, -- JSON: complete Form 1040Data
  
  -- Schedule data
  schedule1_data TEXT,  -- JSON: Schedule1Data
  schedule1a_data TEXT, -- JSON: Schedule1AData (2025 new)
  schedule2_data TEXT,  -- JSON: Schedule2Data
  schedule3_data TEXT,  -- JSON: Schedule3Data
  
  -- Calculation results
  total_income REAL,
  adjusted_gross_income REAL,
  taxable_income REAL,
  total_tax REAL,
  total_payments REAL,
  refund_amount REAL,
  amount_owed REAL,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'review', 'ready', 'transmitted', 'accepted', 'rejected')),
  
  -- E-file information
  efile_authorized BOOLEAN DEFAULT 0,
  efile_authorization_date TEXT,
  efin TEXT, -- EFIN: 748335
  etin TEXT,
  irs_submission_id TEXT,
  
  -- Preparer information
  preparer_ptin TEXT, -- PTIN: P03215544
  preparer_name TEXT,
  preparer_signed BOOLEAN DEFAULT 0,
  preparer_signature_date TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_returns_1040_user ON returns_1040(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_1040_year ON returns_1040(tax_year);
CREATE INDEX IF NOT EXISTS idx_returns_1040_status ON returns_1040(status);

-- Dependents
CREATE TABLE IF NOT EXISTS dependents (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  ssn_encrypted TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  relationship TEXT NOT NULL,
  ctc_eligible BOOLEAN DEFAULT 0,
  odc_eligible BOOLEAN DEFAULT 0,
  months_lived_in_home INTEGER DEFAULT 12,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns_1040(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dependents_return ON dependents(return_id);

-- E-File Workflow Tracking
CREATE TABLE IF NOT EXISTS efile_workflow (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  current_step TEXT NOT NULL,
  completed_steps TEXT, -- JSON array
  validation_errors TEXT, -- JSON array
  user_actions TEXT, -- JSON array: user interaction log
  ai_suggestions TEXT, -- JSON array: AI assistant suggestions
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns_1040(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_efile_workflow_return ON efile_workflow(return_id);
CREATE INDEX IF NOT EXISTS idx_efile_workflow_step ON efile_workflow(current_step);

-- E-File Steps Definition
INSERT OR IGNORE INTO efile_workflow_steps (step_id, step_name, step_order, description) VALUES
  ('personal_info', 'Personal Information', 1, 'Enter taxpayer and spouse information'),
  ('filing_status', 'Filing Status', 2, 'Select filing status'),
  ('dependents', 'Dependents', 3, 'Add dependent information'),
  ('income_w2', 'W-2 Income', 4, 'Enter W-2 wages'),
  ('income_1099', '1099 Income', 5, 'Enter 1099 income forms'),
  ('income_other', 'Other Income', 6, 'Enter other income sources'),
  ('adjustments', 'Adjustments to Income', 7, 'Schedule 1 adjustments'),
  ('deductions', 'Deductions', 8, 'Standard or itemized deductions'),
  ('credits', 'Tax Credits', 9, 'Child tax credit, EITC, education credits'),
  ('payments', 'Payments & Withholding', 10, 'Enter federal tax withheld'),
  ('bank_products', 'Bank Products', 11, 'Select refund transfer or advance'),
  ('review', 'Review Return', 12, 'Review all entries'),
  ('sign', 'Sign & Authorize', 13, 'E-file authorization'),
  ('transmit', 'Transmit to IRS', 14, 'Submit return to IRS');

CREATE TABLE IF NOT EXISTS efile_workflow_steps (
  step_id TEXT PRIMARY KEY,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  description TEXT,
  required_fields TEXT, -- JSON array
  validation_rules TEXT -- JSON array
);

-- Form Finder (Search Forms)
CREATE TABLE IF NOT EXISTS form_finder_index (
  id TEXT PRIMARY KEY,
  form_number TEXT NOT NULL UNIQUE,
  form_name TEXT NOT NULL,
  form_category TEXT NOT NULL,
  keywords TEXT, -- Space-separated keywords for search
  description TEXT,
  pdf_url TEXT,
  instructions_url TEXT,
  related_forms TEXT, -- JSON array
  tax_year INTEGER DEFAULT 2025,
  is_active BOOLEAN DEFAULT 1
);

-- Seed Form Finder with 2025 forms
INSERT OR IGNORE INTO form_finder_index VALUES
  ('1040', '1040', 'U.S. Individual Income Tax Return', 'Individual', 'individual income tax return personal', 'Annual income tax return filed by citizens or residents of the United States', 'https://www.irs.gov/pub/irs-pdf/f1040.pdf', 'https://www.irs.gov/pub/irs-pdf/i1040gi.pdf', '["1040-SR","Schedule 1","Schedule 2","Schedule 3","W-2","1099"]', 2025, 1),
  ('w2', 'W-2', 'Wage and Tax Statement', 'Income', 'wages salary w2 employer', 'Reports wages paid and taxes withheld by employer', NULL, 'https://www.irs.gov/pub/irs-pdf/iw2w3.pdf', '["1040","W-4"]', 2025, 1),
  ('1099nec', '1099-NEC', 'Nonemployee Compensation', 'Income', '1099 nec independent contractor freelance self employed', 'Reports income paid to independent contractors', 'https://www.irs.gov/pub/irs-pdf/f1099nec.pdf', 'https://www.irs.gov/pub/irs-pdf/i1099nec.pdf', '["Schedule C","Schedule SE","1040"]', 2025, 1),
  ('1099int', '1099-INT', 'Interest Income', 'Income', '1099 int interest bank savings', 'Reports interest income from banks and financial institutions', 'https://www.irs.gov/pub/irs-pdf/f1099int.pdf', NULL, '["Schedule B","1040"]', 2025, 1),
  ('1099div', '1099-DIV', 'Dividends and Distributions', 'Income', '1099 div dividends stocks investments', 'Reports dividend income from stocks and mutual funds', 'https://www.irs.gov/pub/irs-pdf/f1099div.pdf', NULL, '["Schedule B","1040"]', 2025, 1),
  ('1098', '1098', 'Mortgage Interest Statement', 'Deduction', '1098 mortgage interest home loan', 'Reports mortgage interest paid on home loan', 'https://www.irs.gov/pub/irs-pdf/f1098.pdf', NULL, '["Schedule A","1040"]', 2025, 1),
  ('1098t', '1098-T', 'Tuition Statement', 'Education', '1098t college tuition education', 'Reports qualified tuition and related expenses', 'https://www.irs.gov/pub/irs-pdf/f1098t.pdf', NULL, '["Form 8863","1040"]', 2025, 1),
  ('schedule1', 'Schedule 1', 'Additional Income and Adjustments', 'Schedule', 'schedule 1 additional income adjustments', 'Report additional income and above-the-line deductions', 'https://www.irs.gov/pub/irs-pdf/f1040s1.pdf', NULL, '["1040","Schedule C","Schedule E"]', 2025, 1),
  ('schedule2', 'Schedule 2', 'Additional Taxes', 'Schedule', 'schedule 2 additional taxes amt', 'Report alternative minimum tax and other additional taxes', 'https://www.irs.gov/pub/irs-pdf/f1040s2.pdf', NULL, '["1040","Form 6251"]', 2025, 1),
  ('schedule3', 'Schedule 3', 'Additional Credits and Payments', 'Schedule', 'schedule 3 credits payments', 'Report nonrefundable credits and refundable credits', 'https://www.irs.gov/pub/irs-pdf/f1040s3.pdf', NULL, '["1040","Form 8863","Form 2441"]', 2025, 1),
  ('w4', 'W-4', 'Employee''s Withholding Certificate', 'Withholding', 'w4 withholding allowances paycheck', 'Complete to determine federal income tax withholding', 'https://www.irs.gov/pub/irs-pdf/fw4.pdf', NULL, '["W-2"]', 2025, 1),
  ('941', '941', 'Employer''s Quarterly Federal Tax Return', 'Employment', '941 employer quarterly payroll', 'Report income taxes, social security, and Medicare taxes withheld', 'https://www.irs.gov/pub/irs-pdf/f941.pdf', 'https://www.irs.gov/pub/irs-pdf/i941.pdf', '["940","W-2","W-3"]', 2025, 1),
  ('ss4', 'SS-4', 'Application for Employer Identification Number', 'Business', 'ss4 ein employer identification number', 'Apply for an EIN for business or estate', 'https://www.irs.gov/pub/irs-pdf/fss4.pdf', 'https://www.irs.gov/pub/irs-pdf/iss4.pdf', '["941","1040","Schedule C"]', 2025, 1),
  ('w9', 'W-9', 'Request for Taxpayer Identification Number', 'Information', 'w9 tin ssn itin', 'Provide TIN to person or entity required to file information return', 'https://www.irs.gov/pub/irs-pdf/fw9.pdf', NULL, '["1099-NEC","1099-MISC"]', 2025, 1),
  ('4868', '4868', 'Application for Extension of Time to File', 'Extension', '4868 extension deadline', 'Request automatic 6-month extension to file return', 'https://www.irs.gov/pub/irs-pdf/f4868.pdf', 'https://www.irs.gov/pub/irs-pdf/i4868.pdf', '["1040"]', 2025, 1),
  ('1040x', '1040-X', 'Amended U.S. Individual Income Tax Return', 'Amendment', '1040x amended return correction', 'Amend previously filed Form 1040, 1040-SR, or 1040-NR', 'https://www.irs.gov/pub/irs-pdf/f1040x.pdf', 'https://www.irs.gov/pub/irs-pdf/i1040x.pdf', '["1040"]', 2025, 1);

-- Audit log entries
INSERT INTO audit_log (id, action, entity, entity_id, details, created_at) VALUES
  (lower(hex(randomblob(16))), 'schema_create', 'ai_assistant', 'schema_2025', 'AI Tax Assistant schema created', datetime('now')),
  (lower(hex(randomblob(16))), 'schema_create', 'form_1040', 'schema_2025', 'Form 1040 calculator schema created', datetime('now'));
