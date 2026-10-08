import { User, InspectionRequest, InspectionStatus, InspectionType, InspectionRecord } from '@/types/prophunta';
import { inspectionRepository } from '../repositories/inspection-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';

export class InspectionService {
  async getInspection(id: string): Promise<InspectionRequest | null> {
    return inspectionRepository.findById(id);
  }

  async getUserInspections(user: User): Promise<InspectionRequest[]> {
    if (user.role === 'ADMIN') {
      return inspectionRepository.listAll();
    }
    if (user.role === 'SEEKER') {
      return inspectionRepository.findBySeeker(user.id);
    }
    return inspectionRepository.findByHost(user.id);
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

    return request;
  }

  async updateStatus(
    user: User,
    inspectionId: string,
    status: InspectionStatus,
    notes?: string
  ): Promise<InspectionRequest> {
    const inspection = await inspectionRepository.findById(inspectionId);
    if (!inspection) throw new Error('Inspection request not found');

    // Only host or admin can update status
    if (inspection.hostId !== user.id && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to update this inspection');
    }

    const updated = await inspectionRepository.update(inspectionId, {
      status,
      notes: notes || inspection.notes,
    });

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
          : 'INSPECTION_SCHEDULED',
      objectType: 'INSPECTION',
      objectId: inspectionId,
      result: 'SUCCESS',
      metadata: { newStatus: status },
    });

    return updated!;
  }

  async completeInspection(
    user: User,
    inspectionId: string,
    record: Omit<InspectionRecord, 'completedAt'>
  ): Promise<InspectionRequest> {
    const inspection = await inspectionRepository.findById(inspectionId);
    if (!inspection) throw new Error('Inspection request not found');

    if (inspection.hostId !== user.id && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to complete this inspection');
    }

    const fullRecord: InspectionRecord = {
      ...record,
      completedAt: new Date().toISOString(),
    };

    const updated = await inspectionRepository.update(inspectionId, {
      status: 'COMPLETED',
      inspectionRecord: fullRecord,
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'INSPECTION_COMPLETED',
      objectType: 'INSPECTION',
      objectId: inspectionId,
      result: 'SUCCESS',
      metadata: { rating: record.conditionRating },
    });

    return updated!;
  }
}

export const inspectionService = new InspectionService();
