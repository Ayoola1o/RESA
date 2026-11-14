import { User, UserRole, UserVerificationStatus } from '@/types/prophunta';
import { getDb, saveDb, hashPassword } from '../db/store';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

type SupabaseProfile = Record<string, any>;
type SupabaseAuthUser = { id: string; email?: string; created_at: string; user_metadata?: Record<string, any> };

function userClient() {
  const client = getSupabaseAdminClient();
  if (!client && process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase server credentials are missing; refusing to use temporary local user storage.');
  }
  return client;
}

function mapProfile(profile: SupabaseProfile, authUser?: SupabaseAuthUser, agent?: SupabaseProfile): User {
  const metadata = authUser?.user_metadata || {};
  const data = profile.profile_data && typeof profile.profile_data === 'object' ? profile.profile_data : {};
  const role = (['SEEKER', 'OWNER', 'AGENT', 'ADMIN'].includes(profile.role) ? profile.role : 'SEEKER') as UserRole;
  return {
    id: String(profile.id),
    name: String(profile.name || metadata.name || authUser?.email || ''),
    email: String(authUser?.email || data.email || metadata.email || ''),
    phone: String(profile.phone || metadata.phone || ''),
    role,
    verificationStatus: (profile.verification_status || 'UNVERIFIED') as UserVerificationStatus,
    createdAt: String(profile.created_at || authUser?.created_at || new Date(0).toISOString()),
    updatedAt: String(profile.updated_at || profile.created_at || authUser?.created_at || new Date(0).toISOString()),
    profilePhoto: data.profilePhoto as string | undefined,
    location: data.location as string | undefined,
    bio: data.bio as string | undefined,
    agencyName: String(agent?.agency_name || data.agencyName || metadata.agencyName || '') || undefined,
    licenseNumber: String(agent?.license_number || data.licenseNumber || metadata.licenseNumber || '') || undefined,
    kycStatus: data.kycStatus || 'NOT_SUBMITTED',
    kycDocumentType: data.kycDocumentType,
    kycDocumentNumber: data.kycDocumentNumber,
    kycDocumentUrl: data.kycDocumentUrl,
    kycSubmittedAt: data.kycSubmittedAt,
    kycReviewedAt: data.kycReviewedAt,
    kycReviewedBy: data.kycReviewedBy,
    kycRejectionReason: data.kycRejectionReason,
    agentVerificationLevel: data.agentVerificationLevel,
    agentCredentials: data.agentCredentials,
  };
}

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const client = userClient();
    if (client) {
      const [{ data: profile, error }, { data: authResult }] = await Promise.all([
        client.from('profiles').select('*').eq('id', id).maybeSingle(),
        client.auth.admin.getUserById(id),
      ]);
      if (error) throw new Error(`Could not load user profile: ${error.message}`);
      if (!profile) return null;
      const { data: agent } = profile.role === 'AGENT'
        ? await client.from('agent_profiles').select('agency_name,license_number').eq('user_id', id).maybeSingle()
        : { data: null };
      return mapProfile(profile, authResult?.user as SupabaseAuthUser | undefined, agent || undefined);
    }
    const db = getDb();
    return db.users.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = getDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  async verifyPassword(userId: string, plainPassword: string): Promise<boolean> {
    const db = getDb();
    const storedHash = db.passwords[userId];
    if (!storedHash) return false;
    return storedHash === hashPassword(plainPassword);
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, plainPassword: string): Promise<User> {
    const db = getDb();
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newUser: User = {
      ...user,
      id,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);
    db.passwords[id] = hashPassword(plainPassword);
    saveDb(db);

    return newUser;
  }

  async update(id: string, partial: Partial<User>): Promise<User | null> {
    const client = userClient();
    if (client) {
      const current = await this.findById(id);
      if (!current) return null;
      const { data: stored, error: storedError } = await client.from('profiles').select('profile_data').eq('id', id).single();
      if (storedError) throw new Error(`Could not load user profile data: ${storedError.message}`);
      const next = { ...current, ...partial, updatedAt: new Date().toISOString() };
      const profileData = {
        ...(stored.profile_data && typeof stored.profile_data === 'object' ? stored.profile_data : {}),
        profilePhoto: next.profilePhoto, location: next.location, bio: next.bio,
        kycStatus: next.kycStatus || 'NOT_SUBMITTED', kycDocumentType: next.kycDocumentType,
        kycDocumentNumber: next.kycDocumentNumber, kycDocumentUrl: next.kycDocumentUrl,
        kycSubmittedAt: next.kycSubmittedAt, kycReviewedAt: next.kycReviewedAt,
        kycReviewedBy: next.kycReviewedBy, kycRejectionReason: next.kycRejectionReason,
        agentVerificationLevel: next.agentVerificationLevel, agentCredentials: next.agentCredentials,
      };
      const { error } = await client.from('profiles').update({
        name: next.name, phone: next.phone, role: next.role,
        verification_status: next.verificationStatus, profile_data: profileData, updated_at: next.updatedAt,
      }).eq('id', id);
      if (error) throw new Error(`Could not update user profile: ${error.message}`);
      if (next.role === 'AGENT' && (partial.agencyName !== undefined || partial.licenseNumber !== undefined)) {
        const { error: agentError } = await client.from('agent_profiles').upsert({
          user_id: id, agency_name: next.agencyName || null, license_number: next.licenseNumber || null,
        }, { onConflict: 'user_id' });
        if (agentError) throw new Error(`Could not update agent profile: ${agentError.message}`);
      }
      return next;
    }
    const db = getDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    db.users[idx] = {
      ...db.users[idx],
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    return db.users[idx];
  }

  async updatePassword(userId: string, newPlainPassword: string): Promise<boolean> {
    const db = getDb();
    db.passwords[userId] = hashPassword(newPlainPassword);
    saveDb(db);
    return true;
  }

  async listAll(): Promise<User[]> {
    const client = userClient();
    if (client) {
      const { data: profiles, error } = await client.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(`Could not load user profiles: ${error.message}`);
      const authUsers: SupabaseAuthUser[] = [];
      for (let page = 1; ; page += 1) {
        const { data, error: authError } = await client.auth.admin.listUsers({ page, perPage: 1000 });
        if (authError) throw new Error(`Could not load account emails: ${authError.message}`);
        authUsers.push(...data.users as SupabaseAuthUser[]);
        if (data.users.length < 1000) break;
      }
      const authById = new Map(authUsers.map((user) => [user.id, user]));
      const agentIds = (profiles || []).filter((profile) => profile.role === 'AGENT').map((profile) => profile.id);
      const { data: agents, error: agentError } = agentIds.length
        ? await client.from('agent_profiles').select('user_id,agency_name,license_number').in('user_id', agentIds)
        : { data: [], error: null };
      if (agentError) throw new Error(`Could not load agent profiles: ${agentError.message}`);
      const agentById = new Map((agents || []).map((agent) => [agent.user_id, agent]));
      return (profiles || []).map((profile) => mapProfile(profile, authById.get(profile.id), agentById.get(profile.id)));
    }
    const db = getDb();
    return [...db.users];
  }
}

export const userRepository = new UserRepository();
