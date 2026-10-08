import { cookies } from 'next/headers';
import { User, UserRole } from '@/types/prophunta';
import { userRepository } from '../repositories/user-repository';
import { auditRepository } from '../repositories/audit-repository';
import { getDb, saveDb } from '../db/store';

const SESSION_COOKIE_NAME = 'prophunta_session';
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    agencyName?: string;
    licenseNumber?: string;
  }): Promise<{ user: User | null; error?: string }> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      return { user: null, error: 'An account with this email already exists.' };
    }

    if (data.password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters long.' };
    }

    const user = await userRepository.create(
      {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        role: data.role,
        verificationStatus: data.role === 'SEEKER' ? 'VERIFIED' : 'PENDING',
        agencyName: data.agencyName?.trim(),
        licenseNumber: data.licenseNumber?.trim(),
      },
      data.password
    );

    // Create session
    await this.createSession(user);

    // Audit log
    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      objectType: 'USER',
      objectId: user.id,
      result: 'SUCCESS',
      metadata: { role: user.role },
    });

    return { user };
  }

  async login(email: string, plainPassword: string): Promise<{ user: User | null; error?: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { user: null, error: 'Invalid email or password.' };
    }

    const isValid = await userRepository.verifyPassword(user.id, plainPassword);
    if (!isValid) {
      await auditRepository.create({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_LOGIN',
        objectType: 'USER',
        objectId: user.id,
        result: 'FAILURE',
        metadata: { reason: 'Incorrect password' },
      });
      return { user: null, error: 'Invalid email or password.' };
    }

    await this.createSession(user);

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      objectType: 'USER',
      objectId: user.id,
      result: 'SUCCESS',
    });

    return { user };
  }

  async resetPassword(email: string, newPlainPassword: string): Promise<{ success: boolean; error?: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }

    if (newPlainPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    await userRepository.updatePassword(user.id, newPlainPassword);

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_PASSWORD_RESET',
      objectType: 'USER',
      objectId: user.id,
      result: 'SUCCESS',
    });

    return { success: true };
  }

  async logout(): Promise<void> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        const db = getDb();
        delete db.sessions[token];
        saveDb(db);
      }
      cookieStore.delete(SESSION_COOKIE_NAME);
    } catch {
      // Non-request scope
    }
  }

  async createSession(user: User): Promise<string> {
    const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    const db = getDb();
    db.sessions[token] = {
      userId: user.id,
      role: user.role,
      expiresAt,
    };
    saveDb(db);

    try {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 14 * 24 * 60 * 60,
      });
    } catch {
      // Non-request scope
    }

    return token;
  }

  async getCurrentUser(): Promise<User | null> {
    let token: string | undefined;
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Non-request scope
    }

    if (!token) {
      // Default fallback for preview / demo if no session yet: first seeker user
      const db = getDb();
      return db.users.find((u) => u.email === 'seeker@prophunta.ai') || db.users[0] || null;
    }

    const db = getDb();
    const session = db.sessions[token];
    if (!session) {
      return db.users.find((u) => u.email === 'seeker@prophunta.ai') || db.users[0] || null;
    }

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      delete db.sessions[token];
      saveDb(db);
      return null;
    }

    return (await userRepository.findById(session.userId)) || null;
  }

  async switchDemoRole(targetRole: UserRole): Promise<User | null> {
    const db = getDb();
    const targetUser = db.users.find((u) => u.role === targetRole);
    if (!targetUser) return null;

    await this.createSession(targetUser);

    await auditRepository.create({
      actorId: targetUser.id,
      actorEmail: targetUser.email,
      actorRole: targetRole,
      action: 'USER_ROLE_CHANGED',
      objectType: 'USER',
      objectId: targetUser.id,
      result: 'SUCCESS',
      metadata: { newRole: targetRole },
    });

    return targetUser;
  }

  async requireUser(): Promise<User> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  }

  async requireRole(allowedRoles: UserRole[]): Promise<User> {
    const user = await this.requireUser();
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Forbidden: Access requires one of [${allowedRoles.join(', ')}] role`);
    }
    return user;
  }
}

export const authService = new AuthService();
