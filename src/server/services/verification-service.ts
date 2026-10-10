import { User, PropertyVerification, VerificationSubStatus, VerificationOverallStatus } from '@/types/prophunta';
import { verificationRepository } from '../repositories/verification-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';

export class VerificationService {
  async getVerification(propertyId: string): Promise<PropertyVerification | null> {
    return verificationRepository.findByPropertyId(propertyId);
  }

  async listQueue(): Promise<{ propertyId: string; title: string; verification?: PropertyVerification }[]> {
    return verificationRepository.listPending();
  }

  async updateChecklist(
    adminUser: User,
    propertyId: string,
    updates: {
      ownerIdentityStatus?: VerificationSubStatus;
      locationStatus?: VerificationSubStatus;
      authorityDocumentStatus?: VerificationSubStatus;
      availabilityStatus?: VerificationSubStatus;
      mediaStatus?: VerificationSubStatus;
      inspectionStatus?: VerificationSubStatus;
      overallStatus?: VerificationOverallStatus;
      reviewNotes?: string;
    }
  ): Promise<PropertyVerification> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrator / Verification Officers can perform verification reviews');
    }

    const current = (await verificationRepository.findByPropertyId(propertyId)) || {
      verificationId: `ver_${Date.now()}`,
      propertyId,
      ownerIdentityStatus: 'PENDING',
      locationStatus: 'PENDING',
      authorityDocumentStatus: 'PENDING',
      availabilityStatus: 'PENDING',
      mediaStatus: 'PENDING',
      inspectionStatus: 'PENDING',
      overallStatus: 'IN_REVIEW',
    };

    const now = new Date().toISOString();
    const updated: PropertyVerification = {
      ...current,
      ...updates,
      propertyId,
      reviewerId: adminUser.id,
      reviewedAt: now,
      lastVerifiedAt: updates.overallStatus === 'PASSED' ? now : current.lastVerifiedAt,
    };

    const res = await verificationRepository.upsert(updated);

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VERIFICATION_UPDATED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { updates },
    });

    return res;
  }

  async approveVerification(adminUser: User, propertyId: string, notes: string): Promise<PropertyVerification> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrator / Verification Officers can approve listings');
    }

    if (!notes || notes.trim().length < 5) {
      throw new Error('Reviewer compliance notes (minimum 5 characters) are required for audit trail.');
    }

    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const current = await verificationRepository.findByPropertyId(propertyId);
    if (!current) {
      throw new Error('Cannot approve listing: No verification record initiated for this property.');
    }

    // Require explicit outcomes for required checks: identity, location, authority documents, availability, media and inspection
    const requiredChecks = [
      { name: 'Owner/Host Identity', status: current.ownerIdentityStatus },
      { name: 'Location & Cadaster', status: current.locationStatus },
      { name: 'Authority Documents', status: current.authorityDocumentStatus },
      { name: 'Availability & Vacancy', status: current.availabilityStatus },
      { name: 'Media Authenticity', status: current.mediaStatus },
      { name: 'Physical Inspection', status: current.inspectionStatus },
    ];

    const incompleteChecks = requiredChecks.filter((c) => c.status !== 'PASSED');
    if (incompleteChecks.length > 0) {
      const failedNames = incompleteChecks.map((c) => `${c.name} (${c.status})`).join(', ');
      throw new Error(
        `Approval rejected: Verification checks incomplete or unverified. All 6 parameters must be explicitly PASSED. Incomplete: ${failedNames}.`
      );
    }

    // Keep document review and overall property verification states consistent
    const approvedDocs = (property.documents || []).filter((d) => d.status === 'APPROVED');
    if (approvedDocs.length === 0) {
      throw new Error(
        'Approval rejected: Property authority verification requires at least one reviewed and APPROVED title document on file.'
      );
    }

    const TRUST_DISCLAIMER =
      'PropHunta Verified Trust Badge certifies that independent compliance review of host KYC, cadastral coordinates, physical inspection evidence, and submitted land registry/authority documentation passed platform verification criteria. This review constitutes operational due diligence and does not represent an official legal guarantee or warranty of statutory title under the Land Use Act.';

    const now = new Date().toISOString();
    const approvedVerification: PropertyVerification = {
      ...current,
      overallStatus: 'PASSED',
      reviewerId: adminUser.id,
      reviewedAt: now,
      lastVerifiedAt: now,
      reviewNotes: notes.trim(),
      trustDisclaimer: TRUST_DISCLAIMER,
    };

    const res = await verificationRepository.upsert(approvedVerification);

    await propertyRepository.update(propertyId, {
      listingStatus: 'VERIFIED',
      publishedAt: property.publishedAt || now,
      verification: approvedVerification,
    });

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VERIFICATION_APPROVED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: {
        reviewerId: adminUser.id,
        notes,
        approvedDocsCount: approvedDocs.length,
      },
    });

    return res;
  }

  async rejectVerification(adminUser: User, propertyId: string, notes: string): Promise<PropertyVerification> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrator / Verification Officers can reject listings');
    }

    const res = await this.updateChecklist(adminUser, propertyId, {
      overallStatus: 'FAILED',
      reviewNotes: notes || 'Listing rejected due to non-compliance.',
    });

    await propertyRepository.update(propertyId, {
      listingStatus: 'REJECTED',
    });

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VERIFICATION_REJECTED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { notes },
    });

    return res;
  }

  async requestChanges(adminUser: User, propertyId: string, notes: string): Promise<PropertyVerification> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrator / Verification Officers can request changes');
    }

    const res = await this.updateChecklist(adminUser, propertyId, {
      overallStatus: 'CHANGES_REQUIRED',
      reviewNotes: notes || 'Additional documentation or clarification required.',
    });

    await propertyRepository.update(propertyId, {
      listingStatus: 'CHANGES_REQUIRED',
    });

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VERIFICATION_CHANGES_REQUESTED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { notes },
    });

    return res;
  }

  async approveProperty(adminUser: User, propertyId: string, notes: string): Promise<PropertyVerification> {
    return this.approveVerification(adminUser, propertyId, notes);
  }

  async rejectProperty(adminUser: User, propertyId: string, notes: string): Promise<PropertyVerification> {
    return this.rejectVerification(adminUser, propertyId, notes);
  }
}

export const verificationService = new VerificationService();
