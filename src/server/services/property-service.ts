import { getValidCoordinates, isCoordinatePair } from '@/lib/maps/property-coordinates';
import { relationshipService } from './relationship-service';
import { staffAuthorizationService } from './staff-authorization-service';
import { Property, PropertyMedia, ListingStatus, User, PropertyDocument, DocumentType } from '@/types/prophunta';
import { propertyRepository, PropertyFilterOptions } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';
import { verificationAssignmentService } from './verification-assignment-service';
import { isEligibleMarketplaceListing } from '@/lib/property-publication-eligibility';

export class PropertyService {
  async getProperty(id: string): Promise<Property | null> {
    return propertyRepository.findById(id);
  }

  async getPropertyById(id: string): Promise<Property | null> {
    return propertyRepository.findById(id);
  }

  async getAllProperties(): Promise<Property[]> {
    return propertyRepository.listAll();
  }

  async searchProperties(filters: PropertyFilterOptions): Promise<Property[]> {
    return propertyRepository.search(filters);
  }

  async getUserProperties(userId: string): Promise<Property[]> {
    const properties = await propertyRepository.findByOwner(userId);
    const visible = await Promise.all(properties.map(async (property) =>
      await this.canManageListing(userId, property) ? property : null,
    ));
    return visible.filter((property): property is Property => property !== null);
  }

  async canManageListing(userId: string, property: Property): Promise<boolean> {
    if (property.ownerId === userId) return true;
    return property.authorizedAgentId === userId && await relationshipService.validateAgentAuthority(userId, property);
  }

  private async canStaffManageProperty(user: User, property: Property): Promise<boolean> {
    const context = await staffAuthorizationService.requirePermission(user, 'properties.moderate');
    return context.activeRoles.includes('SUPER_ADMIN');
  }

  isPublicListing(property: Property): boolean {
    return isEligibleMarketplaceListing(property);
  }

