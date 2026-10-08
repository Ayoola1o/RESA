import { ListingReport, ReportStatus } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class ReportRepository {
  async findById(id: string): Promise<ListingReport | null> {
    const db = getDb();
    return db.reports.find((r) => r.id === id) || null;
  }

  async listAll(): Promise<ListingReport[]> {
    const db = getDb();
    return [...db.reports];
  }

  async findByProperty(propertyId: string): Promise<ListingReport[]> {
    const db = getDb();
    return db.reports.filter((r) => r.propertyId === propertyId);
  }

  async create(data: Omit<ListingReport, 'id' | 'reportedAt' | 'status'>): Promise<ListingReport> {
    const db = getDb();
    const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newReport: ListingReport = {
      ...data,
      id,
      status: 'REPORTED',
      reportedAt: now,
    };

    db.reports.unshift(newReport);
    saveDb(db);
    return newReport;
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    adminId: string,
    resolutionNotes?: string
  ): Promise<ListingReport | null> {
    const db = getDb();
    const idx = db.reports.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    db.reports[idx] = {
      ...db.reports[idx],
      status,
      resolvedBy: adminId,
      resolvedAt: new Date().toISOString(),
      resolutionNotes: resolutionNotes || db.reports[idx].resolutionNotes,
    };

    // If report is suspended, update property status accordingly
    if (status === 'SUSPENDED') {
      const propIdx = db.properties.findIndex((p) => p.id === db.reports[idx].propertyId);
      if (propIdx !== -1) {
        db.properties[propIdx].listingStatus = 'SUSPENDED';
      }
    }

    saveDb(db);
    return db.reports[idx];
  }
}

export const reportRepository = new ReportRepository();
