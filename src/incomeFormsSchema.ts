/**
 * IRS INCOME FORMS SCHEMA - 2025 TAX YEAR
 * Complete definitions for W-2, 1099s, 1098s, and other income reporting forms
 */

// ============================================================================
// FORM W-2: WAGE AND TAX STATEMENT
// ============================================================================

export interface FormW2 {
  id: string;
  return_id: number;
  employer_ein: string;
  employer_name: string;
  employer_address: string;
  employer_city: string;
  employer_state: string;
  employer_zip: string;
  
  employee_ssn: string;
  employee_name: string;
  employee_address: string;
  employee_city: string;
  employee_state: string;
  employee_zip: string;
  
  // Box 1-20
  box1_wages: number;                    // Wages, tips, other compensation
  box2_federal_tax_withheld: number;     // Federal income tax withheld
  box3_social_security_wages: number;    // Social security wages
  box4_social_security_tax: number;      // Social security tax withheld
  box5_medicare_wages: number;           // Medicare wages and tips
  box6_medicare_tax: number;             // Medicare tax withheld
  box7_social_security_tips: number;     // Social security tips
  box8_allocated_tips: number;           // Allocated tips
  box9_verification_code?: string;       // (Unused)
  box10_dependent_care_benefits: number; // Dependent care benefits
  box11_nonqualified_plans: number;      // Nonqualified plans
  box12_codes: Array<{                   // Box 12 codes (A-HH)
    code: string;
    amount: number;
  }>;
  box13_statutory_employee: boolean;
  box13_retirement_plan: boolean;
  box13_third_party_sick_pay: boolean;
  box14_other?: string;                  // Other (employer use)
  
  // State/Local (Boxes 15-20)
  box15_state: string;
  box15_employer_state_id: string;
  box16_state_wages: number;
  box17_state_tax_withheld: number;
  box18_local_wages: number;
  box19_local_tax_withheld: number;
  box20_locality_name: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM 1099-NEC: NONEMPLOYEE COMPENSATION
// ============================================================================

export interface Form1099NEC {
  id: string;
  return_id: number;
  payer_tin: string;
  payer_name: string;
  payer_address: string;
  payer_city: string;
  payer_state: string;
  payer_zip: string;
  
  recipient_tin: string;
  recipient_name: string;
  recipient_address: string;
  recipient_city: string;
  recipient_state: string;
  recipient_zip: string;
  
  box1_nonemployee_compensation: number; // Nonemployee compensation
  box2_payer_direct_sales: boolean;      // Direct sales of $5,000 or more
  box4_federal_tax_withheld: number;     // Federal income tax withheld
  box5_state_tax_withheld: number;       // State tax withheld
  box6_state: string;                    // State
  box7_state_payer_id: string;           // Payer's state no.
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM 1099-INT: INTEREST INCOME
// ============================================================================

export interface Form1099INT {
  id: string;
  return_id: number;
  payer_tin: string;
  payer_name: string;
  payer_address: string;
  
  recipient_tin: string;
  recipient_name: string;
  recipient_address: string;
  
  box1_interest_income: number;              // Interest income
  box2_early_withdrawal_penalty: number;     // Early withdrawal penalty
  box3_interest_on_us_savings_bonds: number; // Interest on U.S. Savings Bonds
  box4_federal_tax_withheld: number;         // Federal income tax withheld
  box5_investment_expenses: number;          // Investment expenses
  box6_foreign_tax_paid: number;             // Foreign tax paid
  box7_foreign_country: string;              // Foreign country or U.S. possession
  box8_tax_exempt_interest: number;          // Tax-exempt interest
  box9_specified_private_bond_interest: number; // Specified private activity bond interest
  box10_market_discount: number;             // Market discount
  box11_bond_premium: number;                // Bond premium
  box12_bond_premium_treasury: number;       // Bond premium on Treasury obligations
  box13_tax_exempt_bond_premium: number;     // Tax-exempt and tax credit bond CUSIP no.
  box14_tax_exempt_state: string;            // State
  box15_state_id: string;                    // Payer's state no.
  box16_state_tax_withheld: number;          // State tax withheld
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM 1099-DIV: DIVIDENDS AND DISTRIBUTIONS
// ============================================================================

export interface Form1099DIV {
  id: string;
  return_id: number;
  payer_tin: string;
  payer_name: string;
  payer_address: string;
  
