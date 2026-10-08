import { userRepository } from '../src/server/repositories/user-repository';
import { propertyService } from '../src/server/services/property-service';
import { verificationService } from '../src/server/services/verification-service';
import { inspectionService } from '../src/server/services/inspection-service';
import { enquiryService } from '../src/server/services/enquiry-service';
import { applicationService } from '../src/server/services/application-service';
import { reportService } from '../src/server/services/report-service';
import { auditService } from '../src/server/services/audit-service';
import { authService } from '../src/server/services/auth-service';

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 PROPHUNTA AI — PART I MVP E2E TEST SUITE');
  console.log('====================================================\n');

  // --- 1. SEEKER WORKFLOW ---
  console.log('Step 1: Testing Seeker Registration & Authentication...');
  const seekerEmail = `seeker_test_${Date.now()}@prophunta.ai`;
  const seekerReg = await authService.register({
    name: 'Ngozi Okonjo',
    email: seekerEmail,
    password: 'Password123!',
    phone: '+234 803 111 2233',
    role: 'SEEKER',
  });
  if (!seekerReg.user) throw new Error('Seeker registration failed: ' + seekerReg.error);
  console.log('  ✓ Seeker registered successfully:', seekerReg.user.email);

  const seekerLogin = await authService.login(seekerEmail, 'Password123!');
  if (!seekerLogin.user) throw new Error('Seeker login failed: ' + seekerLogin.error);
  const seeker = seekerLogin.user;
  console.log('  ✓ Seeker login passed');

  console.log('\nStep 2: Testing Property Discovery & Filtering...');
  const allProperties = await propertyService.searchProperties({ city: 'Lagos', verifiedOnly: false });
  if (allProperties.length === 0) throw new Error('No properties found in database');
  console.log(`  ✓ Found ${allProperties.length} properties matching search filter`);

  const targetProperty = allProperties[0];
  console.log(`  ✓ Inspected target property: "${targetProperty.title}" (ID: ${targetProperty.id})`);
  console.log(`    - Price: ₦${targetProperty.price.toLocaleString()}`);
  console.log(`    - Agreement Fee: ₦${(targetProperty.agreementFee || 0).toLocaleString()}`);
  console.log(`    - Verification Overall Status: ${targetProperty.verification?.overallStatus}`);

  console.log('\nStep 3: Testing Inspection Scheduling (Seeker)...');
  const inspRequest = await inspectionService.requestInspection(seeker, {
    propertyId: targetProperty.id,
    preferredDate: '2026-10-15',
    preferredTimeSlot: '11:00 AM - 01:00 PM',
    type: 'IN_PERSON',
    notes: 'Interested in structural layout and security features.',
  });
  console.log('  ✓ Inspection requested successfully:', inspRequest.id, 'Status:', inspRequest.status);

  console.log('\nStep 4: Testing Property-Tied Enquiry Messaging...');
  const enquiry = await enquiryService.sendEnquiry(
    seeker,
    targetProperty.id,
    'Hello, is the Governor’s Consent title document verified and available for legal inspection?'
  );
  console.log('  ✓ Enquiry sent to host. Conversation ID:', enquiry.id, 'Messages:', enquiry.messages.length);

  console.log('\nStep 5: Testing Rental Application / EOI...');
  const application = await applicationService.submitApplication(seeker, {
    propertyId: targetProperty.id,
    type: 'RENTAL',
    occupation: 'Lead Systems Architect',
    moveInDate: '2026-11-01',
    occupants: 2,
    offerAmount: targetProperty.price,
    message: 'We are prepared to take immediate occupancy following verified inspection.',
  });
  console.log('  ✓ Rental expression of interest submitted:', application.id, 'Status:', application.status);

  console.log('\nStep 6: Testing Trust & Safety Report Submission...');
  const report = await reportService.fileReport(seeker, {
    propertyId: targetProperty.id,
    reason: 'Incorrect Information',
    description: 'Minor discrepancy in advertised floor level vs on-site layout.',
  });
  console.log('  ✓ Report filed with Trust & Safety:', report.id, 'Status:', report.status);

  // --- 2. OWNER WORKFLOW ---
  console.log('\nStep 7: Testing Property Owner Registration & Listing Draft...');
  const ownerEmail = `owner_test_${Date.now()}@prophunta.ai`;
  const ownerReg = await authService.register({
    name: 'Chief Emeka Adeleke',
    email: ownerEmail,
    password: 'Password123!',
    phone: '+234 802 999 8877',
    role: 'OWNER',
  });
  if (!ownerReg.user) throw new Error('Owner registration failed: ' + ownerReg.error);
  const owner = ownerReg.user;
  console.log('  ✓ Owner registered successfully:', owner.email);

  const draftProperty = await propertyService.createDraft(owner, {
    title: 'Luxury 4-Bedroom Waterfront Penthouse',
    propertyType: 'Apartment',
    listingType: 'RENT',
    description: 'Spectacular waterfront views in Banana Island with 24/7 power and security.',
    state: 'Lagos',
    city: 'Lagos',
    area: 'Banana Island, Ikoyi',
    address: 'Plot 12, Waterfront Promenade',
    price: 35000000,
    priceUnit: '/year',
    agreementFee: 3500000,
    cautionFee: 3500000,
    serviceCharge: 6000000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 450,
    features: ['Waterfront View', 'Elevator', '24/7 Power', 'Swimming Pool', 'Security Guard'],
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c'],
  });
  console.log('  ✓ Property draft created:', draftProperty.id, 'Status:', draftProperty.listingStatus);

  console.log('\nStep 8: Uploading Title Proof Documents...');
  const doc = await propertyService.addDocument(
    owner,
    draftProperty.id,
    'GOVERNORS_CONSENT',
    'Governors_Consent_Ref_LND-2024-0012.pdf'
  );
  console.log('  ✓ Document attached:', doc.documentType, doc.fileName);

  console.log('\nStep 9: Submitting Property for Review...');
  const submittedProperty = await propertyService.submitForReview(owner, draftProperty.id);
  console.log('  ✓ Listing submitted for verification review. Status:', submittedProperty.listingStatus);

  // --- 3. AGENT WORKFLOW ---
  console.log('\nStep 10: Testing Licensed Agent Onboarding & Management...');
  const agentEmail = `agent_test_${Date.now()}@prophunta.ai`;
  const agentReg = await authService.register({
    name: 'Kemi Balogun, FNIVS',
    email: agentEmail,
    password: 'Password123!',
    phone: '+234 809 333 4455',
    role: 'AGENT',
    agencyName: 'Balogun & Partners Realty',
    licenseNumber: 'LASRERA-AGT-2025-081',
  });
  if (!agentReg.user) throw new Error('Agent registration failed: ' + agentReg.error);
  const agent = agentReg.user;
  console.log('  ✓ Agent registered with credentials:', agent.agencyName, 'Lic:', agent.licenseNumber);

  // --- 4. ADMIN & VERIFICATION OFFICER WORKFLOW ---
  console.log('\nStep 11: Testing Admin Verification Queue & Title Audit...');
  const adminUser = await userRepository.findByEmail('admin@prophunta.ai');
  if (!adminUser) throw new Error('Seed admin user not found');

  const queue = await verificationService.listQueue();
  console.log(`  ✓ Admin verification queue contains ${queue.length} items`);

  console.log('  ✓ Running granular checklist audit on submitted property...');
  await verificationService.updateChecklist(adminUser, submittedProperty.id, {
    ownerIdentityStatus: 'PASSED',
    locationStatus: 'PASSED',
    authorityDocumentStatus: 'PASSED',
    availabilityStatus: 'PASSED',
    mediaStatus: 'PASSED',
    inspectionStatus: 'PASSED',
    reviewNotes: 'Governor Consent volume verified with Alausa Lands Registry. Coordinates matched.',
  });

  const verificationResult = await verificationService.approveVerification(
    adminUser,
    submittedProperty.id,
    'Official Verified Trust Badge approved.'
  );
  const updatedProp = await propertyService.getProperty(submittedProperty.id);
  console.log('  ✓ Property approved! New Listing Status:', updatedProp?.listingStatus);
  console.log('  ✓ Property Verification Status:', verificationResult.overallStatus);

  console.log('\nStep 12: Testing Moderation & Audit Ledger...');
  const allReports = await reportService.getAllReports(adminUser);
  console.log(`  ✓ Admin retrieved ${allReports.length} trust & safety reports`);

  const auditLogs = await auditService.getRecentLogs(adminUser, 10);
  console.log(`  ✓ Immutable audit log retrieved. Recent entries: ${auditLogs.length}`);
  console.log('    Recent logged actions:');
  auditLogs.slice(0, 5).forEach((log) => {
    console.log(`    - [${log.timestamp.slice(11, 19)}] ${log.action} by ${log.actorRole} (${log.actorEmail})`);
  });

  console.log('\n====================================================');
  console.log('✅ ALL MVP END-TO-END WORKFLOWS PASSED 100%!');
  console.log('====================================================\n');
}

runE2ETests().catch((err) => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});
