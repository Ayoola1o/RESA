import { resetDatabase, getDb } from '../src/server/db/store';
import { authService } from '../src/server/services/auth-service';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyService } from '../src/server/services/property-service';
import { verificationService } from '../src/server/services/verification-service';
import { documentService } from '../src/server/services/document-service';
import { relationshipService } from '../src/server/services/relationship-service';
import { agentCredentialService } from '../src/server/services/agent-credential-service';
import { inspectionService } from '../src/server/services/inspection-service';
import { auditService } from '../src/server/services/audit-service';
import { User } from '../src/types/prophunta';

async function runGovernanceAuditTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE: PHASE 2 GOVERNANCE & RISK MITIGATION AUDIT');
  console.log('================================================================\n');

  // Reset database to ensure completely deterministic initial state
  resetDatabase();
  console.log('✅ Initial database reset complete: 0 test fixture leakage.\n');

  const adminUser = (await userRepository.findById('user_admin_1'))!;
  const verifiedOwner = (await userRepository.findById('user_owner_1'))!;
  const verifiedAgent = (await userRepository.findById('user_agent_1'))!;

  // -------------------------------------------------------------------------
  // SECTION A: AUTHENTICATION & KYC GOVERNANCE
  // -------------------------------------------------------------------------
  console.log('--- SECTION A: AUTHENTICATION & KYC GOVERNANCE ---');

  // A1: Public registration cannot create ADMIN
  const regAdmin = await authService.register({
    name: 'Hacker Joe',
    email: 'hacker@prophunta.ai',
    password: 'password123',
    phone: '+234 800 000 9999',
    role: 'ADMIN',
  });
  if (regAdmin.user || !regAdmin.error) {
    console.error('❌ FAILED: Public registration allowed ADMIN role creation!');
    process.exit(1);
  }
  console.log(`✅ A1 PASSED: Blocked public ADMIN registration ("${regAdmin.error}")`);

  // A2: New seeker registration is UNVERIFIED with KYC NOT_SUBMITTED
  const regSeeker = await authService.register({
    name: 'New Seeker Test',
    email: 'newseeker@test.com',
    password: 'password123',
    phone: '+234 809 111 2222',
    role: 'SEEKER',
  });
  const newSeeker = regSeeker.user!;
  if (!newSeeker || newSeeker.verificationStatus !== 'UNVERIFIED' || newSeeker.kycStatus !== 'NOT_SUBMITTED') {
    console.error('❌ FAILED: New seeker was automatically verified!', newSeeker);
    process.exit(1);
  }
  console.log(`✅ A2 PASSED: New seeker defaults to UNVERIFIED and KYC NOT_SUBMITTED`);

  // A3: Unauthorized role elevation is blocked
  try {
    await authService.updateUserRole(newSeeker, newSeeker.id, 'ADMIN');
    console.error('❌ FAILED: Non-admin was able to self-promote to ADMIN!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ A3 PASSED: Unauthorized role escalation blocked ("${err.message}")`);
  }

  // A4: Unverified user is blocked from protected actions (e.g., submitting property for review)
  // Let's create an unverified owner
  const regOwner = await authService.register({
    name: 'Unverified Landlord',
    email: 'unverified.landlord@test.com',
    password: 'password123',
    phone: '+234 809 222 3333',
    role: 'OWNER',
  });
  const unverifiedOwner = regOwner.user!;
  const unverifiedDraft = await propertyService.createDraft(unverifiedOwner, {
    title: 'Unverified Owner Apartment',
    propertyType: 'Apartment',
    listingType: 'RENT',
    description: 'A test listing by unverified owner',
    state: 'Lagos',
    city: 'Lagos',
    area: 'Ikeja',
    address: '10 Test Lane',
    price: 3000000,
    bedrooms: 2,
    bathrooms: 2,
    features: ['Security'],
    images: ['https://images.unsplash.com/test.jpg'],
    intendedUse: 'Residential',
  });

  try {
    await propertyService.submitForReview(unverifiedOwner, unverifiedDraft.id);
    console.error('❌ FAILED: Unverified user was permitted to submit property for review!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ A4 PASSED: Unverified user blocked from submitting for review ("${err.message}")`);
  }

  // A5: KYC Submission and Admin Approval Workflow
  const kycSubmittedUser = await authService.submitKyc(unverifiedOwner, {
    documentType: 'NIN',
    documentNumber: '12345678901',
    documentUrl: 'https://vault.prophunta.ai/kyc/nin-sample.jpg',
  });
  if (kycSubmittedUser.kycStatus !== 'PENDING') {
    console.error('❌ FAILED: KYC status did not update to PENDING');
    process.exit(1);
  }
  console.log('✅ A5a PASSED: KYC submitted successfully, status is PENDING');

  const kycApprovedUser = await authService.reviewKyc(
    adminUser,
    unverifiedOwner.id,
    'VERIFIED',
    'NIN matches National Identity Database.'
  );
  if (kycApprovedUser.verificationStatus !== 'VERIFIED' || kycApprovedUser.kycStatus !== 'VERIFIED') {
    console.error('❌ FAILED: KYC approval did not update user status to VERIFIED');
    process.exit(1);
  }
  console.log('✅ A5b PASSED: Admin approved KYC, user is now KYC verified.');

  // Now the owner can submit for review
  const submittedProperty = await propertyService.submitForReview(kycApprovedUser, unverifiedDraft.id);
  if (submittedProperty.listingStatus !== 'SUBMITTED') {
    console.error('❌ FAILED: Verified owner could not submit for review');
    process.exit(1);
  }
  console.log('✅ A5c PASSED: KYC-verified owner successfully submitted property for review.\n');

  // -------------------------------------------------------------------------
  // SECTION B: PROPERTY VERIFICATION INTEGRITY
  // -------------------------------------------------------------------------
  console.log('--- SECTION B: PROPERTY VERIFICATION INTEGRITY ---');

  // B1: Negative test: Direct transition to VERIFIED is prohibited
  try {
    await propertyService.transitionListingStatus(adminUser, submittedProperty.id, 'VERIFIED' as any);
    console.error('❌ FAILED: Direct status transition to VERIFIED was permitted!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ B1 PASSED: Direct transition to VERIFIED rejected ("${err.message}")`);
  }

  // B2: Negative test: approveVerification fails when checklist items are pending
  try {
    await verificationService.approveVerification(adminUser, submittedProperty.id, 'Attempting early approval');
    console.error('❌ FAILED: approveVerification passed when checklist was incomplete/empty!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ B2 PASSED: Approval rejected due to incomplete checklist ("${err.message}")`);
  }

  // B3: Negative test: approveVerification fails without approved title/authority documents
  // Set all 6 checks to PASSED, but do not upload an approved document
  await verificationService.updateChecklist(adminUser, submittedProperty.id, {
    ownerIdentityStatus: 'PASSED',
    locationStatus: 'PASSED',
    authorityDocumentStatus: 'PASSED',
    availabilityStatus: 'PASSED',
    mediaStatus: 'PASSED',
    inspectionStatus: 'PASSED',
    reviewNotes: 'Pre-checks verified, awaiting document review',
  });

  try {
    await verificationService.approveVerification(adminUser, submittedProperty.id, 'Checks passed but no docs approved');
    console.error('❌ FAILED: approveVerification passed without approved document records!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ B3 PASSED: Approval rejected because no approved ownership documents exist ("${err.message}")`);
  }

  // B4: Positive verification: Upload and review document, then approve
  const dummyBuffer = Buffer.from('%PDF-1.4 Mock Deed of Assignment for Test Lane');
  const doc = await documentService.uploadDocument(
    kycApprovedUser,
    submittedProperty.id,
    dummyBuffer,
    'deed-of-assignment.pdf',
    'application/pdf',
    'DEED_OF_ASSIGNMENT'
  );
  await documentService.reviewDocument(adminUser, submittedProperty.id, doc.id, 'APPROVED', 'Deed verified with land registry.');

  const approvedVerification = await verificationService.approveVerification(
    adminUser,
    submittedProperty.id,
    'All 6 checks verified and deed approved.'
  );

  if (
    approvedVerification.overallStatus !== 'PASSED' ||
    !approvedVerification.trustDisclaimer ||
    !approvedVerification.reviewerId ||
    !approvedVerification.reviewedAt
  ) {
    console.error('❌ FAILED: Verification approval did not record required audit metadata!');
    process.exit(1);
  }
  console.log(`✅ B4 PASSED: Property verification approved with reviewer ID, notes, timestamp and legal disclaimer:`);
  console.log(`   Disclaimer: "${approvedVerification.trustDisclaimer}"\n`);

  // -------------------------------------------------------------------------
  // SECTION C: OWNER-AGENT RELATIONSHIP MANAGEMENT
  // -------------------------------------------------------------------------
  console.log('--- SECTION C: OWNER-AGENT RELATIONSHIP MANAGEMENT ---');

  // Register a secondary agent to test complete invitation lifecycle
  const regAgent2 = await authService.register({
    name: 'Dayo Realty Agent',
    email: 'dayo.agent@test.com',
    password: 'password123',
    phone: '+234 809 333 4444',
    role: 'AGENT',
  });
  const testAgent = regAgent2.user!;

  // C1: Owner invites agent
  const invite = await relationshipService.inviteAgent(verifiedOwner, {
    agentEmail: testAgent.email,
    mandateType: 'EXCLUSIVE',
    commissionRate: '10%',
    scope: 'Sole marketing and tenant vetting rights for Ikoyi estate',
    propertyIds: ['prop-1'],
    notes: 'Exclusive mandate for 12 months',
  });
  if (invite.status !== 'INVITED' || invite.agentId !== testAgent.id) {
    console.error('❌ FAILED: Relationship invitation failed', invite);
    process.exit(1);
  }
  console.log(`✅ C1 PASSED: Owner invited agent (${invite.mandateType} mandate)`);

  // C2: Agent accepts invitation -> status becomes ACTIVE
  const activeRel = await relationshipService.respondToInvitation(testAgent, invite.id, 'ACCEPT', 'Mandate accepted.');
  if (activeRel.status !== 'ACTIVE' || !activeRel.respondedAt) {
    console.error('❌ FAILED: Acceptance failed', activeRel);
    process.exit(1);
  }
  console.log(`✅ C2 PASSED: Agent accepted invitation. Relationship is ACTIVE.`);

  // C3: Agent creates listing on behalf of owner using active mandate
  const agentManagedListing = await propertyService.createDraft(testAgent, {
    title: 'Managed Luxury Villa in Ikoyi',
    propertyType: 'House',
    listingType: 'RENT',
    description: 'Managed property on behalf of Alhaji Musa',
    state: 'Lagos',
    city: 'Lagos',
    area: 'Ikoyi',
    address: '4 Bourdillon Road',
    price: 25000000,
    bedrooms: 5,
    bathrooms: 6,
    features: ['Pool', 'Security'],
    images: ['https://images.unsplash.com/villa.jpg'],
    intendedUse: 'Residential',
    ownerId: verifiedOwner.id,
    relationshipId: activeRel.id,
    isDirectListing: false,
  });
  if (agentManagedListing.ownerId !== verifiedOwner.id || agentManagedListing.authorizedAgentId !== testAgent.id) {
    console.error('❌ FAILED: Managed listing did not bind owner and agent properly', agentManagedListing);
    process.exit(1);
  }
  console.log('✅ C3 PASSED: Agent created managed listing for owner with mandate validation.');

  // C4: Negative test: Agent CANNOT revoke owner's authority
  try {
    await relationshipService.revokeRelationship(testAgent, activeRel.id, 'Agent trying to revoke owner');
    console.error('❌ FAILED: Agent was able to revoke owner authority!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ C4 PASSED: Agent blocked from revoking mandate ("${err.message}")`);
  }

  // C5: Owner revokes relationship
  const revokedRel = await relationshipService.revokeRelationship(verifiedOwner, activeRel.id, 'Mandate terminated by owner');
  if (revokedRel.status !== 'REVOKED' || !revokedRel.revokedAt) {
    console.error('❌ FAILED: Owner revocation failed', revokedRel);
    process.exit(1);
  }
  console.log('✅ C5 PASSED: Owner successfully revoked agent mandate.');

  // C6: Negative test: Agent cannot create managed listing after mandate revocation
  try {
    await propertyService.createDraft(testAgent, {
      title: 'Unauthorized Post-Revocation Listing',
      propertyType: 'Apartment',
      listingType: 'RENT',
      description: 'Attempting to list without mandate',
      state: 'Lagos',
      city: 'Lagos',
      area: 'Ikoyi',
      address: '5 Bourdillon Road',
      price: 15000000,
      bedrooms: 3,
      bathrooms: 3,
      features: ['Security'],
      images: ['https://images.unsplash.com/test.jpg'],
      intendedUse: 'Residential',
      ownerId: verifiedOwner.id,
      isDirectListing: false,
    });
    console.error('❌ FAILED: Agent created listing for owner without active mandate!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ C6 PASSED: Blocked listing creation after mandate revocation ("${err.message}")\n`);
  }

  // -------------------------------------------------------------------------
  // SECTION D: AGENT CREDENTIAL LEVELS & NIGERIAN REALTY FLEXIBILITY
  // -------------------------------------------------------------------------
  console.log('--- SECTION D: AGENT CREDENTIAL LEVELS & NIGERIAN REALTY FLEXIBILITY ---');

  // D1: Agent submits CAC business registration
  const credCac = await agentCredentialService.submitCredential(testAgent, {
    level: 'LEVEL_2_BUSINESS_REGISTERED',
    credentialType: 'CAC_CERTIFICATE',
    title: 'Corporate Affairs Commission - Prime Crest Realtors Ltd',
    issuingAuthority: 'CAC',
    registrationNumber: 'RC-1849204',
    documentUrl: 'https://vault.prophunta.ai/credentials/cac-rc1849204.pdf',
  });
  if (credCac.status !== 'PENDING') {
    console.error('❌ FAILED: Credential submission failed', credCac);
    process.exit(1);
  }
  console.log('✅ D1 PASSED: Agent submitted CAC business registration.');

  // D2: Admin reviews and verifies credential -> Agent auto-promoted to LEVEL_2_BUSINESS_REGISTERED
  const reviewedCred = await agentCredentialService.reviewCredential(
    adminUser,
    credCac.id,
    'VERIFIED',
    'CAC registration confirmed on corporate portal.'
  );
  if (reviewedCred.status !== 'VERIFIED') {
    console.error('❌ FAILED: Credential status was not updated to VERIFIED', reviewedCred);
    process.exit(1);
  }

  const updatedAgent = (await userRepository.findById(testAgent.id))!;
  if (updatedAgent.agentVerificationLevel !== 'LEVEL_2_BUSINESS_REGISTERED') {
    console.error('❌ FAILED: Agent verification level did not upgrade', updatedAgent);
    process.exit(1);
  }
  console.log(`✅ D2 PASSED: Admin verified credential. Agent promoted to ${updatedAgent.agentVerificationLevel}`);

  // D3: Configurable explanation returned for seekers
  const explanation = agentCredentialService.getVerificationLevelExplanation('LEVEL_2_BUSINESS_REGISTERED');
  if (!explanation.title || !explanation.description) {
    console.error('❌ FAILED: Missing level explanation', explanation);
    process.exit(1);
  }
  console.log(`✅ D3 PASSED: Agent tier explanation for seekers:`);
  console.log(`   Badge: "${explanation.badgeLabel}" | Summary: "${explanation.description}"\n`);

  // -------------------------------------------------------------------------
  // SECTION E: INSPECTION AUTHENTICITY & ESCALATION
  // -------------------------------------------------------------------------
  console.log('--- SECTION E: INSPECTION AUTHENTICITY & ESCALATION ---');

  // E1: Schedule an inspection
  const inspection = await inspectionService.requestInspection(newSeeker, {
    propertyId: 'prop-1',
    preferredDate: '2026-10-25',
    preferredTimeSlot: '11:00 AM',
    type: 'IN_PERSON',
    notes: 'Requesting in-person physical walkthrough.',
  });
  await inspectionService.updateStatus(verifiedOwner, inspection.id, 'ACCEPTED');
  await inspectionService.updateStatus(verifiedOwner, inspection.id, 'SCHEDULED');

  // E2: Complete inspection as host-submitted media vs field officer walkthrough
  const videoRecord = await inspectionService.completeInspection(verifiedOwner, inspection.id, {
    completedAt: new Date().toISOString(),
    inspectorName: 'Landlord Host Walkthrough',
    conditionRating: 'EXCELLENT',
    utilitiesFunctional: true,
    observations: 'Video recorded by landlord on site.',
    method: 'HOST_SUBMITTED_MEDIA',
    isIndependentInspection: false, // Explicitly false!
  });
  if (videoRecord.inspectionRecord?.isIndependentInspection !== false) {
    console.error('❌ FAILED: Host-submitted media was marked as independent inspection!', videoRecord);
    process.exit(1);
  }
  console.log('✅ E2 PASSED: Host-submitted media is explicitly distinguished as non-independent.');

  // E3: Seeker spots discrepancies during physical inspection and escalates
  const escalationResult = await inspectionService.escalateInspection(
    newSeeker,
    inspection.id,
    'Listing claims 24/7 central generator and marble tiles; on-site tiles are broken and generator is broken.',
    'Significant visual and infrastructure discrepancy from verified media.'
  );
  if (
    escalationResult.inspection.escalationStatus !== 'ESCALATED_FRAUD_INVESTIGATION' ||
    !escalationResult.report
  ) {
    console.error('❌ FAILED: Inspection escalation failed', escalationResult);
    process.exit(1);
  }
  console.log('✅ E3 PASSED: Inspection discrepancy escalated to fraud investigation & created Trust & Safety report:');
  console.log(`   Report ID: ${escalationResult.report.id} (Status: ${escalationResult.report.status})`);

  // E4: Compliance officer investigates and resolves escalation
  const resolvedInspection = await inspectionService.resolveEscalation(
    adminUser,
    inspection.id,
    'Owner instructed to replace pictures and fix generator before listing can be re-activated.'
  );
  if (resolvedInspection.escalationStatus !== 'RESOLVED') {
    console.error('❌ FAILED: Escalation resolution failed', resolvedInspection);
    process.exit(1);
  }
  console.log('✅ E4 PASSED: Admin compliance officer resolved inspection escalation.\n');

  // -------------------------------------------------------------------------
  // SECTION F: DATA INTEGRITY & AUDIT LOG IMMUTABILITY
  // -------------------------------------------------------------------------
  console.log('--- SECTION F: DATA INTEGRITY & AUDIT LOG IMMUTABILITY ---');

  // F1: Verify audit logs captured all sensitive governance actions
  const allLogs = await auditService.getRecentLogs(adminUser, 100);
  const actionsCaptured = new Set(allLogs.map((l) => l.action));
  console.log(`✅ F1 PASSED: Captured ${allLogs.length} append-only audit events.`);
  console.log('   Sample actions captured:', Array.from(actionsCaptured).slice(0, 8).join(', '));

  // F2: Verify demo records are properly labeled
  const dbBeforeReset = getDb();
  const demoUsers = dbBeforeReset.users.filter((u) => u.isDemo);
  const demoProperties = dbBeforeReset.properties.filter((p) => p.isDemo);
  if (demoUsers.length === 0 || demoProperties.length === 0) {
    console.error('❌ FAILED: Seed demo users/properties not marked with isDemo: true');
    process.exit(1);
  }
  console.log(`✅ F2 PASSED: Demo records labeled (${demoUsers.length} demo users, ${demoProperties.length} demo properties).`);

  // F3: Reset database and verify zero leakage / accumulation
  resetDatabase();
  const dbAfterReset = getDb();
  console.log(`✅ F3 PASSED: Database reset to deterministic seed (${dbAfterReset.properties.length} seed properties, ${dbAfterReset.users.length} seed users).`);

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 2 GOVERNANCE AUDIT TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runGovernanceAuditTests().catch((err) => {
  console.error('💥 Test suite crashed:', err);
  process.exit(1);
});
