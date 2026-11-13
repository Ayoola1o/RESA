import { staffAuthorizationService } from './staff-authorization-service';
import { User, PropertyVerification, VerificationSubStatus, VerificationOverallStatus } from '@/types/prophunta';
import { verificationRepository } from '../repositories/verification-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';
import { userRepository } from '../repositories/user-repository';
import { notificationService } from './notification-service';
import { verificationAssignmentService } from './verification-assignment-service';

export class VerificationService {
  private async notifyPropertyStakeholders(propertyId: string, title: string, message: string) {
    const property = await propertyRepository.findById(propertyId);
    if (!property) return;
    const recipientIds = [...new Set([property.ownerId, property.authorizedAgentId].filter((id): id is string => Boolean(id)))];
    for (const recipientId of recipientIds) {
      if (await userRepository.findById(recipientId)) {
        await notificationService.createNotification(recipientId, { title, message, type: 'VERIFICATION', link: `/property/${propertyId}` });
      }
    }
  }

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
    if (updates.overallStatus === 'PASSED') throw new Error('Final approval must use the approval workflow after all checks are complete.');
    if (updates.overallStatus === 'FAILED') await staffAuthorizationService.requirePermission(adminUser, 'verification.reject', { resourceId: propertyId });
    const taskByField: Array<[keyof typeof updates, 'IDENTITY' | 'LOCATION' | 'OWNERSHIP' | 'AVAILABILITY' | 'MEDIA' | 'INSPECTION']> = [
      ['ownerIdentityStatus', 'IDENTITY'], ['locationStatus', 'LOCATION'], ['authorityDocumentStatus', 'OWNERSHIP'],
      ['availabilityStatus', 'AVAILABILITY'], ['mediaStatus', 'MEDIA'], ['inspectionStatus', 'INSPECTION'],
    ];
    for (const [field, taskType] of taskByField) {
      if (updates[field] !== undefined) {
        const permission = taskType === 'MEDIA' ? 'properties.moderate' : taskType === 'INSPECTION' ? 'inspections.update' : 'verification.review';
        await verificationAssignmentService.assertTaskAssigned(adminUser, permission, 'PROPERTY', propertyId, [taskType]);
      }
    }
    if (!taskByField.some(([field]) => updates[field] !== undefined)) await verificationAssignmentService.assertAssigned(adminUser, propertyId);

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
      lastVerifiedAt: current.lastVerifiedAt,
    };

    const res = await verificationRepository.upsert(updated);
    for (const [field, taskType] of taskByField) {
      const status = updates[field];
      if (status && !['PENDING', 'IN_REVIEW', 'NOT_REVIEWED'].includes(status)) {
        await verificationAssignmentService.completeTask(adminUser, propertyId, taskType, updates.reviewNotes || `Verification check marked ${status}.`);
      }
    }

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
    await staffAuthorizationService.requirePermission(adminUser, 'verification.approve', { resourceId: propertyId });
    await verificationAssignmentService.assertAssigned(adminUser, propertyId);

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
    const approvedDocs = (property.documents || []).filter((d) => d.status === 'APPROVED' && [
      'DEED_OF_ASSIGNMENT', 'CERTIFICATE_OF_OCCUPANCY', 'GOVERNORS_CONSENT', 'LETTER_OF_AUTHORITY', 'RECEIPT_OF_PURCHASE',
    ].includes(d.documentType));
    if (approvedDocs.length === 0) {
      throw new Error(
        'Approval rejected: Property authority verification requires at least one reviewed and APPROVED title document on file.'
      );
    }
    if (property.moderationStatus !== 'APPROVED') throw new Error('Approval rejected: Property moderation must be approved first.');

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
    await this.notifyPropertyStakeholders(propertyId, 'Property approved', `${property.title} passed verification and is now eligible for the marketplace.`);

    return res;
  }

  async rejectVerification(adminUser: User, propertyId: string, notes: string): Promise<PropertyVerification> {
    await staffAuthorizationService.requirePermission(adminUser, 'verification.reject', { resourceId: propertyId });
    await verificationAssignmentService.assertAssigned(adminUser, propertyId);
    if (!notes.trim()) throw new Error('A rejection reason is required.');

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
    await this.notifyPropertyStakeholders(propertyId, 'Property verification rejected', notes.trim());

    return res;
  }

  async requestChanges(adminUser: User, propertyId: string, notes: string): Promise<PropertyVerification> {
    await staffAuthorizationService.requirePermission(adminUser, 'verification.review', { resourceId: propertyId });
    await verificationAssignmentService.assertAssigned(adminUser, propertyId);
    if (!notes.trim()) throw new Error('A reason for requested changes is required.');

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
    await this.notifyPropertyStakeholders(propertyId, 'Property changes requested', notes.trim());

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
