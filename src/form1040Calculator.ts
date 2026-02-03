/**
 * FORM 1040 CALCULATOR - 2025 TAX YEAR
 * Complete calculation engine for Form 1040 and Schedules 1, 1-A, 2, and 3
 * EFIN: 748335 | PTIN: P03215544
 */

// ============================================================================
// FORM 1040 STRUCTURE
// ============================================================================

export interface Form1040Data {
  // Filing Information
  tax_year: number;
  filing_status: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household' | 'qualifying_surviving_spouse';
  
  // Taxpayer Information
  taxpayer_ssn: string;
  taxpayer_first_name: string;
  taxpayer_last_name: string;
  taxpayer_dob: string;
  spouse_ssn?: string;
  spouse_first_name?: string;
  spouse_last_name?: string;
  spouse_dob?: string;
  
  // Address
  street_address: string;
  apt_number?: string;
  city: string;
  state: string;
  zip_code: string;
  foreign_country?: string;
  
  // Dependents
  dependents: Dependent[];
  
  // === PAGE 1: INCOME ===
  line1_wages: number;                          // W-2 wages
  line2a_tax_exempt_interest: number;           // Tax-exempt interest
  line2b_taxable_interest: number;              // Taxable interest
  line3a_qualified_dividends: number;           // Qualified dividends
  line3b_ordinary_dividends: number;            // Ordinary dividends
  line4a_ira_distributions: number;             // IRA distributions
  line4b_ira_taxable: number;                   // IRA taxable amount
  line5a_pensions_annuities: number;            // Pensions and annuities
  line5b_pensions_taxable: number;              // Pensions taxable amount
  line6a_social_security: number;               // Social security benefits
  line6b_social_security_taxable: number;       // Social security taxable
  line7_capital_gain_loss: number;              // Schedule D capital gain/loss
  line8_schedule1_additional_income: number;    // From Schedule 1 Line 10
  line9_total_income: number;                   // TOTAL INCOME (sum lines 1-8)
  
  line10_schedule1_adjustments: number;         // From Schedule 1 Line 26
  line11_adjusted_gross_income: number;         // AGI (Line 9 - Line 10)
  
  // === PAGE 2: DEDUCTIONS ===
  line12_standard_or_itemized: 'standard' | 'itemized';
  line12_deduction_amount: number;              // Standard or itemized deduction
  line13_qbi_deduction: number;                 // Qualified business income deduction
  line14_total_deductions: number;              // Line 12 + Line 13
  line15_taxable_income: number;                // Line 11 - Line 14
  
  // === TAX COMPUTATION ===
  line16_tax: number;                           // Tax from tax tables or Schedule D
  line17_schedule2_additional_taxes: number;    // From Schedule 2 Line 21
  line18_total_tax_before_credits: number;      // Line 16 + Line 17
  line19_child_tax_credit: number;              // Child tax credit
  line20_schedule3_nonrefundable_credits: number; // From Schedule 3 Line 8
  line21_total_credits: number;                 // Line 19 + Line 20
  line22_tax_after_credits: number;             // Line 18 - Line 21 (not less than 0)
  line23_other_taxes: number;                   // Other taxes from Schedule 2
  line24_total_tax: number;                     // Line 22 + Line 23
  
  // === PAYMENTS ===
  line25a_federal_withholding_w2: number;       // Federal income tax withheld from W-2
  line25b_federal_withholding_1099: number;     // Federal income tax withheld from 1099
  line25c_other_withholding: number;            // Other federal tax withheld
  line25d_total_withholding: number;            // Total withholding (25a + 25b + 25c)
  line26_estimated_tax_payments: number;        // 2025 estimated tax payments
  line27_eitc: number;                          // Earned income credit (EIC)
  line28_additional_child_tax_credit: number;   // Additional child tax credit
  line29_american_opportunity_credit: number;   // American opportunity credit (Form 8863)
  line30_schedule3_refundable_credits: number;  // From Schedule 3 Line 15
  line31_rrc: number;                           // Recovery rebate credit
  line32_total_payments: number;                // Total payments (sum 25d-31)
  
