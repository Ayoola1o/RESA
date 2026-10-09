import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { User, PropertyDocument, DocumentType, DocumentStatus, Property } from '@/types/prophunta';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';

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
   */
  async getDocumentFile(
    user: User,
    documentId: string
  ): Promise<{ document: PropertyDocument; fileBuffer: Buffer; property: Property }> {
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

    if (!foundProperty || !foundDoc) {
      throw new Error('Document record not found');
    }

    // Access control: Not publicly accessible by default
    const isOwner = foundProperty.ownerId === user.id;
    const isAgent = foundProperty.authorizedAgentId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAgent && !isAdmin) {
      throw new Error('Unauthorized: Confidential property document access denied');
    }

    const diskPath = path.join(VAULT_DIR, foundDoc.fileReference);
    if (!fs.existsSync(diskPath)) {
      throw new Error('Physical document file missing from secure vault');
    }

    const fileBuffer = fs.readFileSync(diskPath);
    return { document: foundDoc, fileBuffer, property: foundProperty };
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

    return property.documents || [];
  }

  getVaultFilePath(fileReference: string): string {
    return path.join(VAULT_DIR, fileReference);
  }
}

export const documentService = new DocumentService();
