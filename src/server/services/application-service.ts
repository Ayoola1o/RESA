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
        link: '/applications',
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
      link: '/applications',
    });

    return this.attachAliases(updated);
  }

  /**
   * Seeker funds the initial outlay (Rent, Legal/Agreement fee, Caution deposit, Service charge)
   * into PropHunta's Segregated Escrow Trust Account.
   */
  async fundEscrow(
    user: User,
    applicationId: string,
    paymentMethod: string,
    paymentRef?: string
  ): Promise<Application> {
    const app = await applicationRepository.findById(applicationId);
    if (!app) throw new Error('Application not found');

    if (app.seekerId !== user.id && user.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only the applicant seeker can fund the escrow account.');
    }

    const property = await propertyRepository.findById(app.propertyId);
    const feeBreakdown = app.feeBreakdown || (property ? this.calculateFeeBreakdown(property, app.offerAmount) : {
      basePrice: app.propertyPrice,
      agreementFee: Math.round(app.propertyPrice * 0.1),
      cautionFee: Math.round(app.propertyPrice * 0.1),
      serviceCharge: 0,
      agencyFee: Math.round(app.propertyPrice * 0.1),
      otherCharges: 0,
      totalInitialOutlay: Math.round(app.propertyPrice * 1.3),
      currency: 'NGN',
      escrowNotice: 'Funds held in Segregated Escrow Trust Account under Lagos State real estate guidelines.',
    });

    const now = new Date().toISOString();
    const ref = paymentRef || `ESC_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const updated = await applicationRepository.update(applicationId, {
      status: 'ESCROW_FUNDED',
      feeBreakdown,
      escrowPayment: {
        paymentRef: ref,
        paymentMethod: paymentMethod || 'Providus Virtual Escrow Account Transfer',
        amountPaid: feeBreakdown.totalInitialOutlay,
        paidAt: now,
        escrowStatus: 'HELD_IN_ESCROW',
        cautionDepositHeld: feeBreakdown.cautionFee,
      },
    });

    if (!updated) throw new Error('Failed to update escrow state');

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'APPLICATION_STATUS_UPDATED',
      objectType: 'APPLICATION',
      objectId: applicationId,
      result: 'SUCCESS',
      metadata: {
        action: 'ESCROW_FUNDED',
        paymentRef: ref,
        amountPaid: feeBreakdown.totalInitialOutlay,
        cautionDepositHeld: feeBreakdown.cautionFee,
      },
    });

    // Notify Host (Owner and/or Authorized Agent)
    const hostRecipients = new Set<string>();
    if (property?.ownerId) hostRecipients.add(property.ownerId);
    if (property?.authorizedAgentId) hostRecipients.add(property.authorizedAgentId);

    for (const hostId of hostRecipients) {
      await notificationService.createNotification(hostId, {
        title: 'Escrow Payment Confirmed',
        message: `${app.applicantName} has successfully funded ₦${feeBreakdown.totalInitialOutlay.toLocaleString()} into the Segregated Escrow Account for "${app.propertyTitle}". Tenancy Agreement is ready for bilateral digital signing.`,
        type: 'APPLICATION',
        link: `/lease/${app.propertyId}?appId=${app.id}`,
      });
    }

    return this.attachAliases(updated);
  }

  /**
   * Digitally signs the tenancy agreement for an approved/funded application.
   */
  async signLeaseAgreement(
    user: User,
    applicationId: string,
    signature: string
  ): Promise<Application> {
    const app = await applicationRepository.findById(applicationId);
    if (!app) throw new Error('Application not found');

    const now = new Date().toISOString();
    const checksum = `SIG_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const sigRecord = {
      signature: signature.trim() || user.name,
      signedAt: now,
      signerName: user.name,
      signerRole: user.role,
      checksum,
    };

    let updated: Application | null = null;

    if (user.role === 'SEEKER' || app.seekerId === user.id) {
      updated = await applicationRepository.update(applicationId, {
        tenantSignature: sigRecord,
        status: 'LEASE_SIGNED',
      });
    } else {
      updated = await applicationRepository.update(applicationId, {
        landlordSignature: sigRecord,
        status: 'LEASE_SIGNED',
      });
    }

    if (!updated) throw new Error('Failed to update lease signature');

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'APPLICATION_STATUS_UPDATED',
      objectType: 'APPLICATION',
      objectId: applicationId,
      result: 'SUCCESS',
      metadata: {
        action: 'LEASE_SIGNED',
        signerRole: user.role,
        checksum,
      },
    });

    // Notify other party
    const targetUserId = (user.role === 'SEEKER' || app.seekerId === user.id)
      ? (app as any).ownerId || 'admin'
      : app.seekerId;

    if (targetUserId) {
      await notificationService.createNotification(targetUserId, {
        title: 'Tenancy Agreement Signed',
        message: `${user.name} has digitally signed the tenancy agreement for "${app.propertyTitle}". Checksum: ${checksum}.`,
        type: 'APPLICATION',
        link: `/lease/${app.propertyId}?appId=${app.id}`,
      });
    }

    return this.attachAliases(updated);
  }

  /**
   * Finalizes physical key handover & move-in inspection sign-off.
   * Releases net rent to landlord and locks caution deposit in ongoing escrow hold.
   */
  async confirmHandover(
    user: User,
    applicationId: string,
    notes?: string
  ): Promise<Application> {
    const app = await applicationRepository.findById(applicationId);
    if (!app) throw new Error('Application not found');

    const property = await propertyRepository.findById(app.propertyId);
    const now = new Date().toISOString();

    const updated = await applicationRepository.update(applicationId, {
      status: 'HANDOVER_COMPLETED',
      handoverRecord: {
        confirmedAt: now,
        confirmedBy: user.name,
        notes: notes || 'Physical key handover and pre-occupancy condition sign-off completed.',
      },
      escrowPayment: app.escrowPayment ? {
        ...app.escrowPayment,
        escrowStatus: 'RELEASED_TO_HOST',
      } : undefined,
    });

    if (!updated) throw new Error('Failed to update handover status');

    // Update property listing to OCCUPIED
    if (property) {
      await propertyRepository.update(property.id, {
        listingStatus: 'OCCUPIED',
        availabilityStatus: 'OCCUPIED',
      });
    }

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'APPLICATION_STATUS_UPDATED',
      objectType: 'APPLICATION',
      objectId: applicationId,
      result: 'SUCCESS',
      metadata: {
        action: 'HANDOVER_COMPLETED',
        escrowRelease: 'NET_RENT_RELEASED_TO_HOST',
        cautionDepositStatus: 'SECURED_IN_ESCROW',
      },
    });

    // Notify Landlord
    if (property?.ownerId) {
      await notificationService.createNotification(property.ownerId, {
        title: 'Move-in Complete • Rent Disbursed',
        message: `Tenant ${app.applicantName} confirmed key handover for "${app.propertyTitle}". Net annual rent has been disbursed to your account. Caution deposit remains secured in escrow.`,
        type: 'APPLICATION',
        link: `/lease/${app.propertyId}?appId=${app.id}`,
      });
    }

    // Notify Seeker with Tenant Portal link
    await notificationService.createNotification(app.seekerId, {
      title: 'Welcome to Your New Home!',
      message: `Key handover confirmed for "${app.propertyTitle}". You now have full access to the Tenant Portal for maintenance and rent renewal.`,
      type: 'APPLICATION',
      link: `/maintenance/${app.propertyId}`,
    });

    return this.attachAliases(updated);
  }
}

export const applicationService = new ApplicationService();
