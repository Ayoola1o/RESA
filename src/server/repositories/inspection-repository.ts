import { InspectionRequest, InspectionStatus, InspectionRecord } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class InspectionRepository {
  async findById(id: string): Promise<InspectionRequest | null> {
    const db = getDb();
    return db.inspections.find((i) => i.id === id) || null;
  }

  async listAll(): Promise<InspectionRequest[]> {
    const db = getDb();
    return [...db.inspections];
  }

  async findBySeeker(seekerId: string): Promise<InspectionRequest[]> {
    const db = getDb();
    return db.inspections.filter((i) => i.seekerId === seekerId);
  }

  async findByHost(hostId: string): Promise<InspectionRequest[]> {
    const db = getDb();
    return db.inspections.filter((i) => i.hostId === hostId);
  }

  async findByProperty(propertyId: string): Promise<InspectionRequest[]> {
    const db = getDb();
    return db.inspections.filter((i) => i.propertyId === propertyId);
  }

  async create(data: Omit<InspectionRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<InspectionRequest> {
    const db = getDb();
    const id = `insp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newInspection: InspectionRequest = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    db.inspections.unshift(newInspection);
    saveDb(db);
    return newInspection;
  }

  async update(id: string, partial: Partial<InspectionRequest>): Promise<InspectionRequest | null> {
    const db = getDb();
    const idx = db.inspections.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    db.inspections[idx] = {
      ...db.inspections[idx],
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    saveDb(db);
    return db.inspections[idx];
  }
}

export const inspectionRepository = new InspectionRepository();
