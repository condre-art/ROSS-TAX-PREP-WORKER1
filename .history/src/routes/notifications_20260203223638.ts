/**
 * Notifications API Routes
 * 
 * REST Endpoints:
 * - GET /api/notifications - Get all notifications for user
 * - GET /api/notifications/unread - Get unread notifications
 * - GET /api/notifications/count - Get notification count badge
 * - POST /api/notifications/:id/read - Mark notification as read
 * - POST /api/notifications/send - Send notification (admin)
 */

import { Router } from 'itty-router';
import {
  sendRealtimeNotification,
  getUnreadNotifications,
  markAsRead,
  getNotificationCount
} from '../notifications';
import { verifyAuth } from '../utils/auth';

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for authenticated user
 */
router.get('/api/notifications', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    const recipientType = auth.role === 'admin' ? 'admin' : 
                         (auth.role === 'tax_prep' || auth.role === 'ero') ? 'staff' : 'client';
    
    const result = await env.DB.prepare(`
      SELECT * FROM notifications
      WHERE recipient_id = ? AND recipient_type = ?
      ORDER BY urgent DESC, created_at DESC
      LIMIT 50
    `).bind(auth.userId, recipientType).all();
    
    return new Response(JSON.stringify({
      success: true,
      notifications: result.results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting notifications:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/notifications/unread
 * Get unread notifications
 */
router.get('/api/notifications/unread', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    const recipientType = auth.role === 'admin' ? 'admin' : 
                         (auth.role === 'tax_prep' || auth.role === 'ero') ? 'staff' : 'client';
    
    const notifications = await getUnreadNotifications(env, auth.userId, recipientType);
    
    return new Response(JSON.stringify({
      success: true,
      notifications
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting unread notifications:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * GET /api/notifications/count
 * Get notification count badge
 */
router.get('/api/notifications/count', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    const recipientType = auth.role === 'admin' ? 'admin' : 
                         (auth.role === 'tax_prep' || auth.role === 'ero') ? 'staff' : 'client';
    
    const count = await getNotificationCount(env, auth.userId, recipientType);
    
    return new Response(JSON.stringify({
      success: true,
      ...count
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error getting notification count:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark notification as read
 */
router.post('/api/notifications/:id/read', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    const notificationId = req.params.id;
    await markAsRead(env, notificationId);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Notification marked as read'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/**
 * POST /api/notifications/send
 * Send notification (admin/staff only)
 * 
 * Body:
 * {
 *   "type": "custom",
 *   "recipient_id": "client-uuid",
 *   "recipient_type": "client",
 *   "title": "Custom Message",
 *   "message": "Your custom message here",
 *   "urgent": false
 * }
 */
router.post('/api/notifications/send', async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid || (auth.role !== 'admin' && auth.role !== 'ero' && auth.role !== 'tax_prep')) {
      return new Response(JSON.stringify({ error: 'Forbidden - Staff only' }), { status: 403 });
    }
    
    const data = await req.json();
    
    if (!data.recipient_id || !data.message) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: recipient_id, message' 
      }), { status: 400 });
    }
    
    const notification = await sendRealtimeNotification(env, {
      type: data.type || 'custom',
      recipient_id: data.recipient_id,
      recipient_type: data.recipient_type || 'client',
      title: data.title,
      message: data.message,
      urgent: data.urgent || false,
      data: data.data
    });
    
    return new Response(JSON.stringify({
      success: true,
      notification
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error sending notification:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

export default router;
