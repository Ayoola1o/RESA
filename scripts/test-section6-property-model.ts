import { propertyService } from '../src/server/services/property-service';
import { verificationService } from '../src/server/services/verification-service';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyRepository } from '../src/server/repositories/property-repository';
import { auditRepository } from '../src/server/repositories/audit-repository';
import { ListingStatus, Property } from '../src/types/prophunta';

async function runSection6PropertyModelTests() {
  console.log('========================================================');
  console.log('🧪 TESTING SECTION 6: PROPERTY DATA MODEL & STATUS ENGINE');
  console.log('========================================================\n');

  // 1. Fetch Users
  const owner = await userRepository.findByEmail('owner@prophunta.ai');
  const agent = await userRepository.findByEmail('agent@prophunta.ai');
  const admin = await userRepository.findByEmail('admin@prophunta.ai');
  const seeker = await userRepository.findByEmail('seeker@prophunta.ai');

  if (!owner || !agent || !admin || !seeker) {
    throw new Error('Seed users not found');
  }

  // 2. Test Property Model Field Completeness on Draft Creation
  console.log('1. Testing Complete Property Model Architecture with Minimum Fields...');
  const newProperty = await propertyService.createDraft(owner, {
    title: 'Crown Heights Luxury Smart Duplex',
    propertyType: 'House',
    listingType: 'RENT',
    description: 'Ultra-contemporary duplex with automated access and clean title.',
    state: 'Lagos',
    city: 'Lekki',
    area: 'Lekki Phase 1',
    address: '14 Admiralty Way, Lekki Phase 1',
    latitude: 6.4485,
    longitude: 3.4735,
    price: 25000000,
    priceUnit: '/year',
    agreementFee: 2500000,
    cautionFee: 2000000,
    serviceCharge: 1500000,
    otherCharges: 500000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 450,
    features: ['Swimming Pool', '24/7 Security', 'Solar Inverter', 'Fitted Kitchen'],
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
    intendedUse: 'Residential',
    authorizedAgentId: agent.id,
  });

  // Verify all 26 required fields are present
  const requiredFields: (keyof Property)[] = [
    'id',
    'ownerId',
    'authorizedAgentId',
    'title',
    'propertyType',
    'listingType',
    'description',
    'state',
    'city',
    'area',
    'address',
    'latitude',
    'longitude',
    'price',
    'agreementFee',
    'cautionFee',
    'serviceCharge',
    'otherCharges',
    'bedrooms',
    'bathrooms',
    'features',
    'availabilityStatus',
    'intendedUse',
    'listingStatus',
    'createdAt',
    'updatedAt',
  ];

  for (const field of requiredFields) {
    if (newProperty[field] === undefined) {
      throw new Error(`Missing required property field: ${String(field)}`);
    }
  }

  console.log('  ✓ All 26 required fields verified on persistent model.');
  console.log(`    - ID: ${newProperty.id}`);
  console.log(`    - Initial Listing Status: ${newProperty.listingStatus}`);
  console.log(`    - Initial Availability: ${newProperty.availabilityStatus}`);
  console.log(`    - Intended Use: ${newProperty.intendedUse}`);
  console.log(`    - Coordinates: Lat ${newProperty.latitude}, Lng ${newProperty.longitude}`);

  if (newProperty.listingStatus !== 'DRAFT') {
    throw new Error('New property draft must have listingStatus = DRAFT');
  }

  // 3. Test Security: Seeker cannot transition status
  console.log('\n2. Testing Role Security & Unauthorized Transition Rejection...');
  try {
    await propertyService.transitionListingStatus(seeker, newProperty.id, 'ACTIVE');
    throw new Error('Expected seeker status transition to fail');
  } catch (err: any) {
    if (err.message.includes('Unauthorized')) {
      console.log('  ✓ Security check passed: Seeker unauthorized transition rejected.');
    } else {
      throw err;
    }
  }

  // 4. Test Security: Owner cannot bypass verification to mark draft as ACTIVE
  try {
    await propertyService.transitionListingStatus(owner, newProperty.id, 'ACTIVE');
    throw new Error('Expected owner bypass to fail');
  } catch (err: any) {
    if (err.message.includes('Cannot transition listing')) {
      console.log('  ✓ Workflow check passed: Owner cannot bypass verification straight to ACTIVE.');
    } else {
      throw err;
    }
  }

  // 5. Test Full 11 Listing Status Lifecycle Transitions
  console.log('\n3. Testing All 11 Supported Listing Statuses in Workflow Engine...');

  const allExpectedStatuses: ListingStatus[] = [
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'VERIFIED',
    'CHANGES_REQUIRED',
    'REJECTED',
    'ACTIVE',
    'RESERVED',
    'OCCUPIED',
    'SOLD',
    'SUSPENDED',
  ];

  // Transition 1: DRAFT -> SUBMITTED (by Owner)
  let current = await propertyService.transitionListingStatus(owner, newProperty.id, 'SUBMITTED', 'Ready for compliance audit');
  if (current.listingStatus !== 'SUBMITTED') throw new Error('Expected status SUBMITTED');
  console.log(`  ✓ 1/11 [SUBMITTED]: Submitted by owner for verification review.`);

  // Transition 2: SUBMITTED -> UNDER_REVIEW (by Admin)
  current = await propertyService.transitionListingStatus(admin, newProperty.id, 'UNDER_REVIEW', 'Assigned to field verification team');
  if (current.listingStatus !== 'UNDER_REVIEW') throw new Error('Expected status UNDER_REVIEW');
  console.log(`  ✓ 2/11 [UNDER_REVIEW]: Verification officer opened review.`);

  // Transition 3: UNDER_REVIEW -> CHANGES_REQUIRED (by Admin)
  current = await propertyService.transitionListingStatus(admin, newProperty.id, 'CHANGES_REQUIRED', 'Please upload signed Survey Plan');
  if (current.listingStatus !== 'CHANGES_REQUIRED') throw new Error('Expected status CHANGES_REQUIRED');
  console.log(`  ✓ 3/11 [CHANGES_REQUIRED]: Compliance flagged missing survey plan.`);

  // Transition 4: CHANGES_REQUIRED -> SUBMITTED (by Owner after amendments)
  current = await propertyService.transitionListingStatus(owner, newProperty.id, 'SUBMITTED', 'Survey plan attached');
  if (current.listingStatus !== 'SUBMITTED') throw new Error('Expected status SUBMITTED');
  console.log(`  ✓ Resubmitted amended draft.`);

  // Transition 5: SUBMITTED -> VERIFIED (by Admin audit pass)
  current = await propertyService.transitionListingStatus(admin, newProperty.id, 'VERIFIED', 'All titles confirmed clean');
  if (current.listingStatus !== 'VERIFIED') throw new Error('Expected status VERIFIED');
  console.log(`  ✓ 4/11 [VERIFIED]: Verification passed with clean legal title.`);

  // Transition 6: VERIFIED -> ACTIVE (Published to Marketplace)
  current = await propertyService.transitionListingStatus(owner, newProperty.id, 'ACTIVE');
  if (current.listingStatus !== 'ACTIVE') throw new Error('Expected status ACTIVE');
  if (!current.publishedAt) throw new Error('Expected publishedAt to be set upon activation');
  if (current.availabilityStatus !== 'AVAILABLE') throw new Error('Expected availabilityStatus AVAILABLE');
  console.log(`  ✓ 5/11 [ACTIVE]: Listing live on marketplace with publishedAt: ${current.publishedAt}`);

  // Transition 7: ACTIVE -> RESERVED (Offer / deposit held)
  current = await propertyService.transitionListingStatus(owner, newProperty.id, 'RESERVED', 'Holding deposit received');
  if (current.listingStatus !== 'RESERVED') throw new Error('Expected status RESERVED');
  if (current.availabilityStatus !== 'UNDER_OFFER') throw new Error('Expected availabilityStatus UNDER_OFFER');
  console.log(`  ✓ 6/11 [RESERVED]: Holding deposit placed. Availability synced to ${current.availabilityStatus}`);

  // Transition 8: RESERVED -> OCCUPIED (Handover complete, tenant moved in)
  current = await propertyService.transitionListingStatus(owner, newProperty.id, 'OCCUPIED', 'Keys handed over to verified tenant');
  if (current.listingStatus !== 'OCCUPIED') throw new Error('Expected status OCCUPIED');
  if (current.availabilityStatus !== 'OCCUPIED') throw new Error('Expected availabilityStatus OCCUPIED');
  console.log(`  ✓ 7/11 [OCCUPIED]: Tenancy commenced. Availability synced to ${current.availabilityStatus}`);

  // Transition 9: OCCUPIED -> SOLD (Or for sale properties)
  current = await propertyService.transitionListingStatus(admin, newProperty.id, 'SOLD', 'Transaction deed executed');
  if (current.listingStatus !== 'SOLD') throw new Error('Expected status SOLD');
  if (current.availabilityStatus !== 'UNAVAILABLE') throw new Error('Expected availabilityStatus UNAVAILABLE');
  console.log(`  ✓ 8/11 [SOLD]: Transaction closed. Availability synced to ${current.availabilityStatus}`);

  // Transition 10: SOLD -> SUSPENDED (by Admin / Compliance)
  current = await propertyService.transitionListingStatus(admin, newProperty.id, 'SUSPENDED', 'Title dispute reported');
  if (current.listingStatus !== 'SUSPENDED') throw new Error('Expected status SUSPENDED');
  console.log(`  ✓ 9/11 [SUSPENDED]: Suspended by compliance officer.`);

  // Transition 11: SUSPENDED -> REJECTED (by Admin)
  current = await propertyService.transitionListingStatus(admin, newProperty.id, 'REJECTED', 'Permanent rejection due to fraudulent survey');
  if (current.listingStatus !== 'REJECTED') throw new Error('Expected status REJECTED');
  console.log(`  ✓ 10/11 [REJECTED]: Final non-compliant rejection recorded.`);

  // Initial status was DRAFT (11/11)
  console.log(`  ✓ 11/11 [DRAFT]: Validated on draft creation.`);

  // 6. Test Persistence in Repository
  console.log('\n4. Testing Persistent Storage Verification (.data/store.json)...');
  const stored = await propertyRepository.findById(newProperty.id);
  if (!stored) throw new Error('Property was not persisted in repository');
  if (stored.listingStatus !== 'REJECTED') throw new Error('Persisted status does not match latest update');
  console.log(`  ✓ Verified persistent disk retrieval for ID: ${stored.id}`);

  // 7. Test Audit Trail Generation
  console.log('\n5. Testing Immutable Audit Ledger Recording for Status Transitions...');
  const logs = await auditRepository.listAll(50);
  const transitionLogs = logs.filter((l) => l.objectId === newProperty.id && l.action === 'PROPERTY_STATUS_TRANSITIONED');
  console.log(`  ✓ Found ${transitionLogs.length} persistent status transition audit records for this property.`);
  if (transitionLogs.length === 0) throw new Error('No status transition audit logs recorded');

  console.log('\n========================================================');
  console.log('✅ ALL SECTION 6 PROPERTY MODEL & STATUS TESTS PASSED (100%)!');
  console.log('========================================================\n');
}

runSection6PropertyModelTests().catch((err) => {
  console.error('❌ Section 6 Test failed:', err);
  process.exit(1);
});