  recipient_tin: string;
  recipient_name: string;
  recipient_address: string;
  
  box1a_total_ordinary_dividends: number;      // Total ordinary dividends
  box1b_qualified_dividends: number;           // Qualified dividends
  box2a_total_capital_gain_distributions: number; // Total capital gain distributions
  box2b_unrecaptured_section_1250_gain: number;   // Unrecap. Sec. 1250 gain
  box2c_section_1202_gain: number;             // Section 1202 gain
  box2d_collectibles_gain: number;             // Collectibles (28%) gain
  box2e_section_897_gain: number;              // Section 897 ordinary dividends
  box2f_section_897_capital_gain: number;      // Section 897 capital gain
  box3_nondividend_distributions: number;      // Nondividend distributions
  box4_federal_tax_withheld: number;           // Federal income tax withheld
  box5_section_199a_dividends: number;         // Section 199A dividends
  box6_investment_expenses: number;            // Investment expenses
  box7_foreign_tax_paid: number;               // Foreign tax paid
  box8_foreign_country: string;                // Foreign country
  box9_cash_liquidation: number;               // Cash liquidation distributions
  box10_noncash_liquidation: number;           // Noncash liquidation distributions
  box11_exempt_interest_dividends: number;     // Exempt-interest dividends
  box12_specified_private_bond_interest: number; // Specified private activity bond interest dividends
  box13_state: string;
  box14_state_id: string;
  box15_state_tax_withheld: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM 1099-MISC: MISCELLANEOUS INFORMATION
// ============================================================================

export interface Form1099MISC {
  id: string;
  return_id: number;
  payer_tin: string;
  payer_name: string;
  payer_address: string;
  
  recipient_tin: string;
  recipient_name: string;
  recipient_address: string;
  
  box1_rents: number;                           // Rents
  box2_royalties: number;                       // Royalties
  box3_other_income: number;                    // Other income
  box4_federal_tax_withheld: number;            // Federal income tax withheld
  box5_fishing_boat_proceeds: number;           // Fishing boat proceeds
  box6_medical_health_payments: number;         // Medical and health care payments
  box7_payer_direct_sales: boolean;             // Direct sales indicator
  box8_substitute_payments: number;             // Substitute payments in lieu of dividends
  box9_crop_insurance_proceeds: number;         // Crop insurance proceeds
  box10_gross_proceeds_attorney: number;        // Gross proceeds paid to an attorney
  box11_fish_purchased_for_resale: number;      // Fish purchased for resale
  box12_section_409a_deferrals: number;         // Section 409A deferrals
  box13_excess_golden_parachute: number;        // Excess golden parachute payments
  box14_nonqualified_deferred_comp: number;     // Nonqualified deferred compensation
  box15_state_tax_withheld: number;
  box16_state: string;
  box17_state_payer_id: string;
  box18_state_income: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM 1099-G: CERTAIN GOVERNMENT PAYMENTS
// ============================================================================

export interface Form1099G {
  id: string;
  return_id: number;
  payer_tin: string;
  payer_name: string;
  payer_address: string;
  
  recipient_tin: string;
  recipient_name: string;
  recipient_address: string;
  
  box1_unemployment_compensation: number;    // Unemployment compensation
  box2_state_local_tax_refunds: number;      // State or local income tax refunds
  box3_box2_year: number;                    // Box 2 amount is for tax year
  box4_federal_tax_withheld: number;         // Federal income tax withheld
  box5_rtaa_payments: number;                // RTAA payments
  box6_taxable_grants: number;               // Taxable grants
  box7_agriculture_payments: number;         // Agriculture payments
  box8_market_gain: boolean;                 // Check if box 2 is trade or business income
  box9_state_tax_withheld: number;
  box10_state: string;
  box11_state_payer_id: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM 1098: MORTGAGE INTEREST STATEMENT
// ============================================================================

export interface Form1098 {
  id: string;
  return_id: number;
  lender_tin: string;
  lender_name: string;
  lender_address: string;
  
