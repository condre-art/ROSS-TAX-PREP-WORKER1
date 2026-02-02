// efileProviders.ts
// IRS MeF E-File Provider Configuration
// PRODUCTION INTEGRATION - ATS → Production Gate Compliant

export interface EfinProfile {
  efin: string;
  etin_prod: string;
  etin_test?: string;
  firm_name: string;
  owner_name: string;
  address: string;
  phone: string;
  email: string;
  status: "active" | "inactive" | "test";
  approved_years: string[];
  provider_options: string[];
  software_developer_approved: boolean;
  role: "Software Developer" | "ERO" | "Transmitter";
}

export interface MefConfig {
  environment: "ATS" | "PRODUCTION";
  active_profile: string;
  transmissions_enabled: boolean; // Kill switch
  endpoints: {
    ATS_BASE: string;
    PROD_BASE: string;
  };
  transport: "mime" | "mtom";
  services: {
    SendSubmissions: string;
    GetSubmissionStatus: string;
    GetAck: string;
    GetAcks: string;
    GetNewAcks: string;
  };
  retry: {
    max_attempts: number;
    initial_delay_ms: number;
    max_delay_ms: number;
    backoff_multiplier: number;
  };
  timeouts: {
    connection_ms: number;
    read_ms: number;
  };
}

export interface BankProductProvider {
  id: string;
  name: string;
  api_url: string;
  supported_products: string[];
  support_contact: string;
}

// ============================================================================
// EFIN PROFILES
// ============================================================================

/**
 * Profile A - ROSS TAX PREP AND BOOKKEEPING LLC
 * ERO only - NOT for custom software development
 */
export const ROSS_TAX_PREP_PROFILE: EfinProfile = {
  efin: "****86", // Redacted for public
  etin_prod: "98978",
  firm_name: "ROSS TAX PREP AND BOOKKEEPING LLC",
  owner_name: "Condre Ross",
  address: "[Business Address]",
  phone: "[Business Phone]",
  email: "[Business Email]",
  status: "test",
  approved_years: ["2025", "2026"],
  provider_options: ["ERO", "Transmitter", "ISP"],
  software_developer_approved: false,
  role: "ERO"
};

/**
 * Profile B - 254 - TAX CONSULTANTS (Software Developer Approved)
 * ✅ REQUIREMENT 0: Software Developer = Accepted
 * This is the CORRECT profile for custom-built transmitter software
 */
export const TAX_CONSULTANTS_PROFILE: EfinProfile = {
  efin: "****35", // Redacted for public
  etin_prod: "95409",
  etin_test: "95410",
  firm_name: "254 - TAX CONSULTANTS",
  owner_name: "Condre Ross",
  address: "[Business Address]",
  phone: "[Business Phone]",
  email: "[Business Email]",
  status: "test",
  approved_years: ["2025", "2026"],
  provider_options: ["ERO", "Transmitter", "ISP", "Software Developer"],
  software_developer_approved: true,  // ✅ This is the key requirement
  role: "Software Developer"          // ✅ Role alignment for "I built the transmitter"
};

// ============================================================================
// ACTIVE PROFILE SELECTION
// ============================================================================

/**
 * ACTIVE PROFILE - Set to Software Developer approved profile
 * ✅ Requirement 0: Operating under EFIN where Software Developer = Accepted
 */
export const ERO_EFIN_PROFILE = TAX_CONSULTANTS_PROFILE;

// All EFIN profiles for lookup
export const EFIN_PROFILES: Record<string, EfinProfile> = {
  "ross_tax_prep": ROSS_TAX_PREP_PROFILE,
  "254_tax_consultants": TAX_CONSULTANTS_PROFILE
};

// ============================================================================
// MEF CONFIGURATION
// ============================================================================

/**
 * IRS MeF A2A Configuration
 * ✅ Requirement 5: Environment switch is config toggle, not code change
 */