  // === REFUND OR AMOUNT OWED ===
  line33_overpayment: number;                   // Line 32 - Line 24 (if positive)
  line34_refund_amount: number;                 // Amount to be refunded
  line35_applied_to_next_year: number;          // Amount applied to 2026 estimated tax
  line36_amount_owed: number;                   // Line 24 - Line 32 (if positive)
  line37_estimated_tax_penalty: number;         // Estimated tax penalty
  line38_total_amount_owed: number;             // Line 36 + Line 37
  
  // Direct Deposit
  refund_direct_deposit: boolean;
  refund_routing_number?: string;
  refund_account_number?: string;
  refund_account_type?: 'checking' | 'savings';
  
  // Bank Product Selection
  bank_product_selected?: 'RT' | 'RAL' | 'EITC_Advance' | null;
  bank_product_fee?: number;
  
  // Signature
  taxpayer_signed: boolean;
  taxpayer_signature_date?: string;
  spouse_signed?: boolean;
  spouse_signature_date?: string;
  
  // Preparer Information (ERO)
  preparer_ptin?: string;  // PTIN: P03215544
  preparer_name?: string;
  preparer_firm?: string;
  preparer_phone?: string;
  preparer_signed?: boolean;
  preparer_signature_date?: string;
  
  // E-File Authorization
  efile_authorized: boolean;
  efile_authorization_date?: string;
  efin?: string;  // EFIN: 748335
}

export interface Dependent {
  ssn: string;
  first_name: string;
  last_name: string;
  dob: string;
  relationship: string;
  ctc_eligible: boolean;     // Child Tax Credit eligible
  odc_eligible: boolean;     // Other Dependent Credit eligible
  months_lived_in_home: number;
}

// ============================================================================
// SCHEDULE 1: ADDITIONAL INCOME AND ADJUSTMENTS
// ============================================================================

export interface Schedule1Data {
  // PART I: ADDITIONAL INCOME
  line1_taxable_refunds: number;                // State/local tax refunds
  line2_alimony_received: number;               // Alimony received
  line3_business_income: number;                // Business income/loss (Schedule C)
  line4_other_gains: number;                    // Other gains/losses (Form 4797)
  line5_rental_real_estate: number;             // Rental real estate (Schedule E)
  line6_farm_income: number;                    // Farm income/loss (Schedule F)
  line7_unemployment_compensation: number;      // Unemployment compensation
  line8_other_income: number;                   // Other income
  line8_description?: string;                   // Description of other income
  line9_total_other_income: number;             // Total of lines 1-8
  line10_combine_with_1040: number;             // Goes to Form 1040 Line 8
  
  // PART II: ADJUSTMENTS TO INCOME
  line11_educator_expenses: number;             // Educator expenses
  line12_business_expenses: number;             // Certain business expenses (Form 2106)
  line13_hsa_deduction: number;                 // HSA deduction
  line14_moving_expenses: number;               // Moving expenses (armed forces only)
  line15_se_tax_deduction: number;              // Deductible part of self-employment tax
  line16_sep_simple_plans: number;              // SEP, SIMPLE, qualified plans
  line17_penalty_early_withdrawal: number;      // Penalty on early withdrawal of savings
  line18_alimony_paid: number;                  // Alimony paid
  line19_reserved: number;                      // Reserved for future use
  line20_ira_deduction: number;                 // IRA deduction
  line21_student_loan_interest: number;         // Student loan interest deduction
  line22_tuition_fees: number;                  // Tuition and fees (DEPRECATED for 2025)
  line23_archer_msa: number;                    // Archer MSA deduction
  line24_jury_duty_pay: number;                 // Jury duty pay given to employer
  line25_other_adjustments: number;             // Other adjustments
  line25_description?: string;                  // Description of other adjustments
  line26_total_adjustments: number;             // Total adjustments (sum 11-25)
}

// ============================================================================
// SCHEDULE 1-A: ENHANCED DEDUCTIONS (2025 NEW)
// ============================================================================

export interface Schedule1AData {
  // PART I: NO TAX ON TIPS
  line1_tip_income: number;                     // Total tip income for year
  line2_tips_excluded: number;                  // Tips eligible for exclusion
  line3_tip_deduction: number;                  // No Tax on Tips deduction
  
