// src/utils/qrcode.ts
// QR Code generation for certificate verification and enrollment tracking

/**
 * Generate QR code data URL for embedding in PDFs or images
 * Uses QR code to link to certificate verification endpoint
 */
export async function generateQRCode(
  data: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): Promise<string> {
  try {
    // Dynamically import qrcode library (client-side)
    // For server-side generation, use a different approach
    const sizeMap = {
      small: 200,
      medium: 300,
      large: 400
    };

    const qrSize = sizeMap[size];

    // Build QR code API call (uses qr-server.com as fallback)
    // In production, use node-qrcode or similar
    const encodedData = encodeURIComponent(data);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodedData}`;

    return qrUrl;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate verification URL for certificate
 * Format: https://academy.rosstaxacademy.com/verify/{certificateCode}
 */
export function generateVerificationUrl(certificateCode: string, baseUrl: string = 'https://academy.rosstaxacademy.com'): string {
  return `${baseUrl}/verify/${certificateCode}`;
}

/**
 * Generate enrollment verification URL
 */
export function generateEnrollmentVerificationUrl(enrollmentId: string, baseUrl: string = 'https://academy.rosstaxacademy.com'): string {
  return `${baseUrl}/enroll/verify/${enrollmentId}`;
}

/**
 * Create QR code for certificate with all necessary details
 */
export async function createCertificateQR(
  certificateCode: string,
  studentName: string,
  programName: string,
  completionDate: string,
  baseUrl: string = 'https://academy.rosstaxacademy.com'
): Promise<{ url: string; verificationLink: string; data: string }> {
  // Create a structured data format for the QR code
  const data = JSON.stringify({
    type: 'certificate',
    code: certificateCode,
    student: studentName,
    program: programName,
    date: completionDate,
    verified: baseUrl + '/verify/' + certificateCode
  });

  const verificationLink = generateVerificationUrl(certificateCode, baseUrl);
  const qrUrl = await generateQRCode(verificationLink, 'medium');

  return {
    url: qrUrl,
    verificationLink,
    data
  };
}

/**
 * Create QR code for enrollment
 */
export async function createEnrollmentQR(
  enrollmentId: string,
  studentEmail: string,
  programName: string,
  baseUrl: string = 'https://academy.rosstaxacademy.com'
): Promise<{ url: string; verificationLink: string }> {
  const verificationLink = generateEnrollmentVerificationUrl(enrollmentId, baseUrl);
  const qrUrl = await generateQRCode(verificationLink, 'medium');

  return {
    url: qrUrl,
    verificationLink
  };
}

/**
 * Generate bulk QR codes for multiple certificates
 */
export async function generateBulkQRCodes(
  certificates: Array<{
    code: string;
    studentName: string;
    programName: string;
    completionDate: string;
  }>,
  baseUrl?: string
): Promise<Map<string, any>> {
  const qrMap = new Map();

  for (const cert of certificates) {
    const qrData = await createCertificateQR(
      cert.code,
      cert.studentName,
      cert.programName,
      cert.completionDate,
      baseUrl
    );
    qrMap.set(cert.code, qrData);
  }

  return qrMap;
}

/**
 * Validate QR code data by extracting certificate code
 */
export function extractCertificateCode(qrData: string): string | null {
  try {
    const url = new URL(qrData);
    const parts = url.pathname.split('/');
    const code = parts[parts.length - 1];
    
    if (code && code.length > 0 && code.match(/^RTA-\d{4}-[A-Z0-9]{6}$/)) {
      return code;
    }
  } catch (e) {
    // Not a URL, might be raw code
    if (qrData.match(/^RTA-\d{4}-[A-Z0-9]{6}$/)) {
      return qrData;
    }
  }

  return null;
}

/**
 * QR Code format: RTA-YYYY-XXXXXX
 * RTA: Ross Tax Academy
 * YYYY: Current year
 * XXXXXX: Random alphanumeric code
 */
export function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RTA-${year}-${randomCode}`;
}

/**
 * Batch generate certificate codes with QR codes
 */
export async function batchGenerateCertificates(
  count: number
): Promise<Array<{ code: string; qrUrl: string }>> {
  const certificates: Array<{ code: string; qrUrl: string }> = [];

  for (let i = 0; i < count; i++) {
    const code = generateCertificateCode();
    const verificationUrl = generateVerificationUrl(code);
    const qrUrl = await generateQRCode(verificationUrl, 'medium');

    certificates.push({
      code,
      qrUrl
    });
  }

  return certificates;
}

export default {
  generateQRCode,
  generateVerificationUrl,
  generateEnrollmentVerificationUrl,
  createCertificateQR,
  createEnrollmentQR,
  generateBulkQRCodes,
  extractCertificateCode,
  generateCertificateCode,
  batchGenerateCertificates
};
