/**
 * AI TAX ASSISTANT API ROUTES
 * Intelligent guidance during e-file flow to transmission
 */

import { Router } from 'itty-router';
import { v4 as uuid } from 'uuid';
import { createAITaxAssistant } from '../aiTaxAssistant';

const router = Router({ base: '/api/ai-assistant' });

/**
 * Start new AI assistant session
 * POST /api/ai-assistant/session
 */
router.post('/session', async (req: any, env: any) => {
  try {
    const body = await req.json();
    
    if (!body.user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
    }

    const sessionId = uuid();
    
    await env.DB.prepare(`
      INSERT INTO ai_assistant_sessions (id, user_id, return_id, current_form, current_step, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      sessionId,
      body.user_id,
      body.return_id || null,
      body.current_form || null,
      body.current_step || null
    ).run();

    return new Response(JSON.stringify({
      session_id: sessionId,
      message: "Hi! I'm your AI Tax Assistant. I'm here to help you through every step of filing your 2025 tax return. What would you like help with?"
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[AI Assistant] Session creation failed:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Ask AI assistant a question
 * POST /api/ai-assistant/ask
 */
router.post('/ask', async (req: any, env: any) => {
  try {
    const body = await req.json();
    
    if (!body.session_id || !body.question) {
      return new Response(JSON.stringify({ error: 'session_id and question required' }), { status: 400 });
    }

    // Get session
    const session = await env.DB.prepare(
      'SELECT * FROM ai_assistant_sessions WHERE id = ?'
    ).bind(body.session_id).first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
    }

    // Create AI assistant
    const assistant = createAITaxAssistant(
      env,
      session.user_id,
      session.id,
      session.return_id
    );

    // Get response
    const response = await assistant.ask(body.question);

    // Update session
    await env.DB.prepare(`
      UPDATE ai_assistant_sessions 
      SET current_form = ?, current_step = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.current_form || session.current_form,
      response.next_step || session.current_step,
      session.id
    ).run();

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[AI Assistant] Question processing failed:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get conversation history
 * GET /api/ai-assistant/history/:session_id
 */
router.get('/history/:session_id', async (req: any, env: any) => {
  const sessionId = req.params.session_id;
  
  const rows = await env.DB.prepare(
    'SELECT * FROM ai_assistant_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 50'
  ).bind(sessionId).all();

  return new Response(JSON.stringify({
    session_id: sessionId,
    messages: rows.results
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * Search forms (Form Finder)
 * GET /api/ai-assistant/forms/search
 */
router.get('/forms/search', async (req: any, env: any) => {
  const url = new URL(req.url);
  const query = url.searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    // Return popular forms
    const rows = await env.DB.prepare(
      'SELECT * FROM form_finder_index WHERE is_active = 1 ORDER BY form_number LIMIT 20'
    ).all();

    return new Response(JSON.stringify({ results: rows.results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Search by form number, name, or keywords
  const rows = await env.DB.prepare(`
    SELECT * FROM form_finder_index 
    WHERE is_active = 1 
    AND (
      LOWER(form_number) LIKE ? 
      OR LOWER(form_name) LIKE ? 
      OR LOWER(keywords) LIKE ?
    )
    ORDER BY 
      CASE 
        WHEN LOWER(form_number) = ? THEN 1
        WHEN LOWER(form_number) LIKE ? THEN 2
        ELSE 3
      END,
      form_number
    LIMIT 10
  `).bind(
    `%${query}%`,
    `%${query}%`,
    `%${query}%`,
    query,
    `${query}%`
  ).all();

  return new Response(JSON.stringify({
    query,
    results: rows.results
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * Get form details
 * GET /api/ai-assistant/forms/:form_number
 */
router.get('/forms/:form_number', async (req: any, env: any) => {
  const formNumber = req.params.form_number.toUpperCase();

  const form = await env.DB.prepare(
    'SELECT * FROM form_finder_index WHERE UPPER(form_number) = ? AND is_active = 1'
  ).bind(formNumber).first();

  if (!form) {
    return new Response(JSON.stringify({ error: 'Form not found' }), { status: 404 });
  }

  // Get AI guidance for this form
  const assistant = createAITaxAssistant(env, 0, uuid());
  const guidance = await assistant.provideFormHelp(formNumber);

  return new Response(JSON.stringify({
    form,
    ai_guidance: guidance
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * Get e-file workflow status
 * GET /api/ai-assistant/workflow/:return_id
 */
router.get('/workflow/:return_id', async (req: any, env: any) => {
  const returnId = parseInt(req.params.return_id);

  const workflow = await env.DB.prepare(
    'SELECT * FROM efile_workflow WHERE return_id = ?'
  ).bind(returnId).first();

  if (!workflow) {
    return new Response(JSON.stringify({ error: 'Workflow not found' }), { status: 404 });
  }

  // Get all steps
  const steps = await env.DB.prepare(
    'SELECT * FROM efile_workflow_steps ORDER BY step_order'
  ).all();

  const completedSteps = JSON.parse(workflow.completed_steps || '[]');
  const currentStepIndex = steps.results.findIndex((s: any) => s.step_id === workflow.current_step);

  return new Response(JSON.stringify({
    return_id: returnId,
    current_step: workflow.current_step,
    current_step_name: steps.results[currentStepIndex]?.step_name,
    progress_percent: Math.round((completedSteps.length / steps.results.length) * 100),
    completed_steps: completedSteps,
    all_steps: steps.results,
    validation_errors: JSON.parse(workflow.validation_errors || '[]'),
    ai_suggestions: JSON.parse(workflow.ai_suggestions || '[]')
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * Update workflow step
 * POST /api/ai-assistant/workflow/:return_id/step
 */
router.post('/workflow/:return_id/step', async (req: any, env: any) => {
  try {
    const returnId = parseInt(req.params.return_id);
    const body = await req.json();

    if (!body.step_id) {
      return new Response(JSON.stringify({ error: 'step_id required' }), { status: 400 });
    }

    // Get or create workflow
    let workflow = await env.DB.prepare(
      'SELECT * FROM efile_workflow WHERE return_id = ?'
    ).bind(returnId).first();

    if (!workflow) {
      const workflowId = uuid();
      await env.DB.prepare(`
        INSERT INTO efile_workflow (id, return_id, current_step, completed_steps, created_at, updated_at)
        VALUES (?, ?, ?, '[]', datetime('now'), datetime('now'))
      `).bind(workflowId, returnId, body.step_id).run();

      workflow = { id: workflowId, completed_steps: '[]' };
    }

    // Update current step
    const completedSteps = JSON.parse(workflow.completed_steps || '[]');
    if (body.completed && !completedSteps.includes(body.step_id)) {
      completedSteps.push(body.step_id);
    }

    await env.DB.prepare(`
      UPDATE efile_workflow 
      SET current_step = ?,
          completed_steps = ?,
          validation_errors = ?,
          updated_at = datetime('now')
      WHERE return_id = ?
    `).bind(
      body.step_id,
      JSON.stringify(completedSteps),
      JSON.stringify(body.validation_errors || []),
      returnId
    ).run();

    return new Response(JSON.stringify({
      success: true,
      current_step: body.step_id,
      completed_steps: completedSteps
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[AI Assistant] Workflow update failed:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Get tax tips for current context
 * GET /api/ai-assistant/tips
 */
router.get('/tips', async (req: any, env: any) => {
  const url = new URL(req.url);
  const context = url.searchParams.get('context') || 'general';

  const tips: Record<string, any> = {
    'income': {
      title: 'Income Reporting Tips',
      tips: [
        'Report ALL income, even if you didn\'t receive a form',
        'W-2 wages go on Form 1040 Line 1',
        '1099-NEC income requires Schedule C and self-employment tax',
        'Interest over $1,500 requires Schedule B'
      ]
    },
    'deductions': {
      title: 'Maximize Your Deductions',
      tips: [
        'Most taxpayers benefit from the standard deduction ($15,000 single, $30,000 married)',
        'HSA contributions are deductible (up to $4,300 self / $8,550 family)',
        'Student loan interest deduction: up to $2,500',
        'IRA contributions may be deductible (up to $7,000)'
      ]
    },
    'credits': {
      title: 'Don\'t Miss These Credits',
      tips: [
        'Child Tax Credit: $2,000 per child under 17',
        'EITC: Up to $8,046 for 3+ children',
        'American Opportunity Credit: $2,500 for college expenses',
        'Saver\'s Credit: Up to $1,000 for retirement contributions'
      ]
    },
    'efile': {
      title: 'E-Filing Best Practices',
      tips: [
        'E-file with direct deposit for fastest refund (21 days)',
        'Double-check all Social Security numbers',
        'Sign and date your return',
        'Keep copies of all forms and receipts for 3 years'
      ]
    }
  };

  const contextTips = tips[context] || tips['general'] || {
    title: 'General Tax Tips',
    tips: [
      'File on time, even if you can\'t pay',
      'Review your return carefully before submitting',
      'Ask questions if you\'re unsure about anything',
      'Keep good records throughout the year'
    ]
  };

  return new Response(JSON.stringify(contextTips), {
    headers: { 'Content-Type': 'application/json' }
  });
});

export default router;
