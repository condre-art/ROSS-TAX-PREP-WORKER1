// src/utils/certificates.ts
// Certificate PDF generation and management

interface CertificateData {
  studentName: string;
  programName: string;
  completionDate: string;
  certificateCode: string;
  instructorName?: string;
  instructorTitle?: string;
  issueDate: string;
  expiryDate?: string;
  specialHonors?: string;
  programHours?: number;
}

interface CertificateGenerationResult {
  success: boolean;
  certificateCode: string;
  pdfUrl?: string;
  error?: string;
}

/**
 * Generate HTML certificate template for PDF conversion
 * This HTML is then converted to PDF using external service
 */
export function generateCertificateHTML(data: CertificateData, qrCodeUrl: string): string {
  const { 
    studentName, 
    programName, 
    completionDate, 
    certificateCode,
    instructorName = 'Ross Tax Academy',
    instructorTitle = 'Education Director',
    issueDate,
    specialHonors,
    programHours
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificate of Completion - ${studentName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Georgia', serif;
          background: white;
        }
        
        .certificate {
          width: 11in;
          height: 8.5in;
          padding: 60px;
          background: linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%);
          border: 3px solid #071223;
          position: relative;
          text-align: center;
          page-break-after: always;
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          border: 2px solid #f6c445;
          pointer-events: none;
        }
        
        .certificate-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .header {
          margin-bottom: 30px;
        }
        
        .logo {
          font-size: 14px;
          font-weight: bold;
          color: #071223;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }
        
        .seal {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: radial-gradient(circle, #f6c445, #f2b60f);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: #071223;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .main-text {
          margin: 40px 0;
        }
        
        .certificate-title {
          font-size: 32px;
          font-weight: bold;
          color: #071223;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        
        .recipient-label {
          font-size: 14px;
          color: #666;
          margin: 20px 0 10px 0;
        }
        
        .recipient-name {
          font-size: 36px;
          font-weight: bold;
          color: #f6c445;
          margin-bottom: 20px;
          border-bottom: 2px solid #071223;
          padding-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .achievement-text {
          font-size: 16px;
          color: #333;
          margin: 20px 0;
          line-height: 1.6;
        }
        
        .program-info {
          background: rgba(241, 194, 69, 0.1);
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
          color: #333;
        }
        
        .program-name {
          font-weight: bold;
          color: #071223;
          font-size: 18px;
          margin-bottom: 8px;
        }
        
        .date-info {
          font-size: 12px;
          color: #666;
          margin: 10px 0;
        }
        
        .honors {
          background: linear-gradient(90deg, #f6c445, #f2b60f);
          color: #071223;
          padding: 10px;
          margin: 15px 0;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          margin-top: 40px;
          padding-top: 40px;
          border-top: 1px solid #ddd;
        }
        
        .signature-block {
          width: 30%;
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #071223;
          margin-bottom: 5px;
          height: 50px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          font-weight: bold;
          color: #071223;
          font-size: 12px;
        }
        
        .signature-title {
          font-size: 12px;
          color: #666;
          font-weight: bold;
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 30px;
          font-size: 10px;
          color: #999;
        }
        
        .verification-code {
          background: #f9f9f9;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #071223;
        }
        
        .qr-code {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .certificate {
            margin: 0;
            width: 100%;
            height: 100%;
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="certificate-content">
          <div class="header">
            <div class="logo">ROSS TAX ACADEMY</div>
            <div class="seal">🎓</div>
          </div>
          
          <div class="main-text">
            <div class="certificate-title">Certificate of Completion</div>
            
            <div class="recipient-label">This certificate is proudly presented to</div>
            <div class="recipient-name">${studentName}</div>
            
            <div class="achievement-text">
              For successfully completing the requirements of
            </div>
            
            <div class="program-info">
              <div class="program-name">${programName}</div>
              ${programHours ? `<div class="date-info">${programHours} hours of instruction</div>` : ''}
              <div class="date-info">Completed: ${new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            
            ${specialHonors ? `<div class="honors">🌟 ${specialHonors}</div>` : ''}
          </div>
          
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-title">${instructorName}</div>
              <div style="font-size: 11px; color: #999;">${instructorTitle}</div>
            </div>
            
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-title">Registrar</div>
              <div style="font-size: 11px; color: #999;">Ross Tax Academy</div>
            </div>
          </div>
          
          <div class="footer">
            <div>
              <div style="font-size: 11px; font-weight: bold; color: #333; margin-bottom: 5px;">Verification Code</div>
              <div class="verification-code">${certificateCode}</div>
              <div style="font-size: 10px; color: #999; margin-top: 3px;">Verify: academy.rosstaxacademy.com/verify/${certificateCode}</div>
            </div>
            
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" />
            </div>
            
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #999; margin-bottom: 5px;">Issued</div>
              <div style="font-size: 11px; font-weight: bold; color: #333;">${new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Convert HTML certificate to PDF
 * Uses external HTML-to-PDF service (e.g., html2pdf.app or similar)
 */
export async function convertHTMLToPDF(
  htmlContent: string,
  filename: string,
  env: any
): Promise<Buffer | null> {
  try {
    // Use HTML2PDF API service
    const response = await fetch('https://html2pdf.app/api/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: htmlContent,
        options: {
          margin: [0, 0, 0, 0],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'landscape', unit: 'in', format: 'letter' }
        }
      })
    });

    if (!response.ok) {
      console.error('PDF conversion failed:', response.statusText);
      return null;
    }

    return await response.arrayBuffer().then(ab => Buffer.from(ab));
  } catch (error) {
    console.error('PDF conversion error:', error);
    return null;
  }
}

/**
 * Generate certificate and upload to R2
 */
export async function generateAndUploadCertificate(
  data: CertificateData,
  qrCodeUrl: string,
  env: any
): Promise<CertificateGenerationResult> {
  try {
    const certificateCode = data.certificateCode;
    const filename = `certificate-${certificateCode}.pdf`;

    // Generate HTML certificate
    const htmlContent = generateCertificateHTML(data, qrCodeUrl);

    // Convert to PDF (using external service for Cloudflare Workers)
    const pdfBuffer = await convertHTMLToPDF(htmlContent, filename, env);

    if (!pdfBuffer) {
      return {
        success: false,
        certificateCode,
        error: 'Failed to convert HTML to PDF'
      };
    }

    // Upload to R2 bucket
    const bucket = env.DOCUMENTS_BUCKET;
    const key = `certificates/${certificateCode}/${filename}`;

    await bucket.put(key, pdfBuffer, {
      httpMetadata: {
        contentType: 'application/pdf'
      }
    });

    // Generate public URL
    const pdfUrl = `https://cdn.rosstaxacademy.com/${key}`;

    return {
      success: true,
      certificateCode,
      pdfUrl
    };
  } catch (error: any) {
    return {
      success: false,
      certificateCode: data.certificateCode,
      error: error.message
    };
  }
}

/**
 * Revoke certificate (mark as inactive in database)
 */
export async function revokeCertificate(
  db: any,
  certificateCode: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .prepare(
        `UPDATE certificates 
         SET revoked = 1, revocation_reason = ?, revoked_at = CURRENT_TIMESTAMP 
         WHERE certificate_code = ?`
      )
      .bind(reason, certificateCode)
      .run();

    return { success: result.success };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify certificate authenticity
 */
export async function verifyCertificate(
  db: any,
  certificateCode: string
): Promise<{
  valid: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const result = await db
      .prepare(
        `SELECT c.*, e.student_name, e.student_email, lc.program_name
         FROM certificates c
         JOIN enrollments e ON c.enrollment_id = e.id
         JOIN lms_courses lc ON c.course_id = lc.id
         WHERE c.certificate_code = ? AND c.revoked = 0`
      )
      .bind(certificateCode)
      .first();

    if (!result) {
      return {
        valid: false,
        error: 'Certificate not found or has been revoked'
      };
    }

    return {
      valid: true,
      data: result
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Generate batch certificates for completed students
 */
export async function generateBatchCertificates(
  completedEnrollments: Array<{
    enrollmentId: string;
    studentName: string;
    studentEmail: string;
    programId: string;
    programName: string;
    completionDate: string;
  }>,
  env: any,
  qrCodeGenerator: any
): Promise<Array<CertificateGenerationResult>> {
  const results: CertificateGenerationResult[] = [];

  for (const enrollment of completedEnrollments) {
    try {
      // Generate certificate code
      const code = `RTA-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Generate QR code
      const verificationUrl = `https://academy.rosstaxacademy.com/verify/${code}`;
      const qrUrl = await qrCodeGenerator(verificationUrl, 'medium');

      // Create certificate data
      const certData: CertificateData = {
        studentName: enrollment.studentName,
        programName: enrollment.programName,
        completionDate: enrollment.completionDate,
        certificateCode: code,
        issueDate: new Date().toISOString(),
        instructorName: 'Ross Tax Academy',
        instructorTitle: 'Education Director'
      };

      // Generate and upload certificate
      const result = await generateAndUploadCertificate(certData, qrUrl, env);
      results.push(result);
    } catch (error: any) {
      results.push({
        success: false,
        certificateCode: '',
        error: error.message
      });
    }
  }

  return results;
}

export default {
  generateCertificateHTML,
  convertHTMLToPDF,
  generateAndUploadCertificate,
  revokeCertificate,
  verifyCertificate,
  generateBatchCertificates
};
