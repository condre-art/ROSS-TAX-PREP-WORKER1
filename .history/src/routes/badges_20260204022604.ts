import { Router } from 'itty-router';
import { D1Database } from '@cloudflare/workers-types';
import { verifyAuth } from '../utils/auth';
import { getBadgeDashboard, getBadgesByClient, createBadge, BadgeType, getAllBadgeDefinitions } from '../services/badgeSystem';
import { logAudit } from '../utils/audit';

const badgesRouter = Router();

// GET /api/badges/dashboard/:clientId - Get badge dashboard with progress
badgesRouter.get('/api/badges/dashboard/:clientId', async (req, env, context) => {
  const db = env.DB as D1Database;
  const { clientId } = req.params;

  try {
    // Verify auth
    const authResult = await verifyAuth(req, db, ['client', 'staff', 'admin']);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const dashboard = await getBadgeDashboard(db, clientId);

    return new Response(JSON.stringify(dashboard), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to get badge dashboard: ${error}` }), { status: 500 });
  }
});

// GET /api/badges/client/:clientId - Get all badges for client
badgesRouter.get('/api/badges/client/:clientId', async (req, env, context) => {
  const db = env.DB as D1Database;
  const { clientId } = req.params;

  try {
    // Verify auth
    const authResult = await verifyAuth(req, db, ['client', 'staff', 'admin']);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const badges = await getBadgesByClient(db, clientId);

    return new Response(JSON.stringify({ badges, count: badges.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to get badges: ${error}` }), { status: 500 });
  }
});

// POST /api/badges/create - Create/award a badge (staff only)
badgesRouter.post('/api/badges/create', async (req, env, context) => {
  const db = env.DB as D1Database;

  try {
    // Verify auth - staff/admin only
    const authResult = await verifyAuth(req, db, ['staff', 'admin']);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized - staff only' }), { status: 401 });
    }

    const { clientId, badgeType, metadata } = await req.json();

    if (!clientId || !badgeType) {
      return new Response(JSON.stringify({ error: 'clientId and badgeType are required' }), { status: 400 });
    }

    // Validate badge type
    const badgeDefs = getAllBadgeDefinitions();
    const validTypes = new Set(badgeDefs.map((def) => def.type));
    if (!validTypes.has(badgeType)) {
      return new Response(JSON.stringify({ error: `Unknown badge type: ${badgeType}` }), { status: 400 });
    }

    const badge = await createBadge(db, clientId, badgeType as BadgeType, metadata);

    // Log audit
    await logAudit(db, {
      action: 'badge_awarded',
      userId: authResult.userId,
      resourceType: 'badge',
      resourceId: badge.id,
      changes: { clientId, badgeType },
      severity: 'info',
    });

    return new Response(JSON.stringify(badge), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to create badge: ${error}` }), { status: 500 });
  }
});

// GET /api/badges/definitions - Get all badge definitions (public)
badgesRouter.get('/api/badges/definitions', async (req, env, context) => {
  try {
    const definitions = getAllBadgeDefinitions().map((def) => ({
      type: def.type,
      category: def.category,
      label: def.label,
      description: def.description,
      icon: def.icon,
      color: def.color,
      isRequired: def.isRequired,
      completionMessage: def.completionMessage,
    }));

    return new Response(JSON.stringify(definitions), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to get badge definitions: ${error}` }), { status: 500 });
  }
});

export default badgesRouter;
