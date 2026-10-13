import crypto from 'crypto';
import { AuditLog, AuditAction, UserRole } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /auth(?:orization)?/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /session[_-]?token/i,
  /credit[_-]?card/i,
  /cvv/i,
  /private[_-]?key/i,
];

const MASKED_IDENTITY_KEY_PATTERNS = [
  /bvn/i,
  /nin/i,
  /ssn/i,
  /account[_-]?number/i,
  /bank[_-]?account/i,
];

/**
 * Recursively redacts passwords, tokens, API keys and masks identity numbers in audit metadata.
 */
export function redactSensitiveData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    if (/^Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/i.test(data)) {
      return '[REDACTED_TOKEN]';
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        result[key] = '[REDACTED]';
      } else if (MASKED_IDENTITY_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        if (typeof value === 'string' && value.length > 4) {
          result[key] = `***${value.slice(-4)}`;
        } else {
          result[key] = '[REDACTED]';
        }
      } else {
        result[key] = redactSensitiveData(value);
      }
    }
    return result;
  }
  return data;
}

/**
 * Computes deterministic SHA-256 cryptographic hash for an audit log entry.
 */
export function computeLogChecksum(
  log: {
    id: string;
    timestamp: string;
    actorId: string;
    action: string;
    objectType: string;
    objectId: string;
    result: string;
    metadata?: Record<string, any>;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
    correlationId?: string;
  },
  previousChecksum: string
): string {
  const payload = [
    previousChecksum,
    log.id,
    log.timestamp,
    log.actorId,
    log.action,
    log.objectType,
    log.objectId,
    log.result,
    log.correlationId || '',
    JSON.stringify(log.beforeState || {}),
    JSON.stringify(log.afterState || {}),
    JSON.stringify(log.metadata || {}),
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

export class AuditRepository {
  private ensureInitialized(): void {
    const db = getDb();
    const logs = db.auditLogs;
    let needsSave = false;
    let prevHash = GENESIS_HASH;

    // Build chain from oldest (tail) to newest (head)
    for (let i = logs.length - 1; i >= 0; i--) {
      const item = logs[i];
      if (!item.checksum || !item.previousChecksum) {
        item.previousChecksum = prevHash;
        item.checksum = computeLogChecksum(item, prevHash);
        needsSave = true;
      }
      prevHash = item.checksum;
    }

    if (needsSave) {
      saveDb(db);
    }
  }

  async listAll(limit = 100): Promise<AuditLog[]> {
    this.ensureInitialized();
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

  async query(
    filters?: {
      action?: AuditAction;
      objectType?: AuditLog['objectType'];
      objectId?: string;
      actorId?: string;
      startDate?: string;
      endDate?: string;
      correlationId?: string;
    },
    limit = 100
  ): Promise<AuditLog[]> {
    this.ensureInitialized();
    const db = getDb();
    let result = db.auditLogs;

    if (filters?.action) {
      result = result.filter((l) => l.action === filters.action);
    }
    if (filters?.objectType) {
      result = result.filter((l) => l.objectType === filters.objectType);
    }
    if (filters?.objectId) {
      result = result.filter((l) => l.objectId === filters.objectId);
    }
    if (filters?.actorId) {
      result = result.filter((l) => (l.actor?.id || l.actorId) === filters.actorId);
    }
    if (filters?.correlationId) {
      result = result.filter((l) => l.correlationId === filters.correlationId);
    }
    if (filters?.startDate) {
      result = result.filter((l) => new Date(l.timestamp) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
      result = result.filter((l) => new Date(l.timestamp) <= new Date(filters.endDate!));
    }

    return result.slice(0, limit).map((log: any) => ({
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
    correlationId?: string;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    this.ensureInitialized();
    const db = getDb();
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    const actorId = data.actor?.id || data.actorId || 'system';
    const actorEmail = data.actor?.email || data.actorEmail || 'system@prophunta.ai';
    const actorRole = data.actor?.role || data.actorRole || 'ADMIN';

    // Redact sensitive payload information
    const safeMetadata = data.metadata ? redactSensitiveData(data.metadata) : undefined;
    const safeBeforeState = data.beforeState ? redactSensitiveData(data.beforeState) : undefined;
    const safeAfterState = data.afterState ? redactSensitiveData(data.afterState) : undefined;

    // Cryptographic hash chaining: link to previous head of chain
    const previousChecksum = db.auditLogs.length > 0 && db.auditLogs[0].checksum
      ? db.auditLogs[0].checksum
      : GENESIS_HASH;

    const baseLog = {
      id,
      timestamp,
      actorId,
      action: data.action,
      objectType: data.objectType,
      objectId: data.objectId,
      result: data.result,
      correlationId: data.correlationId,
      beforeState: safeBeforeState,
      afterState: safeAfterState,
      metadata: safeMetadata,
    };

    const checksum = computeLogChecksum(baseLog, previousChecksum);

    const log: AuditLog = {
      ...baseLog,
      actor: data.actor
        ? { ...data.actor }
        : {
            id: actorId,
            email: actorEmail,
            role: actorRole,
          },
      actorEmail,
      actorRole,
      previousChecksum,
      checksum,
    };

    db.auditLogs.unshift(log);
    saveDb(db);
    return log;
  }

  /**
   * Cryptographically verifies the SHA-256 hash-chain across all stored audit entries.
   */
  async verifyIntegrity(): Promise<{
    isValid: boolean;
    totalLogs: number;
    brokenAtIndex?: number;
    error?: string;
  }> {
    this.ensureInitialized();
    const db = getDb();
    const logs = db.auditLogs;
    if (logs.length === 0) {
      return { isValid: true, totalLogs: 0 };
    }

    let expectedPrevChecksum = GENESIS_HASH;
    // Walk from oldest (tail) to newest (head)
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      if (log.previousChecksum !== expectedPrevChecksum) {
        return {
          isValid: false,
          totalLogs: logs.length,
          brokenAtIndex: i,
          error: `Hash chain broken at index ${i} (ID: ${log.id}). Expected previous checksum ${expectedPrevChecksum}, got ${log.previousChecksum}`,
        };
      }

      const calculated = computeLogChecksum(log, log.previousChecksum);
      if (log.checksum !== calculated) {
        return {
          isValid: false,
          totalLogs: logs.length,
          brokenAtIndex: i,
          error: `Checksum mismatch at index ${i} (ID: ${log.id}). Expected ${calculated}, stored ${log.checksum}`,
        };
      }

      expectedPrevChecksum = log.checksum!;
    }

    return { isValid: true, totalLogs: logs.length };
  }

  /**
   * Immutability enforcement: audit logs must never be updated.
   */
  async update(): Promise<never> {
    throw new Error('Audit logs are immutable and cannot be modified.');
  }

  /**
   * Immutability enforcement: audit logs must never be deleted.
   */
  async delete(): Promise<never> {
    throw new Error('Audit logs are immutable and cannot be deleted.');
  }
}

export const auditRepository = new AuditRepository();
