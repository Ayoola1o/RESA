import { propertyService } from './property-service';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  User,
  PropertyDocument,
  DocumentType,
  DocumentStatus,
  Property,
  UserDocument,
  UserDocumentType,
  UserDocumentStatus,
} from '@/types/prophunta';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';
import { staffAuthorizationService } from './staff-authorization-service';
import { getDb, saveDb } from '../db/store';
import { supabaseStorageService } from './supabase-storage-service';
import { verificationAssignmentService } from './verification-assignment-service';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { userRepository } from '../repositories/user-repository';

const VAULT_DIR = path.join(process.cwd(), '.data', 'vault', 'documents');

function documentClient() {
  const client = getSupabaseAdminClient();
  if (!client && process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase server credentials are missing; refusing to use temporary local document storage.');
  }
  return client;
}

function mapUserDocument(row: Record<string, any>): UserDocument {
  const review = row.review_data && typeof row.review_data === 'object' ? row.review_data : {};
  return {
    id: row.id, userId: row.user_id, documentType: row.document_type, title: row.title,
    fileName: row.file_name, fileReference: row.file_reference, fileSize: Number(row.file_size),
    mimeType: row.mime_type, status: row.status, uploadedAt: row.uploaded_at,
    reviewedAt: review.reviewedAt, reviewedBy: review.reviewedBy, reviewNotes: review.reviewNotes,
  } as UserDocument;
}

function userDocumentRow(document: UserDocument) {
  return {
    id: document.id, user_id: document.userId, document_type: document.documentType,
    title: document.title, file_name: document.fileName, file_reference: document.fileReference,
    file_size: document.fileSize, mime_type: document.mimeType, status: document.status,
    review_data: {}, uploaded_at: document.uploadedAt,
  };
}

// Ensure vault directory exists
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

export class DocumentService {
  /**
   * Uploads a confidential title/verification document to access-controlled vault storage.
   */
  async uploadDocument(
    user: User,
    propertyId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    documentType: DocumentType
  ): Promise<PropertyDocument> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    // Access control check
    const isOwner = property.ownerId === user.id;
    const isAgent = await propertyService.canManageListing(user.id, property);
    if (!isOwner && !isAgent) {
      throw new Error('Unauthorized to upload confidential documentation for this property');
    }

    if (!fileBuffer?.length || fileBuffer.length > 10 * 1024 * 1024) {
      throw new Error('Verification documents must be between 1 byte and 10 MB.');
    }
    const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
    const normalizedMimeType = mimeType.toLowerCase();
    if (!allowedMimeTypes.has(normalizedMimeType)) {
      throw new Error('Supported verification documents are PDF, JPG, PNG, and WEBP.');
    }

    const safeUUID = randomUUID().replace(/-/g, '');
    const docId = `doc_${Date.now()}_${safeUUID.slice(0, 8)}`;
    const extensionByMime: Record<string, string> = {
      'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
    };
    const diskFileName = `doc_${Date.now()}_${safeUUID}${extensionByMime[normalizedMimeType]}`;
    const storageReference = await supabaseStorageService.upload(
      'verification-files', `properties/${propertyId}/${docId}${extensionByMime[normalizedMimeType]}`,
      fileBuffer, normalizedMimeType
    );
    if (!storageReference) fs.writeFileSync(path.join(VAULT_DIR, diskFileName), fileBuffer);

    const newDoc: PropertyDocument = {
      id: docId,
      propertyId,
      uploadedBy: user.id,
      documentType,
      fileName: originalName,
      fileReference: storageReference || diskFileName,
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
      mimeType: normalizedMimeType,
      sizeBytes: fileBuffer.length,
    };