export const MEF_CONFIG: MefConfig = {
  // ============================================================
  // ENVIRONMENT TOGGLE - Change this for ATS vs Production
  // NO CODE CHANGES REQUIRED - just change this value
  // ============================================================
  environment: "PRODUCTION", // "ATS" for testing, "PRODUCTION" for live filing
  
  // Active EFIN profile
  active_profile: "254_tax_consultants", // Software Developer approved
  
  // ============================================================
  // KILL SWITCH - Disable transmissions without taking app down
  // ✅ Requirement 5: "stop the line" switch
  // ============================================================
  transmissions_enabled: true, // Set to false to stop all transmissions
  
  // MeF Endpoints
  endpoints: {
    ATS_BASE: "https://la.alt.www4.irs.gov/a2a/mef",
    PROD_BASE: "https://la.www4.irs.gov/a2a/mef"
  },
  
  // Transport format
  transport: "mime",
  
  // MeF Services
  services: {
    SendSubmissions: "SendSubmissions",
    GetSubmissionStatus: "GetSubmissionStatus",
    GetAck: "GetAck",
    GetAcks: "GetAcks",
    GetNewAcks: "GetNewAcks"
  },
  
  // Retry configuration for resilience
  retry: {
    max_attempts: 3,
    initial_delay_ms: 1000,
    max_delay_ms: 30000,
    backoff_multiplier: 2,
  },
  
  // Timeout configuration
  timeouts: {
    connection_ms: 30000,
    read_ms: 120000,
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current MeF endpoint based on environment
 */
export function getMefEndpoint(service: string): string {
  const baseUrl = MEF_CONFIG.environment === "ATS" 
    ? MEF_CONFIG.endpoints.ATS_BASE 
    : MEF_CONFIG.endpoints.PROD_BASE;
  return `${baseUrl}/${MEF_CONFIG.transport}/${service}`;
}

/**
 * Get active ETIN based on environment
 */
export function getActiveEtin(): string {
  const profile = EFIN_PROFILES[MEF_CONFIG.active_profile];
  if (MEF_CONFIG.environment === "ATS" && profile.etin_test) {
    return profile.etin_test;
  }
  return profile.etin_prod;
}

/**
 * Get active EFIN profile
 */
export function getActiveProfile(): EfinProfile {
  return EFIN_PROFILES[MEF_CONFIG.active_profile];
}

/**
 * Check if transmissions are enabled (kill switch)
 * ✅ Requirement 5: "stop the line" switch
 */
export function isTransmissionEnabled(): boolean {
  return MEF_CONFIG.transmissions_enabled;
}

/**
 * Check if using production environment
 */
export function isProduction(): boolean {
  return MEF_CONFIG.environment === "PRODUCTION";
}

/**
 * Validate profile has Software Developer approval
 * ✅ Requirement 0 validation
 */
export function validateSoftwareDeveloperApproval(): { valid: boolean; message: string } {
  const profile = getActiveProfile();
  if (!profile.software_developer_approved) {
    return {
      valid: false,
      message: `Profile ${profile.firm_name} (EFIN: ${profile.efin}) does not have Software Developer approval. Cannot transmit custom software submissions.`
    };
  }
  if (profile.role !== "Software Developer") {
    return {
      valid: false,
      message: `Profile ${profile.firm_name} role is "${profile.role}", expected "Software Developer".`
    };
  }
  return {
    valid: true,
    message: `Profile ${profile.firm_name} (EFIN: ${profile.efin}) has Software Developer approval.`
  };
}

// ============================================================================
// BANK PRODUCT PROVIDERS
// ============================================================================

export const BANK_PRODUCT_PROVIDERS: BankProductProvider[] = [
  {
    id: "sbtpg",
    name: "Santa Barbara TPG",
    api_url: "https://www.sbtpg.com/api",
    supported_products: ["refund transfer", "cash advance"],
    support_contact: "support@sbtpg.com"
  },
  {
    id: "refundadvantage",
    name: "Refund Advantage",
    api_url: "https://www.refund-advantage.com/api",
    supported_products: ["refund transfer", "prepaid card"],
    support_contact: "support@refund-advantage.com"
  },
  {
    id: "eps",
    name: "EPS Financial",
    api_url: "https://www.epsfinancial.net/api",
    supported_products: ["refund transfer", "cash advance", "prepaid card"],
    support_contact: "support@epsfinancial.net"
  }
];

export const SUPPORTED_PAYMENT_METHODS = [
  "ach",
  "chime",
  "cashapp",
  "credit_card",
  "debit_card",
  "direct_deposit",
  "check",
  "prepaid_card",
  "refund_transfer"
];
