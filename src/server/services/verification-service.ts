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

    const res = await this.updateChecklist(adminUser, propertyId, {
      ownerIdentityStatus: 'PASSED',
      locationStatus: 'PASSED',
      authorityDocumentStatus: 'PASSED',
      availabilityStatus: 'PASSED',
      mediaStatus: 'PASSED',
      inspectionStatus: 'PASSED',
      overallStatus: 'PASSED',
      reviewNotes: notes || 'All verification parameters audited and passed.',
    });

    await propertyRepository.update(propertyId, {
      listingStatus: 'VERIFIED',
      publishedAt: new Date().toISOString(),
    });

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VERIFICATION_APPROVED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { notes },
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
