import { auditRepository } from '../src/server/repositories/audit-repository';
import { inspectionService } from '../src/server/services/inspection-service';
import { propertyService } from '../src/server/services/property-service';
import { documentService } from '../src/server/services/document-service';
import { verificationService } from '../src/server/services/verification-service';
import { reportService } from '../src/server/services/report-service';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyRepository } from '../src/server/repositories/property-repository';
import { InspectionStatus, AuditAction } from '../src/types/prophunta';

async function runSection14And15Tests() {
  console.log('================================================================');
  console.log('🧪 TESTING SECTION 14 (AUDIT LOG) & SECTION 15 (INSPECTION SYSTEM)');
  console.log('================================================================\n');

  // Fetch seed users
  const admin = await userRepository.findByEmail('admin@prophunta.ai');
  const owner = await userRepository.findByEmail('owner@prophunta.ai');
  const seeker = await userRepository.findByEmail('seeker@prophunta.ai');

  if (!admin || !owner || !seeker) {
    throw new Error('Seed admin, owner, and seeker users required for test');
  }

  // -------------------------------------------------------------
  // TEST SECTION 14: AUDIT LOGGING & IMMUTABILITY
  // -------------------------------------------------------------
  console.log('--- TEST SECTION 14: AUDIT LOGGING OF SENSITIVE ACTIONS ---');

  // Check Immutability: Repository must NOT have update or delete methods
  console.log('1. Checking Audit Log Immutability architecture...');
  const repoProto = Object.getPrototypeOf(auditRepository);
  if ('update' in repoProto || 'delete' in repoProto || 'remove' in repoProto) {
    throw new Error('Violation: auditRepository exposes mutable update/delete methods! Audit logs must be immutable.');
  }
  console.log('  ✓ Immutability verified: auditRepository is strictly append-only (no update/delete methods exist).');

  // Initial audit count
  const initialLogs = await auditRepository.listAll();
  const initialCount = initialLogs.length;
  console.log(`  ✓ Initial audit log entries in store: ${initialCount}`);

  // Test 14.1: Listing Submission Log
  console.log('\n2. Testing Listing Submission audit log...');
  const testProperty = await propertyService.createDraft(owner, {
    title: 'Audit & Inspection Penthouse Suite',
    propertyType: 'Apartment',
    listingType: 'RENT',
    description: 'High-end duplex penthouse for comprehensive audit and inspection tests.',
    state: 'Lagos',
    city: 'Lekki Phase 1',
    area: 'Admiralty Way',
    address: '15 Admiralty Way, Lekki Phase 1',
    price: 25000000,
    priceUnit: '/year',
    bedrooms: 4,
    bathrooms: 4,
    features: ['Elevator', 'Private Terrace', 'Smart Home'],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
  });

  const submittedProp = await propertyService.transitionListingStatus(owner, testProperty.id, 'SUBMITTED', 'Submitted for compliance inspection');
  
  // Test 14.2: Listing Edit Log
  console.log('\n3. Testing Listing Edit audit log...');
  await propertyService.updateProperty(owner, submittedProp.id, {
    price: 26000000,
    description: 'Updated penthouse suite description with amended terms.',
  });

  // Test 14.3: Document Upload Log
  console.log('\n4. Testing Document Upload audit log...');
  const docBuffer = Buffer.from('GOVERNOR_CONSENT_AUDIT_TEST_DATA');
  const uploadedDoc = await documentService.uploadDocument(
    owner,
    submittedProp.id,
    docBuffer,
    'deed_of_assignment.pdf',
    'application/pdf',
    'DEED_OF_ASSIGNMENT'
  );

  // Test 14.4: Verification Approval & Rejection Logs
  console.log('\n5. Testing Verification Rejection and Approval audit logs...');
  // Rejection:
  await verificationService.rejectProperty(admin, submittedProp.id, 'Preliminary review failed, please update paperwork');
  // Approval:
  await verificationService.approveProperty(admin, submittedProp.id, 'All title deeds and on-site coordinates validated');

  // Test 14.5: Listing Suspension & Restoration Logs
  console.log('\n6. Testing Listing Suspension & Restoration audit logs...');
  await propertyService.suspendListing(admin, submittedProp.id, 'Temporary administrative review hold');
  await propertyService.restoreListing(admin, submittedProp.id, 'Compliance restored, cleared by admin');

  // Test 14.6: Report Creation & Resolution Logs
  console.log('\n7. Testing Report Creation & Resolution audit logs...');
  const filedReport = await reportService.fileReport(seeker, {
    propertyId: submittedProp.id,
    reason: 'Suspected Scam',
    description: 'Suspicious title discrepancy observed during inquiry',
  });
  await reportService.resolveReport(admin, filedReport.id, 'Investigated and cleared against land registry records');

  // Validate all logged events in Section 14
  console.log('\n8. Verifying Section 14 Minimum Audit Log Event Coverage:');
  const allLogs = await auditRepository.listAll();
  const actionsLogged = new Set(allLogs.map(l => l.action));

  const requiredActions: { action: AuditAction; description: string }[] = [
    { action: 'PROPERTY_SUBMITTED', description: 'listing submission' },
    { action: 'PROPERTY_EDITED', description: 'listing edit' },
    { action: 'DOCUMENT_UPLOADED', description: 'document upload' },
    { action: 'VERIFICATION_REJECTED', description: 'verification rejection' },
    { action: 'VERIFICATION_APPROVED', description: 'verification approval' },
    { action: 'LISTING_SUSPENDED', description: 'listing suspension' },
    { action: 'LISTING_RESTORED', description: 'listing restoration' },
    { action: 'REPORT_FILED', description: 'report creation' },
    { action: 'REPORT_RESOLVED', description: 'report resolution' },
  ];

  for (const req of requiredActions) {
    if (!actionsLogged.has(req.action)) {
      throw new Error(`Missing required audit log action: ${req.action} (${req.description})`);
    }
    console.log(`  ✓ Audit action logged: ${req.action} (${req.description})`);
  }

  // Check required audit record structure
  const sampleLog = allLogs[allLogs.length - 1];
  console.log('\n9. Verifying Audit Record Schema Structure...');
  const requiredFields = ['actor', 'action', 'objectType', 'objectId', 'timestamp', 'result', 'metadata'];
  for (const field of requiredFields) {
    if (!(field in sampleLog)) {
      throw new Error(`Audit log entry is missing mandatory field: ${field}`);
    }
  }
  console.log(`  ✓ Sample audit record validated: [${sampleLog.action}] on [${sampleLog.objectType}:${sampleLog.objectId}] by [${sampleLog.actor.email}] -> ${sampleLog.result}`);


  // -------------------------------------------------------------
  // TEST SECTION 15: INSPECTION SYSTEM WORKFLOW & STATES
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 15: INSPECTION SYSTEM WORKFLOW & STATES ---');

  // Step 1: Seeker requests inspection (State: REQUESTED)
  console.log('\n1. Seeker requests inspection...');
  const inspectionRequest = await inspectionService.requestInspection(seeker, {
    propertyId: submittedProp.id,
    preferredDate: '2026-10-15',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    notes: 'Please verify compound water pressure and inverter battery state.',
    type: 'IN_PERSON',
  });

  console.log(`  ✓ Inspection created: ID ${inspectionRequest.id}, Status: ${inspectionRequest.status}`);
  if (inspectionRequest.status !== 'REQUESTED') {
    throw new Error(`Expected status REQUESTED, got ${inspectionRequest.status}`);
  }

  // Verify Seeker can see their inspections
  const seekerInspections = await inspectionService.getUserInspections(seeker.id, 'SEEKER');
  const foundSeekerReq = seekerInspections.find(i => i.id === inspectionRequest.id);
  if (!foundSeekerReq) {
    throw new Error('Seeker failed to retrieve their requested inspection');
  }
  console.log(`  ✓ Seeker can view requested inspection in list (found ${seekerInspections.length} total inspections)`);

  // Step 2: Owner accepts inspection (State: ACCEPTED)
  console.log('\n2. Owner accepts inspection...');
  const acceptedInspection = await inspectionService.updateInspectionStatus(
    owner,
    inspectionRequest.id,
    'ACCEPTED',
    'Accepted request, aligning with field inspector'
  );
  if (acceptedInspection.status !== 'ACCEPTED') {
    throw new Error(`Expected status ACCEPTED, got ${acceptedInspection.status}`);
  }
  console.log(`  ✓ Owner accepted inspection: Status is ${acceptedInspection.status}`);

  // Step 3: Owner proposes reschedule (State: RESCHEDULED)
  console.log('\n3. Owner proposes reschedule with alternative date/time...');
  const rescheduledInspection = await inspectionService.updateInspectionStatus(
    owner,
    inspectionRequest.id,
    'RESCHEDULED',
    'Rescheduling due to road maintenance on Admiralty Way',
    {
      preferredDate: '2026-10-16',
      preferredTimeSlot: '02:00 PM - 04:00 PM',
    }
  );
  if (rescheduledInspection.status !== 'RESCHEDULED') {
    throw new Error(`Expected status RESCHEDULED, got ${rescheduledInspection.status}`);
  }
  if (rescheduledInspection.preferredDate !== '2026-10-16') {
    throw new Error(`Expected rescheduled date 2026-10-16, got ${rescheduledInspection.preferredDate}`);
  }
  console.log(`  ✓ Owner rescheduled inspection: Status is ${rescheduledInspection.status}, New Date: ${rescheduledInspection.preferredDate}`);

  // Step 4: Schedule confirmed (State: SCHEDULED)
  console.log('\n4. Confirming inspection schedule...');
  const scheduledInspection = await inspectionService.updateInspectionStatus(
    owner,
    inspectionRequest.id,
    'SCHEDULED',
    'Confirmed for Oct 16th 2:00 PM'
  );
  if (scheduledInspection.status !== 'SCHEDULED') {
    throw new Error(`Expected status SCHEDULED, got ${scheduledInspection.status}`);
  }
  console.log(`  ✓ Inspection status is ${scheduledInspection.status}`);

  // Step 5: Test NO_SHOW state
  console.log('\n5. Testing NO_SHOW state on a temporary inspection...');
  const tempReq = await inspectionService.requestInspection(seeker, {
    propertyId: submittedProp.id,
    preferredDate: '2026-10-12',
    preferredTimeSlot: '11:00 AM - 01:00 PM',
    type: 'IN_PERSON',
    notes: 'Quick test for no show workflow',
  });
  const noShowInspection = await inspectionService.updateInspectionStatus(
    owner,
    tempReq.id,
    'NO_SHOW',
    'Party did not arrive for scheduled slot'
  );
  if (noShowInspection.status !== 'NO_SHOW') {
    throw new Error(`Expected status NO_SHOW, got ${noShowInspection.status}`);
  }
  console.log(`  ✓ Successfully updated to NO_SHOW: ${noShowInspection.status}`);

  // Step 6: Test CANCELLED state
  console.log('\n6. Testing CANCELLED state...');
  const cancelledInspection = await inspectionService.updateInspectionStatus(
    seeker,
    tempReq.id,
    'CANCELLED',
    'Cancelled by seeker'
  );
  if (cancelledInspection.status !== 'CANCELLED') {
    throw new Error(`Expected status CANCELLED, got ${cancelledInspection.status}`);
  }
  console.log(`  ✓ Successfully updated to CANCELLED: ${cancelledInspection.status}`);

  // Step 7: Complete inspection with comprehensive InspectionRecord
  console.log('\n7. Completing inspection with complete InspectionRecord (PRD Section 15 specifications)...');
  const completedInspection = await inspectionService.completeInspection(
    admin,
    inspectionRequest.id,
    {
      date: new Date().toISOString(),
      inspector: 'Officer Adekunle Gold (Certified Field Inspector)',
      inspectorName: 'Officer Adekunle Gold',
      condition: 'EXCELLENT',
      conditionRating: 'EXCELLENT',
      utilities: true,
      utilitiesFunctional: true,
      meters: 'EKEDC Smart Meter #042918820 - Reading: 14,892 kWh; Water Meter: 310 m³',
      meterReadings: 'EKEDC Smart Meter #042918820 - Reading: 14,892 kWh; Water Meter: 310 m³',
      observations: 'All bedrooms, rooftop terrace, and backup diesel generator are fully operational. Structural finishes in pristine condition.',
      discrepancies: 'Minor scuff on the south terrace railing, repaired before occupancy.',
      photos: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      ],
      video: 'https://storage.prophunta.ai/inspections/video_walkthrough_prop_42.mp4',
    }
  );

  if (completedInspection.status !== 'COMPLETED') {
    throw new Error(`Expected status COMPLETED, got ${completedInspection.status}`);
  }
  if (!completedInspection.inspectionRecord) {
    throw new Error('InspectionRecord was not saved onto the inspection request!');
  }

  console.log(`  ✓ Inspection completed: Status is ${completedInspection.status}`);
  console.log('  ✓ Verifying all Section 15 InspectionRecord required fields:');
  const record = completedInspection.inspectionRecord;
  const inspectionFields = [
    { field: 'date', val: record.date || record.completedAt },
    { field: 'inspector', val: record.inspector || record.inspectorName },
    { field: 'photos', val: record.photos },
    { field: 'video', val: record.video },
    { field: 'condition', val: record.condition || record.conditionRating },
    { field: 'meters', val: record.meters || record.meterReadings },
    { field: 'utilities', val: record.utilities ?? record.utilitiesFunctional },
    { field: 'observations', val: record.observations },
    { field: 'discrepancies', val: record.discrepancies },
  ];

  for (const item of inspectionFields) {
    if (item.val === undefined || item.val === null) {
      throw new Error(`Missing mandatory inspection record field: ${item.field}`);
    }
    console.log(`    - ${item.field}: ${JSON.stringify(item.val).slice(0, 70)}`);
  }

  // Step 8: Verify Seeker can view the finalized inspection record
  console.log('\n8. Verifying Seeker can view the finalized inspection record...');
  const seekerFinalCheck = await inspectionService.getUserInspections(seeker.id, 'SEEKER');
  const finishedReq = seekerFinalCheck.find(i => i.id === inspectionRequest.id);
  if (!finishedReq || !finishedReq.inspectionRecord) {
    throw new Error('Seeker cannot access the finalized inspection record');
  }
  console.log('  ✓ Seeker successfully retrieved finalized inspection record with photos and video.');

  // Step 9: Verify all 7 states have been exercised
  console.log('\n9. Verifying all 7 Inspection States tested:');
  const all7States: InspectionStatus[] = [
    'REQUESTED',
    'ACCEPTED',
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
    'RESCHEDULED',
    'NO_SHOW',
  ];
  for (const st of all7States) {
    console.log(`  ✓ State verified in workflow: ${st}`);
  }

  // Step 10: Verify Inspection audit logging occurred
  console.log('\n10. Verifying inspection status changes were audit logged...');
  const postInspectionLogs = await auditRepository.listAll();
  const inspectionAuditLogs = postInspectionLogs.filter(l => l.objectType === 'INSPECTION');
  console.log(`  ✓ Total inspection audit logs recorded: ${inspectionAuditLogs.length}`);
  if (inspectionAuditLogs.length === 0) {
    throw new Error('No audit log entries recorded for inspection actions');
  }

  console.log('\n================================================================');
  console.log('🎉 SECTION 14 & SECTION 15 TESTS COMPLETED SUCCESSFULLY! ALL PASS!');
  console.log('================================================================\n');
}

runSection14And15Tests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
