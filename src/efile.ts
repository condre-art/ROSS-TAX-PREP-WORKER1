// efile.ts
// E-file transmission extension and integration for DIY and ERO/PTIN workflows
// Integrated with IRS MeF A2A Web Services

import { createMefClient, MefSubmission, MefAcknowledgment, MefOperationResult } from './mef';
import { createSchemaValidator, ReturnType } from './schemaValidator';
import { ERO_EFIN_PROFILE, MEF_CONFIG, getActiveEtin, isTransmissionEnabled } from './efileProviders';

export type EFileStatus =
  | "created"
  | "pending"
  | "transmitting"
  | "accepted"
  | "rejected"
  | "error"
  | "completed";

export interface EFileTransmission {
  id: string;
  return_id: number;
  client_id: number;
  preparer_id?: number; // ERO/PTIN holder
  method: "DIY" | "ERO";
  status: EFileStatus;
  irs_submission_id?: string;
  ack_code?: string;
  ack_message?: string;
  dcn?: string; // Document Control Number
  efin?: string;
  etin?: string;
  environment?: string;
  created_at: string;
  updated_at: string;
}

export interface TransmitResult {
  success: boolean;
  transmission: EFileTransmission;
  mefResult?: MefOperationResult<MefSubmission>;
  errors?: string[];
}

/**
 * Transmit e-file to IRS via MeF A2A
 * 
 * @param env - Environment with DB and MeF credentials
 * @param transmission - E-file transmission record
 * @param returnXml - XML content of tax return (IRS schema compliant)
 * @param returnType - Return type (1040, 1040-SR, etc.)
 * @param taxYear - Tax year being filed
 */
export async function transmitEFile(
  env: any,
  transmission: EFileTransmission,
  returnXml?: string,
  returnType: string = "1040",
  taxYear: string = "2025"
): Promise<TransmitResult> {
  const now = new Date().toISOString();
  const mefClient = createMefClient(env);
  const schemaValidator = createSchemaValidator();
  
  console.log(`[E-File] Starting transmission for return ${transmission.return_id}`);
  console.log(`[E-File] Environment: ${MEF_CONFIG.environment}`);
  console.log(`[E-File] Profile: ${ERO_EFIN_PROFILE.firm_name}`);
  console.log(`[E-File] EFIN: ${ERO_EFIN_PROFILE.efin}, ETIN: ${getActiveEtin()}`);

  // Check kill switch
  if (!isTransmissionEnabled()) {
    console.log('[E-File] Transmissions disabled (kill switch active)');
    return {
      success: false,
      transmission: {
        ...transmission,
        status: "error",
        ack_message: "Transmissions are currently disabled",
        updated_at: now,
      },
      errors: ["Transmissions disabled"]
    };
  }

  // If no XML provided, this is a test/demo transmission
  if (!returnXml) {
    console.log('[E-File] No return XML provided - running in test mode');
    
    return {
      success: true,
      transmission: {
        ...transmission,
        status: "accepted",
        irs_submission_id: "TEST-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
        ack_code: "A0000",
        ack_message: "Test submission accepted",
        efin: ERO_EFIN_PROFILE.efin,
        etin: getActiveEtin(),
        environment: MEF_CONFIG.environment,
        updated_at: now,
      }
    };
  }

  // Validate return XML using schema validator
  const validation = schemaValidator.validate(returnXml, returnType as ReturnType, {
    taxYear,
    environment: MEF_CONFIG.environment as 'ATS' | 'PRODUCTION'
  });
  
  if (!validation.valid) {
    console.error('[E-File] Schema validation failed:', validation.errors);
    return {
      success: false,
      transmission: {
        ...transmission,
        status: "error",
        ack_message: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        updated_at: now,
      },
      errors: validation.errors.map(e => `[${e.code}] ${e.message}`)
    };
  }

  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('[E-File] Schema validation warnings:', validation.warnings);
  }

  try {
    // Update status to transmitting
    transmission.status = "transmitting";
    transmission.updated_at = now;

    // Send to IRS via MeF
    const mefResult = await mefClient.sendSubmission(returnXml, returnType, taxYear);
    
    if (!mefResult.success || !mefResult.data) {
      console.error('[E-File] MeF submission failed:', mefResult.error);
      return {
        success: false,
        transmission: {
          ...transmission,
          status: "error",
          ack_message: mefResult.error || "Submission failed",
          updated_at: now,
        },
        mefResult,
        errors: [mefResult.error || "Unknown error"]
      };
    }
    
    console.log(`[E-File] Submission sent: ${mefResult.data.submissionId}`);

    // Update transmission with MeF details
    const updatedTransmission: EFileTransmission = {
      ...transmission,
      status: mefResult.data.status === 'Received' ? 'pending' : 'transmitting',
      irs_submission_id: mefResult.data.submissionId,
      efin: mefResult.data.efin,
      etin: mefResult.data.etin,
      environment: mefResult.data.environment,
      updated_at: new Date().toISOString(),
    };

    return {
      success: true,
      transmission: updatedTransmission,
      mefResult
    };

  } catch (error: any) {
    console.error('[E-File] Transmission failed:', error);
    
    return {
      success: false,
      transmission: {
        ...transmission,
        status: "error",
        ack_message: error.message || "Transmission failed",
        updated_at: now,
      },
      errors: [error.message]
    };
  }
}

