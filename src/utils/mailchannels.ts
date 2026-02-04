// src/utils/mailchannels.ts
// Email notification service using MailChannels API
// Handles enrollment confirmations, payment notifications, certificate issuance

import { LogLevel } from './audit';

interface EmailMessage {
  to: string[];
  from: { email: string; name: string };
  subject: string;
  html: string;
  reply_to?: string;
}

interface MailChannelsResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send email via MailChannels API
 * Replaces traditional SMTP with Cloudflare Workers integration
 */
export async function sendEmail(
  env: any,
  to: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<MailChannelsResponse> {
  try {
    const message: EmailMessage = {
      to: [to],
      from: {
        email: env.MAILCHANNELS_FROM_EMAIL || 'noreply@rosstaxacademy.com',
        name: 'Ross Tax Academy'
      },
      subject: subject,
      html: html,
      reply_to: replyTo ? [{ email: replyTo }] : undefined
    };

    // Remove undefined properties
    if (!message.reply_to) {
      delete message.reply_to;
    }

    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.MAILCHANNELS_API_KEY || ''
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[MailChannels] Error:', error);
      return {
        success: false,
        error: `MailChannels API error: ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      id: data.result?.id
    };
  } catch (err: any) {
    console.error('[MailChannels] Exception:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Enrollment confirmation email
 */
export async function sendEnrollmentConfirmation(
  env: any,
  studentEmail: string,
  studentName: string,
  enrollmentId: string,
  programName: string,
  totalCost: number,
  paymentMethod: string
): Promise<MailChannelsResponse> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(180deg, #071223, #0a1627); padding: 30px; color: #eaf0ff; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; color: #f6c445;">Welcome to Ross Tax Academy</h1>
        <p style="margin: 10px 0 0 0; color: #b8c7ea; font-size: 14px;">Enrollment Confirmation</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0;">
        <p>Hi ${studentName},</p>
        
        <p>Thank you for enrolling in Ross Tax Academy! We're excited to have you join our community of tax professionals and accounting students.</p>
        
        <h2 style="color: #071223; margin-top: 20px;">Your Enrollment Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Enrollment ID</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${enrollmentId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Program</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${programName}</td>
          </tr>
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Total Cost</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">$${totalCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Payment Method</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${paymentMethod === 'full' ? 'Full Payment' : paymentMethod === 'plan' ? 'Monthly Plan' : 'Employer Reimbursement'}</td>
          </tr>
        </table>
        
        <h2 style="color: #071223; margin-top: 20px;">Next Steps</h2>
        <ol style="line-height: 1.8;">
          <li><strong>Complete Payment:</strong> Login to your portal to process payment</li>
          <li><strong>Textbook Access:</strong> Confirm your RTB Textbook format (physical or eBook)</li>
          <li><strong>Portal Access:</strong> You'll receive login credentials within 24 hours of payment</li>
          <li><strong>Start Learning:</strong> Access course materials and begin your education</li>
        </ol>
        
        <div style="background: #fff8dc; border-left: 4px solid #f6c445; padding: 15px; margin: 20px 0;">
          <strong>Important:</strong> Please review your enrollment agreement and student handbook. You've acknowledged understanding our refund policy, academic integrity standards, and all institutional policies.
        </div>
        
        <h2 style="color: #071223; margin-top: 20px;">Questions?</h2>
        <p>Our student support team is here to help:</p>
        <ul style="margin: 10px 0;">
          <li><strong>Email:</strong> support@rosstaxacademy.com</li>
          <li><strong>Phone:</strong> (512) 555-0123</li>
          <li><strong>Portal:</strong> https://academy.rosstaxacademy.com</li>
        </ul>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
          This is an automated message. Please do not reply to this email. For support, visit our portal or contact the email address above.
        </p>
      </div>
    </div>
  `;

  return sendEmail(env, studentEmail, `Welcome to Ross Tax Academy - Enrollment #${enrollmentId}`, html, 'support@rosstaxacademy.com');
}

/**
 * Payment confirmation email
 */
export async function sendPaymentConfirmation(
  env: any,
  studentEmail: string,
  studentName: string,
  enrollmentId: string,
  amount: number,
  transactionId: string,
  paymentMethod: string
): Promise<MailChannelsResponse> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(180deg, #10b981, #059669); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">✅ Payment Received</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Thank you for your payment</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0;">
        <p>Hi ${studentName},</p>
        
        <p>Your payment has been successfully processed. Your course access will be activated within 24 hours.</p>
        
        <h2 style="color: #071223;">Payment Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Transaction ID</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Amount</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">$${amount.toFixed(2)}</td>
          </tr>
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Payment Method</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Receipt</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><a href="https://academy.rosstaxacademy.com/receipts/${transactionId}" style="color: #071223; text-decoration: none;">View Receipt</a></td>
          </tr>
        </table>
        
        <h2 style="color: #071223; margin-top: 20px;">What's Next?</h2>
        <ol style="line-height: 1.8;">
          <li>Watch your email for portal access credentials (within 24 hours)</li>
          <li>Log in and confirm your textbook format</li>
          <li>Download course materials</li>
          <li>Begin your first lesson!</li>
        </ol>
      </div>
    </div>
  `;

  return sendEmail(env, studentEmail, `Payment Confirmation - $${amount.toFixed(2)}`, html, 'billing@rosstaxacademy.com');
}

/**
 * Certificate issuance email with download link
 */
export async function sendCertificateEmail(
  env: any,
  studentEmail: string,
  studentName: string,
  programName: string,
  certificateCode: string,
  completionDate: string,
  downloadUrl: string
): Promise<MailChannelsResponse> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(180deg, #f6c445, #f2b60f); padding: 30px; color: #071223; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 32px;">🎓 Congratulations!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>You've Earned Your Certificate</strong></p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0;">
        <p>Hi ${studentName},</p>
        
        <p>You've successfully completed <strong>${programName}</strong> and earned your certificate from Ross Tax Academy!</p>
        
        <div style="background: white; border: 2px solid #f6c445; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 12px;">CERTIFICATE CODE</p>
          <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #071223; font-family: monospace;">${certificateCode}</p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Share this code to verify your achievement</p>
        </div>
        
        <h2 style="color: #071223;">Your Certificate</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Program</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${programName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Completion Date</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${completionDate}</td>
          </tr>
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Verification Code</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${certificateCode}</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(180deg, #f6c445, #f2b60f); color: #071223; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">⬇️ Download Certificate (PDF)</a>
        </div>
        
        <h2 style="color: #071223;">Share Your Achievement</h2>
        <p>Your certificate is now available in your portal. You can:</p>
        <ul style="line-height: 1.8;">
          <li><strong>Download PDF:</strong> Save to your computer</li>
          <li><strong>Print:</strong> Display on your wall</li>
          <li><strong>Share Code:</strong> Use code ${certificateCode} to verify with employers</li>
          <li><strong>LinkedIn:</strong> Add to your professional profile</li>
        </ul>
        
        <div style="background: #e8f5e9; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <strong>Verification:</strong> Employers can verify your certificate by visiting verify.rosstaxacademy.com and entering code: <strong>${certificateCode}</strong>
        </div>
        
        <h2 style="color: #071223; margin-top: 20px;">Next Steps</h2>
        <ul style="line-height: 1.8;">
          <li>Update your resume and LinkedIn profile</li>
          <li>Explore advanced courses (if available)</li>
          <li>Refer friends and earn rewards</li>
          <li>Continue your tax education journey</li>
        </ul>
      </div>
    </div>
  `;

  return sendEmail(env, studentEmail, `🎓 Your Certificate from Ross Tax Academy`, html, 'certificates@rosstaxacademy.com');
}

/**
 * Refund confirmation email
 */
export async function sendRefundConfirmation(
  env: any,
  studentEmail: string,
  studentName: string,
  enrollmentId: string,
  refundAmount: number,
  refundDate: string
): Promise<MailChannelsResponse> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(180deg, #3b82f6, #2563eb); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">Refund Processed</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Your refund has been approved and processed</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0;">
        <p>Hi ${studentName},</p>
        
        <p>Your refund request has been approved and processed. The funds will be returned to your original payment method within 5-10 business days.</p>
        
        <h2 style="color: #071223;">Refund Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Enrollment ID</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${enrollmentId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Refund Amount</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">$${refundAmount.toFixed(2)}</td>
          </tr>
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Processing Date</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${refundDate}</td>
          </tr>
        </table>
        
        <div style="background: #fef3c7; border-left: 4px solid #f6c445; padding: 15px; margin: 20px 0;">
          <strong>Note:</strong> Your course access has been revoked. If you'd like to re-enroll, you may do so at any time.
        </div>
        
        <h2 style="color: #071223;">Questions?</h2>
        <p>If you have questions about your refund, please contact:</p>
        <ul style="margin: 10px 0;">
          <li><strong>Email:</strong> billing@rosstaxacademy.com</li>
          <li><strong>Phone:</strong> (512) 555-0123</li>
        </ul>
      </div>
    </div>
  `;

  return sendEmail(env, studentEmail, `Refund Confirmation - $${refundAmount.toFixed(2)}`, html, 'billing@rosstaxacademy.com');
}

/**
 * Admin notification: New enrollment
 */
export async function sendAdminEnrollmentNotification(
  env: any,
  studentName: string,
  studentEmail: string,
  programName: string,
  enrollmentId: string,
  totalCost: number
): Promise<MailChannelsResponse> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #071223; padding: 20px; color: #eaf0ff; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0;">New Enrollment Alert</h2>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9; border: 1px solid #e0e0e0;">
        <p><strong>New enrollment received:</strong></p>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Enrollment ID</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${enrollmentId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Student Name</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${studentName}</td>
          </tr>
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Email</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${studentEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Program</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${programName}</td>
          </tr>
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Total Cost</strong></td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">$${totalCost.toFixed(2)}</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px;"><a href="https://academy.rosstaxacademy.com/admin/enrollments/${enrollmentId}" style="color: #071223; text-decoration: none; font-weight: bold;">View Full Enrollment</a></p>
      </div>
    </div>
  `;

  return sendEmail(env, 'admin@rosstaxacademy.com', `[ADMIN] New Enrollment: ${studentName}`, html);
}

/**
 * Send bulk email to multiple recipients
 */
export async function sendBulkEmail(
  env: any,
  recipients: string[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendEmail(env, recipient, subject, html);
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${recipient}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}

export default {
  sendEmail,
  sendEnrollmentConfirmation,
  sendPaymentConfirmation,
  sendCertificateEmail,
  sendRefundConfirmation,
  sendAdminEnrollmentNotification,
  sendBulkEmail
};
