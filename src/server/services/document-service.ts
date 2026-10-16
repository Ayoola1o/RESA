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

const VAULT_DIR = path.join(process.cwd(), '.data', 'vault', 'documents');

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
    const isAgent = property.authorizedAgentId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAgent && !isAdmin) {
      throw new Error('Unauthorized to upload confidential documentation for this property');
    }

    // Sanitize extension and generate collision-resistant fileReference
    const ext = path.extname(originalName) || '.pdf';
    const safeUUID = randomUUID().replace(/-/g, '');
    const diskFileName = `doc_${Date.now()}_${safeUUID}${ext}`;
    const diskPath = path.join(VAULT_DIR, diskFileName);

    // Save physical file
    fs.writeFileSync(diskPath, fileBuffer);

    const docId = `doc_${Date.now()}_${safeUUID.slice(0, 8)}`;
    const newDoc: PropertyDocument = {
      id: docId,
      propertyId,
      uploadedBy: user.id,
      documentType,
      fileName: originalName,
      fileReference: diskFileName,
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
      mimeType: mimeType || 'application/pdf',
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
      const isAgent = foundProperty.authorizedAgentId === user.id;
      const isAdmin = user.role === 'ADMIN';

      if (!isOwner && !isAgent && !isAdmin) {
        throw new Error('Unauthorized: Confidential property document access denied');
      }

      if (isAdmin) {
        await staffAuthorizationService.assertPermission(user.id, 'documents.view_sensitive');
      }

      const diskPath = path.join(VAULT_DIR, foundDoc.fileReference);
      if (!fs.existsSync(diskPath)) {
        throw new Error('Physical document file missing from secure vault');
      }

      const fileBuffer = fs.readFileSync(diskPath);

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
    const db = getDb();
    const userDoc = (db.userDocuments || []).find((d) => d.id === documentId);
    if (userDoc) {
      const isOwner = userDoc.userId === user.id;
      const isAdmin = user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        throw new Error('Unauthorized: Confidential user credential document access denied');
      }

      const diskPath = path.join(VAULT_DIR, userDoc.fileReference);
      if (!fs.existsSync(diskPath)) {
        throw new Error('Physical credential document missing from secure vault');
      }

      const fileBuffer = fs.readFileSync(diskPath);

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

    const ext = path.extname(originalName) || (mimeType.includes('pdf') ? '.pdf' : '.jpg');
    const safeUUID = randomUUID().replace(/-/g, '');
    const diskFileName = `usr_${user.id}_${Date.now()}_${safeUUID.slice(0, 8)}${ext}`;
    const diskPath = path.join(VAULT_DIR, diskFileName);

    fs.writeFileSync(diskPath, fileBuffer);

    const docId = `udoc_${Date.now()}_${safeUUID.slice(0, 8)}`;
    const newDoc: UserDocument = {
      id: docId,
      userId: user.id,
      documentType,
      title: title || originalName,
      fileName: originalName,
      fileReference: diskFileName,
      fileSize: fileBuffer.length,
      mimeType,
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
    };

    const db = getDb();
    if (!db.userDocuments) {
      db.userDocuments = [];
    }
    db.userDocuments.push(newDoc);
    saveDb(db);

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
    const db = getDb();
    const target = targetUserId || user.id;

    if (target !== user.id && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to inspect other users credential documents');
    }

    return (db.userDocuments || []).filter((d) => d.userId === target);
  }

  /**
   * Deletes a user credential document and unlinks its physical file.
   */
  async deleteUserDocument(user: User, documentId: string): Promise<boolean> {
    const db = getDb();
    const doc = (db.userDocuments || []).find((d) => d.id === documentId);
    if (!doc) return false;

    const isOwner = doc.userId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized to delete this credential document');
    }

    const diskPath = path.join(VAULT_DIR, doc.fileReference);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (err) {
        console.error('Failed to unlink user vault file:', err);
      }
    }

    db.userDocuments = (db.userDocuments || []).filter((d) => d.id !== documentId);
    saveDb(db);

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

    await staffAuthorizationService.assertPermission(adminUser.id, 'documents.review');

    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const docs = property.documents || [];
    const docIdx = docs.findIndex((d) => d.id === documentId);
    if (docIdx === -1) throw new Error('Document not found on this property');

    docs[docIdx] = {
      ...docs[docIdx],
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminUser.id,
      reviewNotes: reviewNotes || undefined,
    };

    await propertyRepository.update(propertyId, { documents: docs });

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
    const isAgent = property.authorizedAgentId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAgent && !isAdmin) {
      throw new Error('Unauthorized to delete documentation for this property');
    }

    const docs = property.documents || [];
    const doc = docs.find((d) => d.id === documentId);
    if (!doc) return false;

    // Delete disk file
    const diskPath = path.join(VAULT_DIR, doc.fileReference);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (err) {
        console.error('Failed to unlink vault file:', err);
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
    const isAgent = property.authorizedAgentId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAgent && !isAdmin) {
      throw new Error('Unauthorized to view documents for this property');
    }

    if (isAdmin) {
      await staffAuthorizationService.assertPermission(user.id, 'documents.view_metadata');
    }

    return property.documents || [];
  }

  getVaultFilePath(fileReference: string): string {
    return path.join(VAULT_DIR, fileReference);
  }
}

export const documentService = new DocumentService();
