import fs from 'fs';
import path from 'path';
import { documentService } from '../src/server/services/document-service';
import { propertyService } from '../src/server/services/property-service';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyRepository } from '../src/server/repositories/property-repository';
import { auditRepository } from '../src/server/repositories/audit-repository';

async function runSection8And9Tests() {
  console.log('===============================================================');
  console.log('🧪 TESTING SECTION 8 (DOCUMENTS) & SECTION 9 (CREATION FLOW)');
  console.log('===============================================================\n');

  // 1. Fetch Users
  const owner = await userRepository.findByEmail('owner@prophunta.ai');
  const admin = await userRepository.findByEmail('admin@prophunta.ai');
  const seeker = await userRepository.findByEmail('seeker@prophunta.ai');

  if (!owner || !admin || !seeker) {
    throw new Error('Seed users not found');
  }

  // -------------------------------------------------------------
  // TEST SECTION 9: PROPERTY CREATION FLOW (8 STEPS, DRAFT & SUBMIT)
  // -------------------------------------------------------------
  console.log('--- TEST SECTION 9: PROPERTY CREATION WORKFLOW ---');

  // 1. Save Draft (Steps 1 to 5)
  console.log('\n1. Testing "Save Draft" Creation...');
  const draft = await propertyService.createDraft(owner, {
    title: 'The Atlantic Oceanview Villa Draft',
    propertyType: 'House',
    listingType: 'SALE',
    description: 'Bespoke shoreline architecture awaiting document attachment.',
    state: 'Lagos',
    city: 'Lagos Island',
    area: 'Oniru',
    address: 'Plot 18 Ocean Drive, Oniru Waterfront',
    latitude: 6.4312,
    longitude: 3.4418,
    price: 320000000,
    priceUnit: 'total',
    agreementFee: 16000000,
    cautionFee: 0,
    serviceCharge: 4000000,
    otherCharges: 2500000,
    bedrooms: 5,
    bathrooms: 6,
    sqft: 680,
    features: ['Private Beach Access', 'Infinity Pool', '24/7 Security'],
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
    intendedUse: 'Residential',
  });

  console.log(`  ✓ Draft created: ID ${draft.id}`);
  console.log(`  ✓ Listing Status is strictly: ${draft.listingStatus}`);
  if (draft.listingStatus !== 'DRAFT') {
    throw new Error(`Expected draft status DRAFT, got: ${draft.listingStatus}`);
  }

  // 2. Edit Draft
  console.log('\n2. Testing "Edit Draft" Modification...');
  const updatedDraft = await propertyService.updateDraft(owner, draft.id, {
    title: 'The Atlantic Oceanview Villa (Updated Draft)',
    price: 330000000,
    bedrooms: 6,
  });

  console.log(`  ✓ Draft updated: Title "${updatedDraft.title}", Price ₦${updatedDraft.price.toLocaleString()}, Beds: ${updatedDraft.bedrooms}`);
  console.log(`  ✓ Listing Status remains: ${updatedDraft.listingStatus}`);
  if (updatedDraft.listingStatus !== 'DRAFT') {
    throw new Error('Editing draft must not alter DRAFT status');
  }

  // -------------------------------------------------------------
  // TEST SECTION 8: PROPERTY DOCUMENTS & CONFIDENTIAL STORAGE
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 8: ACCESS-CONTROLLED DOCUMENTS ---');

  // 3. Upload Title Document to Access-Controlled Vault (.data/vault/documents/)
  console.log('\n3. Testing Document Upload to Secure Vault...');
  const fakePdfBuffer = Buffer.from('%PDF-1.4 Fake Registered Deed of Assignment & C of O Document Body %EOF');
  const uploadedDoc = await documentService.uploadDocument(
    owner,
    draft.id,
    fakePdfBuffer,
    'Deed_Of_Assignment_LND_2025.pdf',
    'application/pdf',
    'DEED_OF_ASSIGNMENT'
  );

  console.log(`  ✓ Document record created:`);
  console.log(`    - ID: ${uploadedDoc.id}`);
  console.log(`    - PropertyId: ${uploadedDoc.propertyId}`);
  console.log(`    - UploadedBy: ${uploadedDoc.uploadedBy}`);
  console.log(`    - DocumentType: ${uploadedDoc.documentType}`);
  console.log(`    - FileReference: ${uploadedDoc.fileReference}`);
  console.log(`    - Status: ${uploadedDoc.status}`);
  console.log(`    - UploadedAt: ${uploadedDoc.uploadedAt}`);
  console.log(`    - SizeBytes: ${uploadedDoc.sizeBytes}`);

  // Minimum required fields assertion
  const requiredDocFields = ['id', 'propertyId', 'uploadedBy', 'documentType', 'fileReference', 'status', 'uploadedAt'];
  for (const f of requiredDocFields) {
    if ((uploadedDoc as any)[f] === undefined) {
      throw new Error(`Missing required document field: ${f}`);
    }
  }

  // Verify file exists in physical access-controlled vault
  const vaultPath = documentService.getVaultFilePath(uploadedDoc.fileReference);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`File was not stored in vault at: ${vaultPath}`);
  }
  console.log(`  ✓ Physical file verified in vault: ${vaultPath} (${fs.statSync(vaultPath).size} bytes)`);

  // 4. Test Access Control: Confidential Documents must NOT be publicly accessible
  console.log('\n4. Testing Confidential Access Control (Public / Seeker Denied)...');
  try {
    await documentService.getDocumentFile(seeker, uploadedDoc.id);
    throw new Error('Expected seeker access to confidential document to fail');
  } catch (err: any) {
    if (err.message.includes('Unauthorized') || err.message.includes('denied')) {
      console.log('  ✓ Access Control Passed: Unauthorized seeker blocked from confidential document.');
    } else {
      throw err;
    }
  }

  // 5. Test Authorized Access: Owner & Admin allowed
  console.log('\n5. Testing Authorized Retrieval (Owner & Admin Allowed)...');
  const ownerRetrieval = await documentService.getDocumentFile(owner, uploadedDoc.id);
  if (ownerRetrieval.fileBuffer.length !== fakePdfBuffer.length) {
    throw new Error('Retrieved file buffer size mismatch');
  }
  console.log(`  ✓ Owner retrieval successful (${ownerRetrieval.fileBuffer.length} bytes).`);

  const adminRetrieval = await documentService.getDocumentFile(admin, uploadedDoc.id);
  if (adminRetrieval.fileBuffer.length !== fakePdfBuffer.length) {
    throw new Error('Admin retrieval file buffer mismatch');
  }
  console.log(`  ✓ Admin retrieval successful (${adminRetrieval.fileBuffer.length} bytes).`);

  // 6. Test Verification Officer Audit (Review Document)
  console.log('\n6. Testing Verification Officer Document Audit...');
  const reviewedDoc = await documentService.reviewDocument(
    admin,
    draft.id,
    uploadedDoc.id,
    'APPROVED',
    'Deed of Assignment signature and registry seal verified.'
  );

  console.log(`  ✓ Document audit logged:`);
  console.log(`    - Status: ${reviewedDoc.status}`);
  console.log(`    - ReviewedBy: ${reviewedDoc.reviewedBy}`);
  console.log(`    - ReviewedAt: ${reviewedDoc.reviewedAt}`);
  console.log(`    - ReviewNotes: "${reviewedDoc.reviewNotes}"`);

  if (reviewedDoc.status !== 'APPROVED') throw new Error('Expected status APPROVED');
  if (!reviewedDoc.reviewedAt || !reviewedDoc.reviewedBy) throw new Error('Review metadata missing');

  // -------------------------------------------------------------
  // TEST SECTION 9: SUBMISSION PROTOCOL
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 9: SUBMIT FOR REVIEW PROTOCOL ---');
  console.log('\n7. Testing "Submit for Review" (Changes Status to SUBMITTED; Not Automatically VERIFIED)...');
  const submittedProp = await propertyService.submitForReview(owner, draft.id);

  console.log(`  ✓ Submitted Property ID: ${submittedProp.id}`);
  console.log(`  ✓ New Listing Status: ${submittedProp.listingStatus}`);
  console.log(`  ✓ Verification Overall Status: ${submittedProp.verification?.overallStatus}`);

  if (submittedProp.listingStatus !== 'SUBMITTED') {
    throw new Error(`Expected listingStatus SUBMITTED, got: ${submittedProp.listingStatus}`);
  }

  if ((submittedProp.listingStatus as string) === 'VERIFIED') {
    throw new Error('VIOLATION: Listing was automatically marked VERIFIED upon submission!');
  }
  console.log('  ✓ Confirmed: Listing was NOT automatically marked VERIFIED.');

  // 8. Test Document Deletion & Vault Cleanup
  console.log('\n8. Testing Document Deletion and Secure Vault Disk Cleanup...');
  // Upload a second document to test deletion
  const tempDoc = await documentService.uploadDocument(
    owner,
    draft.id,
    Buffer.from('Temporary survey plan draft'),
    'temp_survey.pdf',
    'application/pdf',
    'SURVEY_PLAN'
  );
  const tempDiskPath = documentService.getVaultFilePath(tempDoc.fileReference);
  if (!fs.existsSync(tempDiskPath)) throw new Error('Temp file not found on disk');

  await documentService.deleteDocument(owner, draft.id, tempDoc.id);
  if (fs.existsSync(tempDiskPath)) {
    throw new Error('Temp file was not cleaned up from vault disk upon deletion');
  }
  console.log(`  ✓ Document record and physical disk file successfully removed from vault.`);

  // 9. Verify Immutable Audit Ledger
  console.log('\n9. Testing Audit Trail Verification for Documents & Submissions...');
  const logs = await auditRepository.listAll(50);
  const docUploadLog = logs.find((l) => l.objectId === uploadedDoc.id && l.action === 'DOCUMENT_UPLOADED');
  const docReviewLog = logs.find((l) => l.objectId === uploadedDoc.id && l.action === 'DOCUMENT_REVIEWED');
  const propSubmitLog = logs.find((l) => l.objectId === draft.id && l.action === 'PROPERTY_SUBMITTED');

  if (!docUploadLog || !docReviewLog || !propSubmitLog) {
    throw new Error('Missing expected audit records for documents or submission');
  }
  console.log(`  ✓ Audit records found: DOCUMENT_UPLOADED, DOCUMENT_REVIEWED, PROPERTY_SUBMITTED.`);

  console.log('\n===============================================================');
  console.log('✅ ALL SECTION 8 & SECTION 9 TESTS PASSED (100%)!');
  console.log('===============================================================\n');
}

runSection8And9Tests().catch((err) => {
  console.error('❌ Section 8 & 9 Test failed:', err);
  process.exit(1);
});
