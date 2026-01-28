/**
 * IRS MeF Schema Validator
 * 
 * Business Rules-based validation for IRS tax return XML
 * Based on IRS Publication 4164 and MeF Business Rules packages
 * 
 * Supports: Form 1120, 1120-S, 1120-H, 1041, 1065, 7004, 94x series
 * 
 * Note: This validator implements business rules. For full XSD validation,
 * download the MeF XSD Schema packages from IRS e-file website.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  ruleChecks: RuleCheckResult[];
  summary: {
    totalRules: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface ValidationError {
  code: string;
  rule: string;
  message: string;
  field?: string;
  xpath?: string;
  severity: 'reject' | 'error';
  category: string;
}

export interface ValidationWarning {
  code: string;
  rule: string;
  message: string;
  field?: string;
  severity: 'warning' | 'alert';
}

export interface RuleCheckResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  message?: string;
}

export type ReturnType = 
  | '1040' | '1040-SR' | '1040-NR' | '1040-X'  // Individual
  | '1120' | '1120-S' | '1120-H'              // Corporation
  | '1041'                                     // Estate/Trust
  | '1065'                                     // Partnership
  | '7004'                                     // Extension
  | '940' | '941' | '943' | '944' | '945';    // Employment

// ============================================================================
// BUSINESS RULES REGISTRY
// ============================================================================

interface BusinessRule {
  id: string;
  name: string;
  description: string;
  forms: ReturnType[];
  severity: 'reject' | 'error' | 'warning';
  category: string;
  validate: (xml: string, context: ValidationContext) => boolean;
  errorMessage: string;
}

interface ValidationContext {
  taxYear: string;
  returnType: ReturnType;
  isAmended: boolean;
  environment: 'ATS' | 'PRODUCTION';
}

// Common business rules across all forms
const COMMON_RULES: BusinessRule[] = [
  {
    id: 'R0001',
    name: 'XML Declaration Required',
    description: 'Return must have valid XML declaration',
    forms: ['1040', '1040-SR', '1040-NR', '1120', '1120-S', '1120-H', '1041', '1065', '7004', '940', '941'],
    severity: 'reject',
    category: 'Structure',
    validate: (xml) => xml.trim().startsWith('<?xml'),
    errorMessage: 'XML declaration is missing or invalid'
  },
  {
    id: 'R0002',
    name: 'Return Element Required',
    description: 'Root Return element must be present',
    forms: ['1040', '1040-SR', '1040-NR', '1120', '1120-S', '1120-H', '1041', '1065', '7004', '940', '941'],
    severity: 'reject',
    category: 'Structure',
    validate: (xml) => /<Return[\s>]/.test(xml),
    errorMessage: 'Return element is missing'
  },
  {
    id: 'R0003',
    name: 'ReturnHeader Required',
    description: 'ReturnHeader element must be present',
    forms: ['1040', '1040-SR', '1040-NR', '1120', '1120-S', '1120-H', '1041', '1065', '7004', '940', '941'],
    severity: 'reject',
    category: 'Structure',
    validate: (xml) => /<ReturnHeader[\s>]/.test(xml),
    errorMessage: 'ReturnHeader element is missing'
  },
  {
    id: 'R0004',
    name: 'TaxYear Required',
    description: 'Tax year must be specified',
    forms: ['1040', '1040-SR', '1040-NR', '1120', '1120-S', '1120-H', '1041', '1065', '7004', '940', '941'],
    severity: 'reject',
    category: 'Header',
    validate: (xml) => /<TaxYr>\d{4}<\/TaxYr>/.test(xml) || /<TaxYear>\d{4}<\/TaxYear>/.test(xml),
    errorMessage: 'Tax year is missing or invalid'
  },
  {
    id: 'R0005',
    name: 'TaxYear Valid Range',
    description: 'Tax year must be within acceptable range',
    forms: ['1040', '1040-SR', '1040-NR', '1120', '1120-S', '1120-H', '1041', '1065', '7004', '940', '941'],
    severity: 'reject',
    category: 'Header',
    validate: (xml, ctx) => {
      const match = xml.match(/<TaxYr>(\d{4})<\/TaxYr>/) || xml.match(/<TaxYear>(\d{4})<\/TaxYear>/);
      if (!match) return false;
      const year = parseInt(match[1]);
      const currentYear = new Date().getFullYear();
      return year >= 2020 && year <= currentYear;
    },
    errorMessage: 'Tax year is outside acceptable range (2020-current)'
  },
  {
    id: 'R0006',
    name: 'ReturnData Required',
    description: 'ReturnData element must be present',
    forms: ['1040', '1040-SR', '1040-NR', '1120', '1120-S', '1120-H', '1041', '1065', '940', '941'],
    severity: 'reject',
    category: 'Structure',
    validate: (xml) => /<ReturnData[\s>]/.test(xml),
    errorMessage: 'ReturnData element is missing'
  }
];

// Individual (1040) specific rules
const INDIVIDUAL_RULES: BusinessRule[] = [
  {
    id: 'IND-001',
    name: 'Primary SSN Required',
    description: 'Primary taxpayer SSN must be present',
    forms: ['1040', '1040-SR', '1040-NR'],
    severity: 'reject',
    category: 'Filer',
    validate: (xml) => /<PrimarySSN>\d{9}<\/PrimarySSN>/.test(xml) || /<TaxpayerSSN>\d{9}<\/TaxpayerSSN>/.test(xml),
    errorMessage: 'Primary taxpayer SSN is missing or invalid format'
  },
  {
    id: 'IND-002',
    name: 'SSN Format Valid',
    description: 'SSN must be 9 digits, not all zeros',
    forms: ['1040', '1040-SR', '1040-NR'],
    severity: 'reject',
    category: 'Filer',
    validate: (xml) => {
      const match = xml.match(/<(?:Primary)?(?:Taxpayer)?SSN>(\d{9})<\/(?:Primary)?(?:Taxpayer)?SSN>/);
      if (!match) return false;
      const ssn = match[1];
      return ssn !== '000000000' && !/^(\d)\1{8}$/.test(ssn);
    },
    errorMessage: 'SSN format is invalid (cannot be all zeros or repeating digit)'
  },
  {
    id: 'IND-003',
    name: 'Filing Status Required',
    description: 'Filing status must be specified',
    forms: ['1040', '1040-SR', '1040-NR'],
    severity: 'reject',
    category: 'Filer',
    validate: (xml) => /<FilingStatus/.test(xml) || /<FilingStatusCd>/.test(xml),
    errorMessage: 'Filing status is missing'
  },
  {
    id: 'IND-004',
    name: 'Taxpayer Name Required',
    description: 'Primary taxpayer name must be present',
    forms: ['1040', '1040-SR', '1040-NR'],
    severity: 'reject',
    category: 'Filer',
    validate: (xml) => /<Name[\s>]/.test(xml) && (/<FirstName>/.test(xml) || /<PersonFirstNm>/.test(xml)),
    errorMessage: 'Taxpayer name is missing'
  },
  {
    id: 'IND-005',
    name: 'ATS Test SSN Check',
    description: 'Test SSNs (9xx) only allowed in ATS environment',
    forms: ['1040', '1040-SR', '1040-NR'],
    severity: 'reject',
    category: 'Environment',
    validate: (xml, ctx) => {
      const match = xml.match(/<(?:Primary)?(?:Taxpayer)?SSN>(\d{9})<\/(?:Primary)?(?:Taxpayer)?SSN>/);
      if (!match) return true;
      const ssn = match[1];
      const isTestSSN = ssn.startsWith('9');
      if (ctx.environment === 'PRODUCTION' && isTestSSN) {
        return false;
      }
      return true;
    },
    errorMessage: 'Test SSN (starting with 9) cannot be used in Production'
  }
];

// Corporation (1120) specific rules  
const CORPORATION_RULES: BusinessRule[] = [
  {
    id: 'CORP-001',
    name: 'EIN Required',
    description: 'Employer Identification Number must be present',
    forms: ['1120', '1120-S', '1120-H'],
    severity: 'reject',
    category: 'Filer',
    validate: (xml) => /<EIN>\d{9}<\/EIN>/.test(xml) || /<EmployerIdentificationNumber>\d{9}<\/EmployerIdentificationNumber>/.test(xml),
    errorMessage: 'EIN is missing or invalid format'
  },
  {
    id: 'CORP-002',
    name: 'Business Name Required',
    description: 'Business name must be present',
    forms: ['1120', '1120-S', '1120-H'],
    severity: 'reject',
    category: 'Filer',
    validate: (xml) => /<BusinessName[\s>]/.test(xml) || /<BusinessNameLine1/.test(xml),
    errorMessage: 'Business name is missing'
  },
  {
    id: 'CORP-003',
    name: 'Tax Period End Date',
    description: 'Tax period end date must be specified for corporations',
    forms: ['1120', '1120-S'],
    severity: 'reject',
    category: 'Header',
    validate: (xml) => /<TaxPeriodEndDt>/.test(xml) || /<TaxPeriodEndDate>/.test(xml),
    errorMessage: 'Tax period end date is missing'
  },
  {
    id: 'CORP-004',
    name: 'S-Corp Election Date',
    description: '1120-S requires S election date or box checked',
    forms: ['1120-S'],
    severity: 'warning',
    category: 'Election',
    validate: (xml) => /<SElectionEffectiveDt>/.test(xml) || /<InitialReturn>/.test(xml),
    errorMessage: 'S election effective date or initial return indicator recommended'
  }
];

// Partnership (1065) specific rules
const PARTNERSHIP_RULES: BusinessRule[] = [
  {
    id: 'PTNR-001',
    name: 'Partnership EIN Required',
    description: 'Partnership EIN must be present',
    forms: ['1065'],
    severity: 'reject',
    category: 'Filer',
    validate: (xml) => /<EIN>\d{9}<\/EIN>/.test(xml),
    errorMessage: 'Partnership EIN is missing'
  },
  {
    id: 'PTNR-002',
    name: 'Partner Information',
    description: 'At least one partner Schedule K-1 required',
    forms: ['1065'],
    severity: 'warning',
    category: 'Schedules',
    validate: (xml) => /<IRS.*K1/.test(xml) || /<Schedule.*K1/.test(xml) || /<PartnerInformation/.test(xml),
    errorMessage: 'No Schedule K-1 partner information found'
  }
];

// Estate/Trust (1041) specific rules
const ESTATE_TRUST_RULES: BusinessRule[] = [
  {
    id: 'EST-001',
    name: 'Estate/Trust EIN Required',
    description: 'Estate or Trust EIN must be present',
    forms: ['1041'],
    severity: 'reject',
    category: 'Filer',
    validate: (xml) => /<EIN>\d{9}<\/EIN>/.test(xml),
    errorMessage: 'Estate/Trust EIN is missing'
  },
  {
    id: 'EST-002',
    name: 'Entity Type Required',
    description: 'Trust type indicator must be specified',
    forms: ['1041'],
    severity: 'reject',
    category: 'Filer',
    validate: (xml) => /<TypeOfEntity/.test(xml) || /<DecedentEstate/.test(xml) || /<SimpleTrust/.test(xml) || /<ComplexTrust/.test(xml),
    errorMessage: 'Entity type (estate/trust type) is missing'
  }
];

// Extension (7004) specific rules
const EXTENSION_RULES: BusinessRule[] = [
  {
    id: 'EXT-001',
    name: 'Form Code Required',
    description: 'Extension must specify which form is being extended',
    forms: ['7004'],
    severity: 'reject',
    category: 'Extension',
    validate: (xml) => /<FormCode>/.test(xml) || /<ExtensionFormCd>/.test(xml),
    errorMessage: 'Form code for extension is missing'
  },
  {
    id: 'EXT-002',
    name: 'Tentative Tax',
    description: 'Tentative tax amount should be specified',
    forms: ['7004'],
    severity: 'warning',
    category: 'Extension',
    validate: (xml) => /<TentativeTax/.test(xml) || /<TotalTax/.test(xml),
    errorMessage: 'Tentative tax amount not specified'
  }
];

// Employment (94x) specific rules
const EMPLOYMENT_RULES: BusinessRule[] = [
  {
    id: 'EMP-001',
    name: 'Quarter Indicator Required',
    description: 'Quarterly returns must specify the quarter',
    forms: ['941', '943'],
    severity: 'reject',
    category: 'Period',
    validate: (xml) => /<Quarter/.test(xml) || /<Qtr/.test(xml),
    errorMessage: 'Quarter indicator is missing'
  },
  {
    id: 'EMP-002',
    name: 'Wages Reported',
    description: 'Total wages must be reported',
    forms: ['940', '941', '943', '944', '945'],
    severity: 'reject',
    category: 'Wages',
    validate: (xml) => /<.*Wages.*>/.test(xml) || /<WagesAmt>/.test(xml),
    errorMessage: 'Total wages amount is missing'
  },
  {
    id: 'EMP-003',
    name: 'Employee Count',
    description: 'Number of employees should be specified',
    forms: ['941', '944'],
    severity: 'warning',
    category: 'Employees',
    validate: (xml) => /<NumberOfEmployees/.test(xml) || /<EmployeeCnt/.test(xml),
    errorMessage: 'Number of employees not specified'
  }
];

// Combine all rules
const ALL_RULES: BusinessRule[] = [
  ...COMMON_RULES,
  ...INDIVIDUAL_RULES,
  ...CORPORATION_RULES,
  ...PARTNERSHIP_RULES,
  ...ESTATE_TRUST_RULES,
  ...EXTENSION_RULES,
  ...EMPLOYMENT_RULES
];

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

export class SchemaValidator {
  private rules: BusinessRule[];
  
  constructor() {
    this.rules = ALL_RULES;
  }
  
  /**
   * Validate tax return XML against business rules
   */
  validate(
    xml: string, 
    returnType: ReturnType,
    options: {
      taxYear?: string;
      isAmended?: boolean;
      environment?: 'ATS' | 'PRODUCTION';
    } = {}
  ): ValidationResult {
    const context: ValidationContext = {
      taxYear: options.taxYear || this.extractTaxYear(xml) || new Date().getFullYear().toString(),
      returnType,
      isAmended: options.isAmended || xml.includes('Amended') || returnType.includes('-X'),
      environment: options.environment || 'ATS'
    };
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const ruleChecks: RuleCheckResult[] = [];
    
    // Get applicable rules for this return type
    const applicableRules = this.rules.filter(rule => 
      rule.forms.includes(returnType) || rule.forms.includes(returnType.split('-')[0] as ReturnType)
    );
    
    // Run each rule
    for (const rule of applicableRules) {
      try {
        const passed = rule.validate(xml, context);
        
        ruleChecks.push({
          ruleId: rule.id,
          ruleName: rule.name,
          passed,
          message: passed ? undefined : rule.errorMessage
        });
        
        if (!passed) {
          if (rule.severity === 'reject' || rule.severity === 'error') {
            errors.push({
              code: rule.id,
              rule: rule.name,
              message: rule.errorMessage,
              severity: rule.severity,
              category: rule.category
            });
          } else {
            warnings.push({
              code: rule.id,
              rule: rule.name,
              message: rule.errorMessage,
              severity: rule.severity
            });
          }
        }
      } catch (e) {
        // Rule execution error
        errors.push({
          code: rule.id,
          rule: rule.name,
          message: `Rule execution error: ${e}`,
          severity: 'error',
          category: 'System'
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      ruleChecks,
      summary: {
        totalRules: applicableRules.length,
        passed: ruleChecks.filter(r => r.passed).length,
        failed: errors.length,
        warnings: warnings.length
      }
    };
  }
  
  /**
   * Quick validation - only checks critical rules
   */
  quickValidate(xml: string, returnType: ReturnType): { valid: boolean; errors: string[] } {
    const criticalRules = this.rules.filter(r => 
      r.severity === 'reject' && r.forms.includes(returnType)
    );
    
    const errors: string[] = [];
    const context: ValidationContext = {
      taxYear: this.extractTaxYear(xml) || new Date().getFullYear().toString(),
      returnType,
      isAmended: false,
      environment: 'ATS'
    };
    
    for (const rule of criticalRules) {
      if (!rule.validate(xml, context)) {
        errors.push(`[${rule.id}] ${rule.errorMessage}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  /**
   * Get list of rules for a specific form
   */
  getRulesForForm(returnType: ReturnType): BusinessRule[] {
    return this.rules.filter(r => r.forms.includes(returnType));
  }
  
  /**
   * Get all supported return types
   */
  getSupportedForms(): ReturnType[] {
    const forms = new Set<ReturnType>();
    this.rules.forEach(r => r.forms.forEach(f => forms.add(f)));
    return Array.from(forms);
  }
  
  /**
   * Extract tax year from XML
   */
  private extractTaxYear(xml: string): string | null {
    const match = xml.match(/<TaxYr>(\d{4})<\/TaxYr>/) || xml.match(/<TaxYear>(\d{4})<\/TaxYear>/);
    return match ? match[1] : null;
  }
}

// ============================================================================
// FORM-SPECIFIC VALIDATORS
// ============================================================================

/**
 * Form 1120 (Corporation) Validator
 */
export function validate1120(xml: string, options?: { environment?: 'ATS' | 'PRODUCTION' }): ValidationResult {
  const validator = new SchemaValidator();
  return validator.validate(xml, '1120', options);
}

/**
 * Form 1120-S (S Corporation) Validator
 */
export function validate1120S(xml: string, options?: { environment?: 'ATS' | 'PRODUCTION' }): ValidationResult {
  const validator = new SchemaValidator();
  return validator.validate(xml, '1120-S', options);
}

/**
 * Form 1065 (Partnership) Validator
 */
export function validate1065(xml: string, options?: { environment?: 'ATS' | 'PRODUCTION' }): ValidationResult {
  const validator = new SchemaValidator();
  return validator.validate(xml, '1065', options);
}

/**
 * Form 1041 (Estate/Trust) Validator
 */
export function validate1041(xml: string, options?: { environment?: 'ATS' | 'PRODUCTION' }): ValidationResult {
  const validator = new SchemaValidator();
  return validator.validate(xml, '1041', options);
}

/**
 * Form 941 (Quarterly Employment) Validator
 */
export function validate941(xml: string, options?: { environment?: 'ATS' | 'PRODUCTION' }): ValidationResult {
  const validator = new SchemaValidator();
  return validator.validate(xml, '941', options);
}

/**
 * Form 7004 (Extension) Validator
 */
export function validate7004(xml: string, options?: { environment?: 'ATS' | 'PRODUCTION' }): ValidationResult {
  const validator = new SchemaValidator();
  return validator.validate(xml, '7004', options);
}

// ============================================================================
// FACTORY
// ============================================================================

export function createSchemaValidator(): SchemaValidator {
  return new SchemaValidator();
}
