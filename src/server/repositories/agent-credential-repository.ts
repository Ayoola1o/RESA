import { AgentCredential } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class AgentCredentialRepository {
  async listAll(): Promise<AgentCredential[]> {
    const db = getDb();
    return db.agentCredentials || [];
  }

  async findById(id: string): Promise<AgentCredential | null> {
    const db = getDb();
    return db.agentCredentials.find((c) => c.id === id) || null;
  }

  async findByAgent(agentId: string): Promise<AgentCredential[]> {
    const db = getDb();
    return db.agentCredentials.filter((c) => c.agentId === agentId);
  }

  async create(data: Omit<AgentCredential, 'id' | 'createdAt'>): Promise<AgentCredential> {
    const db = getDb();
    const now = new Date().toISOString();
    const credential: AgentCredential = {
      ...data,
      id: `cred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
    };
    db.agentCredentials.push(credential);
    saveDb(db);
    return credential;
  }

  async update(id: string, updates: Partial<AgentCredential>): Promise<AgentCredential | null> {
    const db = getDb();
    const index = db.agentCredentials.findIndex((c) => c.id === id);
    if (index === -1) return null;

    db.agentCredentials[index] = {
      ...db.agentCredentials[index],
      ...updates,
    };
    saveDb(db);
    return db.agentCredentials[index];
  }
}

export const agentCredentialRepository = new AgentCredentialRepository();
