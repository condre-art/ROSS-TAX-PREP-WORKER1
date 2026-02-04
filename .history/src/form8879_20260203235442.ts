/**
 * Form 8879 - IRS e-Signature Authorization for Electronic Filing
 * 
 * Required for all individual, business, and fiduciary electronic return submissions.
 * Captures taxpayer consent and signature for e-file transmission.
 */

import { v4 as uuid } from 'uuid';
import { logAudit } from './utils/audit';

export interface Form8879 {
  form_id: string;
  return_id: number;
  client_id: string;
  
  // Taxpayer Information
  taxpayer_name: string;
  taxpayer_ssn_encrypted: string;
  taxpayer_phone: string;
  taxpayer_email: string;
  taxpayer_date_of_birth: string;
  
  // Spouse Information (if applicable)
  spouse_name?: string;
  spouse_ssn_encrypted?: string;
  spouse_date_of_birth?: string;
  
  // Preparer Information
  preparer_name: string;
  preparer_efin: string;
  preparer_ptin: string;
  preparer_npi?: string;
  preparer_phone: string;
  preparer_email: string;
  preparer_signature_date: string;
  
  // Signature Authorization
  signature_method: 'digital_signature' | 'esignature' | 'facsimile'; // IRS approved methods
  taxpayer_signature_method: 'digital_signature' | 'pin_plus_password' | 'voice_signature';
  taxpayer_signature_date: string;
  taxpayer_signature_ip_address: string;
  taxpayer_signature_device_fingerprint: string;
  
  // Spouse Signature (if applicable)
  spouse_signature_method?: string;
  spouse_signature_date?: string;
  spouse_signature_ip_address?: string;
  
  // Declaration
  declaration_of_representative: string; // Preparer's certification text
  declaration_of_taxpayer: string; // Taxpayer's certification text
  
  // Document Info
  return_form_type: string; // 1040, 1040-ES, 1040-NR, 1065, etc.
  tax_year: number;
  refund_amount?: number;
  tax_due?: number;
  
  // E-file Submission
  form_8879_version: string; // IRS version (e.g., 20250101)
  form_8879_xml: string; // Generated XML for transmission
  
  // Status
  status: 'draft' | 'signed_by_preparer' | 'signed_by_taxpayer' | 'ready_for_transmission' | 'transmitted' | 'acknowledged' | 'rejected';
  signature_completion_percentage: number; // 0-100%
  
  // Audit Trail
  created_at: string;
  updated_at: string;
  transmitted_at?: string;
  acknowledged_at?: string;
  preparer_signed_at?: string;
  taxpayer_signed_at?: string;
}

/**
 * Create Form 8879 record
 */