  // PART II: NO TAX ON OVERTIME
  line4_overtime_wages: number;                 // Overtime wages
  line5_overtime_excluded: number;              // Overtime eligible for exclusion
  line6_overtime_deduction: number;             // No Tax on Overtime deduction
  
  // PART III: NO TAX ON CAR LOAN INTEREST
  line7_car_loan_interest: number;              // Car loan interest paid
  line8_interest_excluded: number;              // Interest eligible for exclusion
  line9_car_loan_deduction: number;             // No Tax on Car Loan Interest deduction
  
  // PART IV: ENHANCED DEDUCTION FOR SENIORS (65+)
  line10_senior_eligible: boolean;              // Age 65 or older
  line11_senior_deduction_amount: number;       // Enhanced senior deduction
  line12_senior_total_deduction: number;        // Total enhanced deduction for seniors
  
  // PART V: TOTAL ADDITIONAL DEDUCTIONS
  line13_total_schedule_1a: number;             // Total (lines 3 + 6 + 9 + 12)
}

// ============================================================================
// SCHEDULE 2: ADDITIONAL TAXES
// ============================================================================

export interface Schedule2Data {
  // PART I: TAX
  line1_amt: number;                            // Alternative minimum tax (Form 6251)
  line2_excess_advance_ptc: number;             // Excess advance premium tax credit repayment
  line3_other_taxes: number;                    // Other taxes
  line4_total_other_taxes: number;              // Total of lines 1-3
  
  // PART II: OTHER TAXES
  line5_se_tax: number;                         // Self-employment tax (Schedule SE)
  line6_social_security_medicare_wages: number; // Uncollected social security and Medicare tax
  line7_additional_medicare_tax: number;        // Additional Medicare Tax (Form 8959)
  line8_net_investment_income_tax: number;      // Net investment income tax (Form 8960)
  line9_household_employment_taxes: number;     // Household employment taxes (Schedule H)
  line10_repayment_first_time_buyer: number;    // Repayment of first-time homebuyer credit
  line11_aca_individual_mandate: number;        // Health care: individual responsibility
  line12_section_965_net_tax: number;           // Section 965 net tax liability
  line13_other_additional_taxes: number;        // Other additional taxes
  line14_reserved: number;                      // Reserved for future use
  line15_total_additional_taxes: number;        // Total of lines 5-14
  line16_reserved2: number;                     // Reserved
  line17_section_965_installment: number;       // Section 965 installment
  line18_deferred_foreign_income: number;       // Deferred foreign income
  line19_reserved3: number;                     // Reserved
  line20_other: number;                         // Other (specify)
  line21_total_schedule2: number;               // Total (sum lines 4, 15, 17-20)
}

// ============================================================================
// SCHEDULE 3: ADDITIONAL CREDITS AND PAYMENTS
// ============================================================================

export interface Schedule3Data {
  // PART I: NONREFUNDABLE CREDITS
  line1_foreign_tax_credit: number;             // Foreign tax credit
  line2_child_dependent_care_credit: number;    // Child and dependent care expenses (Form 2441)
  line3_education_credits: number;              // Education credits (Form 8863)
  line4_retirement_savings_credit: number;      // Retirement savings contributions credit (Form 8880)
  line5_residential_energy_credit: number;      // Residential energy credits (Form 5695)
  line6_other_nonrefundable_credits: number;    // Other nonrefundable credits
  line6_description?: string[];                 // Description of other credits
  line7_total_nonrefundable: number;            // Total of lines 1-6
  line8_add_to_1040: number;                    // Add lines 7 (goes to Form 1040 Line 20)
  
  // PART II: OTHER PAYMENTS AND REFUNDABLE CREDITS
  line9_net_premium_tax_credit: number;         // Net premium tax credit
  line10_reserved: number;                      // Reserved for future use
  line11_amount_form_8885: number;              // Amount from Form 8885
  line12_amount_form_4136: number;              // Amount from Schedule 3, line 12
  line13_amount_form_2439: number;              // Amount from Form 2439
  line14_other_refundable_credits: number;      // Other refundable credits
  line14_description?: string[];                // Description of other refundable credits
  line15_total_refundable: number;              // Total of lines 9-14 (goes to Form 1040 Line 30)
}

