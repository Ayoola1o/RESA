import { User } from '@/types/prophunta';
import {
  AdminPermission,
  StaffRole,
  StaffStatus,
  StaffAccount,
  CustomPermissionGrant,
  DataScope,
  DelegationCeiling,
} from '@/types/admin-governance';
import { staffRepository } from '../repositories/staff-repository';
import { userRepository } from '../repositories/user-repository';
import { auditRepository } from '../repositories/audit-repository';
import { staffAuthorizationService, ROLE_PERMISSIONS } from './staff-authorization-service';
import { getDb, saveDb } from '../db/store';

export class StaffManagementService {
  /**
   * Retrieves the directory of all administrative staff accounts.
   */
  async listStaff(actor: User): Promise<StaffAccount[]> {
    await staffAuthorizationService.requirePermission(actor, 'admin.staff.view');
    return staffRepository.listAll();
  }

  /**
   * Retrieves a single staff account by its ID.
   */
  async getStaffById(actor: User, staffId: string): Promise<StaffAccount> {
    await staffAuthorizationService.requirePermission(actor, 'admin.staff.view');
    const staff = await staffRepository.findById(staffId);
    if (!staff) throw new Error('Staff account not found.');
    return staff;
  }

  /**
   * Onboards/invites a new staff member and provisions their administrative account.
   */
  async inviteStaff(
    actor: User,
    data: {
      name: string;
      email: string;
      phone?: string;
      roles: StaffRole[];
      scope?: DataScope;
      delegation?: DelegationCeiling;
      initialPassword?: string;
    }
  ): Promise<StaffAccount> {
    const actorContext = await staffAuthorizationService.requirePermission(
      actor,
      'admin.staff.invite'
    );

    // Validate delegation ceiling: Delegated Staff Managers cannot grant roles beyond ceiling or create Super Admins
    staffAuthorizationService.validateStaffManagementDelegation(
      actorContext,
      null,
      data.roles
    );

    const email = data.email.toLowerCase().trim();

    // Prevent duplicate staff accounts
    const existingStaff = await staffRepository.findByEmail(email);
    if (existingStaff) {
      throw new Error(`A staff account with email "${email}" already exists.`);
    }

    // Provision or link corresponding platform user
    let user = await userRepository.findByEmail(email);
    if (!user) {
      user = await userRepository.create(
        {
          name: data.name.trim(),
          email,
          phone: data.phone || '+234 800 000 0000',
          role: 'ADMIN',
          verificationStatus: 'VERIFIED',
          kycStatus: 'VERIFIED',
        },
        data.initialPassword || 'TemporaryStaffPass123!'
      );
    } else if (user.role !== 'ADMIN') {
      await userRepository.update(user.id, { role: 'ADMIN' });
    }

    const newStaff = await staffRepository.create({
      userId: user.id,
      email,
      name: data.name.trim(),
      roles: data.roles,
      status: 'ACTIVE',
      scope: data.scope || { scopeType: 'GLOBAL' },
      delegation: data.delegation,
      customGrants: [],
      invitedBy: actorContext.staffAccount.id,
    });

    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'STAFF_INVITED',
      objectType: 'STAFF',
      objectId: newStaff.id,
      result: 'SUCCESS',
      metadata: {
        staffId: newStaff.id,
        email: newStaff.email,
        roles: newStaff.roles,
        scope: newStaff.scope,
      },
    });

    return newStaff;
  }

  /**
   * Updates assigned roles for a staff member, observing delegation ceilings.
   */
  async updateStaffRoles(
    actor: User,
    staffId: string,
    newRoles: StaffRole[]
  ): Promise<StaffAccount> {
    const actorContext = await staffAuthorizationService.requirePermission(
      actor,
      'admin.staff.update_role'
    );

    const targetStaff = await staffRepository.findById(staffId);
    if (!targetStaff) throw new Error('Target staff account not found.');

    // Validate delegation: blocks self-promotion, promoting to Super Admin, or exceeding ceilings
    staffAuthorizationService.validateStaffManagementDelegation(
      actorContext,
      targetStaff,
      newRoles
    );

    const updated = await staffRepository.update(staffId, { roles: newRoles });

    // Invalidate sessions to force privilege refresh
    this.revokeStaffSessions(targetStaff.userId);

    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'STAFF_ROLES_UPDATED',
      objectType: 'STAFF',
      objectId: staffId,
      result: 'SUCCESS',
      metadata: {
        previousRoles: targetStaff.roles,
        newRoles,
      },
    });

    return updated!;
  }

  /**
   * Grants a controlled, expiring custom permission to a staff member.
   */
  async grantCustomPermission(
    actor: User,
    staffId: string,
    data: {
      permission: AdminPermission;
      reason: string;
      durationHours: number;
      scope?: DataScope;
    }
  ): Promise<CustomPermissionGrant> {
    const actorContext = await staffAuthorizationService.requirePermission(
      actor,
      'admin.staff.update_role'
    );

    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error(
        'A comprehensive justification (minimum 5 characters) is required for custom privilege grants.'
      );
    }

    if (data.durationHours <= 0 || data.durationHours > 720) {
      throw new Error('Custom permission grant duration must be between 1 and 720 hours (30 days).');
    }

    const targetStaff = await staffRepository.findById(staffId);
    if (!targetStaff) throw new Error('Target staff account not found.');

    // Validate delegation ceiling
    staffAuthorizationService.validateStaffManagementDelegation(
      actorContext,
      targetStaff,
      targetStaff.roles,
      [data.permission]
    );

    const expiresAt = new Date(
      Date.now() + data.durationHours * 60 * 60 * 1000
    ).toISOString();

    const grant = await staffRepository.addCustomGrant(staffId, {
      staffId,
      permission: data.permission,
      reason: data.reason.trim(),
      scope: data.scope,
      grantedBy: actorContext.staffAccount.id,
      status: 'ACTIVE',
      expiresAt,
    });

    if (!grant) throw new Error('Failed to record custom grant.');

    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'CUSTOM_PERMISSION_GRANTED',
      objectType: 'STAFF',
      objectId: staffId,
      result: 'SUCCESS',
      metadata: {
        permission: data.permission,
        reason: data.reason,
        expiresAt,
      },
    });

    return grant;
  }

  /**
   * Revokes an existing custom permission grant.
   */
  async revokeCustomPermission(
    actor: User,
    staffId: string,
    grantId: string
  ): Promise<boolean> {
    await staffAuthorizationService.requirePermission(
      actor,
      'admin.staff.update_role'
    );

    const targetStaff = await staffRepository.findById(staffId);
    if (!targetStaff) throw new Error('Target staff account not found.');

    const success = await staffRepository.revokeCustomGrant(staffId, grantId, actor.id);
    if (!success) throw new Error('Custom grant not found or could not be revoked.');

    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'CUSTOM_PERMISSION_REVOKED',
      objectType: 'STAFF',
      objectId: staffId,
      result: 'SUCCESS',
      metadata: { grantId },
    });

    return true;
  }

  /**
   * Suspends, deactivates, or reactivates a staff account.
   * If suspended or deactivated, all active sessions for the user are immediately revoked.
   */
  async updateStaffStatus(
    actor: User,
    staffId: string,
    newStatus: StaffStatus,
    reason?: string
  ): Promise<StaffAccount> {
    const actorContext = await staffAuthorizationService.requirePermission(
      actor,
      'admin.staff.deactivate'
    );

    const targetStaff = await staffRepository.findById(staffId);
    if (!targetStaff) throw new Error('Target staff account not found.');

    // 1. Prevent Self-Deactivation / Self-Suspension
    if (targetStaff.id === actorContext.staffAccount.id) {
      throw new Error('Self-Lockout Blocked: You cannot suspend or deactivate your own staff account.');
    }

    // 2. Only Super Admins can alter status of Super Admin accounts
    if (
      targetStaff.roles.includes('SUPER_ADMIN') &&
      !actorContext.activeRoles.includes('SUPER_ADMIN')
    ) {
      throw new Error('Forbidden: Only Super Admins can modify Super Admin accounts.');
    }

    const updated = await staffRepository.update(staffId, { status: newStatus });

    // Critical Session Invalidation: If suspended or deactivated, immediately terminate all active sessions
    if (newStatus === 'SUSPENDED' || newStatus === 'DEACTIVATED') {
      this.revokeStaffSessions(targetStaff.userId);
    }

    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: newStatus === 'DEACTIVATED' ? 'STAFF_DEACTIVATED' : 'STAFF_STATUS_UPDATED',
      objectType: 'STAFF',
      objectId: staffId,
      result: 'SUCCESS',
      metadata: {
        previousStatus: targetStaff.status,
        newStatus,
        reason: reason || 'Status modified by administrator.',
      },
    });

    return updated!;
  }

  /**
   * Generates a preview of effective permissions and active custom grants for any staff member.
   */
  async previewEffectivePermissions(
    actor: User,
    staffId: string
  ): Promise<{
    staff: StaffAccount;
    roles: StaffRole[];
    effectivePermissions: AdminPermission[];
    activeCustomGrants: CustomPermissionGrant[];
    scope: DataScope;
  }> {
    await staffAuthorizationService.requirePermission(actor, 'admin.staff.view');
    const staff = await staffRepository.findById(staffId);
    if (!staff) throw new Error('Staff account not found.');

    const permsSet = new Set<AdminPermission>();
    if (staff.status === 'ACTIVE') {
      for (const role of staff.roles) {
        for (const p of ROLE_PERMISSIONS[role] || []) {
          permsSet.add(p);
        }
      }
      const now = new Date();
      for (const g of staff.customGrants || []) {
        if (g.status === 'ACTIVE' && new Date(g.expiresAt) > now) {
          permsSet.add(g.permission);
        }
      }
    }

    return {
      staff,
      roles: staff.roles,
      effectivePermissions: Array.from(permsSet),
      activeCustomGrants: (staff.customGrants || []).filter(
        (g) => g.status === 'ACTIVE' && new Date(g.expiresAt) > new Date()
      ),
      scope: staff.scope,
    };
  }

  /**
   * Revokes all active session tokens for a given user ID in db.sessions.
   */
  private revokeStaffSessions(userId: string): void {
    const db = getDb();
    const tokenKeys = Object.keys(db.sessions || {});
    let modified = false;

    for (const token of tokenKeys) {
      if (db.sessions[token].userId === userId) {
        delete db.sessions[token];
        modified = true;
      }
    }

    if (modified) {
      saveDb(db);
    }
  }
}

export const staffManagementService = new StaffManagementService();
