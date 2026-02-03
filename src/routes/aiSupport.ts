/**
 * AI Support Route - 24/7 Chatbot for Appointment Setting and Guidance
 * Handles client inquiries, appointment booking, and agent transfer requests
 */

import { Router } from 'itty-router';
import { v4 as uuid } from 'uuid';
import { logAudit } from '../utils/audit';

const aiSupportRouter = Router({ base: '/api/ai-support' });

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  intent?: string;
  confidence?: number;
  metadata?: any;
  created_at: string;
}

interface TransferRequest {
  id: string;
  session_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  reason: string;
  status: 'pending' | 'accepted' | 'completed' | 'expired';
  assigned_ero_id?: number;
  created_at: string;
}

// Intent classification
function classifyIntent(message: string): { intent: string; confidence: number } {
  const msg = message.toLowerCase();
  
  // Appointment booking
  if (/(book|schedule|appointment|meet|consultation|set up)/i.test(msg)) {
    return { intent: 'book_appointment', confidence: 0.9 };
  }
  
  // Tax filing questions
  if (/(file|tax|return|1040|refund|status|efile)/i.test(msg)) {
    return { intent: 'tax_filing', confidence: 0.85 };
  }
  
  // Pricing questions
  if (/(price|cost|fee|charge|pay|how much)/i.test(msg)) {
    return { intent: 'pricing', confidence: 0.9 };
  }
  
  // Transfer to agent
  if (/(speak|talk|agent|human|representative|ero|preparer)/i.test(msg)) {
    return { intent: 'transfer_agent', confidence: 0.95 };
  }
  
  // Bookkeeping services
  if (/(bookkeep|payroll|small business|quickbooks|accounting)/i.test(msg)) {
    return { intent: 'bookkeeping', confidence: 0.85 };
  }
  
  // General inquiry
  return { intent: 'general_inquiry', confidence: 0.7 };
}

// Generate AI response based on intent
function generateResponse(intent: string, userMessage: string): string {
  const responses: Record<string, string> = {
    book_appointment: `I'd be happy to help you schedule an appointment! To book a consultation with one of our tax professionals, I'll need:

1. Your full name
2. Email address
3. Phone number
4. Preferred date and time

You can also book directly at: https://www.rosstaxprepandbookkeeping.com/book

Would you like me to transfer you to an agent to complete the booking?`,

    tax_filing: `I can help you with tax filing! Ross Tax Prep offers:

📋 **DIY Filing** - $49.99 (IRS MeF certified platform)
👨‍💼 **Professional Service** - Starting at $150 (EFIN/PTIN certified preparers)
🏢 **Business Filing** - Custom pricing for partnerships, corporations

We support current year + 5 prior years, with e-file and direct deposit options.

What type of filing are you interested in?`,

    pricing: `Our pricing is transparent and competitive:

**Individual Returns (1040)**
• DIY Platform: $49.99
• Professional Preparation: $150-$300 (complexity-based)

**Business Returns**
• 1120/1120-S: $350-$800
• 1065 Partnership: $400-$900
• 1041 Estate/Trust: $300-$600

**Additional Services**
• Bookkeeping: Starting at $150/month
• Payroll Services: Starting at $100/month
• Quarterly Estimated Taxes: $75 per quarter

Would you like a detailed quote for your situation?`,

    transfer_agent: `I understand you'd like to speak with a live tax professional. Let me connect you with one of our ERO-certified preparers.

To facilitate the transfer, please provide:
• Your name
• Email address
• Phone number
• Brief reason for contact

An agent will respond within 15 minutes during business hours (Mon-Fri 9am-6pm CT), or first thing the next business day.`,

    bookkeeping: `Our bookkeeping and payroll services help small businesses stay compliant and organized:

**Bookkeeping Services**
• Monthly financial statements
• Expense tracking and categorization
• QuickBooks setup and management
• Bank reconciliation
• Sales tax tracking

**Payroll Services**
• Bi-weekly or monthly payroll processing
• W-2 and 1099 preparation
• Quarterly 941 filings
• State unemployment reporting

Pricing starts at $150/month for bookkeeping and $100/month for payroll.

Would you like to schedule a free consultation to discuss your business needs?`,

    general_inquiry: `Thank you for contacting Ross Tax Prep & Bookkeeping! I'm here to assist you 24/7 with:

✅ Appointment scheduling
✅ Tax filing questions
✅ Service pricing
✅ Bookkeeping and payroll
✅ Connection to live agents

How can I help you today?`
  };

  return responses[intent] || responses.general_inquiry;
}