// ============================================================================
// TAX CALCULATION CONSTANTS (2025)
// ============================================================================

export const TAX_CONSTANTS_2025 = {
  // Standard Deductions
  standard_deduction: {
    single: 15000,
    married_filing_jointly: 30000,
    married_filing_separately: 15000,
    head_of_household: 22500,
    qualifying_surviving_spouse: 30000
  },
  
  // Tax Brackets (2025)
  tax_brackets: {
    single: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11601, max: 47150, rate: 0.12 },
      { min: 47151, max: 100525, rate: 0.22 },
      { min: 100526, max: 191950, rate: 0.24 },
      { min: 191951, max: 243725, rate: 0.32 },
      { min: 243726, max: 609350, rate: 0.35 },
      { min: 609351, max: Infinity, rate: 0.37 }
    ],
    married_filing_jointly: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23201, max: 94300, rate: 0.12 },
      { min: 94301, max: 201050, rate: 0.22 },
      { min: 201051, max: 383900, rate: 0.24 },
      { min: 383901, max: 487450, rate: 0.32 },
      { min: 487451, max: 731200, rate: 0.35 },
      { min: 731201, max: Infinity, rate: 0.37 }
    ],
    head_of_household: [
      { min: 0, max: 16550, rate: 0.10 },
      { min: 16551, max: 63100, rate: 0.12 },
      { min: 63101, max: 100500, rate: 0.22 },
      { min: 100501, max: 191950, rate: 0.24 },
      { min: 191951, max: 243700, rate: 0.32 },
      { min: 243701, max: 609350, rate: 0.35 },
      { min: 609351, max: Infinity, rate: 0.37 }
    ]
  },
  
  // Credits
  child_tax_credit: 2000,
  other_dependent_credit: 500,
  eitc_max: {
    no_children: 632,
    one_child: 4213,
    two_children: 6960,
    three_plus_children: 8046
  },
  
  // Phase-out thresholds
  ctc_phaseout: {
    married_filing_jointly: 400000,
    other: 200000
  },
  
  // Self-Employment Tax
  se_tax_rate: 0.153,
  medicare_surtax_threshold: {
    married_filing_jointly: 250000,
    single: 200000
  },
  additional_medicare_rate: 0.009
};

// ============================================================================
// FORM 1040 CALCULATOR CLASS
// ============================================================================

export class Form1040Calculator {
  private data: Form1040Data;
  private schedule1?: Schedule1Data;
  private schedule1a?: Schedule1AData;
  private schedule2?: Schedule2Data;
  private schedule3?: Schedule3Data;

  constructor(data: Form1040Data) {
    this.data = data;
  }

  /**
   * Calculate complete Form 1040
   */
  calculate(): Form1040Data {
    // Calculate income (lines 1-11)
    this.calculateIncome();
    
    // Calculate deductions (lines 12-15)
    this.calculateDeductions();
    
    // Calculate tax (lines 16-24)
    this.calculateTax();
    
    // Calculate payments (lines 25-32)
    this.calculatePayments();
    
    // Calculate refund or amount owed (lines 33-38)
    this.calculateRefundOrOwed();
    
    return this.data;
  }

  /**
   * Calculate income section
   */
  private calculateIncome(): void {
    this.data.line9_total_income = 
      this.data.line1_wages +
      this.data.line2b_taxable_interest +
      this.data.line3b_ordinary_dividends +
      this.data.line4b_ira_taxable +
      this.data.line5b_pensions_taxable +
      this.data.line6b_social_security_taxable +
      this.data.line7_capital_gain_loss +
      this.data.line8_schedule1_additional_income;
    
    this.data.line11_adjusted_gross_income = 
      this.data.line9_total_income - this.data.line10_schedule1_adjustments;
  }

  /**
   * Calculate deductions
   */
  private calculateDeductions(): void {
    // Standard deduction based on filing status
    if (this.data.line12_standard_or_itemized === 'standard') {
      this.data.line12_deduction_amount = 
        TAX_CONSTANTS_2025.standard_deduction[this.data.filing_status];
    }
    
    this.data.line14_total_deductions = 
      this.data.line12_deduction_amount + this.data.line13_qbi_deduction;
    
    this.data.line15_taxable_income = Math.max(0,
      this.data.line11_adjusted_gross_income - this.data.line14_total_deductions
    );
  }

