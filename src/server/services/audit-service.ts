import { User, AuditLog } from '@/types/prophunta';
import { auditRepository } from '../repositories/audit-repository';

export class AuditService {
  async getRecentLogs(adminUser: User, limit = 50): Promise<AuditLog[]> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrator / Verification Officers can view audit records');
    }
    return auditRepository.listAll(limit);
  }
}

export const auditService = new AuditService();