  borrower_tin: string;
  borrower_name: string;
  borrower_address: string;
  
  box1_mortgage_interest: number;            // Mortgage interest received
  box2_outstanding_principal: number;        // Outstanding mortgage principal
  box3_mortgage_origination_date: string;    // Mortgage origination date
  box4_refund_of_overpaid_interest: number;  // Refund of overpaid interest
  box5_mortgage_insurance_premiums: number;  // Mortgage insurance premiums
  box6_points_paid: number;                  // Points paid on purchase
  box7_property_address: string;             // Address of property securing mortgage
  box8_number_of_properties: number;         // Number of properties
  box9_other?: string;                       // Other
  box10_other_amount?: number;
  box11_mortgage_acquisition_date: string;   // Mortgage acquisition date
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM 1098-T: TUITION STATEMENT
// ============================================================================

export interface Form1098T {
  id: string;
  return_id: number;
  institution_tin: string;
  institution_name: string;
  institution_address: string;
  
  student_tin: string;
  student_name: string;
  student_address: string;
  account_number?: string;
  
  box1_payments_received: number;            // Payments received for qualified tuition
  box2_amounts_billed: number;               // Amounts billed for qualified tuition
  box3_change_reporting_method: boolean;     // Check if changed reporting method
  box4_adjustments_prior_year: number;       // Adjustments made for prior year
  box5_scholarships_grants: number;          // Scholarships or grants
  box6_adjustments_scholarships: number;     // Adjustments to scholarships for prior year
  box7_checked_half_time: boolean;           // Student is at least half-time
  box8_checked_graduate_student: boolean;    // Graduate student
  box9_insurance_contract_reimbursement: number; // Amount of any insurance contract reimbursement
  box10_includes_expenses_next_year: boolean; // Box 1 or 2 includes expenses for academic period beginning Jan-Mar of next year
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM 1099-R: DISTRIBUTIONS FROM PENSIONS, ANNUITIES, ETC.
// ============================================================================

export interface Form1099R {
  id: string;
  return_id: number;
  payer_tin: string;
  payer_name: string;
  payer_address: string;
  
  recipient_tin: string;
  recipient_name: string;
  recipient_address: string;
  
  box1_gross_distribution: number;           // Gross distribution
  box2a_taxable_amount: number;              // Taxable amount
  box2b_taxable_not_determined: boolean;     // Taxable amount not determined
  box2b_total_distribution: boolean;         // Total distribution
  box3_capital_gain: number;                 // Capital gain
  box4_federal_tax_withheld: number;         // Federal income tax withheld
  box5_employee_contributions: number;       // Employee contributions
  box6_net_unrealized_appreciation: number;  // Net unrealized appreciation in employer's securities
  box7_distribution_codes: string;           // Distribution code(s)
  box8_other_percent: number;                // Other %
  box9a_your_percent_total_dist: number;     // Your percentage of total distribution
  box9b_total_employee_contributions: number; // Total employee contributions
  box10_amount_allocable_to_ira: number;     // Amount allocable to IRR within 5 years
  box11_first_year_designated_roth: string;  // 1st year of desig. Roth contrib.
  box12_state_tax_withheld: number;
  box13_state: string;
  box14_state_payer_id: string;
  box15_state_distribution: number;
  box16_local_tax_withheld: number;
  box17_locality_name: string;
  box18_local_distribution: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM 1099-K: PAYMENT CARD AND THIRD-PARTY NETWORK TRANSACTIONS
// ============================================================================

export interface Form1099K {
  id: string;
  return_id: number;
  filer_tin: string;
  filer_name: string;
  filer_address: string;
  
  payee_tin: string;
  payee_name: string;
  payee_address: string;
  
