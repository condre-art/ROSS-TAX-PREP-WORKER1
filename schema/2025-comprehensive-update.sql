-- ============================================================================
-- ROSS TAX PREP 2025 E-FILE COMPREHENSIVE SCHEMA UPDATE
-- Tax Year 2025 - All Income Forms, Workflows, Tasks, Form 1040 Complete
-- ============================================================================

-- ============================================================================
-- INCOME FORMS TABLES
-- ============================================================================

-- Form W-2: Wage and Tax Statement
CREATE TABLE IF NOT EXISTS form_w2 (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  employee_ssn TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_address TEXT NOT NULL,
  employee_city TEXT NOT NULL,
  employee_state TEXT NOT NULL,
  employee_zip TEXT NOT NULL,
  employer_ein TEXT NOT NULL,
  employer_name TEXT NOT NULL,
  employer_address TEXT NOT NULL,
  box1_wages REAL NOT NULL DEFAULT 0,
  box2_federal_tax REAL NOT NULL DEFAULT 0,
  box3_ss_wages REAL NOT NULL DEFAULT 0,
  box4_ss_tax REAL NOT NULL DEFAULT 0,
  box5_medicare_wages REAL NOT NULL DEFAULT 0,
  box6_medicare_tax REAL NOT NULL DEFAULT 0,
  box7_ss_tips REAL DEFAULT 0,
  box8_allocated_tips REAL DEFAULT 0,
  box10_dependent_care REAL DEFAULT 0,
  box11_nonqualified_plans REAL DEFAULT 0,
  box12a_code TEXT,
  box12a_amount REAL,
  box13_statutory INTEGER DEFAULT 0,
  box13_retirement INTEGER DEFAULT 0,
  box13_sick_pay INTEGER DEFAULT 0,
  box15_state TEXT,
  box16_state_wages REAL DEFAULT 0,
  box17_state_tax REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_w2_return ON form_w2(return_id);
CREATE INDEX IF NOT EXISTS idx_w2_employee_ssn ON form_w2(employee_ssn);

-- Form 1099-NEC: Nonemployee Compensation
CREATE TABLE IF NOT EXISTS form_1099_nec (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  recipient_tin TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  payer_tin TEXT NOT NULL,
  payer_name TEXT NOT NULL,
  box1_nonemployee_compensation REAL NOT NULL DEFAULT 0,
  box2_payer_direct_sales INTEGER DEFAULT 0,
  box4_federal_tax REAL DEFAULT 0,
  box5_state_tax REAL DEFAULT 0,
  box6_state TEXT,
  box7_state_income REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_1099nec_return ON form_1099_nec(return_id);

-- Form 1099-MISC: Miscellaneous Income
CREATE TABLE IF NOT EXISTS form_1099_misc (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  recipient_tin TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  payer_tin TEXT NOT NULL,
  payer_name TEXT NOT NULL,
  box1_rents REAL DEFAULT 0,
  box2_royalties REAL DEFAULT 0,
  box3_other_income REAL DEFAULT 0,
  box4_federal_tax REAL DEFAULT 0,
  box6_medical_health REAL DEFAULT 0,
  box8_substitute_payments REAL DEFAULT 0,
  box10_crop_insurance REAL DEFAULT 0,
  box14_nonqualified_deferred REAL DEFAULT 0,
  box15_state_tax REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_1099misc_return ON form_1099_misc(return_id);

-- Form 1099-INT: Interest Income
CREATE TABLE IF NOT EXISTS form_1099_int (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  recipient_tin TEXT NOT NULL,
  payer_tin TEXT NOT NULL,
  box1_interest_income REAL DEFAULT 0,
  box2_early_withdrawal REAL DEFAULT 0,
  box3_interest_us_bonds REAL DEFAULT 0,
  box4_federal_tax REAL DEFAULT 0,
  box8_tax_exempt_interest REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_1099int_return ON form_1099_int(return_id);

-- Form 1099-DIV: Dividends and Distributions
CREATE TABLE IF NOT EXISTS form_1099_div (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  recipient_tin TEXT NOT NULL,
  payer_tin TEXT NOT NULL,
  box1a_ordinary_dividends REAL DEFAULT 0,
  box1b_qualified_dividends REAL DEFAULT 0,
  box2a_capital_gain REAL DEFAULT 0,
  box3_nondividend_distributions REAL DEFAULT 0,
  box4_federal_tax REAL DEFAULT 0,
  box5_section_199a REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_1099div_return ON form_1099_div(return_id);

-- Form 1099-R: Distributions From Pensions, Annuities, Retirement
CREATE TABLE IF NOT EXISTS form_1099_r (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  recipient_tin TEXT NOT NULL,
  payer_tin TEXT NOT NULL,
  box1_gross_distribution REAL DEFAULT 0,
  box2a_taxable_amount REAL DEFAULT 0,
  box2b_taxable_not_determined INTEGER DEFAULT 0,
  box2b_total_distribution INTEGER DEFAULT 0,
  box4_federal_tax REAL DEFAULT 0,
  box7_distribution_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_1099r_return ON form_1099_r(return_id);

-- Form 1099-G: Certain Government Payments
CREATE TABLE IF NOT EXISTS form_1099_g (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  recipient_tin TEXT NOT NULL,
  payer_tin TEXT NOT NULL,
  box1_unemployment REAL DEFAULT 0,
  box2_state_tax_refund REAL DEFAULT 0,
  box3_box2_year INTEGER,
  box4_federal_tax REAL DEFAULT 0,
  box6_taxable_grants REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_1099g_return ON form_1099_g(return_id);

-- Form 1098: Mortgage Interest Statement
CREATE TABLE IF NOT EXISTS form_1098 (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  recipient_tin TEXT NOT NULL,
  payer_tin TEXT NOT NULL,
  box1_mortgage_interest REAL DEFAULT 0,
  box2_outstanding_principal REAL DEFAULT 0,
  box3_mortgage_date TEXT,
  box5_mortgage_insurance REAL DEFAULT 0,
  box6_points_paid REAL DEFAULT 0,
  box7_property_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_1098_return ON form_1098(return_id);

-- Form 1098-T: Tuition Statement
CREATE TABLE IF NOT EXISTS form_1098_t (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  student_tin TEXT NOT NULL,
  student_name TEXT NOT NULL,
  filer_tin TEXT NOT NULL,
  filer_name TEXT NOT NULL,
  box1_payments_received REAL DEFAULT 0,
  box2_amounts_billed REAL DEFAULT 0,
  box5_scholarships_grants REAL DEFAULT 0,
  box8_half_time INTEGER DEFAULT 0,
  box9_graduate_student INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_1098t_return ON form_1098_t(return_id);

-- Form 1098-E: Student Loan Interest Statement
CREATE TABLE IF NOT EXISTS form_1098_e (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  borrower_tin TEXT NOT NULL,
  lender_tin TEXT NOT NULL,
  box1_student_loan_interest REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_1098e_return ON form_1098_e(return_id);

-- ============================================================================
-- FORM 1040 AND SCHEDULES - TAX YEAR 2025
-- ============================================================================

-- Form 1040 Master Record
CREATE TABLE IF NOT EXISTS form_1040 (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL UNIQUE,
  tax_year INTEGER NOT NULL DEFAULT 2025,
  filing_status TEXT NOT NULL CHECK(filing_status IN ('single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_surviving_spouse')),
  
  -- Taxpayer
  taxpayer_first_name TEXT NOT NULL,
  taxpayer_last_name TEXT NOT NULL,
  taxpayer_ssn TEXT NOT NULL,
  taxpayer_dob TEXT NOT NULL,
  taxpayer_occupation TEXT,
  taxpayer_ip_pin TEXT,
  taxpayer_presidential_election INTEGER DEFAULT 0,
  
  -- Spouse
  spouse_first_name TEXT,
  spouse_last_name TEXT,
  spouse_ssn TEXT,
  spouse_dob TEXT,
  spouse_occupation TEXT,
  spouse_ip_pin TEXT,
  spouse_presidential_election INTEGER DEFAULT 0,
  
  -- Address
  home_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  
  -- Digital Assets
  digital_assets_transaction INTEGER DEFAULT 0,
  
  -- Income (Page 2)
  line1_wages REAL DEFAULT 0,
  line2a_tax_exempt_interest REAL DEFAULT 0,
  line2b_taxable_interest REAL DEFAULT 0,
  line3a_qualified_dividends REAL DEFAULT 0,
  line3b_ordinary_dividends REAL DEFAULT 0,
  line4a_ira_distributions REAL DEFAULT 0,
  line4b_taxable_ira REAL DEFAULT 0,
  line5a_pensions_annuities REAL DEFAULT 0,
  line5b_taxable_pensions REAL DEFAULT 0,
  line6a_social_security REAL DEFAULT 0,
  line6b_taxable_ss REAL DEFAULT 0,
  line7_capital_gain_loss REAL DEFAULT 0,
  line8_additional_income REAL DEFAULT 0,
  line9_total_income REAL DEFAULT 0,
  
  -- Adjustments
  line10_adjustments REAL DEFAULT 0,
  line11_agi REAL DEFAULT 0,
  
  -- Deductions
  line12_standard_or_itemized REAL DEFAULT 0,
  line13_qualified_business_income REAL DEFAULT 0,
  line14_total_deductions REAL DEFAULT 0,
  line15_taxable_income REAL DEFAULT 0,
  
  -- Tax
  line16_tax REAL DEFAULT 0,
  line17_additional_taxes REAL DEFAULT 0,
  line18_total_tax REAL DEFAULT 0,
  
  -- Credits
  line19_child_tax_credit REAL DEFAULT 0,
  line20_additional_credits REAL DEFAULT 0,
  line21_total_credits REAL DEFAULT 0,
  line22_tax_after_credits REAL DEFAULT 0,
  
  -- Other Taxes
  line23_other_taxes REAL DEFAULT 0,
  line24_total_tax_owed REAL DEFAULT 0,
  
  -- Payments
  line25_federal_withholding REAL DEFAULT 0,
  line26_estimated_tax_payments REAL DEFAULT 0,
  line27_earned_income_credit REAL DEFAULT 0,
  line28_additional_child_tax_credit REAL DEFAULT 0,
  line29_american_opportunity_credit REAL DEFAULT 0,
  line30_recovery_rebate_credit REAL DEFAULT 0,
  line31_additional_payments REAL DEFAULT 0,
  line32_total_payments REAL DEFAULT 0,
  
  -- Refund or Owed
  line33_refund REAL DEFAULT 0,
  line34_refund_to_2026 REAL DEFAULT 0,
  line35_refund_amount REAL DEFAULT 0,
  line36_direct_deposit INTEGER DEFAULT 0,
  line37_amount_owed REAL DEFAULT 0,
  line38_estimated_penalty REAL DEFAULT 0,
  
  -- Calculation Status
  calculated INTEGER DEFAULT 0,
  calculation_date TEXT,
  refund_or_owed TEXT CHECK(refund_or_owed IN ('refund', 'owed', 'zero')),
  amount REAL DEFAULT 0,
  
  -- E-file Status
  efile_status TEXT DEFAULT 'not_filed' CHECK(efile_status IN ('not_filed', 'pending', 'transmitted', 'accepted', 'rejected')),
  efile_date TEXT,
  efile_submission_id TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_form_1040_return ON form_1040(return_id);
CREATE INDEX IF NOT EXISTS idx_form_1040_taxpayer_ssn ON form_1040(taxpayer_ssn);
CREATE INDEX IF NOT EXISTS idx_form_1040_efile_status ON form_1040(efile_status);

-- Form 1040 Dependents
CREATE TABLE IF NOT EXISTS form_1040_dependents (
  id TEXT PRIMARY KEY,
  form_1040_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn TEXT NOT NULL,
  relationship TEXT NOT NULL,
  child_tax_credit_eligible INTEGER DEFAULT 0,
  credit_other_dependents_eligible INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_1040_id) REFERENCES form_1040(id)
);

CREATE INDEX IF NOT EXISTS idx_dependents_1040 ON form_1040_dependents(form_1040_id);

-- Schedule 1: Additional Income and Adjustments
CREATE TABLE IF NOT EXISTS schedule_1 (
  id TEXT PRIMARY KEY,
  form_1040_id TEXT NOT NULL UNIQUE,
  
  -- Part I: Additional Income
  line1_taxable_refunds REAL DEFAULT 0,
  line2_alimony_received REAL DEFAULT 0,
  line3_business_income REAL DEFAULT 0,
  line4_other_gains_losses REAL DEFAULT 0,
  line5_rental_real_estate REAL DEFAULT 0,
  line6_farm_income REAL DEFAULT 0,
  line7_unemployment_comp REAL DEFAULT 0,
  line8_other_income REAL DEFAULT 0,
  line8_description TEXT,
  line9_total_additional_income REAL DEFAULT 0,
  line10_total_income_to_1040 REAL DEFAULT 0,
  
  -- Part II: Adjustments
  line11_educator_expenses REAL DEFAULT 0,
  line12_business_expenses REAL DEFAULT 0,
  line13_hsa_deduction REAL DEFAULT 0,
  line14_moving_expenses REAL DEFAULT 0,
  line15_self_employment_tax REAL DEFAULT 0,
  line16_sep_simple_plans REAL DEFAULT 0,
  line17_self_employed_health REAL DEFAULT 0,
  line18_penalty_early_withdrawal REAL DEFAULT 0,
  line19_alimony_paid REAL DEFAULT 0,
  line20_ira_deduction REAL DEFAULT 0,
  line21_student_loan_interest REAL DEFAULT 0,
  line22_other_adjustments REAL DEFAULT 0,
  line22_description TEXT,
  line23_total_adjustments REAL DEFAULT 0,
  line24_adjustments_to_1040 REAL DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_1040_id) REFERENCES form_1040(id)
);

CREATE INDEX IF NOT EXISTS idx_schedule1_1040 ON schedule_1(form_1040_id);

-- Schedule 1-A: 2025 Tax Enhancements (NEW)
CREATE TABLE IF NOT EXISTS schedule_1a (
  id TEXT PRIMARY KEY,
  form_1040_id TEXT NOT NULL UNIQUE,
  
  -- Part I: No Tax on Tips
  line1_tip_income_excluded REAL DEFAULT 0,
  line1_eligible INTEGER DEFAULT 0,
  
  -- Part II: No Tax on Overtime
  line2_overtime_income_excluded REAL DEFAULT 0,
  line2_weekly_hours_over_40 REAL DEFAULT 0,
  line2_eligible INTEGER DEFAULT 0,
  
  -- Part III: No Tax on Car Loan Interest
  line3_car_loan_interest_deduction REAL DEFAULT 0,
  line3_vehicle_vin TEXT,
  line3_vehicle_make TEXT,
  line3_vehicle_model TEXT,
  line3_vehicle_year INTEGER,
  line3_us_manufactured INTEGER DEFAULT 0,
  line3_eligible INTEGER DEFAULT 0,
  
  -- Part IV: Enhanced Deduction for Seniors
  line4_senior_deduction_enhancement REAL DEFAULT 0,
  line4_taxpayer_age_65_plus INTEGER DEFAULT 0,
  line4_spouse_age_65_plus INTEGER DEFAULT 0,
  
  -- Part V: Total
  line5_total_deductions REAL DEFAULT 0,
  line6_total_to_schedule_1 REAL DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_1040_id) REFERENCES form_1040(id)
);

CREATE INDEX IF NOT EXISTS idx_schedule1a_1040 ON schedule_1a(form_1040_id);

-- Schedule 2: Additional Taxes
CREATE TABLE IF NOT EXISTS schedule_2 (
  id TEXT PRIMARY KEY,
  form_1040_id TEXT NOT NULL UNIQUE,
  
  -- Part I: Tax
  line1_amt REAL DEFAULT 0,
  line2_excess_advance_ptc REAL DEFAULT 0,
  line3_total_part1 REAL DEFAULT 0,
  
  -- Part II: Other Taxes
  line4_self_employment_tax REAL DEFAULT 0,
  line5_unreported_ss_medicare REAL DEFAULT 0,
  line6_uncollected_ss_medicare REAL DEFAULT 0,
  line7_total_add_medicare_tax REAL DEFAULT 0,
  line8_household_employment_tax REAL DEFAULT 0,
  line9_repayment_first_time REAL DEFAULT 0,
  line10_health_care_individual REAL DEFAULT 0,
  line11_section_965_net_tax REAL DEFAULT 0,
  line12_other_additional_taxes REAL DEFAULT 0,
  line13_total_part2 REAL DEFAULT 0,
  line14_total_additional_taxes REAL DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_1040_id) REFERENCES form_1040(id)
);

CREATE INDEX IF NOT EXISTS idx_schedule2_1040 ON schedule_2(form_1040_id);

-- Schedule 3: Additional Credits and Payments
CREATE TABLE IF NOT EXISTS schedule_3 (
  id TEXT PRIMARY KEY,
  form_1040_id TEXT NOT NULL UNIQUE,
  
  -- Part I: Nonrefundable Credits
  line1_foreign_tax_credit REAL DEFAULT 0,
  line2_child_dependent_care REAL DEFAULT 0,
  line3_education_credits REAL DEFAULT 0,
  line4_retirement_savings REAL DEFAULT 0,
  line5_residential_energy REAL DEFAULT 0,
  line6_other_nonrefundable REAL DEFAULT 0,
  line7_total_nonrefundable REAL DEFAULT 0,
  
  -- Part II: Other Payments
  line8_net_premium_tax REAL DEFAULT 0,
  line9_amount_paid_extension REAL DEFAULT 0,
  line10_excess_ss_tax REAL DEFAULT 0,
  line11_credit_federal_tax_fuel REAL DEFAULT 0,
  line12_credit_disaster_area REAL DEFAULT 0,
  line13_other_payments REAL DEFAULT 0,
  line14_total_payments REAL DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_1040_id) REFERENCES form_1040(id)
);

CREATE INDEX IF NOT EXISTS idx_schedule3_1040 ON schedule_3(form_1040_id);

-- ============================================================================
-- TAX RETURN WORKFLOW AND TASKS
-- ============================================================================

-- Return Workflow Status
CREATE TABLE IF NOT EXISTS return_workflow (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL UNIQUE,
  current_step TEXT NOT NULL,
  current_step_name TEXT NOT NULL,
  total_steps INTEGER NOT NULL DEFAULT 12,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  progress_percent REAL NOT NULL DEFAULT 0,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('not_started', 'in_progress', 'review', 'completed', 'filed')),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_return ON return_workflow(return_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status ON return_workflow(status);

-- Return Tasks (PrepCheck items)
CREATE TABLE IF NOT EXISTS return_tasks (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  task_category TEXT NOT NULL,
  task_name TEXT NOT NULL,
  task_description TEXT,
  required INTEGER DEFAULT 1,
  completed INTEGER DEFAULT 0,
  completed_at TEXT,
  blocked_by TEXT, -- Task ID that must be completed first
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_return ON return_tasks(return_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON return_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON return_tasks(task_category);

-- Calculation Results (Avalon)
CREATE TABLE IF NOT EXISTS calculation_results (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  
  -- Income Summary
  total_wages REAL DEFAULT 0,
  total_interest REAL DEFAULT 0,
  total_dividends REAL DEFAULT 0,
  total_capital_gains REAL DEFAULT 0,
  total_business_income REAL DEFAULT 0,
  total_other_income REAL DEFAULT 0,
  adjusted_gross_income REAL DEFAULT 0,
  
  -- Deduction Summary
  standard_deduction REAL DEFAULT 0,
  itemized_deductions REAL DEFAULT 0,
  deduction_type TEXT CHECK(deduction_type IN ('standard', 'itemized')),
  qualified_business_deduction REAL DEFAULT 0,
  total_deductions REAL DEFAULT 0,
  taxable_income REAL DEFAULT 0,
  
  -- Tax Summary
  base_tax REAL DEFAULT 0,
  alternative_minimum_tax REAL DEFAULT 0,
  self_employment_tax REAL DEFAULT 0,
  additional_medicare_tax REAL DEFAULT 0,
  total_tax_before_credits REAL DEFAULT 0,
  
  -- Credits Summary
  child_tax_credit REAL DEFAULT 0,
  earned_income_credit REAL DEFAULT 0,
  education_credits REAL DEFAULT 0,
  other_credits REAL DEFAULT 0,
  total_credits REAL DEFAULT 0,
  total_tax_after_credits REAL DEFAULT 0,
  
  -- Payments Summary
  federal_withholding REAL DEFAULT 0,
  estimated_payments REAL DEFAULT 0,
  other_payments REAL DEFAULT 0,
  total_payments REAL DEFAULT 0,
  
  -- Final Result
  refund_or_owed TEXT CHECK(refund_or_owed IN ('refund', 'owed', 'zero')),
  amount REAL DEFAULT 0,
  
  -- Process Detail (JSON)
  processes_json TEXT,
  
  calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_calc_results_return ON calculation_results(return_id);

-- Update RETURNS table with EFIN/PTIN tracking
ALTER TABLE returns ADD COLUMN efin TEXT DEFAULT '748335';
ALTER TABLE returns ADD COLUMN ptin TEXT DEFAULT 'P03215544';
ALTER TABLE returns ADD COLUMN ero_id INTEGER REFERENCES staff(id);

-- Seed tax year 2025 preparation tasks template
INSERT OR IGNORE INTO return_tasks (id, return_id, task_category, task_name, task_description, required, completed) VALUES
  ('task_personal_info', 0, 'Personal Information', 'Enter taxpayer information', 'Name, SSN, address, date of birth', 1, 0),
  ('task_filing_status', 0, 'Filing Status', 'Select filing status', 'Single, Married Filing Jointly, etc.', 1, 0),
  ('task_dependents', 0, 'Dependents', 'Add dependent information', 'Children, other dependents', 0, 0),
  ('task_income_w2', 0, 'Income', 'Import W-2 forms', 'Wage and tax statements', 0, 0),
  ('task_income_1099', 0, 'Income', 'Import 1099 forms', '1099-NEC, 1099-MISC, 1099-INT, 1099-DIV', 0, 0),
  ('task_deductions', 0, 'Deductions', 'Review deductions', 'Standard or itemized deductions', 1, 0),
  ('task_credits', 0, 'Credits', 'Claim tax credits', 'Child Tax Credit, EITC, education credits', 0, 0),
  ('task_bank_info', 0, 'Refund', 'Enter bank information', 'For direct deposit refund', 0, 0),
  ('task_review', 0, 'Review', 'Review return for accuracy', 'Check all entries before filing', 1, 0),
  ('task_sign', 0, 'Sign', 'Sign and authorize e-file', 'Electronic signature required', 1, 0),
  ('task_payment', 0, 'Payment', 'Make payment if owed', 'Pay balance due', 0, 0),
  ('task_efile', 0, 'E-File', 'Submit to IRS', 'Transmit return electronically', 1, 0);
