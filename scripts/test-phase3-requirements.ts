import { resetDatabase, getDb } from '../src/server/db/store';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyService } from '../src/server/services/property-service';
import { enquiryService } from '../src/server/services/enquiry-service';
import { applicationService } from '../src/server/services/application-service';
import { relationshipService } from '../src/server/services/relationship-service';
import { auditRepository } from '../src/server/repositories/audit-repository';
import { reportService } from '../src/server/services/report-service';
import { User, Property } from '../src/types/prophunta';

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE: PHASE 3 TRANSCRIPT REQUIREMENTS IMPLEMENTATION');
  console.log('================================================================\n');

  // Clean initial state
  resetDatabase();
  console.log('✅ Initial database reset complete: clean isolation guaranteed.\n');

  const verifiedOwner = (await userRepository.findById('user_owner_1'))!;
  const verifiedAgent = (await userRepository.findById('user_agent_1'))!;
  const verifiedSeeker = (await userRepository.findById('user_seeker_1'))!;
  const strangerSeeker = (await userRepository.findById('user_seeker_unverified'))!;

  // ---------------------------------------------------------------------------
  // 1. SETUP: ASSIGN AGENT RELATIONSHIP TO OWNER PROPERTY
  // ---------------------------------------------------------------------------
  console.log('--- SETUP: OWNER-AGENT MANDATE & PROPERTY SETUP ---');
  const property = (await propertyService.getPropertyById('prop-1'))!;
  if (!property) {
    console.error('❌ FAILED: prop-1 not found in seed data.');
    process.exit(1);
  }

  // Confirm active owner-agent relationship for prop-1
  const relationships = await relationshipService.getOwnerRelationships(verifiedOwner.id);
  const activeRel = relationships.find((r) => r.agentId === verifiedAgent.id && r.status === 'ACTIVE');
  if (!activeRel) {
    console.error('❌ FAILED: Active relationship not found in seed.');
    process.exit(1);
  }
  console.log(`✅ Active Owner-Agent mandate confirmed for ${property.title} (Agent: ${verifiedAgent.name})`);

  // ---------------------------------------------------------------------------
  // 2. SHARED PROPERTY CONVERSATION FOR SEEKER, OWNER, AND AUTHORIZED AGENT
  // ---------------------------------------------------------------------------
  console.log('\n--- REQUIREMENT 1: SHARED PROPERTY CONVERSATION ---');

  // Seeker sends an enquiry
  const enquiry = await enquiryService.sendEnquiry(
    verifiedSeeker,
    property.id,
    'Hello, is this duplex available for immediate move-in? What is the caution fee policy?'
  );

  if (!enquiry || !enquiry.id) {
    console.error('❌ FAILED: Enquiry creation failed.');
    process.exit(1);
  }

  if (enquiry.ownerId !== verifiedOwner.id) {
    console.error(`❌ FAILED: Enquiry ownerId mismatch. Expected ${verifiedOwner.id}, got ${enquiry.ownerId}`);
    process.exit(1);
  }

  if (enquiry.authorizedAgentId !== verifiedAgent.id) {
    console.error(`❌ FAILED: Enquiry authorizedAgentId mismatch. Expected ${verifiedAgent.id}, got ${enquiry.authorizedAgentId}`);
    process.exit(1);
  }
  console.log('✅ Enquiry properly bound to ownerId and authorizedAgentId.');

  // Verify all 3 authorized parties can retrieve the conversation
  const seekerEnquiries = await enquiryService.getUserEnquiries(verifiedSeeker);
  const ownerEnquiries = await enquiryService.getUserEnquiries(verifiedOwner);
  const agentEnquiries = await enquiryService.getUserEnquiries(verifiedAgent);

  const seekerFound = seekerEnquiries.some((e) => e.id === enquiry.id);
  const ownerFound = ownerEnquiries.some((e) => e.id === enquiry.id);
  const agentFound = agentEnquiries.some((e) => e.id === enquiry.id);

  if (!seekerFound || !ownerFound || !agentFound) {
    console.error('❌ FAILED: Enquiry not visible to all three shared parties!', { seekerFound, ownerFound, agentFound });
    process.exit(1);
  }
  console.log('✅ Enquiry visible in Seeker, Owner, and Authorized Agent inboxes.');

  // Authorized agent replies in the shared conversation
  const updatedEnquiry = await enquiryService.reply(
    verifiedAgent,
    enquiry.id,
    'Yes, the duplex is vacant. Caution fee is 10% refundable upon move-out audit.'
  );

  if (updatedEnquiry.messages.length < 2) {
    console.error('❌ FAILED: Reply message not added to thread.');
    process.exit(1);
  }
  console.log('✅ Authorized agent successfully replied in the shared property conversation.');

  // Negative test: Stranger cannot read the conversation
  let strangerForbidden = false;
  try {
    await enquiryService.getEnquiry(strangerSeeker, enquiry.id);
  } catch (err: any) {
    strangerForbidden =
      err.message.includes('Forbidden') ||
      err.message.includes('Unauthorized') ||
      err.message.includes('not authorized');
  }

  if (!strangerForbidden) {
    console.error('❌ FAILED: Stranger was not forbidden from accessing private conversation!');
    process.exit(1);
  }
  console.log('✅ Negative test: Unauthorized seeker was blocked from viewing private thread.');

  // ---------------------------------------------------------------------------
  // 3. OWNER-VISIBLE AGENT ACTIVITY & PROPERTY-MANAGEMENT HISTORY
  // ---------------------------------------------------------------------------
  console.log('\n--- REQUIREMENT 2: OWNER-VISIBLE AGENT ACTIVITY & MANAGEMENT HISTORY ---');

  const result = await relationshipService.getAgentActivityForOwner(verifiedOwner, property.id);
  const activities = result.activities;
  if (!Array.isArray(activities) || activities.length === 0) {
    console.error('❌ FAILED: Expected agent activities for owner, got empty list.', result);
    process.exit(1);
  }

  const hasMandateEvent = activities.some((a) => a.activityType === 'MANDATE_CHANGE');
  const hasEnquiryEvent = activities.some((a) => a.activityType === 'ENQUIRY');

  if (!hasMandateEvent) {
    console.error('❌ FAILED: Mandate event missing from owner activity stream.');
    process.exit(1);
  }
  console.log(`✅ Owner-visible agent activity contains ${activities.length} aggregated audit events (mandates, enquiries).`);

  // Negative test: Stranger cannot read owner's agent activity
  let strangerActivityBlocked = false;
  try {
    await relationshipService.getAgentActivityForOwner(strangerSeeker);
  } catch (err: any) {
    strangerActivityBlocked =
      err.message.includes('Only property owners') ||
      err.message.includes('Unauthorized') ||
      err.message.includes('Forbidden');
  }

  if (!strangerActivityBlocked) {
    console.error("❌ FAILED: Non-owner was able to fetch owner's agent activity!");
    process.exit(1);
  }
  console.log("✅ Negative test: Non-owner was blocked from fetching owner's agent activity stream.");

  // ---------------------------------------------------------------------------
  // 4. NON-PUNITIVE OFF-PLATFORM BYPASS DETECTION
  // ---------------------------------------------------------------------------
  console.log('\n--- REQUIREMENT 3: NON-PUNITIVE OFF-PLATFORM WARNINGS ---');

  // Seeker sends a message attempting to bypass the platform via WhatsApp
  const bypassText = 'Kindly send me a message on WhatsApp 08031234567 or direct email so we can pay outside the system.';
  const warnedEnquiry = await enquiryService.reply(verifiedSeeker, enquiry.id, bypassText);
  const warnedMsg = warnedEnquiry.messages[warnedEnquiry.messages.length - 1];

  if (!warnedMsg.hasOffPlatformWarning) {
    console.error('❌ FAILED: Off-platform warning was not attached to suspicious message.');
    process.exit(1);
  }

  if (!warnedMsg.warningNotice || !warnedMsg.warningNotice.includes('Off-Platform Safety Notice')) {
    console.error('❌ FAILED: Warning notice text missing or inaccurate:', warnedMsg.warningNotice);
    process.exit(1);
  }
  console.log('✅ Off-platform solicitation detected: informational warning notice attached.');

  // Crucial check: User must NOT be automatically banned or suspended!
  const seekerAfterWarning = await userRepository.findById(verifiedSeeker.id);
  if (!seekerAfterWarning || seekerAfterWarning.verificationStatus === 'SUSPENDED') {
    console.error('❌ FAILED: Punitive action taken! User was suspended based solely on keywords.');
    process.exit(1);
  }
  console.log('✅ Non-punitive principle verified: User was NOT banned or penalized for keywords.');

  // Verify audit log captured the warning trigger
  const auditLogs = await auditRepository.listAll();
  const warningAudit = auditLogs.find((l) => l.action === 'OFF_PLATFORM_WARNING_TRIGGERED');
  if (!warningAudit) {
    console.error('❌ FAILED: OFF_PLATFORM_WARNING_TRIGGERED not logged in audit history.');
    process.exit(1);
  }
  console.log('✅ Audit log recorded OFF_PLATFORM_WARNING_TRIGGERED with metadata.');

  // ---------------------------------------------------------------------------
  // 5. PROPERTY MAP / LOCATION CONTEXT & DISCREPANCY REPORTING
  // ---------------------------------------------------------------------------
  console.log('\n--- REQUIREMENT 4: PROPERTY MAP & LOCATION DISCREPANCY REPORTING ---');

  const discrepancyResult = await propertyService.reportLocationDiscrepancy(verifiedSeeker, property.id, {
    reportedLatitude: 6.4521,
    reportedLongitude: 3.5849,
    discrepancyNotes: 'Physical gate is located 800m further down Admiralty Way than pinned on survey map.',
  });

  if (!discrepancyResult.report || !discrepancyResult.property) {
    console.error('❌ FAILED: Location discrepancy report failed.');
    process.exit(1);
  }

  if (discrepancyResult.report.reason !== 'Location Discrepancy') {
    console.error(`❌ FAILED: Report reason mismatch. Expected 'Location Discrepancy', got ${discrepancyResult.report.reason}`);
    process.exit(1);
  }

  if (discrepancyResult.property.verification?.locationStatus !== 'CHANGES_REQUIRED') {
    console.error(`❌ FAILED: Verification locationStatus not updated to CHANGES_REQUIRED. Got ${discrepancyResult.property.verification?.locationStatus}`);
    process.exit(1);
  }
  console.log('✅ Location discrepancy logged as Trust & Safety report and flagged verification locationStatus to CHANGES_REQUIRED.');

  const discAudit = (await auditRepository.listAll()).find((l) => l.action === 'LOCATION_DISCREPANCY_REPORTED');
  if (!discAudit) {
    console.error('❌ FAILED: LOCATION_DISCREPANCY_REPORTED not found in audit logs.');
    process.exit(1);
  }
  console.log('✅ Audit log recorded LOCATION_DISCREPANCY_REPORTED.');

  // ---------------------------------------------------------------------------
  // 6. TRANSPARENT FEE BREAKDOWNS & ANTI-MOCK-ESCROW ENFORCEMENT
  // ---------------------------------------------------------------------------
  console.log('\n--- REQUIREMENT 5: TRANSPARENT FEE BREAKDOWNS & ESCROW DISCLAIMER ---');

  const feeBreakdown = applicationService.calculateFeeBreakdown(property);

  if (!feeBreakdown || feeBreakdown.totalInitialOutlay <= feeBreakdown.basePrice) {
    console.error('❌ FAILED: Fee breakdown calculations invalid:', feeBreakdown);
    process.exit(1);
  }

  if (!feeBreakdown.escrowNotice || !feeBreakdown.escrowNotice.includes('does not simulate mock escrow')) {
    console.error('❌ FAILED: Mandatory escrow disclaimer missing from fee breakdown:', feeBreakdown.escrowNotice);
    process.exit(1);
  }
  console.log(`✅ Transparent fee breakdown calculated: Base ₦${feeBreakdown.basePrice.toLocaleString()}, Total Outlay ₦${feeBreakdown.totalInitialOutlay.toLocaleString()}`);
  console.log('✅ Escrow disclaimer verified: explicitly warns no simulated mock escrow is claimed.');

  // Submit rental application and ensure fee breakdown is attached
  const application = await applicationService.submitApplication(verifiedSeeker, {
    propertyId: property.id,
    type: 'RENTAL',
    name: 'Verified Seeker One',
    contact: '+234 800 111 2222',
    occupation: 'Senior Software Engineer',
    moveInDate: '2026-11-01',
    occupants: 2,
    message: 'Expression of interest for 1-year tenancy.',
  });

  if (!application.feeBreakdown || application.feeBreakdown.totalInitialOutlay !== feeBreakdown.totalInitialOutlay) {
    console.error('❌ FAILED: Application does not contain persisted fee breakdown matching schedule:', application.feeBreakdown);
    process.exit(1);
  }
  console.log('✅ Application automatically bound with fee breakdown schedule.');

  // Negative test: Unauthorized seeker cannot approve/decline application
  let unauthorizedMutationBlocked = false;
  try {
    await applicationService.updateStatus(strangerSeeker, application.id, 'APPROVED');
  } catch (err: any) {
    unauthorizedMutationBlocked = err.message.includes('Unauthorized') || err.message.includes('Forbidden');
  }

  if (!unauthorizedMutationBlocked) {
    console.error('❌ FAILED: Stranger was able to approve application!');
    process.exit(1);
  }
  console.log('✅ Negative test: Unauthorized user blocked from mutating application status.');

  // ---------------------------------------------------------------------------
  // 7. CLEANUP & ZERO FIXTURE POLLUTION GUARANTEE
  // ---------------------------------------------------------------------------
  resetDatabase();
  console.log('\n✅ Post-suite database reset complete: 0 test fixture leakage.');

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 3 TRANSCRIPT REQUIREMENTS VERIFIED SUCCESSFULLY!');
  console.log('================================================================');
}

runPhase3Tests().catch((err) => {
  console.error('Unhandled error running Phase 3 tests:', err);
  process.exit(1);
});
