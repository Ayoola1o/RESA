import { resetDatabase, getDb } from '../src/server/db/store';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyRepository } from '../src/server/repositories/property-repository';
import { auditRepository, redactSensitiveData, computeLogChecksum, GENESIS_HASH } from '../src/server/repositories/audit-repository';
import { auditService } from '../src/server/services/audit-service';
import { documentService } from '../src/server/services/document-service';
import { staffManagementService } from '../src/server/services/staff-management-service';
import { User } from '../src/types/prophunta';

async function runPhase6Tests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE: PHASE 6 — AUDIT LOGGING & SENSITIVE DATA PROTECTION');
  console.log('================================================================\n');

  resetDatabase();

  const superAdmin = (await userRepository.findById('user_admin_1'))!;
  const seeker = (await userRepository.findById('user_seeker_1'))!;
  const owner = (await userRepository.findById('user_owner_1'))!;

  // Onboard test staff accounts:
  // 1. Compliance Auditor: has audit_logs.view, audit_logs.export, documents.view_metadata
  const auditorStaff = await staffManagementService.inviteStaff(superAdmin, {
    name: 'Amina Auditor',
    email: 'amina.auditor@prophunta.ai',
    roles: ['COMPLIANCE_AUDITOR'],
  });
  const auditorUser = (await userRepository.findByEmail(auditorStaff.email))!;

  // 2. Verification Officer: has documents.view_metadata, documents.view_sensitive, documents.review, but NOT audit_logs.export
  const verifierStaff = await staffManagementService.inviteStaff(superAdmin, {
    name: 'Bayo Verifier',
    email: 'bayo.verifier@prophunta.ai',
    roles: ['VERIFICATION_OFFICER'],
  });
  const verifierUser = (await userRepository.findByEmail(verifierStaff.email))!;

  // 3. User Support Officer: lacks audit_logs.view, audit_logs.export, documents.view_sensitive
  const supportStaff = await staffManagementService.inviteStaff(superAdmin, {
    name: 'Chioma Support',
    email: 'chioma.support@prophunta.ai',
    roles: ['USER_SUPPORT_OFFICER'],
  });
  const supportUser = (await userRepository.findByEmail(supportStaff.email))!;

  // Setup a test property with a document
  const db = getDb();
  const testProp = db.properties[0];
  const testDocId = 'doc_test_confidential_1';
  testProp.documents = [
    {
      id: testDocId,
      propertyId: testProp.id,
      uploadedBy: owner.id,
      documentType: 'GOVERNORS_CONSENT',
      fileName: 'confidential-deed-of-assignment.pdf',
      fileReference: 'mock_deed.pdf',
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
      mimeType: 'application/pdf',
      sizeBytes: 1048576,
    },
  ];

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: AUTOMATIC SENSITIVE DATA REDACTION & MASKING
  // ---------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: AUTOMATIC SENSITIVE DATA REDACTION ---');

  const rawMetadata = {
    password: 'SuperSecretPassword123!',
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy',
    apiKey: 'live_sec_key_abcdef123456',
    bvn: '22334455667',
    nin: '11223344556',
    normalField: 'Public inspection notes',
    nestedConfig: {
      authSecret: 'nested_secret_value',
      ssn: '123456789',
      safeParam: 42,
    },
  };

  const createdLog = await auditRepository.create({
    actorId: superAdmin.id,
    actorEmail: superAdmin.email,
    actorRole: superAdmin.role,
    action: 'STAFF_INVITED',
    objectType: 'STAFF',
    objectId: 'staff_test_redaction',
    result: 'SUCCESS',
    metadata: rawMetadata,
  });

  if (createdLog.metadata?.password === '[REDACTED]') {
    console.log('✅ 1.1 Password key successfully redacted to [REDACTED]');
  } else {
    throw new Error(`❌ 1.1 Password was not redacted: ${createdLog.metadata?.password}`);
  }

  if (createdLog.metadata?.token === '[REDACTED]' || createdLog.metadata?.token === '[REDACTED_TOKEN]') {
    console.log('✅ 1.2 Authentication token successfully redacted');
  } else {
    throw new Error(`❌ 1.2 Token was not redacted: ${createdLog.metadata?.token}`);
  }

  if (createdLog.metadata?.apiKey === '[REDACTED]') {
    console.log('✅ 1.3 API key successfully redacted');
  } else {
    throw new Error(`❌ 1.3 API key was not redacted: ${createdLog.metadata?.apiKey}`);
  }

  if (createdLog.metadata?.bvn === '***5667') {
    console.log('✅ 1.4 BVN successfully masked with trailing 4 digits');
  } else {
    throw new Error(`❌ 1.4 BVN was not masked correctly: ${createdLog.metadata?.bvn}`);
  }

  if (createdLog.metadata?.nin === '***4556') {
    console.log('✅ 1.5 NIN successfully masked with trailing 4 digits');
  } else {
    throw new Error(`❌ 1.5 NIN was not masked correctly: ${createdLog.metadata?.nin}`);
  }

  if (createdLog.metadata?.nestedConfig?.authSecret === '[REDACTED]') {
    console.log('✅ 1.6 Deeply nested secret successfully redacted');
  } else {
    throw new Error(`❌ 1.6 Nested secret was not redacted`);
  }

  if (createdLog.metadata?.normalField === 'Public inspection notes') {
    console.log('✅ 1.7 Non-sensitive fields preserved intact');
  } else {
    throw new Error(`❌ 1.7 Non-sensitive field was altered`);
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: CRYPTOGRAPHIC SHA-256 HASH CHAINING & INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: CRYPTOGRAPHIC HASH CHAIN INTEGRITY ---');

  if (createdLog.checksum && createdLog.previousChecksum) {
    console.log(`✅ 2.1 Audit log entry contains valid checksum and previousChecksum links`);
    console.log(`    Checksum: ${createdLog.checksum.slice(0, 16)}...`);
    console.log(`    Previous: ${createdLog.previousChecksum.slice(0, 16)}...`);
  } else {
    throw new Error('❌ 2.1 Audit log missing checksum or previousChecksum');
  }

  const initialVerification = await auditRepository.verifyIntegrity();
  if (initialVerification.isValid) {
    console.log(`✅ 2.2 Complete audit trail integrity verified (${initialVerification.totalLogs} entries in unbroken chain)`);
  } else {
    throw new Error(`❌ 2.2 Audit trail integrity failed: ${initialVerification.error}`);
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: TAMPER DETECTION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: AUDIT TAMPER DETECTION ---');

  // Deliberately tamper with an entry in the database store
  const originalAction = db.auditLogs[1].action;
  db.auditLogs[1].action = 'EMERGENCY_OVERRIDE_EXECUTED'; // Tampering!

  const tamperedVerification = await auditRepository.verifyIntegrity();
  if (!tamperedVerification.isValid && tamperedVerification.brokenAtIndex === 1) {
    console.log(`✅ 3.1 Tamper detected immediately at broken index 1: ${tamperedVerification.error?.slice(0, 80)}...`);
  } else {
    throw new Error(`❌ 3.1 Tamper was not detected or returned wrong status: ${JSON.stringify(tamperedVerification)}`);
  }

  // Restore original value
  db.auditLogs[1].action = originalAction;
  const restoredVerification = await auditRepository.verifyIntegrity();
  if (restoredVerification.isValid) {
    console.log('✅ 3.2 Restoring authentic state recovers verified integrity');
  } else {
    throw new Error('❌ 3.2 Integrity check did not recover after restoration');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: AUDIT LOG IMMUTABILITY GUARDS
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: IMMUTABILITY ENFORCEMENT ---');

  const repoProto = Object.getPrototypeOf(auditRepository);
  const isStrictlyAppendOnly = !('update' in repoProto) && !('delete' in repoProto);

  if (isStrictlyAppendOnly) {
    console.log('✅ 4.1 auditRepository has no update() method — verified strictly append-only on prototype');
    console.log('✅ 4.2 auditRepository has no delete() method — verified strictly append-only on prototype');
  } else {
    try {
      await (auditRepository as any).update();
      throw new Error('❌ 4.1 Update should have thrown');
    } catch (err: any) {
      if (err.message?.includes('immutable') || err.message?.includes('not a function')) {
        console.log('✅ 4.1 auditRepository.update() rejected with immutability violation error');
      } else {
        throw err;
      }
    }

    try {
      await (auditRepository as any).delete();
      throw new Error('❌ 4.2 Delete should have thrown');
    } catch (err: any) {
      if (err.message?.includes('immutable') || err.message?.includes('not a function')) {
        console.log('✅ 4.2 auditRepository.delete() rejected with immutability violation error');
      } else {
        throw err;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: AUDIT LOG ACCESS AUTHORIZATION (audit_logs.view)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: AUDIT LOG ACCESS AUTHORIZATION ---');

  // 5.1 Seeker blocked
  try {
    await auditService.listAuditLogs(seeker);
    throw new Error('❌ 5.1 Non-staff user should be denied audit view');
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('denied') || err.message?.toLowerCase().includes('unauthorized') || err.message?.toLowerCase().includes('forbidden')) {
      console.log('✅ 5.1 Platform user (SEEKER) denied audit logs view');
    } else {
      throw err;
    }
  }

  // 5.2 Support Officer (lacks audit_logs.view) blocked
  try {
    await auditService.listAuditLogs(supportUser);
    throw new Error('❌ 5.2 Support officer should be denied audit view');
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('denied') || err.message?.toLowerCase().includes('unauthorized') || err.message?.toLowerCase().includes('forbidden') || err.message?.includes('Missing')) {
      console.log('✅ 5.2 Support officer without audit_logs.view denied access');
    } else {
      throw err;
    }
  }

  // 5.3 Compliance Auditor (has audit_logs.view) allowed
  const auditorLogs = await auditService.listAuditLogs(auditorUser, undefined, 20);
  if (auditorLogs.length > 0) {
    console.log(`✅ 5.3 Compliance Auditor authorized to view audit logs (${auditorLogs.length} retrieved)`);
  } else {
    throw new Error('❌ 5.3 Compliance Auditor could not retrieve audit logs');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: AUDIT EXPORT AUTHORIZATION & AUDIT TRAIL GENERATION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: AUDIT LOG EXPORT AUTHORIZATION & AUDITING ---');

  // 6.1 Verification Officer (lacks audit_logs.export) denied
  try {
    await auditService.exportAuditLogs(verifierUser, 'csv');
    throw new Error('❌ 6.1 Verification Officer should be denied export');
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('denied') || err.message?.toLowerCase().includes('unauthorized') || err.message?.toLowerCase().includes('forbidden') || err.message?.includes('Missing')) {
      console.log('✅ 6.1 Verification Officer without audit_logs.export denied export');
    } else {
      throw err;
    }
  }

  // 6.2 Compliance Auditor (has audit_logs.export) succeeds in CSV export
  const csvExport = await auditService.exportAuditLogs(auditorUser, 'csv');
  if (csvExport.mimeType === 'text/csv' && csvExport.content.includes('checksum')) {
    console.log(`✅ 6.2 Compliance Auditor exported valid CSV with ${csvExport.recordCount} rows`);
  } else {
    throw new Error('❌ 6.2 CSV export failed or invalid format');
  }

  // 6.3 Compliance Auditor succeeds in JSON export
  const jsonExport = await auditService.exportAuditLogs(auditorUser, 'json');
  const parsedJson = JSON.parse(jsonExport.content);
  if (Array.isArray(parsedJson) && parsedJson.length > 0) {
    console.log(`✅ 6.3 Compliance Auditor exported valid JSON with ${parsedJson.length} entries`);
  } else {
    throw new Error('❌ 6.3 JSON export failed or invalid format');
  }

  // 6.4 Verify AUDIT_LOGS_EXPORTED event was appended to the audit trail
  const recentLogsAfterExport = await auditRepository.listAll(10);
  const exportEvent = recentLogsAfterExport.find((l) => l.action === 'AUDIT_LOGS_EXPORTED');
  if (exportEvent && exportEvent.actor?.id === auditorUser.id) {
    console.log(`✅ 6.4 AUDIT_LOGS_EXPORTED event captured in tamper-evident log (Actor: ${exportEvent.actor?.email})`);
  } else {
    throw new Error('❌ 6.4 AUDIT_LOGS_EXPORTED was not logged');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: SENSITIVE DOCUMENT ACCESS AUTHORIZATION & AUDIT LOGGING
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: SENSITIVE DOCUMENT ACCESS CONTROL & AUDITING ---');

  // Create a mock vault file for testing getDocumentFile
  const fs = await import('fs');
  const path = await import('path');
  const vaultDir = path.join(process.cwd(), '.data', 'vault', 'documents');
  if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
  fs.writeFileSync(path.join(vaultDir, 'mock_deed.pdf'), Buffer.from('%PDF-1.4 Mock confidential title deed content'));

  // 7.1 Support Officer (lacks documents.view_sensitive) denied download
  try {
    await documentService.getDocumentFile(supportUser, testDocId);
    throw new Error('❌ 7.1 Support Officer should be denied sensitive document download');
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('denied') || err.message?.toLowerCase().includes('unauthorized') || err.message?.toLowerCase().includes('forbidden') || err.message?.includes('Missing')) {
      console.log('✅ 7.1 Staff member without documents.view_sensitive denied access to confidential document');
    } else {
      throw err;
    }
  }

  // 7.2 Verification Officer (has documents.view_sensitive) allowed download
  const downloadedDoc = await documentService.getDocumentFile(verifierUser, testDocId);
  if (downloadedDoc.fileBuffer && downloadedDoc.document.id === testDocId) {
    console.log(`✅ 7.2 Verification Officer with documents.view_sensitive retrieved confidential document (${downloadedDoc.fileBuffer.length} bytes)`);
  } else {
    throw new Error('❌ 7.2 Verification Officer failed to retrieve confidential document');
  }

  // 7.3 Verify DOCUMENT_VIEWED audit trail record was generated
  const recentLogsAfterDocView = await auditRepository.listAll(5);
  const docViewEvent = recentLogsAfterDocView.find((l) => l.action === 'DOCUMENT_VIEWED');
  if (docViewEvent && docViewEvent.objectId === testDocId && docViewEvent.actor?.id === verifierUser.id) {
    console.log(`✅ 7.3 DOCUMENT_VIEWED security event recorded with actor, document ID, and metadata`);
  } else {
    throw new Error('❌ 7.3 DOCUMENT_VIEWED was not logged');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 8: DOCUMENT METADATA VS SENSITIVE CONTENT ISOLATION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: METADATA VS SENSITIVE ACCESS ISOLATION ---');

  // 8.1 Staff without documents.view_metadata (supportUser) blocked from listing property docs
  try {
    await documentService.listPropertyDocuments(supportUser, testProp.id);
    throw new Error('❌ 8.1 Support Officer without documents.view_metadata should be blocked');
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('denied') || err.message?.toLowerCase().includes('unauthorized') || err.message?.toLowerCase().includes('forbidden') || err.message?.includes('Missing')) {
      console.log('✅ 8.1 Staff without documents.view_metadata denied property documents list');
    } else {
      throw err;
    }
  }

  // 8.2 Compliance Auditor (has documents.view_metadata, but lacks documents.view_sensitive)
  // Can list documents:
  const propDocsList = await documentService.listPropertyDocuments(auditorUser, testProp.id);
  if (propDocsList.length > 0) {
    console.log(`✅ 8.2 Compliance Auditor with documents.view_metadata listed ${propDocsList.length} documents`);
  } else {
    throw new Error('❌ 8.2 Listing property documents failed');
  }

  // But cannot download the sensitive file:
  try {
    await documentService.getDocumentFile(auditorUser, testDocId);
    throw new Error('❌ 8.3 Compliance Auditor without documents.view_sensitive should not download raw file');
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('denied') || err.message?.toLowerCase().includes('unauthorized') || err.message?.toLowerCase().includes('forbidden') || err.message?.includes('Missing')) {
      console.log('✅ 8.3 Compliance Auditor successfully blocked from downloading raw confidential file');
    } else {
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 9: DOCUMENT REVIEW AUTHORIZATION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 9: DOCUMENT REVIEW PERMISSION ENFORCEMENT ---');

  // 9.1 Compliance Auditor (lacks documents.review) blocked from reviewing
  try {
    await documentService.reviewDocument(auditorUser, testProp.id, testDocId, 'APPROVED', 'Audit check');
    throw new Error('❌ 9.1 Staff without documents.review should be blocked');
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('denied') || err.message?.toLowerCase().includes('unauthorized') || err.message?.toLowerCase().includes('forbidden') || err.message?.includes('Missing')) {
      console.log('✅ 9.1 Staff without documents.review blocked from updating document status');
    } else {
      throw err;
    }
  }

  // 9.2 Verification Officer (has documents.review) succeeds
  const reviewedDoc = await documentService.reviewDocument(
    verifierUser,
    testProp.id,
    testDocId,
    'APPROVED',
    'Passed legal registry review'
  );
  if (reviewedDoc.status === 'APPROVED') {
    console.log('✅ 9.2 Verification Officer with documents.review successfully approved document');
  } else {
    throw new Error('❌ 9.2 Document review failed');
  }

  // Verify full chain remains cryptographically valid at test completion
  const finalVerification = await auditRepository.verifyIntegrity();
  if (finalVerification.isValid) {
    console.log(`\n✅ FINAL AUDIT CHAIN VERIFICATION: Unbroken integrity across all ${finalVerification.totalLogs} events`);
  } else {
    throw new Error(`❌ Final integrity verification failed: ${finalVerification.error}`);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 6 AUDIT & SENSITIVE DATA TESTS PASSED (100%)');
  console.log('================================================================');
}

runPhase6Tests().catch((err) => {
  console.error('\n❌ PHASE 6 TEST FAILURE:', err);
  process.exit(1);
});
