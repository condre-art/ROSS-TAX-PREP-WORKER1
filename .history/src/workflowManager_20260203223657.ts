/**
 * Workflow & Task Assignment System
 * 
 * Features:
 * - Automated workflow stages for tax preparation
 * - Task assignment to staff (preparers, reviewers, EROs)
 * - Status tracking and notifications
 * - Due date management
 * - Priority levels
 */

import { v4 as uuid } from 'uuid';
import { logAudit } from '../utils/audit';

/**
 * Workflow Stages for Tax Return Processing
 */
export enum WorkflowStage {
  INTAKE = 'intake',                    // Client intake form received
  DOCUMENTS_PENDING = 'documents_pending', // Waiting for documents
  DOCUMENTS_RECEIVED = 'documents_received', // All documents uploaded
  ASSIGNED = 'assigned',                // Assigned to preparer
  IN_PROGRESS = 'in_progress',          // Preparer working on return
  REVIEW_PENDING = 'review_pending',    // Ready for review
  IN_REVIEW = 'in_review',              // Under review by lead/ERO
  REVISIONS_NEEDED = 'revisions_needed', // Needs corrections
  APPROVED = 'approved',                // Approved for e-file
  EFILE_PENDING = 'efile_pending',      // Queued for IRS submission
  TRANSMITTED = 'transmitted',          // Sent to IRS
  ACCEPTED = 'accepted',                // IRS accepted
  REJECTED = 'rejected',                // IRS rejected
  COMPLETED = 'completed'               // Fully completed
}

/**
 * Task Types
 */
export enum TaskType {
  DOCUMENT_REQUEST = 'document_request',
  PREPARE_RETURN = 'prepare_return',
  REVIEW_RETURN = 'review_return',
  CLIENT_FOLLOW_UP = 'client_follow_up',
  SIGNATURE_REQUEST = 'signature_request',
  EFILE_SUBMISSION = 'efile_submission',
  REFUND_TRACKING = 'refund_tracking',
  QUALITY_REVIEW = 'quality_review'
}

/**
 * Priority Levels
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Task Interface
 */
