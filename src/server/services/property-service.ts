import { Property, PropertyMedia, ListingStatus, User, PropertyDocument, DocumentType } from '@/types/prophunta';
import { propertyRepository, PropertyFilterOptions } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';

export class PropertyService {
  async getProperty(id: string): Promise<Property | null> {
    return propertyRepository.findById(id);
  }

  async getAllProperties(): Promise<Property[]> {
    return propertyRepository.listAll();
  }

  async searchProperties(filters: PropertyFilterOptions): Promise<Property[]> {
    return propertyRepository.search(filters);
  }

  async getUserProperties(userId: string): Promise<Property[]> {
    return propertyRepository.findByOwner(userId);
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
    }
  ): Promise<Property> {
    // Role check: Only OWNER, AGENT, or ADMIN can create listings
    if (!['OWNER', 'AGENT', 'ADMIN'].includes(user.role)) {
      throw new Error('Only Property Owners and Verified Agents can create property listings');
    }

    const media: PropertyMedia[] = (data.images.length > 0 ? data.images : [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ]).map((url, idx) => ({
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
      ownerId: user.role === 'OWNER' ? user.id : 'user_owner_1',
      authorizedAgentId: user.role === 'AGENT' ? user.id : data.authorizedAgentId,
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
      authorizedAgentId?: string;
    }>
  ): Promise<Property> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const isOwner = property.ownerId === user.id;
    const isAgent = property.authorizedAgentId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAgent && !isAdmin) {
      throw new Error('Unauthorized to edit this property draft');
    }

    if (property.listingStatus !== 'DRAFT' && property.listingStatus !== 'CHANGES_REQUIRED' && !isAdmin) {
      throw new Error(`Cannot edit listing while in status: ${property.listingStatus}`);
    }

    const updated = await propertyRepository.update(propertyId, {
      ...data,
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

    const isOwner = property.ownerId === user.id;
    const isAgent = property.authorizedAgentId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAgent && !isAdmin) {
      throw new Error('Unauthorized to edit this property');
    }

    const updated = await propertyRepository.update(propertyId, {
      ...data,
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

    if (property.ownerId !== user.id && property.authorizedAgentId !== user.id && user.role !== 'ADMIN') {
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

    if (property.ownerId !== user.id && property.authorizedAgentId !== user.id && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to submit this property');
    }

    const updated = await propertyRepository.update(propertyId, {
      listingStatus: 'SUBMITTED',
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

    return updated!;
  }

  async suspendProperty(adminUser: User, propertyId: string, reason?: string): Promise<Property> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrators can suspend listings');
    }
    const prop = await propertyRepository.findById(propertyId);
    if (!prop) throw new Error('Property not found');

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
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrators can restore listings');
    }
    const prop = await propertyRepository.findById(propertyId);
    if (!prop) throw new Error('Property not found');

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

    const isOwner = property.ownerId === user.id;
    const isAgent = property.authorizedAgentId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAgent && !isAdmin) {
      throw new Error('Unauthorized: You do not have permission to change the status of this property');
    }

    // Role-specific transition rules
    if (!isAdmin) {
      // Owners / Agents can only perform operational transitions
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
    }

    // Determine availabilityStatus sync
    let availabilityStatus = property.availabilityStatus;
    if (newStatus === 'ACTIVE' || newStatus === 'VERIFIED') {
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

    if ((newStatus === 'ACTIVE' || newStatus === 'VERIFIED') && !property.publishedAt) {
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
}

export const propertyService = new PropertyService();
