import { D1Database } from '@cloudflare/workers-types';
import { logAudit } from '../utils/audit';
import { sendRealtimeNotification } from '../utils/notifications';
import { sanitizeString } from '../utils/sanitization';

export interface Badge {
  id: string;
  clientId: string;
  type: BadgeType;
  category: BadgeCategory;
  status: 'active' | 'inactive' | 'expired';
  isRequired: boolean;
  awardedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface BadgeDashboard {
  clientId: string;
  totalBadges: number;
  completedBadges: number;
  completionPercentage: number;
  badges: Badge[];
  requiredActions: string[];
  categoryProgress: Record<BadgeCategory, { completed: number; total: number; percentage: number }>;
}

export type BadgeCategory = 'payment' | 'documentation' | 'compliance' | 'transmission' | 'refund';

export type BadgeType =
  | 'payment_method_verified'
  | 'form_8879_signed'
  | 'bank_product_selected'
  | 'bank_routing_verified'
  | 'payment_settled'
  | 'payment_election_made'
  | 'identification_verified'
  | 'documents_completed'
  | 'compliance_passed'
  | 'efile_transmitted'
  | 'efile_accepted'
  | 'refund_calculated'
  | 'refund_approved'
  | 'refund_disbursed';

export interface BadgeDefinition {
  type: BadgeType;
  category: BadgeCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  isRequired: boolean;
  completionMessage: string;
}

const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  payment_method_verified: {
    type: 'payment_method_verified',
    category: 'payment',
    label: 'Payment Method Verified',
    description: 'Payment method has been verified and validated',
    icon: '✓',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your payment method has been verified.',
  },
  form_8879_signed: {
    type: 'form_8879_signed',
    category: 'documentation',
    label: 'Form 8879 Signed',
    description: 'IRS Form 8879 (Declaration for Electronic Filing) has been signed',
    icon: '📝',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Form 8879 has been electronically signed.',
  },
  bank_product_selected: {
    type: 'bank_product_selected',
    category: 'payment',
    label: 'Bank Product Selected',
    description: 'You have selected a bank product option (RA, EPS, SBTPG, or Refundo)',
    icon: '🏦',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'You have selected a bank product.',
  },
  bank_routing_verified: {
    type: 'bank_routing_verified',
    category: 'payment',
    label: 'Bank Routing Verified',
    description: 'Your bank routing and account information has been verified',
    icon: '🔐',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your bank routing information has been verified.',
  },
  payment_settled: {
    type: 'payment_settled',
    category: 'payment',
    label: 'Payment Settled',
    description: 'Payment has been processed and settled',
    icon: '💳',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your payment has been settled.',
  },
  payment_election_made: {
    type: 'payment_election_made',
    category: 'payment',
    label: 'Payment Election Made',
    description: 'You have made your payment election (pay with return, pay now, or accept refund)',
    icon: '🎯',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'You have made your payment election.',
  },
  identification_verified: {
    type: 'identification_verified',
    category: 'documentation',
    label: 'Identification Verified',
    description: 'Your identity has been verified and validated',
    icon: '🆔',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your identity has been verified.',
  },
  documents_completed: {
    type: 'documents_completed',
    category: 'documentation',
    label: 'Documents Completed',
    description: 'All required tax documents have been submitted and processed',
    icon: '📄',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'All tax documents have been submitted.',
  },
  compliance_passed: {
    type: 'compliance_passed',
    category: 'compliance',
    label: 'Compliance Passed',
    description: 'Your return has passed all compliance checks and is ready for transmission',
    icon: '✅',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your return has passed all compliance checks.',
  },
  efile_transmitted: {
    type: 'efile_transmitted',
    category: 'transmission',
    label: 'E-File Transmitted',
    description: 'Your return has been transmitted to the IRS',
    icon: '📨',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your return has been transmitted to the IRS.',
  },
  efile_accepted: {
    type: 'efile_accepted',
    category: 'transmission',
    label: 'E-File Accepted',
    description: 'Your return has been accepted by the IRS',
    icon: '🎉',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your return has been accepted by the IRS.',
  },
  refund_calculated: {
    type: 'refund_calculated',
    category: 'refund',
    label: 'Refund Calculated',
    description: 'Your refund amount has been calculated',
    icon: '💰',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your refund has been calculated.',
  },
  refund_approved: {
    type: 'refund_approved',
    category: 'refund',
    label: 'Refund Approved',
    description: 'Your refund has been approved by the IRS',
    icon: '✓',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your refund has been approved.',
  },
  refund_disbursed: {
    type: 'refund_disbursed',
    category: 'refund',
    label: 'Refund Disbursed',
    description: 'Your refund has been disbursed to your account',
    icon: '🏦',
    color: '#FFD700',
    isRequired: true,
    completionMessage: 'Your refund has been deposited.',
  },
};

