import { ApprovalRequest } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class ApprovalRepository {
  async findById(id: string): Promise<ApprovalRequest | null> {
    const db = getDb();
    return db.approvalRequests.find((a) => a.id === id) || null;
  }

  async listAll(): Promise<ApprovalRequest[]> {
    const db = getDb();
    return [...db.approvalRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async listPending(): Promise<ApprovalRequest[]> {
    const db = getDb();
    const now = new Date();
    return db.approvalRequests
      .filter((a) => a.status === 'PENDING' && new Date(a.expiresAt) > now)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(
    data: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>
  ): Promise<ApprovalRequest> {
    const db = getDb();
    const id = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newRequest: ApprovalRequest = {
      ...data,
      id,
      status: 'PENDING',
      createdAt: now,
    };

    db.approvalRequests.push(newRequest);
    saveDb(db);
    return newRequest;
  }

  async update(id: string, partial: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    const db = getDb();
    const idx = db.approvalRequests.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    db.approvalRequests[idx] = {
      ...db.approvalRequests[idx],
      ...partial,
    };

    saveDb(db);
    return db.approvalRequests[idx];
  }
}

export const approvalRepository = new ApprovalRepository();
