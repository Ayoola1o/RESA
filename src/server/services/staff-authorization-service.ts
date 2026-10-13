import { User } from '@/types/prophunta';
import {
  AdminPermission,
  StaffRole,
  StaffAccount,
  StaffAuthContext,
  CustomPermissionGrant,
  DataScope,
} from '@/types/admin-governance';
import { staffRepository } from '../repositories/staff-repository';
import { userRepository } from '../repositories/user-repository';
import { auditRepository } from '../repositories/audit-repository';

/**
 * Predefined Role-to-Permission Mapping (Least Privilege Baseline)
 */
export const ROLE_PERMISSIONS: Record<StaffRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    'admin.dashboard.view',
    'admin.staff.view',
    'admin.staff.invite',
    'admin.staff.update_role',
    'admin.staff.deactivate',
    'verification.queue.view',
    'verification.review',
    'verification.approve',
    'verification.reject',
    'documents.view_metadata',
    'documents.view_sensitive',
    'documents.review',
    'properties.moderate',
    'properties.suspend',
    'properties.restore',
    'reports.view',
    'reports.investigate',
    'reports.resolve',
    'reports.escalate',
    'inspections.view',
    'inspections.assign',
    'inspections.update',
    'users.view_limited',
    'users.support',
    'users.suspend',
    'audit_logs.view',
    'audit_logs.export',
    'approvals.view_assigned',
    'approvals.approve',
    'approvals.reject',
    'platform.settings.view',
    'platform.settings.manage',
  ],
  VERIFICATION_OFFICER: [
    'admin.dashboard.view',
    'verification.queue.view',
    'verification.review',
    'verification.approve',
    'verification.reject',
    'documents.view_metadata',
    'documents.view_sensitive',
    'documents.review',
  ],
  PROPERTY_MODERATOR: [
    'admin.dashboard.view',
    'properties.moderate',
    'properties.suspend',
    'properties.restore',
    'documents.view_metadata',
  ],
  TRUST_SAFETY_INVESTIGATOR: [
    'admin.dashboard.view',
    'reports.view',
    'reports.investigate',
    'reports.resolve',
    'reports.escalate',
    'properties.moderate',
    'properties.suspend',
    'documents.view_metadata',
    'users.view_limited',
  ],
  INSPECTION_COORDINATOR: [
    'admin.dashboard.view',
    'inspections.view',
    'inspections.assign',
    'inspections.update',
    'properties.moderate',
  ],
  USER_SUPPORT_OFFICER: [
    'admin.dashboard.view',
    'users.view_limited',
    'users.support',
    'users.suspend',
    'reports.view',
  ],
  COMPLIANCE_AUDITOR: [
    'admin.dashboard.view',
    'audit_logs.view',
    'audit_logs.export',
    'verification.queue.view',
    'reports.view',
    'inspections.view',
    'documents.view_metadata',
  ],
  STAFF_MANAGER: [
    'admin.dashboard.view',
    'admin.staff.view',
    'admin.staff.invite',
    'admin.staff.update_role',
    'admin.staff.deactivate',
  ],
};

export class StaffAuthorizationService {
  /**
   * Resolves effective permissions, active roles, and data scope for an authenticated user.
   * Fails closed if the user is not an active staff member.
   */
  async getStaffContext(user: User): Promise<StaffAuthContext | null> {
    if (!user) return null;

    let staff = await staffRepository.findByUserId(user.id);

    // Fallback seed linkage for primary administrator account if not yet migrated
    if (!staff && user.role === 'ADMIN') {
      staff = await staffRepository.findByEmail(user.email);
      if (!staff && user.email === 'admin@prophunta.ai') {
        staff = await staffRepository.create({
          userId: user.id,
          email: user.email,
          name: user.name,
          roles: ['SUPER_ADMIN'],
          status: 'ACTIVE',
          scope: { scopeType: 'GLOBAL' },
          customGrants: [],
        });
      }
    }

    if (!staff) {
      return null;
    }

    // Fail closed: Suspended or deactivated staff accounts have zero permissions
    if (staff.status !== 'ACTIVE') {
      return null;
    }

    const effective = new Set<AdminPermission>();

    // 1. Accumulate permissions from all assigned roles
    for (const role of staff.roles) {
      const perms = ROLE_PERMISSIONS[role] || [];
      for (const p of perms) {
        effective.add(p);
      }
    }

    // 2. Accumulate active, unexpired custom permission grants
    const now = new Date();
    for (const grant of staff.customGrants || []) {
      if (grant.status === 'ACTIVE') {
        const expiry = new Date(grant.expiresAt);
        if (expiry > now) {
          effective.add(grant.permission);
        }
      }
    }

    return {
      staffAccount: staff,
      effectivePermissions: effective,
      activeRoles: staff.roles,
      scope: staff.scope || { scopeType: 'GLOBAL' },
    };
  }