    const currentDocs = property.documents || [];
    currentDocs.push(newDoc);
    await propertyRepository.update(propertyId, { documents: currentDocs });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DOCUMENT_UPLOADED',
      objectType: 'DOCUMENT',
      objectId: docId,
      result: 'SUCCESS',
      metadata: {
        propertyId,
        documentType,
        fileName: originalName,
        sizeBytes: fileBuffer.length,
      },
    });

    return newDoc;
  }

  /**
   * Access-controlled retrieval: Only Admin, Owner, or Authorized Agent can download or inspect documents.
   * Supports both PropertyDocument and UserDocument.
   */
  async getDocumentFile(
    user: User,
    documentId: string
  ): Promise<{ document: PropertyDocument | UserDocument; fileBuffer: Buffer; property?: Property }> {
    // 1. Check Property Documents
    const allProps = await propertyRepository.listAll();
    let foundProperty: Property | null = null;
    let foundDoc: PropertyDocument | null = null;

    for (const prop of allProps) {
      const doc = (prop.documents || []).find((d) => d.id === documentId);
      if (doc) {
        foundProperty = prop;
        foundDoc = doc;
        break;
      }
    }

    if (foundProperty && foundDoc) {
      const isOwner = foundProperty.ownerId === user.id;
      const isAgent = await propertyService.canManageListing(user.id, foundProperty);
      const isAdmin = user.role === 'ADMIN';

      if (!isOwner && !isAgent && !isAdmin) {
        throw new Error('Unauthorized: Confidential property document access denied');
      }

      if (isAdmin) {
        await staffAuthorizationService.assertPermission(user, 'documents.view_sensitive');
        await verificationAssignmentService.assertAssigned(user, foundProperty.id, ['OWNERSHIP']);
      }

      const fileBuffer = await supabaseStorageService.download(foundDoc.fileReference)
        ?? (fs.existsSync(path.join(VAULT_DIR, foundDoc.fileReference))
          ? fs.readFileSync(path.join(VAULT_DIR, foundDoc.fileReference))
          : null);
      if (!fileBuffer) throw new Error('Document file missing from secure vault');

      if (isAdmin) {
        await auditRepository.create({
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: 'DOCUMENT_VIEWED',
          objectType: 'DOCUMENT',
          objectId: foundDoc.id,
          result: 'SUCCESS',
          metadata: {
            propertyId: foundProperty.id,
            fileName: foundDoc.fileName,
            documentType: foundDoc.documentType,
            sizeBytes: fileBuffer.length,
          },
        });
      }

      return { document: foundDoc, fileBuffer, property: foundProperty };
    }

    // 2. Check User Credential Documents
    const client = documentClient();
    let userDoc: UserDocument | undefined;
    if (client) {
      const { data, error } = await client.from('user_documents').select('*').eq('id', documentId).maybeSingle();
      if (error) throw new Error(`Could not load credential document: ${error.message}`);
      userDoc = data ? mapUserDocument(data) : undefined;
    } else {
      const db = getDb();
      userDoc = (db.userDocuments || []).find((d) => d.id === documentId);
    }
    if (userDoc) {
      const isOwner = userDoc.userId === user.id;
      const isAdmin = user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        throw new Error('Unauthorized: Confidential user credential document access denied');
      }

      if (isAdmin) {
        await staffAuthorizationService.assertPermission(user, 'documents.view_sensitive');
        await verificationAssignmentService.assertUserAssigned(user, userDoc.userId);
      }
      const fileBuffer = await supabaseStorageService.download(userDoc.fileReference)
        ?? (fs.existsSync(path.join(VAULT_DIR, userDoc.fileReference))
          ? fs.readFileSync(path.join(VAULT_DIR, userDoc.fileReference))
          : null);
      if (!fileBuffer) throw new Error('Credential document missing from secure vault');

      await auditRepository.create({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'DOCUMENT_VIEWED',
        objectType: 'DOCUMENT',
        objectId: userDoc.id,
        result: 'SUCCESS',
        metadata: {
          targetUserId: userDoc.userId,
          fileName: userDoc.fileName,
          documentType: userDoc.documentType,
          sizeBytes: fileBuffer.length,
        },
      });

      return { document: userDoc, fileBuffer };
    }

    throw new Error('Document record not found');
  }

  /**
   * Uploads an authenticated user credential/identity document to private disk vault.
   */
  async uploadUserDocument(
    user: User,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    documentType: UserDocumentType,
    title?: string
  ): Promise<UserDocument> {
    const supportedDocumentTypes = new Set<UserDocumentType>([
      'GOVERNMENT_ID', 'AGENT_CREDENTIAL', 'PROOF_OF_INCOME',
      'PROOF_OF_RESIDENCE', 'EMPLOYMENT_REFERENCE', 'OTHER',
    ]);
    if (!supportedDocumentTypes.has(documentType)) throw new Error('Unsupported verification document type.');
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Empty file content');
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      throw new Error('File exceeds maximum allowable size of 10MB');
    }

    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new Error('Unsupported format. Only PDF, JPG, and PNG are permitted.');
    }

    const safeUUID = randomUUID().replace(/-/g, '');
    const docId = `udoc_${Date.now()}_${safeUUID.slice(0, 8)}`;
    const normalizedMimeType = mimeType.toLowerCase();
    const extensionByMime: Record<string, string> = {
      'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
    };
    const diskFileName = `usr_${user.id}_${Date.now()}_${safeUUID.slice(0, 8)}${extensionByMime[normalizedMimeType]}`;
    const storageReference = await supabaseStorageService.upload(
      'verification-files', `users/${user.id}/${docId}${extensionByMime[normalizedMimeType]}`,
      fileBuffer, normalizedMimeType
    );
    if (!storageReference) fs.writeFileSync(path.join(VAULT_DIR, diskFileName), fileBuffer);

    const newDoc: UserDocument = {
      id: docId,
      userId: user.id,
      documentType,
      title: title || originalName,
      fileName: originalName,
      fileReference: storageReference || diskFileName,
      fileSize: fileBuffer.length,
      mimeType: normalizedMimeType,
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
    };

    const client = documentClient();
    if (client) {
      const { error } = await client.from('user_documents').insert(userDocumentRow(newDoc));
      if (error) {
        if (storageReference) await supabaseStorageService.remove(storageReference).catch(() => undefined);
        throw new Error(`Could not save verification document: ${error.message}`);
      }
    } else {
      const db = getDb();
      db.userDocuments ||= [];
      db.userDocuments.push(newDoc);
      saveDb(db);
    }
    const current = await userRepository.findById(user.id);
    if (current && current.kycStatus === 'NOT_SUBMITTED') {
      await userRepository.update(user.id, { kycStatus: 'PENDING', verificationStatus: 'PENDING', kycSubmittedAt: newDoc.uploadedAt });
    }
    await verificationAssignmentService.createUserIdentityTask(user.id, user);

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_DOCUMENT_UPLOADED' as any,
      objectType: 'DOCUMENT',
      objectId: docId,
      result: 'SUCCESS',
      metadata: {
        documentType,
        fileName: originalName,
        sizeBytes: fileBuffer.length,
      },
    });

    return newDoc;
  }

  /**
   * Lists credential documents for the authenticated user, or for an admin reviewing a target user.
   */
  async listUserDocuments(user: User, targetUserId?: string): Promise<UserDocument[]> {
    const target = targetUserId || user.id;

    if (target !== user.id && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to inspect other users credential documents');
    }
    const client = documentClient();
    if (client) {
      if (target !== user.id) await verificationAssignmentService.assertUserAssigned(user, target);
      const { data, error } = await client.from('user_documents').select('*').eq('user_id', target).order('uploaded_at', { ascending: false });
      if (error) throw new Error(`Could not load verification documents: ${error.message}`);
      return (data || []).map(mapUserDocument);
    }
    const db = getDb();
    return (db.userDocuments || []).filter((d) => d.userId === target);
  }

  async reviewUserDocument(
    adminUser: User,
    documentId: string,
    status: Extract<UserDocumentStatus, 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'CHANGES_REQUIRED'>,
    reviewNotes?: string
  ): Promise<UserDocument> {
    if (adminUser.role !== 'ADMIN') throw new Error('Only administrators can review verification files.');
    await staffAuthorizationService.assertPermission(adminUser, 'documents.review');
    await staffAuthorizationService.assertPermission(adminUser, 'documents.view_sensitive');

    const client = documentClient();
    let document: UserDocument | undefined;
    if (client) {
      const { data, error } = await client.from('user_documents').select('*').eq('id', documentId).maybeSingle();
      if (error) throw new Error(`Could not load verification document: ${error.message}`);
      document = data ? mapUserDocument(data) : undefined;
    } else {
      const db = getDb();
      document = (db.userDocuments || []).find((item) => item.id === documentId);
    }
    if (!document) throw new Error('User verification document not found.');
    await verificationAssignmentService.assertUserAssigned(adminUser, document.userId);
    if ((status === 'REJECTED' || status === 'CHANGES_REQUIRED') && !reviewNotes?.trim()) {
      throw new Error('A reason is required when rejecting a document or requesting changes.');
    }

    const reviewed = {
      ...document,
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminUser.id,
      reviewNotes: reviewNotes?.trim() || undefined,
    };
    if (client) {
      const { error } = await client.from('user_documents').update({
        status, review_data: { reviewedAt: reviewed.reviewedAt, reviewedBy: reviewed.reviewedBy, reviewNotes: reviewed.reviewNotes },
      }).eq('id', documentId);
      if (error) throw new Error(`Could not save document review: ${error.message}`);
    } else {
      const db = getDb();
      db.userDocuments = (db.userDocuments || []).map((item) => item.id === documentId ? reviewed : item);
      saveDb(db);
    }
    await verificationAssignmentService.recordDocumentReview({ documentId, subjectType: 'USER', subjectId: document.userId, reviewerId: adminUser.id, previousStatus: document.status, newStatus: status, reason: reviewNotes });

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'DOCUMENT_REVIEWED',
      objectType: 'DOCUMENT',
      objectId: documentId,
      result: 'SUCCESS',
      metadata: { targetUserId: document.userId, documentType: document.documentType, status, reviewNotes },
    });
    return reviewed;
  }

  /**
   * Deletes a user credential document and unlinks its physical file.
   */
  async deleteUserDocument(user: User, documentId: string): Promise<boolean> {
    const client = documentClient();
    let doc: UserDocument | undefined;
    if (client) {
      const { data, error } = await client.from('user_documents').select('*').eq('id', documentId).maybeSingle();
      if (error) throw new Error(`Could not load verification document: ${error.message}`);
      doc = data ? mapUserDocument(data) : undefined;
    } else {
      const db = getDb();
      doc = (db.userDocuments || []).find((d) => d.id === documentId);
    }
    if (!doc) return false;

    const isOwner = doc.userId === user.id;
    if (!isOwner) {
      throw new Error('Unauthorized to delete this credential document');
    }

    if (supabaseStorageService.isSupabaseReference(doc.fileReference)) {
      await supabaseStorageService.remove(doc.fileReference);
    } else {
      const diskPath = path.join(VAULT_DIR, doc.fileReference);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (err) {
          console.error('Failed to unlink user vault file:', err);
        }
      }
    }

    if (client) {
      const { error } = await client.from('user_documents').delete().eq('id', documentId);
      if (error) throw new Error(`Could not delete verification document: ${error.message}`);
    } else {
      const db = getDb();
      db.userDocuments = (db.userDocuments || []).filter((d) => d.id !== documentId);
      saveDb(db);
    }

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_DOCUMENT_DELETED' as any,
      objectType: 'DOCUMENT',
      objectId: documentId,
      result: 'SUCCESS',
      metadata: { fileName: doc.fileName },
    });

    return true;
  }

  /**
   * Verification Officer audits document: APPROVED, REJECTED, CHANGES_REQUIRED.
   */
  async reviewDocument(
    adminUser: User,
    propertyId: string,
    documentId: string,
    status: DocumentStatus,
    reviewNotes?: string
  ): Promise<PropertyDocument> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Verification Officers can audit property documentation');
    }

    await staffAuthorizationService.assertPermission(adminUser, 'documents.review');
    await verificationAssignmentService.assertAssigned(adminUser, propertyId, ['OWNERSHIP']);
    if ((status === 'REJECTED' || status === 'CHANGES_REQUIRED') && !reviewNotes?.trim()) {
      throw new Error('A reason is required when rejecting a document or requesting changes.');
    }

    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const docs = property.documents || [];
    const docIdx = docs.findIndex((d) => d.id === documentId);
    if (docIdx === -1) throw new Error('Document not found on this property');

    const priorStatus = docs[docIdx].status;
    docs[docIdx] = {
      ...docs[docIdx],
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminUser.id,
      reviewNotes: reviewNotes || undefined,
    };

    await propertyRepository.update(propertyId, { documents: docs });
    await verificationAssignmentService.recordDocumentReview({ documentId, subjectType: 'PROPERTY', subjectId: propertyId, reviewerId: adminUser.id, previousStatus: priorStatus, newStatus: status, reason: reviewNotes });

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'DOCUMENT_REVIEWED',
      objectType: 'DOCUMENT',
      objectId: documentId,
      result: 'SUCCESS',
      metadata: { propertyId, status, reviewNotes },
    });

    return docs[docIdx];
  }

  /**
   * Deletes document record and scrubs file from disk vault.
   */
  async deleteDocument(user: User, propertyId: string, documentId: string): Promise<boolean> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const isOwner = property.ownerId === user.id;
    const isAgent = await propertyService.canManageListing(user.id, property);
    if (!isOwner && !isAgent) {
      throw new Error('Unauthorized to delete documentation for this property');
    }

    const docs = property.documents || [];
    const doc = docs.find((d) => d.id === documentId);
    if (!doc) return false;

    // Delete disk file
    if (supabaseStorageService.isSupabaseReference(doc.fileReference)) {
      await supabaseStorageService.remove(doc.fileReference);
    } else {
      const diskPath = path.join(VAULT_DIR, doc.fileReference);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (err) {
          console.error('Failed to unlink vault file:', err);
        }
      }
    }

    const updatedDocs = docs.filter((d) => d.id !== documentId);
    await propertyRepository.update(propertyId, { documents: updatedDocs });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DOCUMENT_DELETED',
      objectType: 'DOCUMENT',
      objectId: documentId,
      result: 'SUCCESS',
      metadata: { propertyId, fileName: doc.fileName },
    });

    return true;
  }

  /**
   * Retrieves documents list for authorized users.
   */
  async listPropertyDocuments(user: User, propertyId: string): Promise<PropertyDocument[]> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const isOwner = property.ownerId === user.id;
    const isAgent = await propertyService.canManageListing(user.id, property);
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAgent && !isAdmin) {
      throw new Error('Unauthorized to view documents for this property');
    }

    if (isAdmin) {
      await staffAuthorizationService.assertPermission(user, 'documents.view_metadata');
      await verificationAssignmentService.assertAssigned(user, propertyId, ['OWNERSHIP']);
    }

    return property.documents || [];
  }

  getVaultFilePath(fileReference: string): string {
    return path.join(VAULT_DIR, fileReference);
  }
}

export const documentService = new DocumentService();