export interface Task {
  id: string;
  return_id: number;
  client_id: string;
  task_type: TaskType;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: Priority;
  assigned_to: number | null; // staff ID
  assigned_by: number | null; // admin/manager ID
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new task
 */
export async function createTask(
  env: any,
  taskData: {
    return_id: number;
    client_id: string;
    task_type: TaskType;
    title: string;
    description: string;
    priority: Priority;
    assigned_to?: number;
    assigned_by?: number;
    due_date?: string;
  }
): Promise<Task> {
  const taskId = uuid();
  const now = new Date().toISOString();

  const task: Task = {
    id: taskId,
    return_id: taskData.return_id,
    client_id: taskData.client_id,
    task_type: taskData.task_type,
    title: taskData.title,
    description: taskData.description,
    status: 'pending',
    priority: taskData.priority,
    assigned_to: taskData.assigned_to || null,
    assigned_by: taskData.assigned_by || null,
    due_date: taskData.due_date || null,
    completed_at: null,
    notes: null,
    created_at: now,
    updated_at: now
  };

  await env.DB.prepare(`
    INSERT INTO workflow_tasks (
      id, return_id, client_id, task_type, title, description,
      status, priority, assigned_to, assigned_by, due_date,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    task.id,
    task.return_id,
    task.client_id,
    task.task_type,
    task.title,
    task.description,
    task.status,
    task.priority,
    task.assigned_to,
    task.assigned_by,
    task.due_date,
    task.created_at,
    task.updated_at
  ).run();

  await logAudit(env, {
    action: 'task_created',
    resource_type: 'workflow_task',
    resource_id: taskId,
    user_id: taskData.assigned_by?.toString(),
    details: { task_type: taskData.task_type, priority: taskData.priority }
  });

  return task;
}

/**
 * Assign task to staff member
 */
export async function assignTask(
  env: any,
  taskId: string,
  assignedTo: number,
  assignedBy: number
): Promise<void> {
  await env.DB.prepare(`
    UPDATE workflow_tasks
    SET assigned_to = ?, assigned_by = ?, status = 'pending', updated_at = ?
    WHERE id = ?
  `).bind(assignedTo, assignedBy, new Date().toISOString(), taskId).run();

  await logAudit(env, {
    action: 'task_assigned',
    resource_type: 'workflow_task',
    resource_id: taskId,
    user_id: assignedBy.toString(),
    details: { assigned_to: assignedTo }
  });

  // TODO: Send notification to assigned staff member
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  env: any,
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
  notes?: string
): Promise<void> {
  const now = new Date().toISOString();
  const completedAt = status === 'completed' ? now : null;

  await env.DB.prepare(`
    UPDATE workflow_tasks
    SET status = ?, notes = ?, completed_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(status, notes || null, completedAt, now, taskId).run();

  await logAudit(env, {
    action: 'task_status_updated',
    resource_type: 'workflow_task',
    resource_id: taskId,
    details: { status, notes }
  });
}

/**
 * Get tasks for a staff member
 */
export async function getTasksForStaff(
  env: any,
  staffId: number,
  filters?: {
    status?: string;
    priority?: Priority;
    overdue?: boolean;
  }
): Promise<Task[]> {
  let query = `
    SELECT * FROM workflow_tasks
    WHERE assigned_to = ?
  `;
  const params: any[] = [staffId];

  if (filters?.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  if (filters?.priority) {
    query += ` AND priority = ?`;
    params.push(filters.priority);
  }

  if (filters?.overdue) {
    query += ` AND due_date < ? AND status != 'completed'`;
    params.push(new Date().toISOString());
  }

  query += ` ORDER BY priority DESC, due_date ASC`;

  const result = await env.DB.prepare(query).bind(...params).all();
  return result.results as Task[];
}

/**
 * Get tasks for a return
 */
export async function getTasksForReturn(
  env: any,
  returnId: number
): Promise<Task[]> {
  const result = await env.DB.prepare(`
    SELECT * FROM workflow_tasks
    WHERE return_id = ?
    ORDER BY created_at DESC
  `).bind(returnId).all();

  return result.results as Task[];
}

/**
 * Auto-create workflow tasks when return is created
 */
export async function createWorkflowForReturn(
  env: any,
  returnId: number,
  clientId: string,
  taxYear: number
): Promise<void> {
  const today = new Date();
  const taxDeadline = new Date(taxYear + 1, 3, 15); // April 15

  // Task 1: Request documents
  await createTask(env, {
    return_id: returnId,
    client_id: clientId,
    task_type: TaskType.DOCUMENT_REQUEST,
    title: `Request ${taxYear} Tax Documents`,
    description: `Request all necessary documents from client for ${taxYear} tax return (W-2, 1099, receipts, etc.)`,
    priority: Priority.HIGH,
    due_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  });

  // Task 2: Prepare return (auto-created when documents received)
  // This will be created dynamically when workflow advances

  // Task 3: Request signature (will be created when return is ready)
}

/**
 * Advance workflow stage
 */
export async function advanceWorkflowStage(
  env: any,
  returnId: number,
  fromStage: WorkflowStage,
  toStage: WorkflowStage,
  userId: string
): Promise<void> {
  // Update return status
  await env.DB.prepare(`
    UPDATE returns
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).bind(toStage, new Date().toISOString(), returnId).run();

  // Log the advancement
  await logAudit(env, {
    action: 'workflow_advanced',
    resource_type: 'return',
    resource_id: returnId.toString(),
    user_id: userId,
    details: { from: fromStage, to: toStage }
  });

  // Create follow-up tasks based on new stage
  const returnData = await env.DB.prepare(
    'SELECT client_id, tax_year FROM returns WHERE id = ?'
  ).bind(returnId).first();

  if (!returnData) return;

  switch (toStage) {
    case WorkflowStage.DOCUMENTS_RECEIVED:
      // Create "Prepare Return" task
      await createTask(env, {
        return_id: returnId,
        client_id: returnData.client_id,
        task_type: TaskType.PREPARE_RETURN,
        title: `Prepare ${returnData.tax_year} Tax Return`,
        description: 'Review all documents and prepare tax return',
        priority: Priority.MEDIUM,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
      });
      break;

    case WorkflowStage.REVIEW_PENDING:
      // Create "Review Return" task
      await createTask(env, {
        return_id: returnId,
        client_id: returnData.client_id,
        task_type: TaskType.REVIEW_RETURN,
        title: `Review ${returnData.tax_year} Tax Return`,
        description: 'Quality review before client signature',
        priority: Priority.HIGH,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days
      });
      break;

    case WorkflowStage.APPROVED:
      // Create "Signature Request" task
      await createTask(env, {
        return_id: returnId,
        client_id: returnData.client_id,
        task_type: TaskType.SIGNATURE_REQUEST,
        title: `Request Client Signature`,
        description: 'Send engagement letter and Form 8879 for e-signature',
        priority: Priority.URGENT,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
      });
      break;

    case WorkflowStage.EFILE_PENDING:
      // Create "E-file Submission" task
      await createTask(env, {
        return_id: returnId,
        client_id: returnData.client_id,
        task_type: TaskType.EFILE_SUBMISSION,
        title: `Submit ${returnData.tax_year} Return to IRS`,
        description: 'E-file return after all signatures collected',
        priority: Priority.URGENT,
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day
      });
      break;

    case WorkflowStage.TRANSMITTED:
      // Create "Refund Tracking" task
      await createTask(env, {
        return_id: returnId,
        client_id: returnData.client_id,
        task_type: TaskType.REFUND_TRACKING,
        title: `Track IRS Acknowledgment`,
        description: 'Monitor IRS status and refund processing',
        priority: Priority.LOW,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });
      break;
  }
}

/**
 * Get workflow summary for dashboard
 */
export async function getWorkflowSummary(env: any): Promise<any> {
  const stages = Object.values(WorkflowStage);
  const summary: any = {};

  for (const stage of stages) {
    const result = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM returns WHERE status = ?'
    ).bind(stage).first();
    
    summary[stage] = result?.count || 0;
  }

  return summary;
}

/**
 * Get overdue tasks count
 */
export async function getOverdueTasksCount(env: any): Promise<number> {
  const result = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM workflow_tasks
    WHERE due_date < ? AND status != 'completed' AND status != 'cancelled'
  `).bind(new Date().toISOString()).first();

  return result?.count || 0;
}
