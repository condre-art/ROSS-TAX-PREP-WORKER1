/**
 * Real-time notification system
 * Sends notifications to clients via WebSocket, email, SMS, or push
 */

export interface Notification {
  notification_id: string;
  client_id: string;
  type: 'status_change' | 'document_received' | 'refund_processed' | 'action_required' | 'message_received' | 'transfer_complete' | 'security_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: Array<'in_app' | 'email' | 'sms' | 'push'>;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Send real-time notification to client
 */
export async function sendRealtimeNotification(
  env: any,
  data: {
    client_id: string;
    type: Notification['type'];
    title: string;
    message: string;
    priority?: Notification['priority'];
    channels?: Notification['channels'];
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const notificationId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const notification: Notification = {
    notification_id: notificationId,
    client_id: data.client_id,
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority || 'medium',
    channels: data.channels || ['in_app', 'email'],
    metadata: data.metadata,
    created_at: now
  };
  
  // Store notification in database
  try {
    await env.DB.prepare(`
      INSERT INTO client_notifications (
        notification_id, client_id, type, message, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      notification.notification_id,
      notification.client_id,
      notification.type,
      `${notification.title}: ${notification.message}`,
      0, // is_read = false
      notification.created_at
    ).run();
  } catch (error) {
    console.error('Failed to store notification:', error);
  }
  
  // Send via requested channels
  for (const channel of notification.channels) {
    switch (channel) {
      case 'in_app':
        // WebSocket notification (if client connected)
        await sendInAppNotification(env, notification);
        break;
      
      case 'email':
        // Email notification
        await sendEmailNotification(env, notification);
        break;
      
      case 'sms':
        // SMS notification
        await sendSMSNotification(env, notification);
        break;
      
      case 'push':
        // Push notification
        await sendPushNotification(env, notification);
        break;
    }
  }
}

/**
 * Send in-app notification via WebSocket
 */
async function sendInAppNotification(env: any, notification: Notification): Promise<void> {
  // TODO: Implement WebSocket notification
  // For now, just log
  console.log('In-app notification:', notification.notification_id);
}

/**
 * Send email notification
 */
async function sendEmailNotification(env: any, notification: Notification): Promise<void> {
  try {
    // Get client email
    const client = await env.DB.prepare(
      'SELECT email FROM clients WHERE client_id = ?'
    ).bind(notification.client_id).first();
    
    if (!client || !client.email) {
      console.warn('No email found for client:', notification.client_id);
      return;
    }
    
    // Send via MailChannels (Cloudflare Workers email API)
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: client.email }]
        }],
        from: {
          email: 'notifications@rosstaxprepandbookkeeping.com',
          name: 'Ross Tax Prep & Bookkeeping'
        },
        subject: notification.title,
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #003366;">${notification.title}</h2>
              <p>${notification.message}</p>
              <hr style="border: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                This is an automated notification from Ross Tax Prep & Bookkeeping. 
                Please do not reply to this email.
              </p>
            </div>
          `
        }]
      })
    });
    
    console.log('Email notification sent:', notification.notification_id);
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(env: any, notification: Notification): Promise<void> {
  // TODO: Implement SMS via Twilio or similar
  console.log('SMS notification:', notification.notification_id);
}

/**
 * Send push notification
 */
async function sendPushNotification(env: any, notification: Notification): Promise<void> {
  // TODO: Implement push notification via Firebase Cloud Messaging
  console.log('Push notification:', notification.notification_id);
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  env: any,
  notificationId: string
): Promise<void> {
  await env.DB.prepare(`
    UPDATE client_notifications
    SET is_read = 1, read_at = ?
    WHERE notification_id = ?
  `).bind(new Date().toISOString(), notificationId).run();
}

/**
 * Get unread notification count for client
 */
export async function getUnreadCount(
  env: any,
  clientId: string
): Promise<number> {
  const result = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM client_notifications
    WHERE client_id = ? AND is_read = 0
  `).bind(clientId).first();
  
  return result ? Number(result.count) : 0;
}