export async function createForm8879(
  env: any,
  data: {
    return_id: number;
    client_id: string;
    taxpayer_name: string;
    taxpayer_ssn_encrypted: string;
    taxpayer_phone: string;
    taxpayer_email: string;
    taxpayer_date_of_birth: string;
    preparer_name: string;
    preparer_efin: string;
    preparer_ptin: string;
    preparer_phone: string;
    preparer_email: string;
    return_form_type: string;
    tax_year: number;
    refund_amount?: number;
    tax_due?: number;
  }
): Promise<Form8879> {
  const formId = uuid();
  const now = new Date().toISOString();
  
  const form: Form8879 = {
    form_id: formId,
    return_id: data.return_id,
    client_id: data.client_id,
    taxpayer_name: data.taxpayer_name,
    taxpayer_ssn_encrypted: data.taxpayer_ssn_encrypted,
    taxpayer_phone: data.taxpayer_phone,
    taxpayer_email: data.taxpayer_email,
    taxpayer_date_of_birth: data.taxpayer_date_of_birth,
    preparer_name: data.preparer_name,
    preparer_efin: data.preparer_efin,
    preparer_ptin: data.preparer_ptin,
    preparer_phone: data.preparer_phone,
    preparer_email: data.preparer_email,
    preparer_signature_date: '',
    signature_method: 'digital_signature',
    taxpayer_signature_method: 'pin_plus_password',
    taxpayer_signature_date: '',
    taxpayer_signature_ip_address: '',
    taxpayer_signature_device_fingerprint: '',
    declaration_of_representative: `I authorize ${data.preparer_name} (PTIN: ${data.preparer_ptin}, EFIN: ${data.preparer_efin}) to electronically submit this tax return to the IRS on my behalf.`,
    declaration_of_taxpayer: `I hereby authorize the above named preparer to electronically submit my ${data.tax_year} tax return to the IRS. I declare that I have examined the return and supporting schedules and statements, and to the best of my knowledge and belief, they are true, correct, and complete.`,
    return_form_type: data.return_form_type,
    tax_year: data.tax_year,
    refund_amount: data.refund_amount,
    tax_due: data.tax_due,
    form_8879_version: '20250101',
    form_8879_xml: '',
    status: 'draft',
    signature_completion_percentage: 0,
    created_at: now,
    updated_at: now
  };
  
  // Store in database
  await env.DB.prepare(`
    INSERT INTO form_8879 (
      form_id, return_id, client_id,
      taxpayer_name, taxpayer_ssn_encrypted, taxpayer_phone, taxpayer_email, taxpayer_date_of_birth,
      preparer_name, preparer_efin, preparer_ptin, preparer_phone, preparer_email,
      return_form_type, tax_year, refund_amount, tax_due,
      form_8879_version, status, signature_completion_percentage,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    form.form_id, form.return_id, form.client_id,
    form.taxpayer_name, form.taxpayer_ssn_encrypted, form.taxpayer_phone, form.taxpayer_email, form.taxpayer_date_of_birth,
    form.preparer_name, form.preparer_efin, form.preparer_ptin, form.preparer_phone, form.preparer_email,
    form.return_form_type, form.tax_year, form.refund_amount, form.tax_due,
    form.form_8879_version, form.status, form.signature_completion_percentage,
    form.created_at, form.updated_at
  ).run();
  
  return form;
}

/**
 * Sign Form 8879 as preparer
 */
export async function signForm8879AsPreparer(
  env: any,
  formId: string,
  preparerId: string,
  ipAddress: string
): Promise<Form8879> {
  const now = new Date().toISOString();
  
  // Get form
  const form = await env.DB.prepare(
    'SELECT * FROM form_8879 WHERE form_id = ?'
  ).bind(formId).first() as any;
  
  if (!form) {
    throw new Error('Form 8879 not found');
  }
  
  // Update with preparer signature
  await env.DB.prepare(`
    UPDATE form_8879
    SET status = 'signed_by_preparer',
        preparer_signature_date = ?,
        signature_completion_percentage = 50,
        updated_at = ?
    WHERE form_id = ?
  `).bind(now, now, formId).run();
  
  // Log audit
  await logAudit(env, {
    action: 'form_8879_signed_by_preparer',
    resource_type: 'form_8879',
    resource_id: formId,
    user_id: preparerId,
    details: {
      return_id: form.return_id,
      client_id: form.client_id,
      ip_address: ipAddress
    }
  });
  
  form.status = 'signed_by_preparer';
  form.preparer_signature_date = now;
  form.signature_completion_percentage = 50;
  
  return form;
}

/**
 * Sign Form 8879 as taxpayer (PIN + Password method)
 */
export async function signForm8879AsTaxpayer(
  env: any,
  formId: string,
  taxpayerId: string,
  pin: string,
  ipAddress: string,
  deviceFingerprint: string
): Promise<Form8879> {
  const now = new Date().toISOString();
  
  // Get form
  const form = await env.DB.prepare(
    'SELECT * FROM form_8879 WHERE form_id = ?'
  ).bind(formId).first() as any;
  
  if (!form) {
    throw new Error('Form 8879 not found');
  }
  
  if (form.status !== 'signed_by_preparer') {
    throw new Error('Preparer must sign first');
  }
  
  // Validate PIN (4-digit code previously issued via email/SMS)
  const isValidPin = await validateTaxpayerPin(env, taxpayerId, pin);
  if (!isValidPin) {
    throw new Error('Invalid PIN');
  }
  
  // Update with taxpayer signature
  await env.DB.prepare(`
    UPDATE form_8879
    SET status = 'ready_for_transmission',
        taxpayer_signature_date = ?,
        taxpayer_signature_ip_address = ?,
        taxpayer_signature_device_fingerprint = ?,
        signature_completion_percentage = 100,
        updated_at = ?
    WHERE form_id = ?
  `).bind(now, ipAddress, deviceFingerprint, now, formId).run();
  
  // Log audit
  await logAudit(env, {
    action: 'form_8879_signed_by_taxpayer',
    resource_type: 'form_8879',
    resource_id: formId,
    user_id: taxpayerId,
    details: {
      return_id: form.return_id,
      ip_address: ipAddress,
      device_fingerprint: deviceFingerprint
    }
  });
  
  form.status = 'ready_for_transmission';
  form.taxpayer_signature_date = now;
  form.taxpayer_signature_ip_address = ipAddress;
  form.taxpayer_signature_device_fingerprint = deviceFingerprint;
  form.signature_completion_percentage = 100;
  
  return form;
}

/**
 * Generate Form 8879 XML for IRS transmission
 */
export async function generateForm8879XML(
  env: any,
  formId: string
): Promise<string> {
  const form = await env.DB.prepare(
    'SELECT * FROM form_8879 WHERE form_id = ?'
  ).bind(formId).first() as any;
  
  if (!form || form.status !== 'ready_for_transmission') {
    throw new Error('Form 8879 must be fully signed before XML generation');
  }
  
  // Generate XML according to IRS specifications (Publication 1452)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Form8879 xmlns="urn:us:gov:treasury:irs:ext:efile:form8879" version="${form.form_8879_version}">
  <TaxpayerInfo>
    <Name>${form.taxpayer_name}</Name>
    <SSN>${form.taxpayer_ssn_encrypted}</SSN>
    <DateOfBirth>${form.taxpayer_date_of_birth}</DateOfBirth>
    <Phone>${form.taxpayer_phone}</Phone>
    <Email>${form.taxpayer_email}</Email>
  </TaxpayerInfo>
  
  <PreparerInfo>
    <Name>${form.preparer_name}</Name>
    <EFIN>${form.preparer_efin}</EFIN>
    <PTIN>${form.preparer_ptin}</PTIN>
    <Phone>${form.preparer_phone}</Phone>
    <Email>${form.preparer_email}</Email>
  </PreparerInfo>
  
  <ReturnInfo>
    <FormType>${form.return_form_type}</FormType>
    <TaxYear>${form.tax_year}</TaxYear>
    <RefundAmount>${form.refund_amount || 0}</RefundAmount>
    <TaxDue>${form.tax_due || 0}</TaxDue>
  </ReturnInfo>
  
  <Signatures>
    <PreparerSignature>
      <SignatureDate>${form.preparer_signature_date}</SignatureDate>
      <SignatureMethod>${form.signature_method}</SignatureMethod>
    </PreparerSignature>
    <TaxpayerSignature>
      <SignatureDate>${form.taxpayer_signature_date}</SignatureDate>
      <SignatureMethod>${form.taxpayer_signature_method}</SignatureMethod>
      <IPAddress>${form.taxpayer_signature_ip_address}</IPAddress>
      <DeviceFingerprint>${form.taxpayer_signature_device_fingerprint}</DeviceFingerprint>
    </TaxpayerSignature>
  </Signatures>
  
  <Declarations>
    <PreparerDeclaration>${form.declaration_of_representative}</PreparerDeclaration>
    <TaxpayerDeclaration>${form.declaration_of_taxpayer}</TaxpayerDeclaration>
  </Declarations>
  
  <Metadata>
    <FormID>${form.form_id}</FormID>
    <ReturnID>${form.return_id}</ReturnID>
    <CreatedAt>${form.created_at}</CreatedAt>
    <UpdatedAt>${form.updated_at}</UpdatedAt>
  </Metadata>
</Form8879>`;
  
  // Store generated XML
  await env.DB.prepare(
    'UPDATE form_8879 SET form_8879_xml = ? WHERE form_id = ?'
  ).bind(xml, formId).run();
  
  return xml;
}

/**
 * Get Form 8879 by ID
 */
export async function getForm8879(env: any, formId: string): Promise<Form8879> {
  const form = await env.DB.prepare(
    'SELECT * FROM form_8879 WHERE form_id = ?'
  ).bind(formId).first();
  
  if (!form) {
    throw new Error('Form 8879 not found');
  }
  
  return form as Form8879;
}

/**
 * Get Form 8879 by return ID
 */
export async function getForm8879ByReturn(env: any, returnId: number): Promise<Form8879> {
  const form = await env.DB.prepare(
    'SELECT * FROM form_8879 WHERE return_id = ?'
  ).bind(returnId).first();
  
  if (!form) {
    throw new Error('Form 8879 not found for this return');
  }
  
  return form as Form8879;
}

/**
 * List all Form 8879s for a client
 */
export async function listForm8879ByClient(
  env: any,
  clientId: string,
  options?: { tax_year?: number; status?: string }
): Promise<Form8879[]> {
  let query = 'SELECT * FROM form_8879 WHERE client_id = ?';
  const params: any[] = [clientId];
  
  if (options?.tax_year) {
    query += ' AND tax_year = ?';
    params.push(options.tax_year);
  }
  
  if (options?.status) {
    query += ' AND status = ?';
    params.push(options.status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const forms = await env.DB.prepare(query).bind(...params).all();
  return forms.results as Form8879[];
}

/**
 * Validate taxpayer PIN (4-digit code sent via email/SMS)
 */
async function validateTaxpayerPin(env: any, taxpayerId: string, pin: string): Promise<boolean> {
  const record = await env.DB.prepare(
    'SELECT * FROM taxpayer_pins WHERE client_id = ? AND pin = ? AND expires_at > datetime("now")'
  ).bind(taxpayerId, pin).first();
  
  if (!record) {
    return false;
  }
  
  // Invalidate PIN after first use
  await env.DB.prepare(
    'DELETE FROM taxpayer_pins WHERE client_id = ? AND pin = ?'
  ).bind(taxpayerId, pin).run();
  
  return true;
}

/**
 * Issue PIN to taxpayer via email/SMS
 */
export async function issueTaxpayerPin(
  env: any,
  clientId: string,
  email: string,
  phone: string
): Promise<string> {
  // Generate 4-digit PIN
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
  
  // Store PIN
  await env.DB.prepare(`
    INSERT INTO taxpayer_pins (client_id, pin, email, phone, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(clientId, pin, email, phone, expiresAt).run();
  
  // Send PIN via email
  await sendPINEmail(env, email, pin);
  
  // Send PIN via SMS (optional)
  if (phone) {
    await sendPINSMS(env, phone, pin);
  }
  
  return pin;
}

/**
 * Helper: Send PIN via email
 */
async function sendPINEmail(env: any, email: string, pin: string): Promise<void> {
  const html = `
    <h2>Your Form 8879 Signature PIN</h2>
    <p>Your PIN to sign your e-file Form 8879 is:</p>
    <h1 style="font-size: 48px; letter-spacing: 10px;">${pin}</h1>
    <p>This PIN will expire in 15 minutes.</p>
    <p>Do not share this code with anyone.</p>
  `;
  
  // Send via MailChannels
  await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Token': env.MAILCHANNELS_API_TOKEN
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: 'noreply@rosstaxprepandbookkeeping.com', name: 'Ross Tax Prep' },
      subject: 'Your Form 8879 Signature PIN',
      html
    })
  });
}

/**
 * Helper: Send PIN via SMS
 */
async function sendPINSMS(env: any, phone: string, pin: string): Promise<void> {
  // Use Twilio or similar
  // await twilio.messages.create({
  //   body: `Your Ross Tax Prep Form 8879 PIN is: ${pin}. This expires in 15 minutes.`,
  //   from: env.TWILIO_PHONE,
  //   to: phone
  // });
}