  /**
   * Enforces that the user has the required admin permission and satisfies resource scope.
   * Throws an error if authorization fails.
   */
  async requirePermission(
    user: User,
    permission: AdminPermission,
    resourceContext?: { region?: string; resourceId?: string }
  ): Promise<StaffAuthContext> {
    const context = await this.getStaffContext(user);
    if (!context) {
      throw new Error(
        `Access Denied: User "${user.email}" does not have an active administrative staff account.`
      );
    }

    // Permission check
    if (!context.effectivePermissions.has(permission)) {
      await auditRepository.create({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_ROLE_CHANGED', // Auth violation log
        objectType: 'USER',
        objectId: user.id,
        result: 'FAILURE',
        metadata: {
          violation: 'PERMISSION_DENIED',
          requiredPermission: permission,
          assignedRoles: context.activeRoles,
        },
      });
      throw new Error(
        `Forbidden: Staff account lacks required permission [${permission}].`
      );
    }

    // Resource Scope check
    if (resourceContext && context.scope.scopeType !== 'GLOBAL') {
      if (
        context.scope.scopeType === 'REGIONAL' &&
        resourceContext.region &&
        context.scope.region &&
        resourceContext.region.toLowerCase() !== context.scope.region.toLowerCase()
      ) {
        throw new Error(
          `Forbidden: Staff member's regional scope [${context.scope.region}] does not cover resource in [${resourceContext.region}].`
        );
      }

      if (
        context.scope.scopeType === 'ASSIGNED_ONLY' &&
        resourceContext.resourceId &&
        context.scope.assignedResourceIds &&
        !context.scope.assignedResourceIds.includes(resourceContext.resourceId)
      ) {
        throw new Error(
          `Forbidden: Staff member is not assigned to target resource [${resourceContext.resourceId}].`
        );
      }
    }

    return context;
  }

  /**
   * Evaluates whether a user has a specific admin permission without throwing.
   */
  async hasPermission(
    user: User,
    permission: AdminPermission,
    resourceContext?: { region?: string; resourceId?: string }
  ): Promise<boolean> {
    try {
      const context = await this.getStaffContext(user);
      if (!context) {
        return false;
      }
      if (!context.effectivePermissions.has(permission)) {
        return false;
      }
      if (resourceContext && context.scope.scopeType !== 'GLOBAL') {
        if (
          context.scope.scopeType === 'REGIONAL' &&
          resourceContext.region &&
          context.scope.region &&
          resourceContext.region.toLowerCase() !== context.scope.region.toLowerCase()
        ) {
          return false;
        }
        if (
          context.scope.scopeType === 'ASSIGNED_ONLY' &&
          resourceContext.resourceId &&
          context.scope.assignedResourceIds &&
          !context.scope.assignedResourceIds.includes(resourceContext.resourceId)
        ) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Asserts permission given a user ID or User object.
   */
  async assertPermission(
    userOrId: User | string,
    permission: AdminPermission,
    resourceContext?: { region?: string; resourceId?: string }
  ): Promise<StaffAuthContext> {
    const user = typeof userOrId === 'string'
      ? await userRepository.findById(userOrId)
      : userOrId;
    if (!user) {
      throw new Error(`User not found: ${userOrId}`);
    }
    return this.requirePermission(user, permission, resourceContext);
  }

  /**
   * Verifies whether an actor is authorized to manage or grant privileges to a target staff member.
   * Prevents self-promotion, privilege escalation, and delegation ceiling breaches.
   */
  validateStaffManagementDelegation(
    actorContext: StaffAuthContext,
    targetStaff: StaffAccount | null,
    proposedRoles: StaffRole[],
    proposedCustomPerms?: AdminPermission[]
  ): void {
    const isSuperAdmin = actorContext.activeRoles.includes('SUPER_ADMIN');

    // 1. Super Admin has unrestricted authority over staff management
    if (isSuperAdmin) {
      return;
    }

    // 2. Non-super admin actor must have explicit STAFF_MANAGER role or delegation
    const isStaffManager = actorContext.activeRoles.includes('STAFF_MANAGER');
    const delegation = actorContext.staffAccount.delegation;

    if (!isStaffManager && !delegation?.canManageStaff) {
      throw new Error(
        'Forbidden: Staff account does not possess staff management delegation.'
      );
    }

    // 3. Prevent Self-Promotion: Staff members cannot alter their own roles or security boundary
    if (targetStaff && targetStaff.id === actorContext.staffAccount.id) {
      throw new Error(
        'Privilege Escalation Blocked: Staff members cannot modify their own roles or permissions.'
      );
    }

    // 4. Cannot create, promote, or alter SUPER_ADMIN accounts
    if (proposedRoles.includes('SUPER_ADMIN')) {
      throw new Error(
        'Privilege Escalation Blocked: Delegated Staff Managers cannot assign or grant the SUPER_ADMIN role.'
      );
    }

    if (targetStaff && targetStaff.roles.includes('SUPER_ADMIN')) {
      throw new Error(
        'Privilege Escalation Blocked: Only Super Admins can modify Super Admin accounts.'
      );
    }

    // 5. Delegation Ceiling: Proposed roles must be within the grantor's assignable ceiling
    if (delegation) {
      for (const role of proposedRoles) {
        if (!delegation.maxAssignableRoles.includes(role)) {
          throw new Error(
            `Delegation Ceiling Exceeded: Role [${role}] is outside your delegated management authority.`
          );
        }
      }

      if (proposedCustomPerms) {
        for (const perm of proposedCustomPerms) {
          if (!delegation.allowedCustomPermissions.includes(perm)) {
            throw new Error(
              `Delegation Ceiling Exceeded: Custom permission [${perm}] exceeds your delegation authority.`
            );
          }
        }
      }
    }
  }
}

export const staffAuthorizationService = new StaffAuthorizationService();
