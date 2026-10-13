import { resetDatabase, getDb } from '../src/server/db/store';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyRepository } from '../src/server/repositories/property-repository';
import { staffRepository } from '../src/server/repositories/staff-repository';
import { approvalService } from '../src/server/services/approval-service';
import { staffManagementService } from '../src/server/services/staff-management-service';
import { User } from '../src/types/prophunta';

async function runPhase5Tests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE: PHASE 5 — FOUR-EYES DUAL-CUSTODY APPROVAL ENGINE');
  console.log('================================================================\n');

  resetDatabase();

  const superAdmin = (await userRepository.findById('user_admin_1'))!;
  const seeker = (await userRepository.findById('user_seeker_1'))!;

  // Onboard two distinct staff members for dual-custody verification:
  // Staff 1: Property Moderator (Requester)
  const modStaff = await staffManagementService.inviteStaff(superAdmin, {
    name: 'Segun Adebayo (Moderator)',
    email: 'segun.mod@prophunta.ai',
    roles: ['PROPERTY_MODERATOR'],
  });
  const modUser = (await userRepository.findByEmail(modStaff.email))!;

  // Staff 2: Compliance Auditor with approvals.approve permission (Independent Approver)
  const auditorStaff = await staffManagementService.inviteStaff(superAdmin, {
    name: 'Folake Solanke (Compliance Approver)',
    email: 'folake.auditor@prophunta.ai',
    roles: ['COMPLIANCE_AUDITOR'],
  });
  // Grant Folake custom approval permission
  await staffManagementService.grantCustomPermission(superAdmin, auditorStaff.id, {
    permission: 'approvals.approve',
    reason: 'Authorized independent approver for high-impact compliance decisions',
    durationHours: 120,
  });
  await staffManagementService.grantCustomPermission(superAdmin, auditorStaff.id, {
    permission: 'approvals.reject',
    reason: 'Authorized independent reviewer for high-impact decisions',
    durationHours: 120,
  });
  const auditorUser = (await userRepository.findByEmail(auditorStaff.email))!;

  // Set up a suspended property for high-impact restoration tests
  const db = getDb();
  const testProperty = db.properties[0];
  testProperty.listingStatus = 'SUSPENDED';
  testProperty.availabilityStatus = 'UNAVAILABLE';

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: SUBMISSION OF HIGH-IMPACT APPROVAL REQUEST
  // ---------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: APPROVAL REQUEST SUBMISSION ---');

  // 1.1 Non-staff seeker blocked from submitting approval request
  try {
    await approvalService.submitApprovalRequest(seeker, {
      actionType: 'PROPERTY_RESTORE',
      targetResourceType: 'PROPERTY',
      targetResourceId: testProperty.id,
      proposedPayload: { listingStatus: 'ACTIVE' },
      reason: 'Seeker attempting unauthorized request',
    });
    throw new Error('Security Violation: Seeker was allowed to submit approval request!');
  } catch (err: any) {
    if (!err.message.includes('Only active administrative staff can submit approval requests')) {
      throw err;
    }
  }
  console.log('✅ 1.1 PASSED: Non-staff seeker blocked from submitting approval requests.');

  // 1.2 Moderator submits legitimate request to restore suspended listing
  const req1 = await approvalService.submitApprovalRequest(modUser, {
    actionType: 'PROPERTY_RESTORE',
    targetResourceType: 'PROPERTY',
    targetResourceId: testProperty.id,
    proposedPayload: { listingStatus: 'ACTIVE', availabilityStatus: 'AVAILABLE' },
    reason: 'Title dispute resolved with official Alausa Lands Registry stamp verification.',
    supportingEvidence: 'Lands Registry Receipt #LR-2026-98124',
  });

  if (req1.status !== 'PENDING' || req1.requesterStaffId !== modStaff.id) {
    throw new Error('Failed: Approval request initial state invalid.');
  }
  if (!req1.initialSnapshot || req1.initialSnapshot.listingStatus !== 'SUSPENDED') {
    throw new Error('Failed: Initial target resource snapshot was not captured correctly.');
  }
  console.log(`✅ 1.2 PASSED: Moderator submitted approval request (${req1.id}) with initial snapshot.`);

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: FOUR-EYES PRINCIPLE (SELF-APPROVAL BLOCKED)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: FOUR-EYES DUAL-CUSTODY (SELF-APPROVAL GUARD) ---');

  // 2.1 Requester attempts to approve their own request -> MUST BE BLOCKED
  try {
    await approvalService.decideApproval(modUser, req1.id, 'APPROVE', 'Approving my own request');
    throw new Error('CRITICAL SECURITY VIOLATION: Requester was permitted to approve their own request!');
  } catch (err: any) {
    // Both permission check or four-eyes check prevent this
    console.log(`  ✓ Blocked with: "${err.message}"`);
  }

  // Even if Moderator had approvals.approve permission, the engine must block self-approval:
  await staffManagementService.grantCustomPermission(superAdmin, modStaff.id, {
    permission: 'approvals.approve',
    reason: 'Testing four-eyes self-approval guard',
    durationHours: 24,
  });

  try {
    await approvalService.decideApproval(modUser, req1.id, 'APPROVE', 'Self-approval bypass attempt');
    throw new Error('CRITICAL SECURITY VIOLATION: Requester with permission approved their own request!');
  } catch (err: any) {
    if (!err.message.includes('Dual-Custody Violation: A requester must not approve their own approval request')) {
      throw err;
    }
  }
  console.log('✅ 2.1 PASSED: Strict Four-Eyes Principle enforced: Requester cannot approve their own request.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: INDEPENDENT APPROVAL & ATOMIC EXECUTION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: INDEPENDENT APPROVAL & ATOMIC EXECUTION ---');

  // 3.1 Independent Compliance Officer approves request
  const executedReq = await approvalService.decideApproval(
    auditorUser,
    req1.id,
    'APPROVE',
    'Verified registry receipt #LR-2026-98124 against official stamp record. Approved.'
  );

  if (executedReq.status !== 'EXECUTED' || executedReq.executionResult !== 'SUCCESS') {
    throw new Error(`Failed: Expected status EXECUTED, got ${executedReq.status}`);
  }

  // Verify property status was atomically restored in the database
  const restoredProp = await propertyRepository.findById(testProperty.id);
  if (restoredProp?.listingStatus !== 'ACTIVE' || restoredProp?.availabilityStatus !== 'AVAILABLE') {
    throw new Error('Atomic Execution Failed: Target property was not updated to ACTIVE/AVAILABLE.');
  }
  console.log('✅ 3.1 PASSED: Independent reviewer approved request and target listing was atomically restored.');

  // 3.2 Duplicate execution prevention
  try {
    await approvalService.decideApproval(auditorUser, req1.id, 'APPROVE', 'Re-executing');
    throw new Error('Security Violation: Re-deciding already executed request was permitted!');
  } catch (err: any) {
    if (!err.message.includes('Current status is already EXECUTED')) {
      throw err;
    }
  }
  console.log('✅ 3.2 PASSED: Re-execution of decided request strictly blocked.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: STATE-DRIFT DETECTION BEFORE EXECUTION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: PRE-EXECUTION MATERIAL STATE-DRIFT DETECTION ---');

  // Suspend property again
  await propertyRepository.update(testProperty.id, {
    listingStatus: 'SUSPENDED',
    availabilityStatus: 'UNAVAILABLE',
  });

  // Moderator creates second request
  const req2 = await approvalService.submitApprovalRequest(modUser, {
    actionType: 'PROPERTY_RESTORE',
    targetResourceType: 'PROPERTY',
    targetResourceId: testProperty.id,
    proposedPayload: { listingStatus: 'ACTIVE', availabilityStatus: 'AVAILABLE' },
    reason: 'Second restoration attempt',
  });

  // Target property state drifts before approval: e.g. listingStatus becomes SOLD
  await propertyRepository.update(testProperty.id, { listingStatus: 'SOLD' });

  // Approver attempts to approve drifted request -> MUST DETECT DRIFT & CANCEL
  try {
    await approvalService.decideApproval(auditorUser, req2.id, 'APPROVE', 'Approving drifted resource');
    throw new Error('Security Violation: Approved action executed against materially drifted resource!');
  } catch (err: any) {
    if (!err.message.includes('State Drift Detected')) {
      throw err;
    }
  }

  const cancelledReq = (await approvalService.listAllApprovals(superAdmin)).find((r) => r.id === req2.id);
  if (cancelledReq?.status !== 'CANCELLED') {
    throw new Error('Failed: Request was not marked as CANCELLED upon state drift.');
  }
  console.log('✅ 4.1 PASSED: State drift detected pre-execution; approval safely aborted and marked CANCELLED.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: REJECTION WORKFLOW
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: INDEPENDENT REJECTION WORKFLOW ---');

  await propertyRepository.update(testProperty.id, {
    listingStatus: 'SUSPENDED',
    availabilityStatus: 'UNAVAILABLE',
  });
  const req3 = await approvalService.submitApprovalRequest(modUser, {
    actionType: 'PROPERTY_RESTORE',
    targetResourceType: 'PROPERTY',
    targetResourceId: testProperty.id,
    proposedPayload: { listingStatus: 'ACTIVE' },
    reason: 'Restoration with suspicious documents',
  });

  const rejectedReq = await approvalService.decideApproval(
    auditorUser,
    req3.id,
    'REJECT',
    'Document reference does not match survey beacons. Rejected.'
  );

  if (rejectedReq.status !== 'REJECTED') {
    throw new Error('Failed: Expected status REJECTED');
  }

  const propAfterReject = await propertyRepository.findById(testProperty.id);
  if (propAfterReject?.listingStatus !== 'SUSPENDED') {
    throw new Error('Failed: Target property state should remain unchanged upon rejection.');
  }
  console.log('✅ 5.1 PASSED: Independent reviewer rejected request with formal audit notes; target state preserved.');

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: EMERGENCY OVERRIDE PROCEDURE
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: EMERGENCY OVERRIDE PROCEDURE ---');

  // 6.1 Non-Super Admin blocked from emergency override
  try {
    await approvalService.executeEmergencyOverride(modUser, {
      actionType: 'PROPERTY_RESTORE',
      targetResourceType: 'PROPERTY',
      targetResourceId: testProperty.id,
      proposedPayload: { listingStatus: 'ACTIVE' },
      incidentReference: 'INC-2026-001',
      mandatoryJustification: 'Moderator attempting emergency override',
    });
    throw new Error('Security Violation: Non-Super Admin executed emergency override!');
  } catch (err: any) {
    if (!err.message.includes('Emergency override procedure is strictly restricted to Super Admins')) {
      throw err;
    }
  }
  console.log('✅ 6.1 PASSED: Non-Super Admin blocked from invoking emergency override.');

  // 6.2 Super Admin executes emergency override
  const emergencyReq = await approvalService.executeEmergencyOverride(superAdmin, {
    actionType: 'PROPERTY_RESTORE',
    targetResourceType: 'PROPERTY',
    targetResourceId: testProperty.id,
    proposedPayload: { listingStatus: 'ACTIVE', availabilityStatus: 'AVAILABLE' },
    incidentReference: 'INC-SEC-88219',
    mandatoryJustification: 'Executive directive to restore listing following false-positive law enforcement hold resolution.',
  });

  if (emergencyReq.status !== 'EXECUTED' || !emergencyReq.isEmergency) {
    throw new Error('Failed: Emergency override failed execution.');
  }

  const propAfterEmergency = await propertyRepository.findById(testProperty.id);
  if (propAfterEmergency?.listingStatus !== 'ACTIVE') {
    throw new Error('Failed: Property was not restored by emergency override.');
  }
  console.log(`✅ 6.2 PASSED: Super Admin executed emergency override with incident reference (${emergencyReq.supportingEvidence}).`);

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 5 FOUR-EYES APPROVAL WORKFLOW TESTS PASSED (100%)!');
  console.log('================================================================');
}

runPhase5Tests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:\n', err);
  process.exit(1);
});
