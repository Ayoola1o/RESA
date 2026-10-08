import { AuditLog, AuditAction, UserRole } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class AuditRepository {
  async listAll(limit = 100): Promise<AuditLog[]> {
    const db = getDb();
    return db.auditLogs.slice(0, limit);
  }

  async create(data: {
    actorId: string;
    actorEmail: string;
    actorRole: UserRole;
    action: AuditAction;
    objectType: AuditLog['objectType'];
    objectId: string;
    result: 'SUCCESS' | 'FAILURE';
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    const db = getDb();
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    const log: AuditLog = {
      ...data,
      id,
      timestamp,
    };

    db.auditLogs.unshift(log);
    saveDb(db);
    return log;
  }
}

export const auditRepository = new AuditRepository();
