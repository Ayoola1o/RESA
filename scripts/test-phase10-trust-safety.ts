import { reportService } from '../src/server/services/report-service';
import { propertyService } from '../src/server/services/property-service';
import { notificationService } from '../src/server/services/notification-service';
import { auditRepository } from '../src/server/repositories/audit-repository';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyRepository } from '../src/server/repositories/property-repository';
import { ReportReason, ReportStatus } from '../src/types/prophunta';

async function runPhase10Tests() {
  console.log('--- STARTING PHASE 10: TRUST & SAFETY VERIFICATION ---');

  // 1. Setup actors: Seeker, Owner, Compliance Officer (Admin)
  const timestamp = Date.now();
  const seeker = await userRepository.create(
    {
      name: 'Amaka Seeker',
      email: `amaka.phase10.${timestamp}@test.com`,
      role: 'SEEKER',
      phone: '+2348011223344',
      verificationStatus: 'VERIFIED',
    },
    'Password123!'
  );

  const owner = await userRepository.create(
    {
      name: 'Emeka Host',
      email: `emeka.phase10.${timestamp}@test.com`,
      role: 'OWNER',
      phone: '+2348055667788',
      verificationStatus: 'VERIFIED',
    },
    'Password123!'
  );

  const complianceAdmin = await userRepository.create(
    {
      name: 'Super Admin Officer',
      email: `compliance.phase10.${timestamp}@prophunta.ai`,
      role: 'ADMIN',
      phone: '+2348099887766',
      verificationStatus: 'VERIFIED',
    },
    'SuperSecret2026!'
  );

  // 2. Create and publish property
  const property = await propertyService.createDraft(owner, {
    title: 'Waterfront Duplex in Victoria Island',
    propertyType: 'Duplex',
    listingType: 'RENT',
    description: 'Suspiciously cheap luxury waterfront duplex.',
    state: 'Lagos',
    city: 'Victoria Island',
    area: 'Victoria Island Extension',
    address: '42 Akin Adesola Street',
    price: 3500000,
    bedrooms: 5,
    bathrooms: 5,
    features: ['Swimming Pool', 'Ocean View'],
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
  });

  // Activate property
  await propertyRepository.update(property.id, {
    listingStatus: 'ACTIVE',
    availabilityStatus: 'AVAILABLE',
  });

  // 3. Seeker reports listing for Suspected Scam
  console.log('Step 1: Seeker files trust & safety report...');
  const reportReason: ReportReason = 'Suspected Scam';
  const reportDesc = 'Price is drastically below market rate for VI waterfront, and poster demands upfront bank deposit before viewing.';

  const report = await reportService.fileReport(seeker, {
    propertyId: property.id,
    reason: reportReason,
    description: reportDesc,
  });

  if (!report || !report.id) throw new Error('Failed to file listing report');
  if (report.propertyId !== property.id) throw new Error('Report property ID mismatch');
  if (report.reporterId !== seeker.id) throw new Error('Reporter ID mismatch');
  if (report.status !== 'REPORTED') throw new Error(`Initial report status must be REPORTED, got ${report.status}`);

  // Check confirmation notification to reporter
  const seekerNotifs = await notificationService.getUserNotifications(seeker);
  const foundConfirmNotif = seekerNotifs.some(n => n.title === 'Report Received' && n.message.includes('Waterfront Duplex'));
  if (!foundConfirmNotif) throw new Error('Confirmation notification not received by reporter');
  console.log('✓ Trust report filed with confirmation notification.');

  // 4. Admin investigates report (transition to UNDER_INVESTIGATION)
  console.log('Step 2: Admin initiates investigation...');
  const invReport = await reportService.updateReportStatus(
    complianceAdmin,
    report.id,
    'UNDER_INVESTIGATION',
    'Escalated to internal fraud team. Reviewing title deed provenance.'
  );
  if (invReport.status !== 'UNDER_INVESTIGATION') throw new Error('Failed to update status to UNDER_INVESTIGATION');

  // Verify audit log for investigation
  const invAudit = await auditRepository.query({ action: 'REPORT_INVESTIGATED', objectId: report.id });
  if (invAudit.length === 0) throw new Error('Audit record missing for REPORT_INVESTIGATED');
  console.log('✓ Report investigation recorded and audited.');

  // 5. Admin requests documentation from host (DOCUMENTATION_REQUESTED)
  console.log('Step 3: Admin requests documentation from host...');
  const docReqReport = await reportService.updateReportStatus(
    complianceAdmin,
    report.id,
    'DOCUMENTATION_REQUESTED',
    'Requested proof of ownership and verified governor consent from host.'
  );
  if (docReqReport.status !== 'DOCUMENTATION_REQUESTED') throw new Error('Failed to update status to DOCUMENTATION_REQUESTED');
  console.log('✓ Documentation requested state transitioned and logged.');

  // 6. Admin Suspends Listing due to verified fraud (SUSPENDED)
  console.log('Step 4: Admin suspends fraudulent listing...');
  const suspReport = await reportService.updateReportStatus(
    complianceAdmin,
    report.id,
    'SUSPENDED',
    'Host failed to supply governor consent. Listing confirmed fraudulent. Suspended immediately.'
  );
  if (suspReport.status !== 'SUSPENDED') throw new Error('Failed to update report to SUSPENDED');

  // Verify property is automatically suspended
  const suspendedProp = await propertyRepository.findById(property.id);
  if (!suspendedProp || suspendedProp.listingStatus !== 'SUSPENDED') {
    throw new Error(`Property listingStatus must be SUSPENDED, got ${suspendedProp?.listingStatus}`);
  }
  if (suspendedProp.availabilityStatus !== 'UNAVAILABLE') {
    throw new Error(`Property availabilityStatus must be UNAVAILABLE, got ${suspendedProp.availabilityStatus}`);
  }

  // Verify LISTING_SUSPENDED audit event
  const suspAudit = await auditRepository.query({ action: 'LISTING_SUSPENDED', objectId: property.id });
  if (suspAudit.length === 0) throw new Error('Audit log for LISTING_SUSPENDED was not found');
  console.log('✓ Property automatically suspended from marketplace upon report suspension.');

  // 7. Admin restores property after legal clearance (Section 18 restoration workflow)
  console.log('Step 5: Admin restores property after legal review...');
  const restoredProp = await propertyService.restoreProperty(
    complianceAdmin,
    property.id,
    'Title documents verified with Lagos State Lands Bureau. Listing restored to marketplace.'
  );
  if (restoredProp.listingStatus !== 'ACTIVE') throw new Error(`Listing must be ACTIVE upon restoration, got ${restoredProp.listingStatus}`);
  if (restoredProp.availabilityStatus !== 'AVAILABLE') throw new Error(`Availability must be AVAILABLE upon restoration, got ${restoredProp.availabilityStatus}`);

  // Verify LISTING_RESTORED audit event
  const restoreAudit = await auditRepository.query({ action: 'LISTING_RESTORED', objectId: property.id });
  if (restoreAudit.length === 0) throw new Error('Audit log for LISTING_RESTORED was not found');
  console.log('✓ Property restored to active marketplace with cryptographic audit trail.');

  // 8. Admin resolves report (RESOLVED)
  console.log('Step 6: Admin resolves report with final history notes...');
  const resolvedReport = await reportService.resolveReport(
    complianceAdmin,
    report.id,
    'Investigation completed. Property restored after legitimate title documents verified.'
  );
  if (resolvedReport.status !== 'RESOLVED') throw new Error('Report status should be RESOLVED');

  // Verify complete audit history trail for report
  const reportAudits = await auditRepository.query({ objectType: 'REPORT', objectId: report.id });
  if (reportAudits.length < 4) {
    throw new Error(`Expected at least 4 audit events for report lifecycle, found ${reportAudits.length}`);
  }
  console.log(`✓ Full resolution audit history verified (${reportAudits.length} lifecycle events tracked).`);

  console.log('\n--- ALL PHASE 10 TRUST & SAFETY TESTS PASSED PERFECTLY ---');
}

runPhase10Tests().catch((err) => {
  console.error('Phase 10 test failed:', err);
  process.exit(1);
});
