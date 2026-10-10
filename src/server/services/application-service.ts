import { User, Application, ApplicationType, ApplicationStatus } from '@/types/prophunta';
import { applicationRepository } from '../repositories/application-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';
import { notificationService } from './notification-service';

export class ApplicationService {
  private attachAliases(app: Application): Application {
    return {
      ...app,
      name: app.applicantName,
      contact: app.applicantPhone || app.applicantEmail,
      offer: app.offerAmount,
    };
  }

  async getApplication(id: string): Promise<Application | null> {
    const app = await applicationRepository.findById(id);
    return app ? this.attachAliases(app) : null;
  }

  async getUserApplications(user: User): Promise<Application[]> {
    let list: Application[];
    if (user.role === 'ADMIN') {
      list = await applicationRepository.listAll();
    } else if (user.role === 'SEEKER') {
      list = await applicationRepository.findBySeeker(user.id);
    } else {
      // For owner/agent, retrieve applications for their properties
      const userProps = await propertyRepository.findByOwner(user.id);
      const propIds = new Set(userProps.map((p) => p.id));
      const all = await applicationRepository.listAll();
      list = all.filter((a) => propIds.has(a.propertyId));
    }
    return list.map((a) => this.attachAliases(a));
  }

  async submitApplication(
    user: User,
    data: {
      propertyId: string;
      type: ApplicationType;
      name?: string;
      contact?: string;
      applicantName?: string;
      applicantEmail?: string;
      applicantPhone?: string;
      occupation?: string;
      moveInDate?: string;
      occupants?: number;
      offer?: number;
      offerAmount?: number;
      financingStatus?: 'CASH' | 'MORTGAGE_PRE_APPROVED' | 'INSTALLMENT';
      message: string;
    }
  ): Promise<Application> {
    const property = await propertyRepository.findById(data.propertyId);
    if (!property) throw new Error('Property not found');

    const applicantName = data.name || data.applicantName || user.name;
    const isEmailContact = data.contact && data.contact.includes('@');
    const applicantEmail = isEmailContact ? data.contact! : (data.applicantEmail || user.email);
    const applicantPhone = !isEmailContact && data.contact ? data.contact : (data.applicantPhone || user.phone);
    const finalOffer = data.offer !== undefined ? data.offer : data.offerAmount;

    const app = await applicationRepository.create({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyPrice: property.price,
      propertyImage: property.media[0]?.url,
      seekerId: user.id,
      applicantName,
      applicantEmail,
      applicantPhone,
      type: data.type,
      occupation: data.occupation,
      moveInDate: data.moveInDate,
      occupants: data.occupants,
      offerAmount: finalOffer,
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
      metadata: {
        propertyId: property.id,
        type: data.type,
        applicantName,
        offerAmount: finalOffer,
      },
    });

    // Notify Property Host (Owner / Agent)
    const hostId = property.authorizedAgentId || property.ownerId;
    await notificationService.createNotification(hostId, {
      title: data.type === 'RENTAL' ? 'New Rental Application' : 'New Formal Purchase Offer',
      message: `${applicantName} submitted a ${data.type === 'RENTAL' ? 'rental application' : 'formal offer'} for "${property.title}".`,
      type: 'APPLICATION',
      link: '/profile?tab=applications',
    });

    return this.attachAliases(app);
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

    // Notify Seeker of decision
    await notificationService.createNotification(updated.seekerId, {
      title: `Application ${status}`,
      message: `Your expression of interest for "${updated.propertyTitle}" has been marked ${status}.${notes ? ` Notes: "${notes}"` : ''}`,
      type: 'APPLICATION',
      link: '/profile?tab=applications',
    });

    return this.attachAliases(updated);
  }
}

export const applicationService = new ApplicationService();
