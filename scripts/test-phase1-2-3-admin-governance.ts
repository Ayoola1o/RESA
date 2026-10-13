import { resetDatabase } from '../src/server/db/store';
import { staffRepository } from '../src/server/repositories/staff-repository';
import { userRepository } from '../src/server/repositories/user-repository';
import {
  staffAuthorizationService,
  ROLE_PERMISSIONS,
} from '../src/server/services/staff-authorization-service';
import { User } from '../src/types/prophunta';

async function runPhase123Tests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE: PHASES 1, 2 & 3 — ADMIN GOVERNANCE, RBAC & POLICY');
  console.log('================================================================\n');

  resetDatabase();

  const superAdminUser = (await userRepository.findById('user_admin_1'))!;
  const seekerUser = (await userRepository.findById('user_seeker_1'))!;
  const ownerUser = (await userRepository.findById('user_owner_1'))!;

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: PREDEFINED STAFF ROLES & PERMISSION SEPARATION (PHASE 2)
  // ---------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: PREDEFINED STAFF ROLES & PERMISSION ISOLATION ---');

  // 1.1 Super Admin has all 32 permissions
  const superAdminContext = await staffAuthorizationService.getStaffContext(superAdminUser);
  if (!superAdminContext || superAdminContext.effectivePermissions.size !== 32) {
    throw new Error(
      `Failed: Super Admin expected 32 permissions, got ${superAdminContext?.effectivePermissions.size}`
    );
  }
  console.log('✅ 1.1 PASSED: Super Admin holds all 32 permissions in central catalogue.');

  // 1.2 Verification Officer role permissions
  const voAccount = await staffRepository.create({
    userId: 'user_vo_test',
    email: 'vo@prophunta.ai',
    name: 'Verification Officer Test',
    roles: ['VERIFICATION_OFFICER'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
  });
  const voUser: User = {
    ...seekerUser,
    id: 'user_vo_test',
    email: 'vo@prophunta.ai',
    role: 'ADMIN',
  };

  const voContext = await staffAuthorizationService.getStaffContext(voUser);
  if (!voContext?.effectivePermissions.has('verification.approve')) {
    throw new Error('Failed: Verification Officer must have verification.approve');
  }
  if (voContext.effectivePermissions.has('properties.suspend')) {
    throw new Error('Failed: Verification Officer must NOT have properties.suspend by default');
  }
  if (voContext.effectivePermissions.has('audit_logs.export')) {
    throw new Error('Failed: Verification Officer must NOT have audit_logs.export');
  }
  console.log('✅ 1.2 PASSED: Verification Officer has verification.approve but is restricted from property suspension and audit export.');

  // 1.3 Property Moderator role permissions
  const pmAccount = await staffRepository.create({
    userId: 'user_pm_test',
    email: 'pm@prophunta.ai',
    name: 'Property Moderator Test',
    roles: ['PROPERTY_MODERATOR'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
  });
  const pmUser: User = { ...seekerUser, id: 'user_pm_test', email: 'pm@prophunta.ai', role: 'ADMIN' };
  const pmContext = await staffAuthorizationService.getStaffContext(pmUser);

  if (!pmContext?.effectivePermissions.has('properties.suspend')) {
    throw new Error('Failed: Property Moderator must have properties.suspend');
  }
  if (pmContext.effectivePermissions.has('verification.approve')) {
    throw new Error('Failed: Property Moderator must NOT have verification.approve');
  }
  if (pmContext.effectivePermissions.has('documents.view_sensitive')) {
    throw new Error('Failed: Property Moderator must NOT have documents.view_sensitive');
  }
  console.log('✅ 1.3 PASSED: Property Moderator has properties.suspend but is blocked from approving title verification and sensitive documents.');

  // 1.4 Trust & Safety Investigator
  const tsiAccount = await staffRepository.create({
    userId: 'user_tsi_test',
    email: 'tsi@prophunta.ai',
    name: 'T&S Investigator Test',
    roles: ['TRUST_SAFETY_INVESTIGATOR'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
  });
  const tsiUser: User = { ...seekerUser, id: 'user_tsi_test', email: 'tsi@prophunta.ai', role: 'ADMIN' };
  const tsiContext = await staffAuthorizationService.getStaffContext(tsiUser);
  if (!tsiContext?.effectivePermissions.has('reports.investigate')) {
    throw new Error('Failed: T&S Investigator must have reports.investigate');
  }
  if (tsiContext.effectivePermissions.has('verification.approve')) {
    throw new Error('Failed: T&S Investigator must NOT have verification.approve');
  }
  console.log('✅ 1.4 PASSED: Trust & Safety Investigator has reports.investigate but cannot approve title verifications.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: FAIL-CLOSED & NON-STAFF DENIAL (PHASE 3)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: FAIL-CLOSED & NON-STAFF DENIAL ---');

  // 2.1 Regular platform Seeker denied
  try {
    await staffAuthorizationService.requirePermission(seekerUser, 'admin.dashboard.view');
    throw new Error('Security Violation: Seeker was permitted admin dashboard access!');
  } catch (err: any) {
    if (!err.message.includes('does not have an active administrative staff account')) {
      throw err;
    }
  }
  console.log('✅ 2.1 PASSED: Regular platform seeker blocked with explicit non-staff denial.');

  // 2.2 Property Owner denied
  try {
    await staffAuthorizationService.requirePermission(ownerUser, 'properties.suspend');
    throw new Error('Security Violation: Owner was permitted admin properties.suspend!');
  } catch (err: any) {
    if (!err.message.includes('does not have an active administrative staff account')) {
      throw err;
    }
  }
  console.log('✅ 2.2 PASSED: Property owner blocked from administrative operations.');

  // 2.3 Suspended Staff Member denied
  await staffRepository.update(voAccount.id, { status: 'SUSPENDED' });
  try {
    await staffAuthorizationService.requirePermission(voUser, 'verification.approve');
    throw new Error('Security Violation: Suspended staff member was permitted verification approval!');
  } catch (err: any) {
    if (!err.message.includes('does not have an active administrative staff account')) {
      throw err;
    }
  }
  console.log('✅ 2.3 PASSED: Suspended staff member immediately loses all administrative permissions (fail-closed).');

  // Reactivate for further tests
  await staffRepository.update(voAccount.id, { status: 'ACTIVE' });

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: CUSTOM PERMISSION GRANTS & LIFECYCLE (PHASE 2 & 3)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: CONTROLLED CUSTOM PERMISSION GRANTS ---');

  // 3.1 Grant temporary properties.suspend to Verification Officer
  const grant = await staffRepository.addCustomGrant(voAccount.id, {
    staffId: voAccount.id,
    permission: 'properties.suspend',
    reason: 'Temporary emergency coverage for property moderation incident',
    grantedBy: superAdminUser.id,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  });
  if (!grant) throw new Error('Failed to create custom grant');

  const voWithGrant = await staffAuthorizationService.getStaffContext(voUser);
  if (!voWithGrant?.effectivePermissions.has('properties.suspend')) {
    throw new Error('Failed: Active custom grant was not reflected in effective permissions');
  }
  console.log('✅ 3.1 PASSED: Active custom permission grant correctly augmented staff capabilities.');

  // 3.2 Expired grant is automatically ignored
  await staffRepository.addCustomGrant(voAccount.id, {
    staffId: voAccount.id,
    permission: 'platform.settings.manage',
    reason: 'Expired audit',
    grantedBy: superAdminUser.id,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() - 60 * 1000).toISOString(), // Expired 1 min ago
  });
  const voWithExpired = await staffAuthorizationService.getStaffContext(voUser);
  if (voWithExpired?.effectivePermissions.has('platform.settings.manage')) {
    throw new Error('Security Violation: Expired custom grant was still considered effective!');
  }
  console.log('✅ 3.2 PASSED: Expired custom grant was automatically ignored (fail-closed).');

  // 3.3 Revoked grant is immediately disabled
  await staffRepository.revokeCustomGrant(voAccount.id, grant.id, superAdminUser.id);
  const voAfterRevoke = await staffAuthorizationService.getStaffContext(voUser);
  if (voAfterRevoke?.effectivePermissions.has('properties.suspend')) {
    throw new Error('Security Violation: Revoked custom grant remained active!');
  }
  console.log('✅ 3.3 PASSED: Revoked custom grant was immediately disabled upon revocation.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: DELEGATION CEILINGS & SELF-PROMOTION PROTECTION (PHASE 2 & 3)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: DELEGATION CEILINGS & SELF-PROMOTION PROTECTION ---');

  // Create delegated Staff Manager
  const smAccount = await staffRepository.create({
    userId: 'user_sm_test',
    email: 'manager@prophunta.ai',
    name: 'Delegated Staff Manager',
    roles: ['STAFF_MANAGER'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    delegation: {
      canManageStaff: true,
      maxAssignableRoles: ['VERIFICATION_OFFICER', 'PROPERTY_MODERATOR'],
      allowedCustomPermissions: ['verification.review', 'properties.moderate'],
      prohibitSuperAdminCreation: true,
    },
    customGrants: [],
  });
  const smUser: User = { ...seekerUser, id: 'user_sm_test', email: 'manager@prophunta.ai', role: 'ADMIN' };
  const smContext = (await staffAuthorizationService.getStaffContext(smUser))!;

  // 4.1 Staff Manager cannot create Super Admin
  try {
    staffAuthorizationService.validateStaffManagementDelegation(
      smContext,
      null,
      ['SUPER_ADMIN']
    );
    throw new Error('Security Violation: Delegated Staff Manager was permitted to create Super Admin!');
  } catch (err: any) {
    if (!err.message.includes('Delegated Staff Managers cannot assign or grant the SUPER_ADMIN role')) {
      throw err;
    }
  }
  console.log('✅ 4.1 PASSED: Delegated Staff Manager blocked from creating or promoting Super Admin.');

  // 4.2 Staff Manager cannot self-promote or alter their own boundary
  try {
    staffAuthorizationService.validateStaffManagementDelegation(
      smContext,
      smAccount,
      ['STAFF_MANAGER', 'SUPER_ADMIN']
    );
    throw new Error('Security Violation: Staff member was permitted self-promotion!');
  } catch (err: any) {
    if (!err.message.includes('Staff members cannot modify their own roles')) {
      throw err;
    }
  }
  console.log('✅ 4.2 PASSED: Staff member blocked from self-promoting or editing their own permissions.');

  // 4.3 Staff Manager cannot exceed delegated role ceiling
  try {
    staffAuthorizationService.validateStaffManagementDelegation(
      smContext,
      null,
      ['COMPLIANCE_AUDITOR'] // Outside delegation ceiling (only VERIFICATION_OFFICER, PROPERTY_MODERATOR allowed)
    );
    throw new Error('Security Violation: Staff Manager granted role outside delegation ceiling!');
  } catch (err: any) {
    if (!err.message.includes('outside your delegated management authority')) {
      throw err;
    }
  }
  console.log('✅ 4.3 PASSED: Staff Manager strictly prevented from granting roles exceeding delegation ceiling.');

  // 4.4 Allowed delegation succeeds
  staffAuthorizationService.validateStaffManagementDelegation(
    smContext,
    null,
    ['VERIFICATION_OFFICER'],
    ['verification.review']
  );
  console.log('✅ 4.4 PASSED: Legitimate delegated role and custom permission assignment validated successfully.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: REGIONAL & RESOURCE SCOPE ENFORCEMENT (PHASE 2 & 3)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: REGIONAL & RESOURCE DATA SCOPE ENFORCEMENT ---');

  const lagosStaffAccount = await staffRepository.create({
    userId: 'user_lagos_test',
    email: 'lagos.officer@prophunta.ai',
    name: 'Lagos Field Officer',
    roles: ['PROPERTY_MODERATOR'],
    status: 'ACTIVE',
    scope: { scopeType: 'REGIONAL', region: 'Lagos' },
    customGrants: [],
  });
  const lagosUser: User = { ...seekerUser, id: 'user_lagos_test', email: 'lagos.officer@prophunta.ai', role: 'ADMIN' };

  // 5.1 Action inside authorized region succeeds
  await staffAuthorizationService.requirePermission(lagosUser, 'properties.moderate', {
    region: 'Lagos',
  });
  console.log('✅ 5.1 PASSED: Regional staff permitted action within designated region (Lagos).');

  // 5.2 Action outside authorized region blocked
  try {
    await staffAuthorizationService.requirePermission(lagosUser, 'properties.moderate', {
      region: 'Abuja',
    });
    throw new Error('Security Violation: Lagos officer modified Abuja property!');
  } catch (err: any) {
    if (!err.message.includes('regional scope [Lagos] does not cover resource in [Abuja]')) {
      throw err;
    }
  }
  console.log('✅ 5.2 PASSED: Regional staff blocked from operating on cross-regional resource (Abuja).');

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 1, 2 & 3 RBAC AND GOVERNANCE TESTS PASSED (100%)!');
  console.log('================================================================');
}

runPhase123Tests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:\n', err);
  process.exit(1);
});
