/**
 * ROSS TAX ACADEMY - ENROLLMENT AGREEMENT GENERATOR
 * 
 * Generates enrollment agreements with:
 * - Price lock policy
 * - Payment terms
 * - Refund policy
 * - IRS disclaimers
 * - State compliance addendums
 * - DocuSign integration for signature
 */

import { v4 as uuid } from 'uuid';
import { BUSINESS_INFO } from '../index';

// ============================================================================
// AGREEMENT TEMPLATES
// ============================================================================

export interface EnrollmentAgreementData {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  studentAddress?: string;
  studentState?: string;
  programName: string;
  programCode: string;
  bundleName?: string;
  tuitionLocked: number;
  enrollmentFee: number;
  materialsFee: number;
  totalPrice: number;
  paymentMethod: 'full' | 'payment-plan';
  paymentPlanDownPayment?: number;
  paymentPlanInstallments?: number;
  paymentPlanInterval?: string;
  enrolledAt: string;
  agreementVersion: string;
  termsVersion: string;
}

/**
 * Generate full HTML enrollment agreement
 */
export function generateEnrollmentAgreement(data: EnrollmentAgreementData): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enrollment Agreement - Ross Tax Academy</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #1a4d7a;
      padding-bottom: 15px;
    }
    .logo {
      font-size: 24pt;
      font-weight: bold;
      color: #B8860B;
      margin-bottom: 5px;
    }
    .tagline {
      font-size: 10pt;
      color: #1a4d7a;
      font-style: italic;
    }
    h1 {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      margin: 30px 0 20px 0;
      color: #1a4d7a;
    }
    h2 {
      font-size: 12pt;
      font-weight: bold;
      margin: 20px 0 10px 0;
      color: #1a4d7a;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    h3 {
      font-size: 11pt;
      font-weight: bold;
      margin: 15px 0 5px 0;
    }
    p {
      margin: 10px 0;
      text-align: justify;
    }
    .info-box {
      background-color: #f5f5f5;
      border: 1px solid #1a4d7a;
      padding: 15px;
      margin: 20px 0;
    }
    .info-box strong {
      color: #1a4d7a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    table th, table td {
      border: 1px solid #333;
      padding: 8px;
      text-align: left;
    }
    table th {
      background-color: #1a4d7a;
      color: white;
      font-weight: bold;
    }
    .signature-section {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 50px;
      padding-top: 5px;
    }
    .checkbox {
      display: inline-block;
      width: 15px;
      height: 15px;
      border: 1px solid #000;
      margin-right: 10px;
      vertical-align: middle;
    }
    .disclaimer {
      background-color: #fff9e6;
      border: 2px solid #B8860B;
      padding: 15px;
      margin: 20px 0;
      font-size: 10pt;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      text-align: center;
      color: #666;
    }
    @media print {
      body { padding: 0.25in; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="logo">ROSS TAX ACADEMY</div>
    <div class="tagline">"Train. Certify. Excel."</div>
    <p style="margin: 10px 0 0 0; font-size: 9pt;">
      ${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}<br>
      Phone: ${BUSINESS_INFO.phone_formatted} | Email: ${BUSINESS_INFO.email}<br>
      Website: ${BUSINESS_INFO.website_url}
    </p>
  </div>

  <!-- AGREEMENT TITLE -->
  <h1>STUDENT ENROLLMENT AGREEMENT</h1>
  
  <p style="text-align: center; font-size: 10pt;">
    Agreement Date: <strong>${currentDate}</strong><br>
    Enrollment ID: <strong>${data.enrollmentId}</strong><br>
    Agreement Version: <strong>${data.agreementVersion}</strong>
  </p>

  <!-- STUDENT & PROGRAM INFORMATION -->
  <div class="info-box">
    <h3>Student Information</h3>
    <p>
      <strong>Student Name:</strong> ${data.studentName}<br>
      <strong>Email Address:</strong> ${data.studentEmail}<br>
      ${data.studentAddress ? `<strong>Address:</strong> ${data.studentAddress}<br>` : ''}
      ${data.studentState ? `<strong>State:</strong> ${data.studentState}<br>` : ''}
      <strong>Enrollment Date:</strong> ${new Date(data.enrolledAt).toLocaleDateString('en-US')}
    </p>
    
    <h3>Program Enrollment</h3>
    <p>
      <strong>Program:</strong> ${data.programName}${data.bundleName ? ` (${data.bundleName})` : ''}<br>
      <strong>Program Code:</strong> ${data.programCode}
    </p>
    
    <h3>Tuition & Fees (Price-Locked)</h3>
    <table>
      <tr>
        <th>Item</th>
        <th>Amount</th>
      </tr>
      <tr>
        <td>Tuition</td>
        <td>$${data.tuitionLocked.toFixed(2)}</td>
      </tr>
      ${data.enrollmentFee > 0 ? `<tr><td>Enrollment Fee</td><td>$${data.enrollmentFee.toFixed(2)}</td></tr>` : ''}
      ${data.materialsFee > 0 ? `<tr><td>Materials Fee</td><td>$${data.materialsFee.toFixed(2)}</td></tr>` : ''}
      <tr style="font-weight: bold; background-color: #f5f5f5;">
        <td>Total Amount Due</td>
        <td>$${data.totalPrice.toFixed(2)}</td>
      </tr>
    </table>
    
    <h3>Payment Terms</h3>
    <p>
      <strong>Payment Method:</strong> ${data.paymentMethod === 'full' ? 'Full Payment' : 'Payment Plan'}<br>
      ${data.paymentMethod === 'payment-plan' && data.paymentPlanDownPayment ? `
        <strong>Down Payment:</strong> $${data.paymentPlanDownPayment.toFixed(2)}<br>
        <strong>Installments:</strong> ${data.paymentPlanInstallments} payments of $${((data.totalPrice - data.paymentPlanDownPayment) / data.paymentPlanInstallments!).toFixed(2)} ${data.paymentPlanInterval || 'monthly'}<br>
      ` : ''}
    </p>
  </div>

  <!-- ENROLLMENT TERMS & CONDITIONS -->
  <h2>1. Enrollment Terms & Conditions</h2>
  
  <p>
    By enrolling in a Ross Tax Academy program, the student ("Student") acknowledges and agrees to the following terms and conditions:
  </p>

  <h3>1.1 Tuition & Payment</h3>
  <p>
    All tuition and fees are due according to the selected payment option. Tuition is non-transferable between students or programs unless approved in writing by Ross Tax Academy.
  </p>
  
  <p>
    <strong>Payment Responsibility:</strong> Student agrees to pay all tuition and fees according to the payment schedule outlined above. Failure to make timely payments may result in suspension of LMS access and administrative withdrawal.
  </p>

  <h3>1.2 Tuition Price Lock Policy</h3>
  <div class="disclaimer">
    <strong>PRICE LOCK GUARANTEE</strong><br><br>
    Tuition rates are locked at the time of enrollment. Once a student enrolls and submits payment or enters into an approved payment arrangement, the tuition price for that program will not increase for the duration of the enrolled course.
    <br><br>
    Price locks apply only to the specific program(s) selected at enrollment and do not extend to future courses, retakes, upgrades, additional certifications, or supplemental materials unless explicitly stated in writing.
    <br><br>
    Ross Tax Academy reserves the right to adjust tuition pricing for future enrollment periods without prior notice.
  </div>

  <h3>1.3 No Guarantee of Licensure or Certification</h3>
  <p>
    <strong>IMPORTANT:</strong> Completion of coursework does not guarantee licensure, certification, employment, or IRS credential approval. Students are solely responsible for meeting all federal, state, and regulatory requirements for professional tax practice.
  </p>

  <h3>1.4 Access & Completion</h3>
  <p>
    LMS access is granted for the specified course duration upon enrollment confirmation and payment. Failure to complete coursework within the allotted time may require re-enrollment at current tuition rates.
  </p>
  
  <p>
    <strong>Course Access Duration:</strong> Students have access to LMS materials for the duration specified in their program enrollment. Extensions may be available for a fee.
  </p>

  <!-- PAGE BREAK FOR PRINTING -->
  <div class="page-break"></div>

  <h2>2. Refund & Cancellation Policy</h2>
  
  <h3>2.1 Three-Day Cancellation Window</h3>
  <p>
    Students may cancel enrollment within <strong>three (3) business days</strong> of registration for a full refund of tuition paid, excluding non-refundable materials or processing fees, if applicable.
  </p>

  <h3>2.2 Refunds After Cancellation Period</h3>
  <p>
    After the three-day cancellation period, refunds are issued according to the following terms:
  </p>
  
  <table>
    <tr>
      <th>Timing</th>
      <th>Refund Policy</th>
    </tr>
    <tr>
      <td>Before LMS access begins</td>
      <td>Tuition paid minus administrative fees</td>
    </tr>
    <tr>
      <td>After LMS access is granted</td>
      <td>No refunds will be issued</td>
    </tr>
    <tr>
      <td>After coursework has commenced</td>
      <td>No refunds, partial refunds, or credits</td>
    </tr>
  </table>

  <p>
    <strong>Course Commencement:</strong> Course access, digital materials download, and LMS usage constitute course commencement. Once any of these actions occur, the Student is no longer eligible for a refund.
  </p>

  <p>
    All cancellation requests must be submitted in writing to <a href="mailto:${BUSINESS_INFO.email}">${BUSINESS_INFO.email}</a>. Refunds, if approved, will be processed within 30 days of confirmation.
  </p>

  <h2>3. Payment Plan Terms</h2>
  
  ${data.paymentMethod === 'payment-plan' ? `
    <p>
      Ross Tax Academy offers payment plans as a convenience. Payment plans do not alter the total tuition owed.
    </p>
    
    <h3>3.1 Payment Plan Requirements</h3>
    <ul>
      <li>All payments must be made on time per the agreed schedule</li>
      <li>Late or missed payments may result in suspension of LMS access</li>
      <li>Tuition balances remain due regardless of course completion status</li>
      <li>Failure to complete payments may result in administrative withdrawal</li>
      <li>Payment plans are not refunds, scholarships, or tuition reductions</li>
    </ul>
    
    <p>
      <strong>Late Payment:</strong> A late fee of $25 will be assessed for any payment received more than 7 days after the due date.
    </p>
  ` : `
    <p>
      Student has elected to pay tuition in full. No payment plan terms apply.
    </p>
  `}

  <h2>4. Code of Conduct & Professional Standards</h2>
  
  <p>
    Students are expected to adhere to ethical standards consistent with IRS Circular 230 and professional tax practices. Violations of academic integrity, professional conduct, or applicable laws may result in dismissal without refund.
  </p>

  <h3>4.1 Academic Integrity</h3>
  <p>
    Students must complete all coursework independently unless explicitly instructed otherwise. Plagiarism, cheating, or unauthorized collaboration will result in immediate dismissal.
  </p>

  <h3>4.2 Professional Conduct</h3>
  <p>
    Students represent Ross Tax Academy in their professional conduct. Unprofessional behavior, harassment, or violations of tax law may result in dismissal.
  </p>

  <!-- PAGE BREAK FOR PRINTING -->
  <div class="page-break"></div>

  <h2>5. IRS Circular 230 Disclaimer</h2>
  
  <div class="disclaimer">
    <strong>IRS DISCLOSURE - IMPORTANT</strong><br><br>
    Courses offered by Ross Tax Academy are designed for educational purposes only. Completion of coursework does not authorize a student to represent taxpayers before the IRS unless the student independently meets all IRS eligibility and credentialing requirements.
    <br><br>
    Nothing in this program constitutes tax advice, legal advice, or a guarantee of IRS credential approval.
    <br><br>
    Students seeking to practice before the IRS must comply with IRS Circular 230 and applicable federal regulations. Ross Tax Academy does not guarantee IRS credential approval, employment, or licensure.
  </div>

  <h2>6. State Compliance & Regulatory Notice</h2>
  
  <p>
    <strong>Regulatory Compliance:</strong> Ross Tax Academy operates as a private educational training provider. Program availability, refund policies, and disclosures may be subject to state-specific education and consumer protection regulations.
  </p>
  
  <p>
    Students are responsible for verifying that course completion meets any applicable state licensing, registration, or professional requirements in their jurisdiction.
  </p>
  
  <p>
    <strong>Disclaimer:</strong> Ross Tax Academy does not provide legal advice regarding state eligibility or licensing. Students should consult with their state's regulatory board or licensing authority.
  </p>

  ${data.studentState ? generateStateComplianceAddendum(data.studentState) : ''}

  <h2>7. Policy Modifications</h2>
  
  <p>
    Ross Tax Academy reserves the right to update policies, course content, and delivery methods as needed to maintain compliance and instructional quality. Material changes to enrollment terms will be communicated to enrolled students in writing.
  </p>

  <h2>8. Dispute Resolution</h2>
  
  <p>
    Any disputes arising from this agreement shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in Bell County, Texas.
  </p>

  <!-- ACKNOWLEDGMENT & SIGNATURE -->
  <div class="signature-section">
    <h2>Student Acknowledgment & Agreement</h2>
    
    <p>
      By signing below, the Student acknowledges that they have read, understood, and agree to all terms and conditions outlined in this Enrollment Agreement, including:
    </p>
    
    <ul style="list-style-type: none; padding-left: 0;">
      <li><span class="checkbox"></span> Tuition Price Lock Policy</li>
      <li><span class="checkbox"></span> Refund & Cancellation Policy (3-day window)</li>
      <li><span class="checkbox"></span> Payment Plan Terms (if applicable)</li>
      <li><span class="checkbox"></span> IRS Circular 230 Disclaimer</li>
      <li><span class="checkbox"></span> No Guarantee of Licensure or Certification</li>
      <li><span class="checkbox"></span> State Compliance Notice</li>
      <li><span class="checkbox"></span> Code of Conduct & Professional Standards</li>
    </ul>
    
    <p style="margin-top: 30px;">
      <strong>Student Full Name (Print):</strong> ${data.studentName}
    </p>
    
    <div class="signature-line">
      <strong>Student Signature:</strong> ___________________________________ <strong>Date:</strong> _______________
    </div>
    
    <p style="margin-top: 30px; font-size: 9pt; color: #666;">
      <strong>Electronic Signature Notice:</strong> This document may be signed electronically via DocuSign. Electronic signatures have the same legal effect as handwritten signatures.
    </p>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p>
      <strong>ROSS TAX ACADEMY</strong><br>
      ${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}<br>
      Phone: ${BUSINESS_INFO.phone_formatted} | Email: ${BUSINESS_INFO.email}<br>
      www.rosstaxprepandbookkeeping.com
    </p>
    <p style="font-size: 8pt; margin-top: 10px;">
      Agreement ID: ${data.enrollmentId} | Version: ${data.agreementVersion} | Generated: ${currentDate}
    </p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Generate state-specific compliance addendum
 */
function generateStateComplianceAddendum(state: string): string {
  // State-specific notices (examples - expand as needed)
  const stateNotices: Record<string, string> = {
    'CA': `
      <h3>6.1 California Residents</h3>
      <p>
        California students have the right to cancel enrollment within three business days of signing the enrollment agreement and receive a full refund. Students who withdraw after the cancellation period are entitled to a pro-rata refund based on instruction completed, less administrative fees.
      </p>
      <p>
        California Bureau for Private Postsecondary Education: <a href="https://www.bppe.ca.gov">www.bppe.ca.gov</a>
      </p>
    `,
    'TX': `
      <h3>6.1 Texas Residents</h3>
      <p>
        Ross Tax Academy is a private educational training provider operating in Texas. Texas residents have the right to cancel within three business days for a full refund.
      </p>
    `,
    'NY': `
      <h3>6.1 New York Residents</h3>
      <p>
        New York students are entitled to a refund based on the refund policy outlined in Section 2. Ross Tax Academy complies with New York Education Law and regulations governing private career schools.
      </p>
    `,
    'FL': `
      <h3>6.1 Florida Residents</h3>
      <p>
        Florida students have the right to cancel within three business days and receive a full refund. Ross Tax Academy complies with Florida Commission for Independent Education regulations.
      </p>
    `
  };
  
  return stateNotices[state] || `
    <h3>6.1 ${state} Residents</h3>
    <p>
      Students in ${state} should verify that this program meets any state-specific licensing or educational requirements. Contact your state's education department or licensing board for more information.
    </p>
  `;
}

/**
 * Generate DocuSign envelope for enrollment agreement
 */
export async function createDocuSignEnrollmentAgreement(
  env: any,
  enrollmentData: EnrollmentAgreementData,
  studentEmail: string,
  studentName: string
): Promise<{ success: boolean; envelopeId?: string; error?: string }> {
  try {
    // Generate agreement HTML
    const agreementHtml = generateEnrollmentAgreement(enrollmentData);
    
    // Convert HTML to base64 for DocuSign
    const agreementBase64 = btoa(unescape(encodeURIComponent(agreementHtml)));
    
    // Get DocuSign access token (from existing implementation in index.ts)
    const accessToken = await getDocuSignAccessToken(env);
    
    // Create DocuSign envelope
    const envelopeDefinition = {
      emailSubject: `Ross Tax Academy - Enrollment Agreement (${enrollmentData.programName})`,
      documents: [
        {
          documentBase64: agreementBase64,
          name: 'Enrollment Agreement',
          fileExtension: 'html',
          documentId: '1'
        }
      ],
      recipients: {
        signers: [
          {
            email: studentEmail,
            name: studentName,
            recipientId: '1',
            routingOrder: '1',
            tabs: {
              signHereTabs: [
                {
                  documentId: '1',
                  pageNumber: '1',
                  xPosition: '100',
                  yPosition: '700'
                }
              ],
              dateSignedTabs: [
                {
                  documentId: '1',
                  pageNumber: '1',
                  xPosition: '400',
                  yPosition: '700'
                }
              ],
              checkboxTabs: [
                { documentId: '1', pageNumber: '1', xPosition: '50', yPosition: '600', required: 'true', tabLabel: 'Price Lock' },
                { documentId: '1', pageNumber: '1', xPosition: '50', yPosition: '620', required: 'true', tabLabel: 'Refund Policy' },
                { documentId: '1', pageNumber: '1', xPosition: '50', yPosition: '640', required: 'true', tabLabel: 'Payment Terms' },
                { documentId: '1', pageNumber: '1', xPosition: '50', yPosition: '660', required: 'true', tabLabel: 'IRS Disclaimer' },
                { documentId: '1', pageNumber: '1', xPosition: '50', yPosition: '680', required: 'true', tabLabel: 'No Guarantee' }
              ]
            }
          }
        ]
      },
      status: 'sent'
    };
    
    const response = await fetch(
      `${env.DOCUSIGN_BASE_URL}/v2.1/accounts/${env.DOCUSIGN_ACCOUNT_ID}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }
    
    const envelope = await response.json() as { envelopeId: string };
    
    // Store agreement in database
    const agreementId = uuid();
    await env.DB.prepare(`
      INSERT INTO lms_enrollment_agreements (
        id, enrollment_id, student_id, agreement_type, agreement_version,
        agreement_html, docusign_envelope_id, docusign_status, docusign_sent_at,
        terms_version, price_lock_acknowledged, refund_policy_acknowledged,
        irs_disclaimer_acknowledged, state_compliance_acknowledged, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      agreementId,
      enrollmentData.enrollmentId,
      0, // student_id (to be updated)
      'enrollment',
      enrollmentData.agreementVersion,
      agreementHtml,
      envelope.envelopeId,
      'sent',
      new Date().toISOString(),
      enrollmentData.termsVersion,
      0, 0, 0, 0
    ).run();
    
    return { success: true, envelopeId: envelope.envelopeId };
  } catch (error: any) {
    console.error('DocuSign enrollment agreement error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper: Get DocuSign access token
 */
async function getDocuSignAccessToken(env: any): Promise<string> {
  // JWT authentication flow (existing implementation from index.ts)
  const jwtPayload = {
    iss: env.DOCUSIGN_INTEGRATION_KEY,
    sub: env.DOCUSIGN_IMPERSONATED_USER,
    aud: 'account-d.docusign.com',
    scope: 'signature',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  // Sign JWT (simplified - use proper JWT library in production)
  const jwtToken = btoa(JSON.stringify(jwtPayload));
  
  const response = await fetch('https://account-d.docusign.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
  });
  
  if (!response.ok) {
    throw new Error('Failed to obtain DocuSign access token');
  }
  
  const data = await response.json() as { access_token: string };
  return data.access_token;
}

export { EnrollmentAgreementData, generateEnrollmentAgreement, createDocuSignEnrollmentAgreement };
