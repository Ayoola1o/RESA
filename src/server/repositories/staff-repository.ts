import { StaffAccount, CustomPermissionGrant } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';
import { getSupabaseServerClient } from '@/lib/supabase/server';

function fromSupabase(row: Record<string, unknown>): StaffAccount {
  return {
    id: String(row.id), userId: String(row.user_id), email: String(row.email), name: String(row.name),
    roles: (row.roles as StaffAccount['roles']) || [], status: row.status as StaffAccount['status'],
    scope: (row.scope as StaffAccount['scope']) || { scopeType: 'GLOBAL' },
    delegation: row.delegation as StaffAccount['delegation'],
    customGrants: (row.custom_grants as StaffAccount['customGrants']) || [],
    invitedBy: row.invited_by as StaffAccount['invitedBy'], lastActiveAt: row.last_active_at as string | undefined,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

export class StaffRepository {
  async findById(id: string): Promise<StaffAccount | null> {
    const db = getDb();
    return db.staffAccounts.find((s) => s.id === id) || null;
  }

  async findByUserId(userId: string): Promise<StaffAccount | null> {
    const db = getDb();
    const local = db.staffAccounts.find((s) => s.userId === userId);
    if (local) return local;
    const supabase = await getSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('staff_accounts').select('*').eq('user_id', userId).maybeSingle();
    return data ? fromSupabase(data as Record<string, unknown>) : null;
  }

  async findByEmail(email: string): Promise<StaffAccount | null> {
    const db = getDb();
    const local = (
      db.staffAccounts.find((s) => s.email.toLowerCase() === email.toLowerCase().trim()) || null
    );
    if (local) return local;
    const supabase = await getSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('staff_accounts').select('*').ilike('email', email.trim()).maybeSingle();
    return data ? fromSupabase(data as Record<string, unknown>) : null;
  }

  async listAll(): Promise<StaffAccount[]> {
    const db = getDb();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return [...db.staffAccounts];
    const { data } = await supabase.from('staff_accounts').select('*');
    if (!data) return [...db.staffAccounts];
    const merged = new Map(db.staffAccounts.map((staff) => [staff.userId, staff]));
    for (const row of data) { const staff = fromSupabase(row as Record<string, unknown>); merged.set(staff.userId, staff); }
    return [...merged.values()];
  }

  async create(data: Omit<StaffAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffAccount> {
    const db = getDb();
    const id = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newStaff: StaffAccount = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    db.staffAccounts.push(newStaff);
    saveDb(db);
    return newStaff;
  }

  async update(id: string, partial: Partial<StaffAccount>): Promise<StaffAccount | null> {
    const db = getDb();
    const idx = db.staffAccounts.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    db.staffAccounts[idx] = {
      ...db.staffAccounts[idx],
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    saveDb(db);
    return db.staffAccounts[idx];
  }

  async addCustomGrant(
    staffId: string,
    grantData: Omit<CustomPermissionGrant, 'id' | 'grantedAt'>
  ): Promise<CustomPermissionGrant | null> {
    const db = getDb();
    const idx = db.staffAccounts.findIndex((s) => s.id === staffId);
    if (idx === -1) return null;

    const grantId = `cgrant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newGrant: CustomPermissionGrant = {
      ...grantData,
      id: grantId,
      grantedAt: now,
    };

    if (!db.staffAccounts[idx].customGrants) {
      db.staffAccounts[idx].customGrants = [];
    }
    db.staffAccounts[idx].customGrants.push(newGrant);
    db.staffAccounts[idx].updatedAt = now;

    saveDb(db);
    return newGrant;
  }

  async revokeCustomGrant(
    staffId: string,
    grantId: string,
    revokedBy: string
  ): Promise<boolean> {
    const db = getDb();
    const staffIdx = db.staffAccounts.findIndex((s) => s.id === staffId);
    if (staffIdx === -1) return false;

    const grants = db.staffAccounts[staffIdx].customGrants || [];
    const grantIdx = grants.findIndex((g) => g.id === grantId);
    if (grantIdx === -1) return false;

    grants[grantIdx].status = 'REVOKED';
    grants[grantIdx].reviewedAt = new Date().toISOString();
    grants[grantIdx].reviewedBy = revokedBy;
    db.staffAccounts[staffIdx].updatedAt = new Date().toISOString();

    saveDb(db);
    return true;
  }
}

export const staffRepository = new StaffRepository();
