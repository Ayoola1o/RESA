import { User, Application, ApplicationType, ApplicationStatus, Property, FeeBreakdown } from '@/types/prophunta';
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

  /**
   * Calculates a transparent, granular fee breakdown for rentals or property acquisitions.
   * Adheres strictly to the requirement that no simulated escrow or false payment protection is claimed.
   */
  calculateFeeBreakdown(property: Property, offerAmount?: number): FeeBreakdown {
    const basePrice = offerAmount !== undefined && offerAmount > 0 ? offerAmount : property.price;
    const isRental = property.listingType === 'RENT';

    // In Nigeria:
    // Tenancy Agreement & Legal Fee: typically 10% for rentals, 5-10% for sales
    const agreementFee =
      property.agreementFee !== undefined
        ? property.agreementFee
        : Math.round(basePrice * (isRental ? 0.1 : 0.05));

    // Caution Deposit (Refundable security deposit for damages/utilities): 10% for rentals, 0 for sales
    const cautionFee = isRental
      ? property.cautionFee !== undefined
        ? property.cautionFee
        : Math.round(basePrice * 0.1)
      : 0;

    // Estate Service Charge / Facility dues / diesel levy
    const serviceCharge = property.serviceCharge || 0;

    // Agency Fee: Typically 10% for rentals, 5% for sales
    const agencyFee = isRental ? Math.round(basePrice * 0.1) : Math.round(basePrice * 0.05);

    // Other statutory / stamp duty charges
    const otherCharges = property.otherCharges || 0;

    const totalInitialOutlay =
      basePrice + agreementFee + cautionFee + serviceCharge + agencyFee + otherCharges;

    return {
      basePrice,
      agreementFee,
      cautionFee,
      serviceCharge,
      agencyFee,
      otherCharges,
      totalInitialOutlay,
      currency: 'NGN',
      escrowNotice:
        'Notice: PropHunta AI conducts title, cadastral, and physical inspection audits. In compliance with real estate governance, PropHunta AI does not simulate mock escrow or claim payment protection without a licensed escrow partner integration under the Land Use Act. Transactions must proceed through formal lease execution.',
    };
  }

  async getUserApplications(user: User): Promise<Application[]> {
    let list: Application[];
    if (user.role === 'ADMIN') {
      list = await applicationRepository.listAll();
    } else if (user.role === 'SEEKER') {
      list = await applicationRepository.findBySeeker(user.id);
    } else {
      // For owner or authorized agent, retrieve applications for properties they own or manage
      const allProps = await propertyRepository.listAll();
      const relevantProps = allProps.filter(
        (p) => p.ownerId === user.id || p.authorizedAgentId === user.id
      );
      const propIds = new Set(relevantProps.map((p) => p.id));
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
    const applicantEmail = isEmailContact ? data.contact! : data.applicantEmail || user.email;
    const applicantPhone = !isEmailContact && data.contact ? data.contact : data.applicantPhone || user.phone;
    const finalOffer = data.offer !== undefined ? data.offer : data.offerAmount;

    // Calculate transparent fee breakdown
    const feeBreakdown = this.calculateFeeBreakdown(property, finalOffer);

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
      feeBreakdown,
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
        totalInitialOutlay: feeBreakdown.totalInitialOutlay,
      },
    });

    // Notify both Property Owner and Authorized Agent
    const notifyRecipients = new Set<string>([property.ownerId]);
    if (property.authorizedAgentId) notifyRecipients.add(property.authorizedAgentId);

    for (const recId of notifyRecipients) {
      await notificationService.createNotification(recId, {
        title: data.type === 'RENTAL' ? 'New Rental Application' : 'New Formal Purchase Offer',
        message: `${applicantName} submitted a ${data.type === 'RENTAL' ? 'rental application' : 'formal offer'} for "${property.title}" (Total initial outlay: ₦${feeBreakdown.totalInitialOutlay.toLocaleString()}).`,
        type: 'APPLICATION',
        link: '/profile?tab=applications',
      });
    }

    return this.attachAliases(app);
  }

  async updateStatus(
    user: User,
    applicationId: string,
    status: ApplicationStatus,
    notes?: string
  ): Promise<Application> {
    const existing = await applicationRepository.findById(applicationId);
    if (!existing) throw new Error('Application not found');

    const property = await propertyRepository.findById(existing.propertyId);
    const isOwnerOrAgent = property
      ? property.ownerId === user.id || property.authorizedAgentId === user.id
      : false;

    if (!isOwnerOrAgent && user.role !== 'ADMIN') {
      throw new Error(
        'Unauthorized: Only the property owner, authorized agent, or administrator can update application status.'
      );
    }

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
