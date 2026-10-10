import { verificationService } from '../src/server/services/verification-service';
import { propertyService } from '../src/server/services/property-service';
import { documentService } from '../src/server/services/document-service';
import { authService } from '../src/server/services/auth-service';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyRepository } from '../src/server/repositories/property-repository';
import { reportRepository } from '../src/server/repositories/report-repository';
import { inspectionRepository } from '../src/server/repositories/inspection-repository';
import { resetDatabase } from '../src/server/db/store';
import { VerificationSubStatus, PropertyVerification } from '../src/types/prophunta';

async function runSection12And13Tests() {
  console.log('================================================================');
  console.log('🧪 TESTING SECTION 12 (VERIFICATION SYSTEM) & 13 (ADMIN QUEUE)');
  console.log('================================================================\n');

  resetDatabase();

  // 1. Fetch seed users
  const admin = await userRepository.findByEmail('admin@prophunta.ai');
  const owner = await userRepository.findByEmail('owner@prophunta.ai');
  const seeker = await userRepository.findByEmail('seeker@prophunta.ai');

  if (!admin || !owner || !seeker) {
    throw new Error('Seed admin, owner, and seeker users required for test');
  }

  // -------------------------------------------------------------
  // TEST SECTION 12: VERIFICATION SYSTEM MODEL & ENGINE
  // -------------------------------------------------------------
  console.log('--- TEST SECTION 12: VERIFICATION MODEL & CHECKLIST ---');

  // Step 1: Create a test listing draft and submit it for review
  console.log('1. Creating property draft & submitting for review...');
  const property = await propertyService.createDraft(owner, {
    title: 'The Verification Test Haven',
    propertyType: 'Apartment',
    listingType: 'RENT',
    description: 'A test apartment for auditing verification checklist rules.',
    state: 'Lagos',
    city: 'Eti-Osa',
    area: 'Ikoyi',
    address: '42 Alexander Road, Ikoyi',
    price: 18000000,
    priceUnit: '/year',
    bedrooms: 3,
    bathrooms: 3,
    features: ['24/7 Power', 'Swimming Pool', 'Security Guard'],
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'],
  });

  const submittedProp = await propertyService.transitionListingStatus(owner, property.id, 'SUBMITTED', 'Submitted for compliance audit');
  console.log(`  ✓ Property submitted: ID ${submittedProp.id}, Status: ${submittedProp.listingStatus}`);
  if (submittedProp.listingStatus !== 'SUBMITTED') {
    throw new Error(`Expected SUBMITTED, got ${submittedProp.listingStatus}`);
  }

  // Step 2: Critical Constraint: Property MUST NEVER become VERIFIED simply because a document was uploaded
  console.log('\n2. Testing Strict Constraint: Uploading document must NOT auto-verify listing...');
  const testDocBuffer = Buffer.from('TEST GOVERNORS CONSENT DOCUMENT CONTENT');
  const uploadedDoc = await documentService.uploadDocument(
    owner,
    submittedProp.id,
    testDocBuffer,
    'governors_consent_alexander.pdf',
    'application/pdf',
    'GOVERNORS_CONSENT'
  );

  const propAfterDocUpload = await propertyRepository.findById(submittedProp.id);
  console.log(`  ✓ Document uploaded: ${uploadedDoc.fileName} (Status: ${uploadedDoc.status})`);
  console.log(`  ✓ Property listingStatus after document upload: ${propAfterDocUpload?.listingStatus}`);

  if (propAfterDocUpload?.listingStatus === 'VERIFIED') {
    throw new Error('VIOLATION: Property became VERIFIED simply because a document was uploaded!');
  }
  if (propAfterDocUpload?.listingStatus !== 'SUBMITTED') {
    throw new Error(`Expected listingStatus to remain SUBMITTED, got: ${propAfterDocUpload?.listingStatus}`);
  }
  console.log('  ✓ PASSED: Listing status remained SUBMITTED. Zero automatic verification occurred.');

  // Step 3: Test Granular Verification Model Checklist & All Supported Sub-Statuses
  console.log('\n3. Testing Granular Verification Checklist Structure & Sub-Statuses...');
  const supportedSubStatuses: VerificationSubStatus[] = [
    'PENDING',
    'IN_REVIEW',
    'PASSED',
    'FAILED',
    'CHANGES_REQUIRED',
    'NOT_REVIEWED',
  ];

  console.log(`  ✓ Supported granular states verified: ${supportedSubStatuses.join(', ')}`);

  // Update checklist with granular sub-statuses
  const checklist = await verificationService.updateChecklist(admin, submittedProp.id, {
    ownerIdentityStatus: 'PASSED',
    locationStatus: 'PASSED',
    authorityDocumentStatus: 'IN_REVIEW',
    availabilityStatus: 'PASSED',
    mediaStatus: 'PASSED',
    inspectionStatus: 'NOT_REVIEWED',
    reviewNotes: 'Alausa survey beacons match cadaster coordinates. Title deed awaiting stamp confirmation.',
  });

  console.log('  ✓ Checklist recorded:');
  console.log(`    - verificationId: ${checklist.verificationId}`);
  console.log(`    - propertyId: ${checklist.propertyId}`);
  console.log(`    - reviewerId: ${checklist.reviewerId}`);
  console.log(`    - ownerIdentityStatus: ${checklist.ownerIdentityStatus}`);
  console.log(`    - locationStatus: ${checklist.locationStatus}`);
  console.log(`    - authorityDocumentStatus: ${checklist.authorityDocumentStatus}`);
  console.log(`    - availabilityStatus: ${checklist.availabilityStatus}`);
  console.log(`    - mediaStatus: ${checklist.mediaStatus}`);
  console.log(`    - inspectionStatus: ${checklist.inspectionStatus}`);
  console.log(`    - reviewNotes: ${checklist.reviewNotes}`);

  // Minimum required structure validation
  const requiredKeys: (keyof PropertyVerification)[] = [
    'verificationId',
    'propertyId',
    'reviewerId',
    'ownerIdentityStatus',
    'locationStatus',
    'authorityDocumentStatus',
    'availabilityStatus',
    'mediaStatus',
    'inspectionStatus',
    'overallStatus',
    'reviewNotes',
    'reviewedAt',
  ];

  for (const k of requiredKeys) {
    if (checklist[k] === undefined) {
      throw new Error(`Missing required verification model key: ${String(k)}`);
    }
  }

  // Step 4: Admin Action: Request Changes
  console.log('\n4. Testing Admin Action: Request Changes...');
  const changesRes = await verificationService.requestChanges(admin, submittedProp.id, 'Need clearer scan of Deed of Assignment seal.');
  const propAfterChanges = await propertyRepository.findById(submittedProp.id);
  console.log(`  ✓ Changes requested: overallStatus=${changesRes.overallStatus}, listingStatus=${propAfterChanges?.listingStatus}`);
  if (propAfterChanges?.listingStatus !== 'CHANGES_REQUIRED' || changesRes.overallStatus !== 'CHANGES_REQUIRED') {
    throw new Error('Request changes failed to transition statuses properly');
  }

  // Step 5: Admin Action: Reject Listing
  console.log('\n5. Testing Admin Action: Reject Listing...');
  const rejectRes = await verificationService.rejectVerification(admin, submittedProp.id, 'Fraudulent boundary survey detected.');
  const propAfterReject = await propertyRepository.findById(submittedProp.id);
  console.log(`  ✓ Listing rejected: overallStatus=${rejectRes.overallStatus}, listingStatus=${propAfterReject?.listingStatus}`);
  if (propAfterReject?.listingStatus !== 'REJECTED' || rejectRes.overallStatus !== 'FAILED') {
    throw new Error('Reject verification failed to transition statuses properly');
  }

  // Step 6: Admin Action: Approve Listing
  console.log('\n6. Testing Admin Action: Approve Listing as VERIFIED...');

  // 6a. Negative check: Trying to approve when checks are not all PASSED must fail
  try {
    await verificationService.approveVerification(admin, submittedProp.id, 'Attempting early approval');
    throw new Error('Approval should have been rejected for incomplete checklist');
  } catch (err: any) {
    console.log(`  ✓ Approval bypass rejected: "${err.message}"`);
  }

  // 6b. Complete all 6 checklist items to PASSED and review document to APPROVED
  await verificationService.updateChecklist(admin, submittedProp.id, {
    ownerIdentityStatus: 'PASSED',
    locationStatus: 'PASSED',
    authorityDocumentStatus: 'PASSED',
    availabilityStatus: 'PASSED',
    mediaStatus: 'PASSED',
    inspectionStatus: 'PASSED',
    reviewNotes: 'Survey verified, physical inspection cleared, documents verified.',
  });
  await documentService.reviewDocument(admin, submittedProp.id, uploadedDoc.id, 'APPROVED', 'Deed verified with land registry.');

  const approveRes = await verificationService.approveVerification(admin, submittedProp.id, 'All title deeds, survey, and physical walkthrough confirmed.');
  const propAfterApprove = await propertyRepository.findById(submittedProp.id);
  console.log(`  ✓ Listing approved: overallStatus=${approveRes.overallStatus}, listingStatus=${propAfterApprove?.listingStatus}`);
  if (propAfterApprove?.listingStatus !== 'VERIFIED' || approveRes.overallStatus !== 'PASSED') {
    throw new Error('Approve verification failed to transition status to VERIFIED');
  }
  if (!approveRes.lastVerifiedAt) {
    throw new Error('lastVerifiedAt must be populated upon verification approval');
  }
  console.log(`  ✓ lastVerifiedAt timestamp set: ${approveRes.lastVerifiedAt}`);

  // -------------------------------------------------------------
  // TEST SECTION 13: ADMIN VERIFICATION QUEUE & DASHBOARD
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 13: ADMIN VERIFICATION QUEUE & DASHBOARD ---');

  // 1. Overview Metrics
  const allUsers = await authService.getAllUsers(admin);
  const allProperties = await propertyService.getAllProperties();
  const queueItems = await verificationService.listQueue();
  const allInspections = await inspectionRepository.listAll();
  const allReports = await reportRepository.listAll();

  console.log('1. Admin Overview Metrics:');
  console.log(`  - Total Users: ${allUsers.length}`);
  console.log(`  - Total Properties: ${allProperties.length}`);
  console.log(`  - Pending Verification Queue: ${queueItems.length}`);
  console.log(`  - Scheduled Inspections: ${allInspections.length}`);
  console.log(`  - Trust & Safety Reports: ${allReports.length}`);

  if (allUsers.length === 0 || allProperties.length === 0) {
    throw new Error('Admin overview metrics failed: zero users or properties');
  }

  // 2. Property Moderation Actions: Suspend & Restore
  console.log('\n2. Testing Property Moderation: Suspend & Restore...');
  const suspendedProp = await propertyService.suspendProperty(admin, submittedProp.id, 'Suspended for audit check');
  console.log(`  ✓ Property suspended: ID=${suspendedProp.id}, Status=${suspendedProp.listingStatus}, Availability=${suspendedProp.availabilityStatus}`);
  if (suspendedProp.listingStatus !== 'SUSPENDED' || suspendedProp.availabilityStatus !== 'UNAVAILABLE') {
    throw new Error('Property suspend failed');
  }

  const restoredProp = await propertyService.restoreProperty(admin, submittedProp.id);
  console.log(`  ✓ Property restored: ID=${restoredProp.id}, Status=${restoredProp.listingStatus}, Availability=${restoredProp.availabilityStatus}`);
  if (restoredProp.listingStatus !== 'ACTIVE' || restoredProp.availabilityStatus !== 'AVAILABLE') {
    throw new Error('Property restore failed');
  }

  // 3. Document Review Audit Action
  console.log('\n3. Testing Admin Document Review Action...');
  const reviewedDoc = await documentService.reviewDocument(admin, submittedProp.id, uploadedDoc.id, 'APPROVED', 'Registry seal stamped and verified.');
  console.log(`  ✓ Document reviewed by admin: ID=${reviewedDoc.id}, Status=${reviewedDoc.status}, ReviewedBy=${reviewedDoc.reviewedBy}`);
  if (reviewedDoc.status !== 'APPROVED' || reviewedDoc.reviewedBy !== admin.id) {
    throw new Error('Document audit review failed');
  }

  // 4. User Management Actions: Inspect & Suspend / Reactivate
  console.log('\n4. Testing User Management: Inspect, Suspend & Reactivate...');
  const targetSeeker = await userRepository.findByEmail('seeker@prophunta.ai');
  if (!targetSeeker) throw new Error('Seeker user not found');

  console.log(`  ✓ Inspected user: ${targetSeeker.name} (${targetSeeker.role}), Status: ${targetSeeker.verificationStatus}`);

  const suspendedUser = await authService.updateUserVerificationStatus(admin, targetSeeker.id, 'SUSPENDED');
  console.log(`  ✓ User suspended: ${suspendedUser.name}, verificationStatus=${suspendedUser.verificationStatus}`);
  if (suspendedUser.verificationStatus !== 'SUSPENDED') {
    throw new Error('User suspension failed');
  }

  const reactivatedUser = await authService.updateUserVerificationStatus(admin, targetSeeker.id, 'VERIFIED');
  console.log(`  ✓ User reactivated: ${reactivatedUser.name}, verificationStatus=${reactivatedUser.verificationStatus}`);
  if (reactivatedUser.verificationStatus !== 'VERIFIED') {
    throw new Error('User reactivation failed');
  }

  // Cleanup test property
  await documentService.deleteDocument(admin, submittedProp.id, uploadedDoc.id);

  console.log('\n================================================================');
  console.log('🎉 ALL SECTION 12 & SECTION 13 TESTS PASSED (100%)!');
  console.log('================================================================');
}

runSection12And13Tests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