  async createDraft(
    user: User,
    data: {
      title: string;
      propertyType: Property['propertyType'];
      listingType: Property['listingType'];
      description: string;
      state: string;
      city: string;
      area: string;
      address: string;
      price: number;
      priceUnit?: string;
      agreementFee?: number;
      cautionFee?: number;
      serviceCharge?: number;
      otherCharges?: number;
      bedrooms: number;
      bathrooms: number;
      sqft?: number;
      features: string[];
      images: string[];
      latitude?: number;
      longitude?: number;
      intendedUse?: 'Residential' | 'Commercial' | 'Mixed';
      authorizedAgentId?: string;
      ownerId?: string;
      relationshipId?: string;
      isDirectListing?: boolean;
    }
  ): Promise<Property> {
    // Staff review listings but do not create marketplace inventory.
    if (!['OWNER', 'AGENT'].includes(user.role)) {
      throw new Error('Only Property Owners and Verified Agents can create property listings');
    }

    if ((data.latitude !== undefined || data.longitude !== undefined) && !isCoordinatePair(data.latitude, data.longitude)) {
      throw new Error('Enter a latitude from −90 to 90 and a longitude from −180 to 180.');
    }

    let ownerId = user.id;
    let authorizedAgentId: string | undefined;
    let relationshipId: string | undefined;
    const isDirectListing = data.isDirectListing ?? (user.role === 'OWNER' || !data.ownerId);

    if (user.role === 'AGENT') {
      authorizedAgentId = user.id;
      if (!isDirectListing && data.ownerId && data.ownerId !== user.id) {
        // Enforce active relationship
        const { relationshipRepository } = await import('../repositories/relationship-repository');
        const activeRel = await relationshipRepository.findActiveRelationship(data.ownerId, user.id);
        if (!activeRel || activeRel.propertyIds?.length) {
          throw new Error('Cannot create listing on behalf of owner without an active representation mandate.');
        }
        ownerId = data.ownerId;
        relationshipId = activeRel?.id;
      } else {
        ownerId = user.id; // Direct agent listing
      }
    }

    const media: PropertyMedia[] = data.images.map((url, idx) => ({
      id: `med_${Date.now()}_${idx}`,
      propertyId: '',
      url,
      type: url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
      caption: idx === 0 ? 'Main Facade & Front Entrance' : `Property View #${idx + 1}`,
      isPrimary: idx === 0,
      order: idx + 1,
      uploadStatus: 'COMPLETED',
      createdAt: new Date().toISOString(),
    }));

    const property = await propertyRepository.create({
      ownerId,
      authorizedAgentId,
      relationshipId,
      isDirectListing,
      title: data.title,
      propertyType: data.propertyType,
      listingType: data.listingType,
      description: data.description,
      state: data.state,
      city: data.city,
      area: data.area,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      price: data.price,
      priceUnit: data.priceUnit || (data.listingType === 'RENT' ? '/year' : 'total'),
      agreementFee: data.agreementFee || 0,
      cautionFee: data.cautionFee || 0,
      serviceCharge: data.serviceCharge || 0,
      otherCharges: data.otherCharges || 0,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqft: data.sqft,
      features: data.features,
      availabilityStatus: 'AVAILABLE',
      intendedUse: data.intendedUse || 'Residential',
      listingStatus: 'DRAFT',
      moderationStatus: 'PENDING',
      media,
      documents: [],
      verification: {
        verificationId: `ver_${Date.now()}`,
        propertyId: '',
        ownerIdentityStatus: 'PENDING',
        locationStatus: 'PENDING',
        authorityDocumentStatus: 'PENDING',
        availabilityStatus: 'PENDING',
        mediaStatus: 'PENDING',
        inspectionStatus: 'PENDING',
        overallStatus: 'PENDING',
        reviewNotes: 'Draft property created. Awaiting submission for compliance review.',
      },
    });

    if (property.verification) {
      property.verification.propertyId = property.id;
      await propertyRepository.update(property.id, { verification: property.verification });
    }

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PROPERTY_DRAFT_CREATED',
      objectType: 'PROPERTY',
      objectId: property.id,
      result: 'SUCCESS',
      metadata: { title: property.title },
    });

    return property;
  }

  async updateDraft(
    user: User,
    propertyId: string,
    data: Partial<{
      title: string;
      propertyType: Property['propertyType'];
      listingType: Property['listingType'];
      description: string;
      state: string;
      city: string;
      area: string;
      address: string;
      price: number;
      priceUnit?: string;
      agreementFee?: number;
      cautionFee?: number;
      serviceCharge?: number;
      otherCharges?: number;
      bedrooms: number;
      bathrooms: number;
      sqft?: number;
      features: string[];
      latitude?: number;
      longitude?: number;
      intendedUse?: 'Residential' | 'Commercial' | 'Mixed';
    }>
  ): Promise<Property> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const canManage = await this.canManageListing(user.id, property);
    const staffCanManage = user.role === 'ADMIN' && await this.canStaffManageProperty(user, property);

    if (!canManage && !staffCanManage) {
      throw new Error('Unauthorized to edit this property draft');
    }

    if (property.listingStatus !== 'DRAFT' && property.listingStatus !== 'CHANGES_REQUIRED' && !staffCanManage) {
      throw new Error(`Cannot edit listing while in status: ${property.listingStatus}`);
    }

    const coordinatesEdited = Object.hasOwn(data, 'latitude') || Object.hasOwn(data, 'longitude');
    const previousCoordinates = getValidCoordinates(property);
    const latitude = Object.hasOwn(data, 'latitude') ? data.latitude : previousCoordinates?.lat;
    const longitude = Object.hasOwn(data, 'longitude') ? data.longitude : previousCoordinates?.lng;
    if (coordinatesEdited && (latitude !== undefined || longitude !== undefined) && !isCoordinatePair(latitude, longitude)) {
      throw new Error('Enter both valid coordinates, or clear both.');
    }

    const updated = await propertyRepository.update(propertyId, {
      ...Object.fromEntries(Object.entries(data).filter(([key]) => [
        'title', 'propertyType', 'listingType', 'description', 'state', 'city', 'area', 'address',
        'price', 'priceUnit', 'agreementFee', 'cautionFee', 'serviceCharge', 'otherCharges',
        'bedrooms', 'bathrooms', 'sqft', 'features', 'latitude', 'longitude', 'intendedUse',
      ].includes(key))),
      ...(coordinatesEdited ? { latitude, longitude, coordinates: undefined } : {}),
      updatedAt: new Date().toISOString(),
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PROPERTY_EDITED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { title: updated?.title },
    });

    return updated!;
  }

  async updateProperty(
    user: User,
    propertyId: string,
    data: Partial<Property>
  ): Promise<Property> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const canManage = await this.canManageListing(user.id, property);
    const staffCanManage = user.role === 'ADMIN' && await this.canStaffManageProperty(user, property);

    if (!canManage && !staffCanManage) {
      throw new Error('Unauthorized to edit this property');
    }

    const editableKeys = ['title', 'propertyType', 'listingType', 'description', 'state', 'city', 'area', 'address', 'price', 'priceUnit', 'agreementFee', 'cautionFee', 'serviceCharge', 'otherCharges', 'bedrooms', 'bathrooms', 'sqft', 'features', 'latitude', 'longitude', 'intendedUse'];
    const updated = await propertyRepository.update(propertyId, {
      ...Object.fromEntries(Object.entries(data).filter(([key]) => editableKeys.includes(key))),
      updatedAt: new Date().toISOString(),
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PROPERTY_EDITED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { title: updated?.title, changes: Object.keys(data) },
    });

    return updated!;
  }

  async addDocument(
    user: User,
    propertyId: string,
    documentType: DocumentType,
    fileName: string
  ): Promise<PropertyDocument> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    if (!await this.canManageListing(user.id, property)) {
      throw new Error('Unauthorized to modify this property documentation');
    }

    const doc: PropertyDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      propertyId,
      uploadedBy: user.id,
      documentType,
      fileName,
      fileReference: `/secure-vault/${propertyId}/${fileName}`,
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
    };

    const updatedDocs = [...(property.documents || []), doc];
    await propertyRepository.update(propertyId, { documents: updatedDocs });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DOCUMENT_UPLOADED',
      objectType: 'DOCUMENT',
      objectId: doc.id,
      result: 'SUCCESS',
      metadata: { propertyId, documentType, fileName },
    });

    return doc;
  }

  async submitForReview(user: User, propertyId: string): Promise<Property> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    if (!await this.canManageListing(user.id, property)) {
      throw new Error('Unauthorized to submit this property');
    }

    // Security: Require identity KYC verification before submitting listing for compliance audit
    if (user.verificationStatus !== 'VERIFIED') {
      throw new Error('Identity KYC verification required before submitting listings for compliance audit.');
    }
    if (!(property.media || []).some((media) => media.type === 'image' && media.uploadStatus === 'COMPLETED' && Boolean(media.url))) {
      throw new Error('Add at least one uploaded property photo before submitting this listing.');
    }
    if (!(property.documents || []).some((document) => [
      'DEED_OF_ASSIGNMENT', 'CERTIFICATE_OF_OCCUPANCY', 'GOVERNORS_CONSENT', 'LETTER_OF_AUTHORITY', 'RECEIPT_OF_PURCHASE',
    ].includes(document.documentType))) {
      throw new Error('Upload at least one ownership or authority document before submitting this listing.');
    }

    const updated = await propertyRepository.update(propertyId, {
      listingStatus: 'SUBMITTED',
      moderationStatus: 'PENDING',
      verification: {
        ...(property.verification || {
          verificationId: `ver_${Date.now()}`,
          propertyId,
          ownerIdentityStatus: 'PENDING',
          locationStatus: 'PENDING',
          authorityDocumentStatus: 'PENDING',
          availabilityStatus: 'PENDING',
          mediaStatus: 'PENDING',
          inspectionStatus: 'PENDING',
          overallStatus: 'PENDING',
        }),
        overallStatus: 'PENDING',
        reviewNotes: 'Submitted for administrator verification queue review.',
      },
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PROPERTY_SUBMITTED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { title: property.title },
    });

    await verificationAssignmentService.createPropertyTasks({ id: property.id, ownerId: property.ownerId, state: property.state }, user);

    return updated!;
  }

  async reviewModeration(user: User, propertyId: string, outcome: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUIRED', notes: string): Promise<Property> {
    if (notes.trim().length < 5) throw new Error('Moderation notes (minimum 5 characters) are required.');
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found.');
    await verificationAssignmentService.assertTaskAssigned(user, 'properties.moderate', 'PROPERTY', propertyId, ['MODERATION']);
    const now = new Date().toISOString();
    const updated = await propertyRepository.update(propertyId, {
      moderationStatus: outcome,
      moderationReviewedAt: now,
      moderationReviewedBy: user.id,
      moderationNotes: notes.trim(),
      ...(outcome === 'APPROVED' && property.verification ? {
        verification: { ...property.verification, mediaStatus: 'PASSED', reviewedAt: now, reviewerId: user.id },
      } : {}),
      ...(outcome === 'REJECTED' ? { listingStatus: 'REJECTED' as const } : outcome === 'CHANGES_REQUIRED' ? { listingStatus: 'CHANGES_REQUIRED' as const } : {}),
    });
    await verificationAssignmentService.completeTask(user, propertyId, 'MODERATION', notes);
    await auditRepository.create({ actorId: user.id, actorEmail: user.email, actorRole: user.role, action: 'PROPERTY_MODERATION_REVIEWED' as any, objectType: 'PROPERTY', objectId: propertyId, result: 'SUCCESS', metadata: { outcome, notes: notes.trim() } });
    return updated!;
  }

  async suspendProperty(adminUser: User, propertyId: string, reason?: string): Promise<Property> {
    const prop = await propertyRepository.findById(propertyId);
    if (!prop) throw new Error('Property not found');
    const context = await staffAuthorizationService.requirePermission(adminUser, 'properties.suspend', { resourceId: propertyId, region: prop.state });
    if (!context.activeRoles.includes('SUPER_ADMIN')) await verificationAssignmentService.assertTaskAssigned(adminUser, 'properties.suspend', 'PROPERTY', propertyId, ['MODERATION', 'TRUST_SAFETY']);

    const updated = await propertyRepository.update(propertyId, {
      listingStatus: 'SUSPENDED',
      availabilityStatus: 'UNAVAILABLE',
    });

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'LISTING_SUSPENDED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { reason: reason || 'Suspended by compliance officer.' },
    });

    return updated!;
  }

  async restoreProperty(adminUser: User, propertyId: string, reason?: string): Promise<Property> {
    const prop = await propertyRepository.findById(propertyId);
    if (!prop) throw new Error('Property not found');
    const context = await staffAuthorizationService.requirePermission(adminUser, 'properties.restore', { resourceId: propertyId, region: prop.state });
    if (!context.activeRoles.includes('SUPER_ADMIN')) await verificationAssignmentService.assertTaskAssigned(adminUser, 'properties.restore', 'PROPERTY', propertyId, ['MODERATION', 'TRUST_SAFETY']);

    const updated = await propertyRepository.update(propertyId, {
      listingStatus: 'ACTIVE',
      availabilityStatus: 'AVAILABLE',
    });

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'LISTING_RESTORED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { title: prop.title, reason: reason || 'Restored by administrator.' },
    });

    return updated!;
  }

  async suspendListing(adminUser: User, propertyId: string, reason?: string): Promise<Property> {
    return this.suspendProperty(adminUser, propertyId, reason);
  }

  async restoreListing(adminUser: User, propertyId: string, reason?: string): Promise<Property> {
    return this.restoreProperty(adminUser, propertyId, reason);
  }

  /**
   * State Machine transition driver for all 11 listing statuses:
   * DRAFT, SUBMITTED, UNDER_REVIEW, VERIFIED, CHANGES_REQUIRED, REJECTED, ACTIVE, RESERVED, OCCUPIED, SOLD, SUSPENDED
   */
  async transitionListingStatus(
    user: User,
    propertyId: string,
    newStatus: ListingStatus,
    reason?: string
  ): Promise<Property> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const canManage = await this.canManageListing(user.id, property);
    if (user.role === 'ADMIN') {
      throw new Error('Administrative status changes must use the authorized suspend, restore, or verification workflow.');
    }

    if (!canManage) {
      throw new Error('Unauthorized: You do not have permission to change the status of this property');
    }

    // Role-specific transition rules
    // Owners / Agents can only perform operational transitions.
    const allowedOwnerTransitions: Record<ListingStatus, ListingStatus[]> = {
        DRAFT: ['SUBMITTED'],
        CHANGES_REQUIRED: ['SUBMITTED'],
        SUBMITTED: [], // Waiting for review
        UNDER_REVIEW: [], // Admin reviewing
        VERIFIED: ['ACTIVE'], // Host can activate verified listing
        ACTIVE: ['RESERVED', 'OCCUPIED', 'SOLD'],
        RESERVED: ['ACTIVE', 'OCCUPIED', 'SOLD'],
        OCCUPIED: ['ACTIVE'], // Re-listing
        SOLD: [],
        REJECTED: [],
        SUSPENDED: [],
    };

    const allowed = allowedOwnerTransitions[property.listingStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Cannot transition listing from ${property.listingStatus} to ${newStatus}. Owners/agents cannot bypass verification or compliance actions.`
      );
    }

    // Security: VERIFIED status can ONLY be awarded through the formal audit approval workflow
    if (newStatus === 'VERIFIED') {
      throw new Error(
        'Cannot transition to VERIFIED directly. Listings must pass the formal compliance checklist and document audit.'
      );
    }

    // Determine availabilityStatus sync
    let availabilityStatus = property.availabilityStatus;
    if (newStatus === 'ACTIVE') {
      availabilityStatus = 'AVAILABLE';
    } else if (newStatus === 'RESERVED') {
      availabilityStatus = 'UNDER_OFFER';
    } else if (newStatus === 'OCCUPIED') {
      availabilityStatus = 'OCCUPIED';
    } else if (newStatus === 'SOLD' || newStatus === 'REJECTED' || newStatus === 'SUSPENDED') {
      availabilityStatus = 'UNAVAILABLE';
    }

    const updates: Partial<Property> = {
      listingStatus: newStatus,
      availabilityStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === 'ACTIVE' && !property.publishedAt) {
      updates.publishedAt = new Date().toISOString();
    }

    const updated = await propertyRepository.update(propertyId, updates);

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: newStatus === 'SUBMITTED' ? 'PROPERTY_SUBMITTED' : 'PROPERTY_STATUS_TRANSITIONED',
      objectType: 'PROPERTY',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: {
        previousStatus: property.listingStatus,
        newStatus,
        reason: reason || undefined,
      },
    });

    return updated!;
  }

  /**
   * Reports a location or cadastral coordinates discrepancy for a property
   */
  async reportLocationDiscrepancy(
    reporter: User,
    propertyId: string,
    data: {
      reportedLatitude?: number;
      reportedLongitude?: number;
      discrepancyNotes: string;
    }
  ): Promise<{ property: Property; report: import('@/types/prophunta').ListingReport }> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found.');

    const { reportRepository } = await import('../repositories/report-repository');
    const { verificationRepository } = await import('../repositories/verification-repository');

    // Create Trust & Safety incident report
    const report = await reportRepository.create({
      propertyId: property.id,
      propertyTitle: property.title,
      reporterId: reporter.id,
      reporterName: reporter.name,
      reason: 'Location Discrepancy',
      description: `[Location Discrepancy Flag] Reported coordinates: [${data.reportedLatitude ?? 'N/A'}, ${data.reportedLongitude ?? 'N/A'}]. Existing: [${property.latitude ?? 'N/A'}, ${property.longitude ?? 'N/A'}]. Details: ${data.discrepancyNotes.trim()}`,
    });

    // Flag the property's verification location check for review
    const currentVerification = await verificationRepository.findByPropertyId(property.id);
    if (currentVerification) {
      await verificationRepository.upsert({
        ...currentVerification,
        locationStatus: 'CHANGES_REQUIRED',
        reviewNotes: `Location discrepancy flagged by ${reporter.name}: ${data.discrepancyNotes.trim()}`,
      });
    }

    await auditRepository.create({
      actorId: reporter.id,
      actorEmail: reporter.email,
      actorRole: reporter.role,
      action: 'LOCATION_DISCREPANCY_REPORTED',
      objectType: 'PROPERTY',
      objectId: property.id,
      result: 'SUCCESS',
      metadata: {
        reportedLatitude: data.reportedLatitude,
        reportedLongitude: data.reportedLongitude,
        discrepancyNotes: data.discrepancyNotes,
        reportId: report.id,
      },
    });

    return { property, report };
  }
}

export const propertyService = new PropertyService();
