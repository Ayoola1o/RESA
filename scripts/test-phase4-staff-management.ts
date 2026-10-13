import { resetDatabase, getDb } from '../src/server/db/store';
import { userRepository } from '../src/server/repositories/user-repository';
import { staffRepository } from '../src/server/repositories/staff-repository';
import { staffManagementService } from '../src/server/services/staff-management-service';
import { authService } from '../src/server/services/auth-service';
import { User } from '../src/types/prophunta';

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE: PHASE 4 — STAFF MANAGEMENT & DELEGATION ENGINE');
  console.log('================================================================\n');

  resetDatabase();

  const superAdmin = (await userRepository.findById('user_admin_1'))!;
  const seeker = (await userRepository.findById('user_seeker_1'))!;

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: STAFF DIRECTORY ACCESS & PERMISSION CONTROL
  // ---------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: STAFF DIRECTORY ACCESS & AUTHORIZATION ---');

  // 1.1 Super Admin lists staff directory
  const directory = await staffManagementService.listStaff(superAdmin);
  if (!directory || directory.length === 0) {
    throw new Error('Failed: Expected at least seed super admin in directory');
  }
  console.log(`✅ 1.1 PASSED: Super Admin listed staff directory (${directory.length} staff accounts found).`);

  // 1.2 Non-staff Seeker blocked
  try {
    await staffManagementService.listStaff(seeker);
    throw new Error('Security Violation: Seeker was permitted staff directory access!');
  } catch (err: any) {
    if (!err.message.includes('does not have an active administrative staff account')) {
      throw err;
    }
  }
  console.log('✅ 1.2 PASSED: Non-staff seeker blocked from viewing staff directory.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: STAFF ONBOARDING & DELEGATION CEILINGS
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: STAFF ONBOARDING & DELEGATION CEILINGS ---');

  // 2.1 Super Admin invites a Verification Officer
  const newVO = await staffManagementService.inviteStaff(superAdmin, {
    name: 'Babatunde Raji',
    email: 'babatunde.vo@prophunta.ai',
    phone: '+234 802 111 9988',
    roles: ['VERIFICATION_OFFICER'],
    scope: { scopeType: 'GLOBAL' },
  });
  if (newVO.status !== 'ACTIVE' || !newVO.roles.includes('VERIFICATION_OFFICER')) {
    throw new Error('Failed: Onboarded staff account had unexpected initial state.');
  }
  console.log(`✅ 2.1 PASSED: Super Admin onboarded Verification Officer (${newVO.email}).`);

  // 2.2 Duplicate invitation prevented
  try {
    await staffManagementService.inviteStaff(superAdmin, {
      name: 'Duplicate Babatunde',
      email: 'babatunde.vo@prophunta.ai',
      roles: ['VERIFICATION_OFFICER'],
    });
    throw new Error('Security Violation: Duplicate staff email invitation permitted!');
  } catch (err: any) {
    if (!err.message.includes('already exists')) {
      throw err;
    }
  }
  console.log('✅ 2.2 PASSED: Duplicate staff onboarding blocked.');

  // 2.3 Onboard a delegated Staff Manager
  const delegatedSM = await staffManagementService.inviteStaff(superAdmin, {
    name: 'Chioma Okoli (Staff Manager)',
    email: 'chioma.manager@prophunta.ai',
    roles: ['STAFF_MANAGER'],
    delegation: {
      canManageStaff: true,
      maxAssignableRoles: ['VERIFICATION_OFFICER', 'PROPERTY_MODERATOR'],
      allowedCustomPermissions: ['verification.review'],
      prohibitSuperAdminCreation: true,
    },
  });
  const smUser = (await userRepository.findByEmail(delegatedSM.email))!;
  console.log(`✅ 2.3 PASSED: Onboarded delegated Staff Manager (${delegatedSM.email}) with explicit ceilings.`);

  // 2.4 Delegated Staff Manager attempts to onboard a Super Admin -> BLOCKED
  try {
    await staffManagementService.inviteStaff(smUser, {
      name: 'Rogue Admin',
      email: 'rogue.admin@prophunta.ai',
      roles: ['SUPER_ADMIN'],
    });
    throw new Error('Security Violation: Delegated Staff Manager was allowed to create a Super Admin!');
  } catch (err: any) {
    if (!err.message.includes('Delegated Staff Managers cannot assign or grant the SUPER_ADMIN role')) {
      throw err;
    }
  }
  console.log('✅ 2.4 PASSED: Delegated Staff Manager blocked from provisioning a Super Admin.');

  // 2.5 Delegated Staff Manager attempts to assign role outside ceiling -> BLOCKED
  try {
    await staffManagementService.inviteStaff(smUser, {
      name: 'Auditor Attempt',
      email: 'auditor.attempt@prophunta.ai',
      roles: ['COMPLIANCE_AUDITOR'], // Ceiling only allows VERIFICATION_OFFICER, PROPERTY_MODERATOR
    });
    throw new Error('Security Violation: Staff Manager granted role exceeding delegation ceiling!');
  } catch (err: any) {
    if (!err.message.includes('outside your delegated management authority')) {
      throw err;
    }
  }
  console.log('✅ 2.5 PASSED: Delegated Staff Manager blocked from assigning role exceeding delegation ceiling.');

  // 2.6 Delegated Staff Manager onboards an authorized role within ceiling -> SUCCESS
  const validOnboard = await staffManagementService.inviteStaff(smUser, {
    name: 'Authorized Mod',
    email: 'authorized.mod@prophunta.ai',
    roles: ['PROPERTY_MODERATOR'],
  });
  if (!validOnboard.roles.includes('PROPERTY_MODERATOR')) {
    throw new Error('Failed: Legitimate delegated onboarding failed.');
  }
  console.log('✅ 2.6 PASSED: Legitimate delegated onboarding within ceiling succeeded.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: ROLE UPDATES & SELF-PROMOTION SAFEGUARDS
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: ROLE UPDATES & SELF-PROMOTION SAFEGUARDS ---');

  // 3.1 Self-Promotion Blocked
  try {
    await staffManagementService.updateStaffRoles(smUser, delegatedSM.id, ['SUPER_ADMIN']);
    throw new Error('Security Violation: Staff Manager promoted themselves to Super Admin!');
  } catch (err: any) {
    if (!err.message.includes('Staff members cannot modify their own roles')) {
      throw err;
    }
  }
  console.log('✅ 3.1 PASSED: Staff member blocked from self-modifying roles or security boundary.');

  // 3.2 Legitimate Role Promotion by Super Admin
  const updatedVO = await staffManagementService.updateStaffRoles(superAdmin, newVO.id, [
    'VERIFICATION_OFFICER',
    'PROPERTY_MODERATOR',
  ]);
  if (updatedVO.roles.length !== 2) {
    throw new Error('Failed: Expected 2 roles on updated staff account');
  }
  console.log('✅ 3.2 PASSED: Super Admin successfully updated staff roles to dual operational capability.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: CONTROLLED CUSTOM PERMISSIONS & LIFECYCLE
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: CUSTOM PERMISSION GRANTS & REVOCATION ---');

  // 4.1 Grant requires valid justification
  try {
    await staffManagementService.grantCustomPermission(superAdmin, newVO.id, {
      permission: 'reports.investigate',
      reason: 'No', // Too short (< 5 chars)
      durationHours: 48,
    });
    throw new Error('Security Violation: Custom grant allowed without proper justification!');
  } catch (err: any) {
    if (!err.message.includes('comprehensive justification')) {
      throw err;
    }
  }
  console.log('✅ 4.1 PASSED: Custom permission grant rejected when justification is insufficient.');

  // 4.2 Valid custom grant
  const customGrant = await staffManagementService.grantCustomPermission(superAdmin, newVO.id, {
    permission: 'reports.investigate',
    reason: 'Temporary investigation coverage for urgent fraud report',
    durationHours: 48,
  });
  if (customGrant.status !== 'ACTIVE' || customGrant.permission !== 'reports.investigate') {
    throw new Error('Failed: Custom grant creation failed');
  }
  console.log(`✅ 4.2 PASSED: Super Admin issued custom grant (expires: ${customGrant.expiresAt}).`);

  // 4.3 Custom grant revocation
  await staffManagementService.revokeCustomPermission(superAdmin, newVO.id, customGrant.id);
  const reloadedVO = await staffRepository.findById(newVO.id);
  const foundGrant = reloadedVO?.customGrants.find((g) => g.id === customGrant.id);
  if (foundGrant?.status !== 'REVOKED') {
    throw new Error('Failed: Custom grant status was not set to REVOKED.');
  }
  console.log('✅ 4.3 PASSED: Custom permission grant successfully revoked.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: STATUS MUTATION & IMMEDIATE SESSION REVOCATION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: STATUS MUTATION & SESSION INVALIDATION ---');

  // 5.1 Self-deactivation blocked
  try {
    await staffManagementService.updateStaffStatus(superAdmin, 'staff_super_admin_1', 'DEACTIVATED');
    throw new Error('Security Violation: Operator allowed to deactivate own account!');
  } catch (err: any) {
    if (!err.message.includes('You cannot suspend or deactivate your own staff account')) {
      throw err;
    }
  }
  console.log('✅ 5.1 PASSED: Self-deactivation/lockout strictly blocked.');

  // 5.2 Simulate active session for the target staff member
  const voUser = (await userRepository.findByEmail(newVO.email))!;
  const sessionToken = await authService.createSession(voUser);

  let db = getDb();
  if (!db.sessions[sessionToken]) {
    throw new Error('Failed: Simulated session token not found in store.');
  }
  console.log(`  ✓ Active session token established for ${newVO.email}: ${sessionToken}`);

  // 5.3 Suspend staff account -> must revoke all active sessions immediately
  await staffManagementService.updateStaffStatus(superAdmin, newVO.id, 'SUSPENDED', 'Compliance audit pending');

  db = getDb();
  if (db.sessions[sessionToken]) {
    throw new Error('Security Violation: Suspended staff session was NOT invalidated from store!');
  }
  console.log('✅ 5.3 PASSED: Suspending staff member triggered immediate invalidation of all active session tokens.');

  // 5.4 Effective permission preview for suspended staff
  const preview = await staffManagementService.previewEffectivePermissions(superAdmin, newVO.id);
  if (preview.effectivePermissions.length !== 0) {
    throw new Error('Security Violation: Suspended staff still showed effective permissions in preview!');
  }
  console.log('✅ 5.4 PASSED: Effective permissions preview returns empty set for suspended staff (fail-closed).');

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 4 STAFF MANAGEMENT & DELEGATION TESTS PASSED (100%)!');
  console.log('================================================================');
}

runPhase4Tests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:\n', err);
  process.exit(1);
});