export async function createBadge(
  db: D1Database,
  clientId: string,
  type: BadgeType,
  metadata?: Record<string, any>
): Promise<Badge> {
  const definition = BADGE_DEFINITIONS[type];
  if (!definition) {
    throw new Error(`Unknown badge type: ${type}`);
  }

  const badgeId = `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  await db
    .prepare(
      `
      INSERT INTO badges (id, client_id, type, category, status, is_required, awarded_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(badgeId, clientId, type, definition.category, 'active', definition.isRequired, now, JSON.stringify(metadata || {}))
    .run();

  // Log audit
  await logAudit(db, {
    action: 'badge_created',
    userId: clientId,
    resourceType: 'badge',
    resourceId: badgeId,
    changes: { type, category: definition.category },
    severity: 'info',
  });

  // Send notification
  await sendRealtimeNotification(clientId, {
    type: 'badge_earned',
    title: `${definition.label} Earned!`,
    message: definition.completionMessage,
    badge: {
      type,
      label: definition.label,
      icon: definition.icon,
      color: definition.color,
    },
  });

  return {
    id: badgeId,
    clientId,
    type,
    category: definition.category,
    status: 'active',
    isRequired: definition.isRequired,
    awardedAt: now,
    metadata: metadata || {},
  };
}

export async function getBadgesByClient(db: D1Database, clientId: string): Promise<Badge[]> {
  const { results } = await db
    .prepare(
      `
      SELECT id, client_id as clientId, type, category, status, is_required as isRequired,
             awarded_at as awardedAt, expires_at as expiresAt, metadata
      FROM badges
      WHERE client_id = ?
      ORDER BY awarded_at DESC
    `
    )
    .bind(sanitizeString(clientId))
    .all();

  return (results || []).map((row: any) => ({
    id: row.id,
    clientId: row.clientId,
    type: row.type as BadgeType,
    category: row.category as BadgeCategory,
    status: row.status,
    isRequired: row.isRequired === 1,
    awardedAt: row.awardedAt,
    expiresAt: row.expiresAt,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}

export async function getBadgeDashboard(db: D1Database, clientId: string): Promise<BadgeDashboard> {
  const badges = await getBadgesByClient(db, clientId);

  const completedBadges = badges.filter((b) => b.status === 'active').length;
  const totalBadges = Object.keys(BADGE_DEFINITIONS).length;
  const completionPercentage = Math.round((completedBadges / totalBadges) * 100);

  // Calculate category progress
  const categoryProgress: Record<BadgeCategory, { completed: number; total: number; percentage: number }> = {
    payment: { completed: 0, total: 0, percentage: 0 },
    documentation: { completed: 0, total: 0, percentage: 0 },
    compliance: { completed: 0, total: 0, percentage: 0 },
    transmission: { completed: 0, total: 0, percentage: 0 },
    refund: { completed: 0, total: 0, percentage: 0 },
  };

  // Count totals per category
  Object.values(BADGE_DEFINITIONS).forEach((def) => {
    categoryProgress[def.category].total++;
  });

  // Count completed per category
  badges.forEach((badge) => {
    if (badge.status === 'active') {
      categoryProgress[badge.category].completed++;
    }
  });

  // Calculate percentages
  Object.keys(categoryProgress).forEach((cat) => {
    const category = cat as BadgeCategory;
    categoryProgress[category].percentage =
      categoryProgress[category].total > 0
        ? Math.round((categoryProgress[category].completed / categoryProgress[category].total) * 100)
        : 0;
  });

  // Identify required actions
  const requiredActions: string[] = [];
  const awardedTypes = new Set(badges.map((b) => b.type));

  const requiredBadges = Object.values(BADGE_DEFINITIONS).filter((def) => def.isRequired);
  requiredBadges.forEach((def) => {
    if (!awardedTypes.has(def.type)) {
      requiredActions.push(def.label);
    }
  });

  return {
    clientId,
    totalBadges,
    completedBadges,
    completionPercentage,
    badges,
    requiredActions,
    categoryProgress,
  };
}

export function getBadgeDefinition(type: BadgeType): BadgeDefinition | null {
  return BADGE_DEFINITIONS[type] || null;
}

export function getAllBadgeDefinitions(): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS);
}

export async function updateBadgeStatus(
  db: D1Database,
  badgeId: string,
  status: 'active' | 'inactive' | 'expired'
): Promise<void> {
  await db.prepare(`UPDATE badges SET status = ? WHERE id = ?`).bind(status, badgeId).run();

  await logAudit(db, {
    action: 'badge_status_updated',
    resourceType: 'badge',
    resourceId: badgeId,
    changes: { status },
    severity: 'info',
  });
}
