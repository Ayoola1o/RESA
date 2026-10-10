import { User, InspectionRequest, InspectionStatus, InspectionType, InspectionRecord } from '@/types/prophunta';
import { inspectionRepository } from '../repositories/inspection-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';
import { notificationService } from './notification-service';

export class InspectionService {
  async getInspection(id: string): Promise<InspectionRequest | null> {
    return inspectionRepository.findById(id);
  }

  async getUserInspections(userOrId: User | string, role?: string): Promise<InspectionRequest[]> {
    if (typeof userOrId === 'object') {
      const user = userOrId;
      if (user.role === 'ADMIN') {
        return inspectionRepository.listAll();
      }
      if (user.role === 'SEEKER') {
        return inspectionRepository.findBySeeker(user.id);
      }
      return inspectionRepository.findByHost(user.id);
    } else {
      const userId = userOrId;
      if (role === 'ADMIN') {
        return inspectionRepository.listAll();
      }
      if (role === 'SEEKER') {
        return inspectionRepository.findBySeeker(userId);
      }
      return inspectionRepository.findByHost(userId);
    }
  }

  async requestInspection(
    seeker: User,
    data: {
      propertyId: string;
      preferredDate: string;
      preferredTimeSlot: string;
      type: InspectionType;
      notes?: string;
    }
  ): Promise<InspectionRequest> {
    const property = await propertyRepository.findById(data.propertyId);
    if (!property) throw new Error('Property not found');

    const hostId = property.authorizedAgentId || property.ownerId;

    const request = await inspectionRepository.create({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyAddress: property.address,
      seekerId: seeker.id,
      seekerName: seeker.name,
      seekerEmail: seeker.email,
      seekerPhone: seeker.phone,
      hostId,
      preferredDate: data.preferredDate,
      preferredTimeSlot: data.preferredTimeSlot,
      type: data.type,
      status: 'REQUESTED',
      notes: data.notes,
    });

    await auditRepository.create({
      actorId: seeker.id,
      actorEmail: seeker.email,
      actorRole: seeker.role,
      action: 'INSPECTION_REQUESTED',
      objectType: 'INSPECTION',
      objectId: request.id,
      result: 'SUCCESS',
      metadata: { propertyId: property.id, preferredDate: data.preferredDate },
    });

    // Notify Host of new inspection request
    await notificationService.createNotification(hostId, {
      title: 'New Inspection Request',
      message: `${seeker.name} requested an inspection for "${property.title}" on ${data.preferredDate} (${data.preferredTimeSlot}).`,
      type: 'INSPECTION',
      link: '/profile?tab=inspections',
    });

    return request;
  }

