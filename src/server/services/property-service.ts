import { Property, ListingStatus, User, PropertyDocument, DocumentType } from '@/types/prophunta';
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
    }
  ): Promise<Property> {
    // Role check: Only OWNER, AGENT, or ADMIN can create listings
    if (!['OWNER', 'AGENT', 'ADMIN'].includes(user.role)) {
      throw new Error('Only Property Owners and Verified Agents can create property listings');
    }

    const media = (data.images.length > 0 ? data.images : [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ]).map((url, idx) => ({
      id: `med_${Date.now()}_${idx}`,
      propertyId: '',
      url,
      type: 'image' as const,
      isPrimary: idx === 0,
      order: idx + 1,
    }));

    const property = await propertyRepository.create({
      ownerId: user.role === 'OWNER' ? user.id : 'user_owner_1',
      authorizedAgentId: user.role === 'AGENT' ? user.id : undefined,
      title: data.title,
      propertyType: data.propertyType,
      listingType: data.listingType,
      description: data.description,
      state: data.state,
      city: data.city,
      area: data.area,
      address: data.address,
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
}

export const propertyService = new PropertyService();
