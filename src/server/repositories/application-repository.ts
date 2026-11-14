import { Application, ApplicationStatus } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';
import { randomUUID } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

type ApplicationRow = { id: string; property_id: string; seeker_id: string; application_data: Record<string, any>; created_at: string; updated_at: string };

function applicationClient() {
  const client = getSupabaseAdminClient();
  if (!client && process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase server credentials are missing; refusing to use temporary local application storage.');
  }
  return client;
}

function fromRow(row: ApplicationRow): Application {
  return {
    ...row.application_data,
    id: row.id,
    propertyId: row.property_id,
    seekerId: row.seeker_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as Application;
}

function toRow(application: Application) {
  const { id, propertyId, seekerId, createdAt, updatedAt, ...applicationData } = application;
  return { id, property_id: propertyId, seeker_id: seekerId, application_data: applicationData, created_at: createdAt, updated_at: updatedAt };
}

export class ApplicationRepository {
  async findById(id: string): Promise<Application | null> {
    const client = applicationClient();
    if (client) {
      const { data, error } = await client.from('property_applications').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(`Could not load application: ${error.message}`);
      return data ? fromRow(data as ApplicationRow) : null;
    }
    const db = getDb();
    return db.applications.find((a) => a.id === id) || null;
  }

  async listAll(): Promise<Application[]> {
    const client = applicationClient();
    if (client) {
      const { data, error } = await client.from('property_applications').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(`Could not load applications: ${error.message}`);
      return (data || []).map((row) => fromRow(row as ApplicationRow));
    }
    const db = getDb();
    return [...db.applications];
  }

  async findBySeeker(seekerId: string): Promise<Application[]> {
    const client = applicationClient();
    if (client) {
      const { data, error } = await client.from('property_applications').select('*').eq('seeker_id', seekerId).order('created_at', { ascending: false });
      if (error) throw new Error(`Could not load seeker applications: ${error.message}`);
      return (data || []).map((row) => fromRow(row as ApplicationRow));
    }
    const db = getDb();
    return db.applications.filter((a) => a.seekerId === seekerId);
  }

  async findByProperty(propertyId: string): Promise<Application[]> {
    const client = applicationClient();
    if (client) {
      const { data, error } = await client.from('property_applications').select('*').eq('property_id', propertyId).order('created_at', { ascending: false });
      if (error) throw new Error(`Could not load property applications: ${error.message}`);
      return (data || []).map((row) => fromRow(row as ApplicationRow));
    }
    const db = getDb();
    return db.applications.filter((a) => a.propertyId === propertyId);
  }

  async create(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
    const client = applicationClient();
    if (client) {
      const now = new Date().toISOString();
      const application = { ...data, id: `app_${randomUUID()}`, createdAt: now, updatedAt: now } as Application;
      const { data: saved, error } = await client.from('property_applications').insert(toRow(application)).select('*').single();
      if (error) throw new Error(`Could not save property application: ${error.message}`);
      return fromRow(saved as ApplicationRow);
    }
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
    const client = applicationClient();
    if (client) {
      const current = await this.findById(id);
      if (!current) return null;
      const next = { ...current, status, reviewNotes: reviewNotes || current.reviewNotes, updatedAt: new Date().toISOString() };
      const { data, error } = await client.from('property_applications').update({ application_data: toRow(next).application_data, updated_at: next.updatedAt }).eq('id', id).select('*').maybeSingle();
      if (error) throw new Error(`Could not update application status: ${error.message}`);
      return data ? fromRow(data as ApplicationRow) : null;
    }
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

  async update(id: string, data: Partial<Application> | ((current: Application) => Partial<Application>)): Promise<Application | null> {
    const client = applicationClient();
    if (client) {
      const current = await this.findById(id);
      if (!current) return null;
      const partial = typeof data === 'function' ? data(current) : data;
      const next = { ...current, ...partial, updatedAt: new Date().toISOString() };
      const { data: saved, error } = await client.from('property_applications').update({ application_data: toRow(next).application_data, updated_at: next.updatedAt }).eq('id', id).select('*').maybeSingle();
      if (error) throw new Error(`Could not update application: ${error.message}`);
      return saved ? fromRow(saved as ApplicationRow) : null;
    }
    const db = getDb();
    const idx = db.applications.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    db.applications[idx] = {
      ...db.applications[idx],
      ...(typeof data === 'function' ? data(db.applications[idx]) : data),
      updatedAt: new Date().toISOString(),
    };

    saveDb(db);
    return db.applications[idx];
  }
}

export const applicationRepository = new ApplicationRepository();
