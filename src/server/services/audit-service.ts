import { User, AuditLog, AuditAction } from '@/types/prophunta';
import { auditRepository } from '../repositories/audit-repository';
import { staffAuthorizationService } from './staff-authorization-service';

export interface AuditLogFilters {
  action?: AuditAction;
  objectType?: AuditLog['objectType'];
  objectId?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  correlationId?: string;
}

export class AuditService {
  /**
   * Retrieves recent audit logs, verifying staff audit view permission.
   */
  async getRecentLogs(adminUser: User, limit = 50): Promise<AuditLog[]> {
    await staffAuthorizationService.assertPermission(adminUser.id, 'audit_logs.view');
    return auditRepository.listAll(limit);
  }

  /**
   * Queries audit logs with granular filters, enforcing audit_logs.view permission.
   */
  async listAuditLogs(
    actor: User,
    filters?: AuditLogFilters,
    limit = 100
  ): Promise<AuditLog[]> {
    await staffAuthorizationService.assertPermission(actor.id, 'audit_logs.view');
    return auditRepository.query(filters, limit);
  }

  /**
   * Cryptographically verifies the tamper-evident hash chain across all stored audit entries.
   */
  async verifyAuditTrailIntegrity(actor: User): Promise<{
    isValid: boolean;
    totalLogs: number;
    brokenAtIndex?: number;
    error?: string;
  }> {
    await staffAuthorizationService.assertPermission(actor.id, 'audit_logs.view');
    const verification = await auditRepository.verifyIntegrity();

    // Audit the verification check itself
    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'AUDIT_INTEGRITY_CHECKED',
      objectType: 'APPROVAL', // objectType accepted category
      objectId: 'audit-chain',
      result: verification.isValid ? 'SUCCESS' : 'FAILURE',
      metadata: {
        totalLogs: verification.totalLogs,
        isValid: verification.isValid,
        error: verification.error,
      },
    });

    return verification;
  }

  /**
   * Exports audit logs in JSON or CSV format, strictly enforcing audit_logs.export permission.
   * Records an AUDIT_LOGS_EXPORTED event in the immutable audit trail.
   */
  async exportAuditLogs(
    actor: User,
    format: 'json' | 'csv',
    filters?: AuditLogFilters
  ): Promise<{
    fileName: string;
    mimeType: string;
    content: string;
    recordCount: number;
  }> {
    await staffAuthorizationService.assertPermission(actor.id, 'audit_logs.export');

    const logs = await auditRepository.query(filters, 5000);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `prophunta-audit-logs-${timestamp}.${format}`;
    let content = '';
    let mimeType = '';

    if (format === 'json') {
      mimeType = 'application/json';
      content = JSON.stringify(logs, null, 2);
    } else {
      mimeType = 'text/csv';
      const headers = [
        'id',
        'timestamp',
        'actorId',
        'actorEmail',
        'actorRole',
        'action',
        'objectType',
        'objectId',
        'result',
        'checksum',
        'previousChecksum',
        'metadata',
      ];
      const rows = logs.map((log) => {
        return [
          log.id,
          log.timestamp,
          log.actor?.id || log.actorId,
          log.actor?.email || log.actorEmail,
          log.actor?.role || log.actorRole,
          log.action,
          log.objectType,
          log.objectId,
          log.result,
          log.checksum || '',
          log.previousChecksum || '',
          `"${JSON.stringify(log.metadata || {}).replace(/"/g, '""')}"`,
        ].join(',');
      });
      content = [headers.join(','), ...rows].join('\n');
    }

    // Record the export in the audit log
    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'AUDIT_LOGS_EXPORTED',
      objectType: 'APPROVAL',
      objectId: fileName,
      result: 'SUCCESS',
      metadata: {
        format,
        recordCount: logs.length,
        filters,
      },
    });

    return {
      fileName,
      mimeType,
      content,
      recordCount: logs.length,
    };
  }
}

export const auditService = new AuditService();
