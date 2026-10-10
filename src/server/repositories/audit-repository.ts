import { AuditLog, AuditAction, UserRole } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class AuditRepository {
  async listAll(limit = 100): Promise<AuditLog[]> {
    const db = getDb();
    return db.auditLogs.slice(0, limit).map((log: any) => ({
      ...log,
      actor: log.actor || {
        id: log.actorId || 'unknown',
        email: log.actorEmail || 'unknown@prophunta.ai',
        role: log.actorRole || 'ADMIN',
      },
    }));
  }

  async create(data: {
    actor?: { id: string; email: string; role: UserRole; ipAddress?: string };
    actorId?: string;
    actorEmail?: string;
    actorRole?: UserRole;
    action: AuditAction;
    objectType: AuditLog['objectType'];
    objectId: string;
    result: 'SUCCESS' | 'FAILURE';
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    const db = getDb();
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    const actorId = data.actor?.id || data.actorId || 'system';
    const actorEmail = data.actor?.email || data.actorEmail || 'system@prophunta.ai';
    const actorRole = data.actor?.role || data.actorRole || 'ADMIN';

    const log: AuditLog = {
      id,
      actor: data.actor || {
        id: actorId,
        email: actorEmail,
        role: actorRole,
      },
      actorId,
      actorEmail,
      actorRole,
      action: data.action,
      objectType: data.objectType,
      objectId: data.objectId,
      timestamp,
      result: data.result,
      metadata: data.metadata,
    };

    db.auditLogs.unshift(log);
    saveDb(db);
    return log;
  }
}

export const auditRepository = new AuditRepository();