/**
 * Check status of a pending submission
 */
export async function checkSubmissionStatus(
  env: any,
  submissionId: string
): Promise<{ status: string; acknowledgment?: MefAcknowledgment }> {
  const mefClient = createMefClient(env);
  
  console.log(`[E-File] Checking status for ${submissionId}`);
  
  const statusResult = await mefClient.getSubmissionStatus(submissionId);
  
  if (!statusResult.success || !statusResult.data) {
    return { status: 'Error' };
  }
  
  const status = statusResult.data;
  
  if (status === 'Accepted' || status === 'Rejected') {
    const ackResult = await mefClient.getAcknowledgment(submissionId);
    return { 
      status, 
      acknowledgment: ackResult.success ? ackResult.data || undefined : undefined 
    };
  }
  
  return { status };
}

/**
 * Process new acknowledgments from IRS
 */
export async function processNewAcknowledgments(env: any): Promise<MefAcknowledgment[]> {
  const mefClient = createMefClient(env);
  
  console.log('[E-File] Processing new acknowledgments');
  
  const acksResult = await mefClient.getNewAcknowledgments();
  
  if (!acksResult.success || !acksResult.data) {
    console.error('[E-File] Failed to get acknowledgments:', acksResult.error);
    return [];
  }
  
  const acks = acksResult.data;
  
  for (const ack of acks) {
    console.log(`[E-File] Processing ack: ${ack.ackId} - ${ack.status}`);
    
    // Update transmission record in database
    if (env.DB) {
      await env.DB.prepare(`
        UPDATE efile_transmissions 
        SET status = ?, 
            ack_code = ?,
            ack_message = ?,
            dcn = ?,
            updated_at = ?
        WHERE irs_submission_id = ?
      `).bind(
        ack.status.toLowerCase(),
        ack.status === 'Accepted' ? 'A0000' : 'R0000',
        ack.status === 'Accepted' ? 'Accepted by IRS' : (ack.errors?.[0]?.errorMessage || 'Rejected'),
        ack.dcn || null,
        new Date().toISOString(),
        ack.submissionId
      ).run();
    }
  }
  
  return acks;
}

/**
 * Get e-file status summary
 */
export function getEFileStatusInfo(): {
  environment: string;
  profile: string;
  efin: string;
  etin: string;
  softwareDevApproved: boolean;
  atsEndpoint: string;
  prodEndpoint: string;
} {
  return {
    environment: MEF_CONFIG.environment,
    profile: ERO_EFIN_PROFILE.firm_name,
    efin: ERO_EFIN_PROFILE.efin,
    etin: getActiveEtin(),
    softwareDevApproved: ERO_EFIN_PROFILE.software_developer_approved,
    atsEndpoint: MEF_CONFIG.endpoints.ATS_BASE,
    prodEndpoint: MEF_CONFIG.endpoints.PROD_BASE
  };
}
