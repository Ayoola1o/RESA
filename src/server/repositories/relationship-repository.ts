import { OwnerAgentRelationship } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class RelationshipRepository {
  async listAll(): Promise<OwnerAgentRelationship[]> {
    const db = getDb();
    return db.relationships || [];
  }

  async findById(id: string): Promise<OwnerAgentRelationship | null> {
    const db = getDb();
    return db.relationships.find((r) => r.id === id) || null;
  }

  async findByOwner(ownerId: string): Promise<OwnerAgentRelationship[]> {
    const db = getDb();
    return db.relationships.filter((r) => r.ownerId === ownerId);
  }

  async findByAgent(agentId: string): Promise<OwnerAgentRelationship[]> {
    const db = getDb();
    return db.relationships.filter((r) => r.agentId === agentId);
  }

  async findActiveRelationship(ownerId: string, agentId: string): Promise<OwnerAgentRelationship | null> {
    const db = getDb();
    return (
      db.relationships.find(
        (r) => r.ownerId === ownerId && r.agentId === agentId && r.status === 'ACTIVE'
      ) || null
    );
  }

  async create(
    data: Omit<OwnerAgentRelationship, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<OwnerAgentRelationship> {
    const db = getDb();
    const now = new Date().toISOString();
    const relationship: OwnerAgentRelationship = {
      ...data,
      id: `rel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    db.relationships.push(relationship);
    saveDb(db);
    return relationship;
  }

  async update(id: string, updates: Partial<OwnerAgentRelationship>): Promise<OwnerAgentRelationship | null> {
    const db = getDb();
    const index = db.relationships.findIndex((r) => r.id === id);
    if (index === -1) return null;

    db.relationships[index] = {
      ...db.relationships[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    return db.relationships[index];
  }
}

export const relationshipRepository = new RelationshipRepository();
