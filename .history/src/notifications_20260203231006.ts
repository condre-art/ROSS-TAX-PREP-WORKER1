/**
 * Real-Time Notification System
 * 
 * Features:
 * - Instant notifications (no approval needed)
 * - Multi-channel delivery (email, SMS, push, WebSocket)
 * - Admin and client notifications
 * - Priority/urgent flagging
 * - Read/unread tracking
 */

import { v4 as uuid } from 'uuid';

export interface Notification {
  id: string;
  type: string;
  recipient_id: string; // client_id or 'admin'
  recipient_type: 'client' | 'staff' | 'admin';
  message: string;
  title?: string;
  urgent: boolean;
  data?: any;
  channels: ('email' | 'sms' | 'push' | 'websocket')[];
  read: boolean;
  read_at?: string;
  created_at: string;
}

/**
 * Send real-time notification (no approval needed)
 */
export async function sendRealtimeNotification(
  env: any,
  notification: {
    type: string;
    recipient_id: string;
    recipient_type: 'client' | 'staff' | 'admin';
    title?: string;
    message: string;
    urgent?: boolean;
    data?: any;
    channels?: ('email' | 'sms' | 'push' | 'websocket')[];
  }
): Promise<Notification> {
  const notificationId = uuid();
  const now = new Date().toISOString();
  
  const notif: Notification = {
    id: notificationId,
    type: notification.type,
    recipient_id: notification.recipient_id,
    recipient_type: notification.recipient_type,
    title: notification.title || getDefaultTitle(notification.type),
    message: notification.message,
    urgent: notification.urgent || false,
    data: notification.data || {},
    channels: notification.channels || getDefaultChannels(notification.type),
    read: false,
    created_at: now
  };
  
  // Store in database
  await env.DB.prepare(`
    INSERT INTO notifications (
      id, type, recipient_id, recipient_type, title, message,
      urgent, data, channels, read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    notif.id,
    notif.type,
    notif.recipient_id,
    notif.recipient_type,
    notif.title,
    notif.message,
    notif.urgent ? 1 : 0,
    JSON.stringify(notif.data),
    JSON.stringify(notif.channels),
    0,
    notif.created_at
  ).run();
  
  // Send via all channels immediately
  await Promise.all([
    notif.channels.includes('email') ? sendEmail(env, notif) : null,
    notif.channels.includes('sms') ? sendSMS(env, notif) : null,
    notif.channels.includes('push') ? sendPush(env, notif) : null,
    notif.channels.includes('websocket') ? broadcastWebSocket(env, notif) : null
  ]);
  
  return notif;
}

/**
 * Send email notification
 */
async function sendEmail(env: any, notification: Notification): Promise<void> {
  // Get recipient email
  const recipient = await env.DB.prepare(
    notification.recipient_type === 'client'
      ? 'SELECT email, name FROM clients WHERE id = ?'
      : 'SELECT email, name FROM staff WHERE id = ?'
  ).bind(notification.recipient_id).first();
  
  if (!recipient) return;
  
  // MailChannels integration
  const emailBody = {
    personalizations: [{
      to: [{ email: recipient.email, name: recipient.name }]
    }],
    from: {
      email: 'notifications@rosstaxprepandbookkeeping.com',
      name: 'Ross Tax Prep & Bookkeeping'
    },
    subject: notification.urgent 
      ? `🔴 URGENT: ${notification.title}` 
      : notification.title,
    content: [{
      type: 'text/html',
      value: generateEmailTemplate(notification, recipient.name)
    }]
  };
  
  await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': env.MAILCHANNELS_API_KEY
    },
    body: JSON.stringify(emailBody)
  });
  
  console.log(`✅ Email sent to ${recipient.email}: ${notification.title}`);
}

/**
 * Send SMS notification (Twilio)
 */
async function sendSMS(env: any, notification: Notification): Promise<void> {
  if (!notification.urgent) return; // Only send SMS for urgent notifications
  
  const recipient = await env.DB.prepare(
    notification.recipient_type === 'client'
      ? 'SELECT phone FROM clients WHERE id = ?'
      : 'SELECT phone FROM staff WHERE id = ?'
  ).bind(notification.recipient_id).first();
  
  if (!recipient?.phone) return;
  
  // Twilio integration (if configured)
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('From', env.TWILIO_PHONE_NUMBER);
    formData.append('To', recipient.phone);
    formData.append('Body', `${notification.title}: ${notification.message}`);
    
    await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });
    
    console.log(`✅ SMS sent to ${recipient.phone}: ${notification.title}`);
  }
}

/**
 * Send push notification (Firebase Cloud Messaging)
 */
async function sendPush(env: any, notification: Notification): Promise<void> {
  // TODO: Implement FCM push notifications
  console.log(`📱 Push notification: ${notification.title}`);
}

/**
 * Broadcast via WebSocket for real-time UI updates
 */
async function broadcastWebSocket(env: any, notification: Notification): Promise<void> {
  // TODO: Implement WebSocket broadcasting via Durable Objects
  console.log(`🔌 WebSocket broadcast: ${notification.title}`);
}

/**
 * Get unread notifications for user
 */
export async function getUnreadNotifications(
  env: any,
  recipientId: string,
  recipientType: 'client' | 'staff' | 'admin'
): Promise<Notification[]> {
  const result = await env.DB.prepare(`
    SELECT * FROM notifications
    WHERE recipient_id = ? AND recipient_type = ? AND read = 0
    ORDER BY urgent DESC, created_at DESC
  `).bind(recipientId, recipientType).all();
  
  return result.results as Notification[];
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  env: any,
  notificationId: string
): Promise<void> {
  await env.DB.prepare(`
    UPDATE notifications
    SET read = 1, read_at = ?
    WHERE id = ?
  `).bind(new Date().toISOString(), notificationId).run();
}

/**
 * Get notification count badge
 */
export async function getNotificationCount(
  env: any,
  recipientId: string,
  recipientType: 'client' | 'staff' | 'admin'
): Promise<{ total: number; urgent: number }> {
  const total = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE recipient_id = ? AND recipient_type = ? AND read = 0
  `).bind(recipientId, recipientType).first();
  
  const urgent = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE recipient_id = ? AND recipient_type = ? AND read = 0 AND urgent = 1
  `).bind(recipientId, recipientType).first();
  
  return {
    total: total?.count || 0,
    urgent: urgent?.count || 0
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    'return_accepted': 'Tax Return Accepted',
    'return_rejected': 'Tax Return Rejected',
    'refund_approved': 'Refund Approved',
    'refund_disbursed': 'Refund Disbursed',
    'bank_product_selected': 'Bank Product Selected',
    'refund_advance_approved': 'Refund Advance Approved',
    'refund_advance_disbursed': 'Refund Advance Disbursed',
    'payment_received': 'Payment Received',
    'document_needed': 'Document Upload Required',
    'signature_required': 'Signature Required',
    'task_assigned': 'New Task Assigned',
    'task_completed': 'Task Completed'
  };
  
  return titles[type] || 'Notification';
}

function getDefaultChannels(type: string): ('email' | 'sms' | 'push' | 'websocket')[] {
  // Urgent notifications use all channels
  const urgentTypes = [
    'refund_advance_approved',
    'refund_advance_disbursed',
    'return_rejected',
    'signature_required'
  ];
  
  if (urgentTypes.includes(type)) {
    return ['email', 'sms', 'push', 'websocket'];
  }
  
  // Standard notifications use email + websocket
  return ['email', 'websocket'];
}

function generateEmailTemplate(notification: Notification, recipientName: string): string {
  const urgentBanner = notification.urgent 
    ? `<div style="background: #DC3545; color: white; padding: 10px; text-align: center; font-weight: bold;">🔴 URGENT NOTIFICATION</div>`
    : '';
    
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1B365D; color: white; padding: 20px; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #C4A962; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  ${urgentBanner}
  <div class="container">
    <div class="header">
      <h1>Ross Tax Prep & Bookkeeping</h1>
    </div>
    <div class="content">
      <h2>${notification.title}</h2>
      <p>Hi ${recipientName},</p>
      <p>${notification.message}</p>
      ${notification.data?.action_url ? `<p><a href="${notification.data.action_url}" class="button">View Details</a></p>` : ''}
    </div>
    <div class="footer">
      <p>Ross Tax Prep & Bookkeeping LLC | EIN: 33-4891499 | EFIN: 748335</p>
      <p><a href="https://www.rosstaxprepandbookkeeping.com">www.rosstaxprepandbookkeeping.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}