  async updateStatus(
    user: User,
    inspectionId: string,
    status: InspectionStatus,
    notes?: string,
    rescheduleData?: { preferredDate: string; preferredTimeSlot: string }
  ): Promise<InspectionRequest> {
    const inspection = await inspectionRepository.findById(inspectionId);
    if (!inspection) throw new Error('Inspection request not found');

    const property = await propertyRepository.findById(inspection.propertyId);
    const isOwnerOrAgent = property ? property.ownerId === user.id || property.authorizedAgentId === user.id : false;
    const isHostOrAdmin = inspection.hostId === user.id || isOwnerOrAgent || user.role === 'ADMIN';
    const isSeekerCancelling = status === 'CANCELLED' && inspection.seekerId === user.id;

    if (!isHostOrAdmin && !isSeekerCancelling) {
      throw new Error('Unauthorized to update this inspection');
    }

    const updates: Partial<InspectionRequest> = {
      status,
      notes: notes || inspection.notes,
    };

    if (rescheduleData?.preferredDate) {
      updates.preferredDate = rescheduleData.preferredDate;
    }
    if (rescheduleData?.preferredTimeSlot) {
      updates.preferredTimeSlot = rescheduleData.preferredTimeSlot;
    }

    const updated = await inspectionRepository.update(inspectionId, updates);

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action:
        status === 'ACCEPTED'
          ? 'INSPECTION_ACCEPTED'
          : status === 'SCHEDULED'
          ? 'INSPECTION_SCHEDULED'
          : status === 'COMPLETED'
          ? 'INSPECTION_COMPLETED'
          : status === 'CANCELLED'
          ? 'INSPECTION_CANCELLED'
          : status === 'RESCHEDULED'
          ? 'INSPECTION_RESCHEDULED'
          : 'INSPECTION_STATUS_CHANGED',
      objectType: 'INSPECTION',
      objectId: inspectionId,
      result: 'SUCCESS',
      metadata: { newStatus: status, previousStatus: inspection.status, rescheduleData },
    });

    // Notify counterpart (seeker if host updated, host if seeker cancelled)
    const recipientId = user.id === inspection.seekerId ? inspection.hostId : inspection.seekerId;
    await notificationService.createNotification(recipientId, {
      title: `Inspection ${status}`,
      message: `Inspection for "${inspection.propertyTitle}" has been updated to ${status}.${notes ? ` Notes: "${notes}"` : ''}`,
      type: 'INSPECTION',
      link: '/profile?tab=inspections',
    });

    return updated!;
  }

  async updateInspectionStatus(
    user: User,
    inspectionId: string,
    status: InspectionStatus,
    notes?: string,
    rescheduleData?: { preferredDate: string; preferredTimeSlot: string }
  ): Promise<InspectionRequest> {
    return this.updateStatus(user, inspectionId, status, notes, rescheduleData);
  }

  async completeInspection(
    user: User,
    inspectionId: string,
    record: Partial<InspectionRecord> & {
      method?: import('@/types/prophunta').InspectionMethod;
      participants?: import('@/types/prophunta').InspectionParticipant[];
    }
  ): Promise<InspectionRequest> {
    const inspection = await inspectionRepository.findById(inspectionId);
    if (!inspection) throw new Error('Inspection request not found');

    const property = await propertyRepository.findById(inspection.propertyId);
    const isOwnerOrAgent = property ? property.ownerId === user.id || property.authorizedAgentId === user.id : false;
    if (inspection.hostId !== user.id && !isOwnerOrAgent && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to complete this inspection');
    }

    const now = new Date().toISOString();
    const method: import('@/types/prophunta').InspectionMethod =
      record.method ||
      (inspection.type === 'VIDEO' ? 'LIVE_VIDEO_WALKTHROUGH' : 'IN_PERSON_FIELD_OFFICER');

    // Rule: Host-submitted video is NOT proof of an independently verified physical inspection
    const isIndependentInspection =
      user.role === 'ADMIN' && method === 'IN_PERSON_FIELD_OFFICER';

    const participants: import('@/types/prophunta').InspectionParticipant[] = record.participants || [
      { userId: user.id, name: user.name, role: user.role },
      { userId: inspection.seekerId, name: inspection.seekerName, role: 'SEEKER' },
    ];

    const fullRecord: InspectionRecord = {
      completedAt: now,
      date: record.date || now,
      inspectorName: record.inspectorName || record.inspector || user.name,
      inspector: record.inspector || record.inspectorName || user.name,
      inspectorRole: user.role,
      method,
      isIndependentInspection,
      conditionRating: record.conditionRating || record.condition || 'GOOD',
      condition: record.condition || record.conditionRating || 'GOOD',
      utilitiesFunctional: record.utilitiesFunctional ?? record.utilities ?? true,
      utilities: record.utilities ?? record.utilitiesFunctional ?? true,
      meterReadings: record.meterReadings || record.meters || undefined,
      meters: record.meters || record.meterReadings || undefined,
      observations: record.observations || 'Verified observations logged by inspector.',
      discrepancies: record.discrepancies || undefined,
      photos: record.photos || [],
      video: record.video || record.videoUrl || undefined,
      videoUrl: record.videoUrl || record.video || undefined,
      escalationStatus: record.discrepancies ? 'DISCREPANCY_FLAGGED' : 'NONE',
    };

    const updated = await inspectionRepository.update(inspectionId, {
      status: 'COMPLETED',
      method,
      participants,
      inspectionRecord: fullRecord,
      escalationStatus: fullRecord.escalationStatus,
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'INSPECTION_COMPLETED',
      objectType: 'INSPECTION',
      objectId: inspectionId,
      result: 'SUCCESS',
      metadata: {
        rating: fullRecord.conditionRating,
        method,
        isIndependentInspection,
        participantsCount: participants.length,
        discrepancies: fullRecord.discrepancies,
      },
    });

    return updated!;
  }

  /**
   * Escalation path for suspicious or mismatched inspection evidence
   */
  async escalateInspection(
    user: User,
    inspectionId: string,
    reason: string,
    discrepancyDetails: string
  ): Promise<{ inspection: InspectionRequest; report: import('@/types/prophunta').ListingReport }> {
    const inspection = await inspectionRepository.findById(inspectionId);
    if (!inspection) throw new Error('Inspection request not found');

    // Only seeker of the inspection, host, or admin can escalate
    if (inspection.seekerId !== user.id && inspection.hostId !== user.id && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to file an escalation for this inspection.');
    }

    const updated = await inspectionRepository.update(inspectionId, {
      escalationStatus: 'ESCALATED_FRAUD_INVESTIGATION',
      escalationNotes: `${reason}: ${discrepancyDetails}`,
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'INSPECTION_ESCALATED',
      objectType: 'INSPECTION',
      objectId: inspectionId,
      result: 'SUCCESS',
      metadata: {
        propertyId: inspection.propertyId,
        reason,
        discrepancyDetails,
      },
    });

    // Auto-create trust & safety report for admin investigation
    const { reportRepository } = await import('../repositories/report-repository');
    const report = await reportRepository.create({
      propertyId: inspection.propertyId,
      propertyTitle: inspection.propertyTitle,
      reporterId: user.id,
      reporterName: user.name,
      reason: 'Misleading Price/Photos',
      description: `[Inspection Escalation #${inspectionId}] Discrepancy reported during walkthrough: ${reason}. Details: ${discrepancyDetails}`,
    });

    return { inspection: updated!, report };
  }

  /**
   * Resolve an escalated inspection after compliance investigation
   */
  async resolveEscalation(
    adminUser: User,
    inspectionId: string,
    resolutionNotes: string
  ): Promise<InspectionRequest> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only administrators can resolve inspection escalations.');
    }

    const updated = await inspectionRepository.update(inspectionId, {
      escalationStatus: 'RESOLVED',
      escalationNotes: resolutionNotes,
    });
    if (!updated) throw new Error('Inspection not found');

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'INSPECTION_ESCALATION_RESOLVED',
      objectType: 'INSPECTION',
      objectId: inspectionId,
      result: 'SUCCESS',
      metadata: { resolutionNotes },
    });

    return updated;
  }
}

export const inspectionService = new InspectionService();
