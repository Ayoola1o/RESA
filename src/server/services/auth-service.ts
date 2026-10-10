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
    password?: string;
    phone: string;
    role: UserRole;
    agencyName?: string;
    licenseNumber?: string;
  }): Promise<{ user: User | null; error?: string }> {
    // Security: Prevent public registration from granting the ADMIN role
    if (data.role === 'ADMIN') {
      return { user: null, error: 'Administrator role cannot be assigned through public registration.' };
    }

    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      return { user: null, error: 'An account with this email already exists.' };
    }

    if (data.password && data.password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters long.' };
    }

    const assignedRole: UserRole = ['SEEKER', 'OWNER', 'AGENT'].includes(data.role) ? data.role : 'SEEKER';

    // Security: Do not automatically mark any user (including seekers) as KYC verified
    const user = await userRepository.create(
      {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        role: assignedRole,
        verificationStatus: 'UNVERIFIED',
        kycStatus: 'NOT_SUBMITTED',
        agencyName: data.agencyName?.trim(),
        licenseNumber: data.licenseNumber?.trim(),
      },
      data.password || 'Password123!'
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
      metadata: { role: user.role, verificationStatus: 'UNVERIFIED' },
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

  /**
   * Derive current user and role strictly from the authenticated session
   */
  async getCurrentUser(): Promise<User | null> {
    let token: string | undefined;
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Non-request scope
    }

    if (!token) {
      return null;
    }

    const db = getDb();
    const session = db.sessions[token];
    if (!session) {
      return null;
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
      throw new Error('Authentication required: Active session not found.');
    }
    return user;
  }

  async requireRole(allowedRoles: UserRole[]): Promise<User> {
    const user = await this.requireUser();
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Forbidden: Access requires one of [${allowedRoles.join(', ')}] role.`);
    }
    return user;
  }

  /**
   * Enforce identity KYC verification eligibility before protected operations
   */
  async requireKycVerified(user: User): Promise<User> {
    if (user.role === 'ADMIN') {
      return user; // Admins have platform governance bypass
    }
    if (user.verificationStatus !== 'VERIFIED' || user.kycStatus !== 'VERIFIED') {
      throw new Error(
        'Identity KYC verification required: Please complete identity verification before performing protected actions.'
      );
    }
    return user;
  }

  /**
   * Submit KYC identity documents for verification review
   */
  async submitKyc(
    user: User,
    data: {
      documentType: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD';
      documentNumber: string;
      documentUrl?: string;
    }
  ): Promise<User> {
    const now = new Date().toISOString();
    const updated = await userRepository.update(user.id, {
      kycStatus: 'PENDING',
      verificationStatus: 'PENDING',
      kycDocumentType: data.documentType,
      kycDocumentNumber: data.documentNumber.trim(),
      kycDocumentUrl: data.documentUrl || `/secure-vault/kyc/${user.id}/${data.documentType.toLowerCase()}.pdf`,
      kycSubmittedAt: now,
    });
    if (!updated) throw new Error('User not found');

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'KYC_SUBMITTED',
      objectType: 'USER',
      objectId: user.id,
      result: 'SUCCESS',
      metadata: { documentType: data.documentType, documentNumber: data.documentNumber },
    });

    return updated;
  }

  /**
   * Admin workflow for reviewing user KYC submissions
   */
  async reviewKyc(
    adminUser: User,
    targetUserId: string,
    outcome: 'VERIFIED' | 'REJECTED' | 'CHANGES_REQUIRED',
    notes?: string
  ): Promise<User> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrators can review KYC identity submissions.');
    }

    const now = new Date().toISOString();
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) throw new Error('Target user not found');

    const verificationStatus = outcome === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED';

    const updated = await userRepository.update(targetUserId, {
      kycStatus: outcome,
      verificationStatus,
      kycReviewedAt: now,
      kycReviewedBy: adminUser.id,
      kycRejectionReason: outcome !== 'VERIFIED' ? notes : undefined,
    });
    if (!updated) throw new Error('Failed to update KYC status');

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: outcome === 'VERIFIED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
      objectType: 'USER',
      objectId: targetUserId,
      result: 'SUCCESS',
      metadata: { outcome, notes },
    });

    return updated;
  }

  async getAllUsers(adminUser: User): Promise<User[]> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrators can view all platform users.');
    }
    return userRepository.listAll();
  }

  async updateUserVerificationStatus(
    adminUser: User,
    targetUserId: string,
    status: import('@/types/prophunta').UserVerificationStatus
  ): Promise<User> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrators can modify user verification status.');
    }
    const updated = await userRepository.update(targetUserId, { verificationStatus: status });
    if (!updated) throw new Error('User not found');

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_STATUS_UPDATED',
      objectType: 'USER',
      objectId: targetUserId,
      result: 'SUCCESS',
      metadata: { newStatus: status },
    });

    return updated;
  }

  async updateUserRole(adminUser: User, targetUserId: string, newRole: UserRole): Promise<User> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only Administrators can modify user roles.');
    }
    const updated = await userRepository.update(targetUserId, { role: newRole });
    if (!updated) throw new Error('User not found');

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'USER_ROLE_CHANGED',
      objectType: 'USER',
      objectId: targetUserId,
      result: 'SUCCESS',
      metadata: { newRole },
    });

    return updated;
  }
}

export const authService = new AuthService();
