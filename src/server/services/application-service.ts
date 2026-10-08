import { User, Application, ApplicationType, ApplicationStatus } from '@/types/prophunta';
import { applicationRepository } from '../repositories/application-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';

export class ApplicationService {
  async getApplication(id: string): Promise<Application | null> {
    return applicationRepository.findById(id);
  }

  async getUserApplications(user: User): Promise<Application[]> {
    if (user.role === 'ADMIN') {
      return applicationRepository.listAll();
    }
    if (user.role === 'SEEKER') {
      return applicationRepository.findBySeeker(user.id);
    }
    // For owner/agent, retrieve applications for their properties
    const userProps = await propertyRepository.findByOwner(user.id);
    const propIds = new Set(userProps.map((p) => p.id));
    const all = await applicationRepository.listAll();
    return all.filter((a) => propIds.has(a.propertyId));
  }

  async submitApplication(
    user: User,
    data: {
      propertyId: string;
      type: ApplicationType;
      occupation?: string;
      moveInDate?: string;
      occupants?: number;
      offerAmount?: number;
      financingStatus?: 'CASH' | 'MORTGAGE_PRE_APPROVED' | 'INSTALLMENT';
      message: string;
    }
  ): Promise<Application> {
    const property = await propertyRepository.findById(data.propertyId);
    if (!property) throw new Error('Property not found');

    const app = await applicationRepository.create({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyPrice: property.price,
      propertyImage: property.media[0]?.url,
      seekerId: user.id,
      applicantName: user.name,
      applicantEmail: user.email,
      applicantPhone: user.phone,
      type: data.type,
      occupation: data.occupation,
      moveInDate: data.moveInDate,
      occupants: data.occupants,
      offerAmount: data.offerAmount,
      financingStatus: data.financingStatus,
      message: data.message,
      status: 'SUBMITTED',
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'APPLICATION_SUBMITTED',
      objectType: 'APPLICATION',
      objectId: app.id,
      result: 'SUCCESS',
      metadata: { propertyId: property.id, type: data.type },
    });

    return app;
  }

  async updateStatus(
    user: User,
    applicationId: string,
    status: ApplicationStatus,
    notes?: string
  ): Promise<Application> {
    const updated = await applicationRepository.updateStatus(applicationId, status, notes);
    if (!updated) throw new Error('Application not found');

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'APPLICATION_STATUS_UPDATED',
      objectType: 'APPLICATION',
      objectId: applicationId,
      result: 'SUCCESS',
      metadata: { newStatus: status, notes },
    });

    return updated;
  }
}

export const applicationService = new ApplicationService();
