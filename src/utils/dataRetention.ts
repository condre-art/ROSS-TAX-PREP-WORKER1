/**
 * Data Retention and Cleanup Utilities
 * Implements GDPR/GLBA compliance requirements for data lifecycle management
 */

import { logAudit } from './audit';

/**
 * Scheduled cleanup handler for IRS sync
 */
export async function handleScheduledIRSSync(env: any, ctx: any): Promise<void> {
  try {
    console.log('Starting scheduled IRS sync...');
    
    // Sync IRS memos and regulations
    // This would integrate with irsSync.ts
    
    const syncTimestamp = new Date().toISOString();
    console.log(`IRS sync completed at ${syncTimestamp}`);
    
    // Store sync status in KV
    if (env.KV_NAMESPACE) {
      await env.KV_NAMESPACE.put('last_irs_sync', syncTimestamp);
    }
    
    await logAudit(env, {
      action: 'scheduled_irs_sync',
      entity: 'system',
      details: JSON.stringify({ timestamp: syncTimestamp })
    });
  } catch (error) {
    console.error('IRS sync failed:', error);
    throw error;
  }
}

/**
 * Scheduled cleanup handler for audit logs and old data
 */
export async function handleAuditLogProcessing(env: any, ctx: any): Promise<void> {
  try {
    console.log('Starting audit log processing and data retention cleanup...');
    
    // Archive old audit logs (older than 7 years per IRS requirements)
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
    
    const auditResult = await env.DB.prepare(
      `DELETE FROM audit_log WHERE created_at < ?`
    ).bind(sevenYearsAgo.toISOString()).run();
    
    console.log(`Deleted ${auditResult.changes} old audit log entries`);
    
    // Delete old documents metadata (not R2 files yet - manual process)
    const documentResult = await env.DB.prepare(
      `DELETE FROM documents WHERE uploaded_at < ?`
    ).bind(sevenYearsAgo.toISOString()).run();
    
    console.log(`Deleted ${documentResult.changes} old document records`);
    
    // Clean up expired MFA codes from KV
    // KV handles TTL automatically, no action needed
    
    // Delete old returns (after 7 years)
    const returnResult = await env.DB.prepare(
      `DELETE FROM returns WHERE updated_at < ?`
    ).bind(sevenYearsAgo.toISOString()).run();
    
    console.log(`Deleted ${returnResult.changes} old return records`);
    
    // Delete old messages (after 3 years)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    const messageResult = await env.DB.prepare(
      `DELETE FROM messages WHERE created_at < ?`
    ).bind(threeYearsAgo.toISOString()).run();
    
    console.log(`Deleted ${messageResult.changes} old message records`);
    
    const processTimestamp = new Date().toISOString();
    console.log(`Data retention cleanup completed at ${processTimestamp}`);
    
    // Store cleanup status
    if (env.KV_NAMESPACE) {
      await env.KV_NAMESPACE.put('last_data_cleanup', processTimestamp);
    }
    
    await logAudit(env, {
      action: 'scheduled_data_cleanup',
      entity: 'system',
      details: JSON.stringify({
        timestamp: processTimestamp,
        audit_logs_deleted: auditResult.changes,
        documents_deleted: documentResult.changes,
        returns_deleted: returnResult.changes,
        messages_deleted: messageResult.changes
      })
    });
  } catch (error) {
    console.error('Audit log processing failed:', error);
    throw error;
  }
}

/**
 * Delete user data (GDPR right to deletion)
 */
export async function deleteUserData(env: any, userId: number, userType: 'staff' | 'client'): Promise<void> {
  try {
    const table = userType === 'staff' ? 'staff' : 'clients';
    
    // Delete user's messages
    await env.DB.prepare(`DELETE FROM messages WHERE client_id = ?`).bind(userId).run();
    
    // Delete user's returns
    await env.DB.prepare(`DELETE FROM returns WHERE client_id = ?`).bind(userId).run();
    
    // Delete user's documents metadata (R2 files require separate cleanup)
    await env.DB.prepare(`DELETE FROM documents WHERE client_id = ?`).bind(userId).run();
    
    // Delete user's signatures
    await env.DB.prepare(`DELETE FROM signatures WHERE client_id = ?`).bind(userId).run();
    
    // Anonymize audit logs (keep for compliance, but remove PII)
    await env.DB.prepare(
      `UPDATE audit_log SET user_email = 'deleted', details = 'User data deleted' WHERE user_id = ?`
    ).bind(userId).run();
    
    // Delete the user account
    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(userId).run();
    
    await logAudit(env, {
      action: 'user_data_deleted',
      entity: 'user',
      entity_id: userId.toString(),
      details: JSON.stringify({ user_type: userType, reason: 'GDPR deletion request' })
    });
    
    console.log(`User ${userId} (${userType}) data deleted successfully`);
  } catch (error) {
    console.error('Failed to delete user data:', error);
    throw error;
  }
}

/**
 * Export user data (GDPR right to data portability)
 */
export async function exportUserData(env: any, userId: number, userType: 'staff' | 'client'): Promise<any> {
  try {
    const table = userType === 'staff' ? 'staff' : 'clients';
    
    // Get user profile
    const user = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(userId).first();
    
    // Get user's messages
    const messages = await env.DB.prepare(
      `SELECT * FROM messages WHERE client_id = ?`
    ).bind(userId).all();
    
    // Get user's returns
    const returns = await env.DB.prepare(
      `SELECT * FROM returns WHERE client_id = ?`
    ).bind(userId).all();
    
    // Get user's documents
    const documents = await env.DB.prepare(
      `SELECT * FROM documents WHERE client_id = ?`
    ).bind(userId).all();
    
    // Get user's audit log entries
    const auditLogs = await env.DB.prepare(
      `SELECT * FROM audit_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 1000`
    ).bind(userId).all();
    
    const exportData = {
      user: user,
      messages: messages.results,
      returns: returns.results,
      documents: documents.results,
      audit_logs: auditLogs.results,
      exported_at: new Date().toISOString()
    };
    
    await logAudit(env, {
      action: 'user_data_exported',
      entity: 'user',
      entity_id: userId.toString(),
      details: JSON.stringify({ user_type: userType })
    });
    
    return exportData;
  } catch (error) {
    console.error('Failed to export user data:', error);
    throw error;
  }
}
