/**
 * PropHunta AI — Administrative Governance & RBAC Type Definitions
 * Based on docs/writing-block (3).md
 */

import { UserRole } from './prophunta';

export type AdminPermission =
  | 'admin.dashboard.view'
  | 'admin.staff.view'
  | 'admin.staff.invite'
  | 'admin.staff.update_role'
  | 'admin.staff.deactivate'
  | 'verification.queue.view'
  | 'verification.review'
  | 'verification.approve'
  | 'verification.reject'
  | 'documents.view_metadata'
  | 'documents.view_sensitive'
  | 'documents.review'
  | 'properties.moderate'
  | 'properties.suspend'
  | 'properties.restore'
  | 'reports.view'
  | 'reports.investigate'
  | 'reports.resolve'
  | 'reports.escalate'
  | 'inspections.view'
  | 'inspections.assign'
  | 'inspections.update'
  | 'users.view_limited'
  | 'users.support'
  | 'users.suspend'
  | 'audit_logs.view'
  | 'audit_logs.export'
  | 'approvals.view_assigned'
  | 'approvals.approve'
  | 'approvals.reject'
  | 'platform.settings.view'
  | 'platform.settings.manage';

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'VERIFICATION_OFFICER'
  | 'PROPERTY_MODERATOR'
  | 'TRUST_SAFETY_INVESTIGATOR'
  | 'INSPECTION_COORDINATOR'
  | 'USER_SUPPORT_OFFICER'
  | 'COMPLIANCE_AUDITOR'
  | 'STAFF_MANAGER';

export type StaffStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface DataScope {
  scopeType: 'GLOBAL' | 'REGIONAL' | 'ASSIGNED_ONLY';
  region?: string; // e.g., 'Lagos', 'Abuja'
  assignedResourceIds?: string[];
}

export interface CustomPermissionGrant {
  id: string;
  staffId: string;
  permission: AdminPermission;
  scope?: DataScope;
  reason: string;
  grantedBy: string; // Staff ID of the grantor
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  grantedAt: string;
  expiresAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DelegationCeiling {
  canManageStaff: boolean;
  maxAssignableRoles: StaffRole[];
  allowedCustomPermissions: AdminPermission[];
  prohibitSuperAdminCreation: boolean; // Must always be true for delegated Staff Managers
}

export interface StaffAccount {
  id: string;
  userId: string; // Foreign key referencing platform User (db.users)
  email: string;
  name: string;
  roles: StaffRole[];
  status: StaffStatus;
  scope: DataScope;
  delegation?: DelegationCeiling;
  customGrants: CustomPermissionGrant[];
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}

export interface StaffAuthContext {
  staffAccount: StaffAccount;
  effectivePermissions: Set<AdminPermission>;
  activeRoles: StaffRole[];
  scope: DataScope;
}

export type ApprovalActionType =
  | 'PROPERTY_RESTORE'
  | 'USER_SUSPENSION'
  | 'PRIVILEGED_STAFF_ROLE_CHANGE'
  | 'PLATFORM_SETTINGS_CHANGE'
  | 'EMERGENCY_OVERRIDE';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'EXECUTED';

export interface ApprovalRequest {
  id: string;
  actionType: ApprovalActionType;
  targetResourceType: 'PROPERTY' | 'USER' | 'STAFF' | 'SETTINGS';
  targetResourceId: string;
  requesterStaffId: string;
  requesterUserId: string;
  requesterEmail: string;
  proposedPayload: Record<string, any>;
  initialSnapshot?: Record<string, any>;
  reason: string;
  supportingEvidence?: string;
  status: ApprovalStatus;
  approverStaffId?: string;
  approverEmail?: string;
  decisionNotes?: string;
  decidedAt?: string;
  executedAt?: string;
  executionResult?: 'SUCCESS' | 'FAILURE';
  executionError?: string;
  isEmergency?: boolean;
  createdAt: string;
  expiresAt: string;
}