  /**
   * Calculate tax using tax tables
   */
  private calculateTax(): void {
    const taxableIncome = this.data.line15_taxable_income;
    const brackets = TAX_CONSTANTS_2025.tax_brackets[
      this.data.filing_status === 'married_filing_jointly' || 
      this.data.filing_status === 'qualifying_surviving_spouse' 
        ? 'married_filing_jointly' 
        : this.data.filing_status === 'head_of_household'
        ? 'head_of_household'
        : 'single'
    ];
    
    let tax = 0;
    let previousMax = 0;
    
    for (const bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const taxableInBracket = Math.min(taxableIncome, bracket.max) - previousMax;
        tax += taxableInBracket * bracket.rate;
        previousMax = bracket.max;
      } else {
        break;
      }
    }
    
    this.data.line16_tax = Math.round(tax);
    this.data.line18_total_tax_before_credits = 
      this.data.line16_tax + this.data.line17_schedule2_additional_taxes;
    
    this.data.line21_total_credits = 
      this.data.line19_child_tax_credit + this.data.line20_schedule3_nonrefundable_credits;
    
    this.data.line22_tax_after_credits = Math.max(0,
      this.data.line18_total_tax_before_credits - this.data.line21_total_credits
    );
    
    this.data.line24_total_tax = 
      this.data.line22_tax_after_credits + this.data.line23_other_taxes;
  }

  /**
   * Calculate payments and credits
   */
  private calculatePayments(): void {
    this.data.line25d_total_withholding = 
      this.data.line25a_federal_withholding_w2 +
      this.data.line25b_federal_withholding_1099 +
      this.data.line25c_other_withholding;
    
    this.data.line32_total_payments = 
      this.data.line25d_total_withholding +
      this.data.line26_estimated_tax_payments +
      this.data.line27_eitc +
      this.data.line28_additional_child_tax_credit +
      this.data.line29_american_opportunity_credit +
      this.data.line30_schedule3_refundable_credits +
      this.data.line31_rrc;
  }

  /**
   * Calculate refund or amount owed
   */
  private calculateRefundOrOwed(): void {
    const difference = this.data.line32_total_payments - this.data.line24_total_tax;
    
    if (difference > 0) {
      // Refund
      this.data.line33_overpayment = difference;
      
      // Apply bank product fee if selected
      if (this.data.bank_product_selected && this.data.bank_product_fee) {
        this.data.line34_refund_amount = this.data.line33_overpayment - this.data.bank_product_fee;
      } else {
        this.data.line34_refund_amount = this.data.line33_overpayment - this.data.line35_applied_to_next_year;
      }
      
      this.data.line36_amount_owed = 0;
      this.data.line38_total_amount_owed = 0;
    } else {
      // Amount owed
      this.data.line33_overpayment = 0;
      this.data.line34_refund_amount = 0;
      this.data.line35_applied_to_next_year = 0;
      this.data.line36_amount_owed = Math.abs(difference);
      this.data.line38_total_amount_owed = 
        this.data.line36_amount_owed + this.data.line37_estimated_tax_penalty;
    }
  }

  /**
   * Calculate Child Tax Credit
   */
  calculateChildTaxCredit(): number {
    const eligible = this.data.dependents.filter(d => d.ctc_eligible);
    let credit = eligible.length * TAX_CONSTANTS_2025.child_tax_credit;
    
    // Phase-out based on AGI
    const threshold = TAX_CONSTANTS_2025.ctc_phaseout[
      this.data.filing_status === 'married_filing_jointly' 
        ? 'married_filing_jointly' 
        : 'other'
    ];
    
    if (this.data.line11_adjusted_gross_income > threshold) {
      const excess = this.data.line11_adjusted_gross_income - threshold;
      const reduction = Math.ceil(excess / 1000) * 50;
      credit = Math.max(0, credit - reduction);
    }
    
    return credit;
  }
}