  box1a_gross_amount: number;                // Gross amount of payment card/third party network transactions
  box1b_card_not_present: number;            // Card not present transactions
  box2_merchant_category_code: string;       // Merchant category code
  box3_number_of_transactions: number;       // Number of payment transactions
  box4_federal_tax_withheld: number;         // Federal income tax withheld
  box5a_january: number;                     // Monthly breakdown
  box5b_february: number;
  box5c_march: number;
  box5d_april: number;
  box5e_may: number;
  box5f_june: number;
  box5g_july: number;
  box5h_august: number;
  box5i_september: number;
  box5j_october: number;
  box5k_november: number;
  box5l_december: number;
  box6_state_tax_withheld: number;
  box7_state: string;
  box8_state_payer_id: string;
  box9_state_income: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM SSA-1099: SOCIAL SECURITY BENEFIT STATEMENT
// ============================================================================

export interface FormSSA1099 {
  id: string;
  return_id: number;
  
  recipient_ssn: string;
  recipient_name: string;
  recipient_address: string;
  
  box3_benefit_year: number;                 // Benefit year
  box4_rrta_reimbursement: number;           // Benefits repaid in current year
  box5_net_benefits: number;                 // Net benefits for current year
  box6_voluntary_withholding: number;        // Voluntary federal income tax withheld
  box7_address_change: boolean;              // Address changed
  box8_claim_number: string;                 // Claim number
  box9_medicare_premiums: number;            // Total Medicare premiums
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INCOME FORM TYPE UNION
// ============================================================================

export type IncomeForm = 
  | FormW2 
  | Form1099NEC 
  | Form1099INT 
  | Form1099DIV 
  | Form1099MISC 
  | Form1099G 
  | Form1098 
  | Form1098T 
  | Form1099R 
  | Form1099K 
  | FormSSA1099;

export type IncomeFormType = 
  | 'W2' 
  | '1099-NEC' 
  | '1099-INT' 
  | '1099-DIV' 
  | '1099-MISC' 
  | '1099-G' 
  | '1098' 
  | '1098-T' 
  | '1099-R' 
  | '1099-K' 
  | 'SSA-1099';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get form display name
 */
export function getFormDisplayName(formType: IncomeFormType): string {
  const names: Record<IncomeFormType, string> = {
    'W2': 'Form W-2 - Wage and Tax Statement',
    '1099-NEC': 'Form 1099-NEC - Nonemployee Compensation',
    '1099-INT': 'Form 1099-INT - Interest Income',
    '1099-DIV': 'Form 1099-DIV - Dividends and Distributions',
    '1099-MISC': 'Form 1099-MISC - Miscellaneous Information',
    '1099-G': 'Form 1099-G - Government Payments',
    '1098': 'Form 1098 - Mortgage Interest Statement',
    '1098-T': 'Form 1098-T - Tuition Statement',
    '1099-R': 'Form 1099-R - Distributions from Pensions',
    '1099-K': 'Form 1099-K - Payment Card Transactions',
    'SSA-1099': 'Form SSA-1099 - Social Security Benefits'
  };
  return names[formType];
}

/**
 * Determine where income should be reported on Form 1040
 */
export function getReportingLocation(formType: IncomeFormType): string {
  const locations: Record<IncomeFormType, string> = {
    'W2': 'Form 1040 Line 1 (Wages)',
    '1099-NEC': 'Schedule C (Self-Employment)',
    '1099-INT': 'Form 1040 Schedule B (if over $1,500) or Line 2b',
    '1099-DIV': 'Form 1040 Schedule B (if over $1,500) or Line 3b',
    '1099-MISC': 'Various (depends on box)',
    '1099-G': 'Schedule 1 Line 1 (Unemployment) or Schedule 1 Line 10 (Tax refund)',
    '1098': 'Schedule A Line 8a (if itemizing)',
    '1098-T': 'Form 8863 (Education Credits)',
    '1099-R': 'Form 1040 Lines 4a-5b (Pensions/IRA Distributions)',
    '1099-K': 'Schedule C (if business income)',
    'SSA-1099': 'Form 1040 Lines 6a-6b (Social Security)'
  };
  return locations[formType];
}
