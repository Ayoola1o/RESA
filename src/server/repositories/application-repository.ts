import { Application, ApplicationStatus } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class ApplicationRepository {
  async findById(id: string): Promise<Application | null> {
    const db = getDb();
    return db.applications.find((a) => a.id === id) || null;
  }

  async listAll(): Promise<Application[]> {
    const db = getDb();
    return [...db.applications];
  }

  async findBySeeker(seekerId: string): Promise<Application[]> {
    const db = getDb();
    return db.applications.filter((a) => a.seekerId === seekerId);
  }

  async findByProperty(propertyId: string): Promise<Application[]> {
    const db = getDb();
    return db.applications.filter((a) => a.propertyId === propertyId);
  }

  async create(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
    const db = getDb();
    const id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newApp: Application = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    db.applications.unshift(newApp);
    saveDb(db);
    return newApp;
  }

  async updateStatus(id: string, status: ApplicationStatus, reviewNotes?: string): Promise<Application | null> {
    const db = getDb();
    const idx = db.applications.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    db.applications[idx] = {
      ...db.applications[idx],
      status,
      reviewNotes: reviewNotes || db.applications[idx].reviewNotes,
      updatedAt: new Date().toISOString(),
    };

    saveDb(db);
    return db.applications[idx];
  }
}

export const applicationRepository = new ApplicationRepository();