// POST /api/ai-support/chat - Send message to AI chatbot
aiSupportRouter.post('/chat', async (req: any, env: any) => {
  try {
    const { session_id, message, user_info } = await req.json();
    
    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // Create or retrieve session
    const sessionId = session_id || uuid();
    
    // Classify intent
    const { intent, confidence } = classifyIntent(message);
    
    // Store user message
    const userMsgId = uuid();
    await env.DB.prepare(`
      INSERT INTO ai_chat_messages (id, session_id, role, message, intent, confidence, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(userMsgId, sessionId, 'user', message, intent, confidence).run();
    
    // Generate AI response
    const aiResponse = generateResponse(intent, message);
    
    // Store AI response
    const aiMsgId = uuid();
    await env.DB.prepare(`
      INSERT INTO ai_chat_messages (id, session_id, role, message, intent, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(aiMsgId, sessionId, 'assistant', aiResponse, intent).run();
    
    // Log analytics
    await env.DB.prepare(`
      INSERT INTO ai_chat_analytics (session_id, intent, confidence, user_message_length, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(sessionId, intent, confidence, message.length).run();
    
    return new Response(JSON.stringify({
      session_id: sessionId,
      message: aiResponse,
      intent,
      confidence,
      requires_transfer: intent === 'transfer_agent'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('AI Support chat error:', error);
    return new Response(JSON.stringify({ error: 'Chat processing failed' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// POST /api/ai-support/transfer - Request transfer to live agent
aiSupportRouter.post('/transfer', async (req: any, env: any) => {
  try {
    const { session_id, name, email, phone, reason } = await req.json();
    
    if (!name || !email || !reason) {
      return new Response(JSON.stringify({ error: 'Name, email, and reason required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const transferId = uuid();
    
    // Create transfer request
    await env.DB.prepare(`
      INSERT INTO ai_transfer_requests (
        id, session_id, client_name, client_email, client_phone, 
        reason, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(transferId, session_id, name, email, phone || null, reason, 'pending').run();
    
    // Send email notification to ERO team
    try {
      await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: 'info@rosstaxprepandbookkeeping.com', name: 'ERO Team' }],
            dkim_domain: 'rosstaxprepandbookkeeping.com',
            dkim_selector: 'mailchannels',
            dkim_private_key: env.DKIM_PRIVATE_KEY
          }],
          from: {
            email: 'ai-support@rosstaxprepandbookkeeping.com',
            name: 'AI Support Bot'
          },
          subject: `🤖 AI Transfer Request - ${name}`,
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">🤖 AI Support Transfer Request</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #1f2937;">Client Requesting Agent Connection</h2>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p><strong>Transfer ID:</strong> ${transferId}</p>
                  </div>
                  
                  <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #78350f;">
                      ⚡ <strong>Action Required:</strong> Client is waiting for agent connection via messaging system.
                    </p>
                  </div>
                  
                  <a href="https://app.rosstaxprepandbookkeeping.com/ero-hub?transfer=${transferId}" 
                     style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                    Accept Transfer Request
                  </a>
                </div>
              </div>
            `
          }]
        })
      });
    } catch (emailError) {
      console.error('Failed to send transfer notification:', emailError);
    }
    
    // Log audit
    await logAudit(env, {
      action: 'ai_transfer_request',
      entity: 'ai_support',
      entity_id: transferId,
      user_email: email,
      details: JSON.stringify({ name, reason })
    });
    
    return new Response(JSON.stringify({
      success: true,
      transfer_id: transferId,
      message: 'Transfer request submitted. An agent will connect with you shortly.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Transfer request error:', error);
    return new Response(JSON.stringify({ error: 'Transfer request failed' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// GET /api/ai-support/transfers - Get pending transfers (ERO only)
aiSupportRouter.get('/transfers', async (req: any, env: any) => {
  try {
    // Should be protected by auth middleware
    const transfers = await env.DB.prepare(`
      SELECT * FROM ai_transfer_requests 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
      LIMIT 50
    `).all();
    
    return new Response(JSON.stringify(transfers.results), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Get transfers error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch transfers' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// POST /api/ai-support/transfers/:id/accept - Accept transfer (ERO only)
aiSupportRouter.post('/transfers/:id/accept', async (req: any, env: any) => {
  try {
    const { id } = req.params;
    const { ero_id } = await req.json();
    
    await env.DB.prepare(`
      UPDATE ai_transfer_requests 
      SET status = 'accepted', assigned_ero_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(ero_id, id).run();
    
    // Create initial message in ERO messaging system
    const messageId = uuid();
    await env.DB.prepare(`
      INSERT INTO ero_messages (
        id, transfer_request_id, sender_id, sender_type, 
        message, encrypted, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      messageId, 
      id, 
      ero_id, 
      'ero',
      'Hello! I\'ve received your transfer request from our AI assistant. How can I help you today?',
      false
    ).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message_id: messageId 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Accept transfer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to accept transfer' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// GET /api/ai-support/analytics - Get AI chat analytics (Admin only)
aiSupportRouter.get('/analytics', async (req: any, env: any) => {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    
    // Intent distribution
    const intentStats = await env.DB.prepare(`
      SELECT intent, COUNT(*) as count, AVG(confidence) as avg_confidence
      FROM ai_chat_analytics
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY intent
      ORDER BY count DESC
    `).all();
    
    // Daily message volume
    const dailyVolume = await env.DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ai_chat_messages
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();
    
    // Transfer rate
    const transferStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM ai_transfer_requests
      WHERE created_at >= datetime('now', '-${days} days')
    `).first();
    
    return new Response(JSON.stringify({
      intent_distribution: intentStats.results,
      daily_volume: dailyVolume.results,
      transfer_stats: transferStats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Analytics error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

export default aiSupportRouter;
