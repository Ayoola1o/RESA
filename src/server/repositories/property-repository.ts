import { Property, PropertyMedia, ListingStatus, PropertyType, ListingType } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

type SupabasePropertyRow = Record<string, any>;

function propertyClient() {
  const client = getSupabaseAdminClient();
  if (!client && process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase server credentials are missing; refusing to save a listing to temporary local storage.');
  }
  return client;
}

function propertyToDbRow(property: Property) {
  const { id, ownerId, authorizedAgentId, listingStatus, title, city, area, address, propertyType, listingType, price, latitude, longitude, createdAt, updatedAt, media, documents, verification, ...data } = property;
  return {
    id, owner_id: ownerId, authorized_agent_id: authorizedAgentId || null, listing_status: listingStatus,
    title, city, area, address, property_type: propertyType, listing_type: listingType, price,
    latitude: latitude ?? null, longitude: longitude ?? null, property_data: data,
    created_at: createdAt, updated_at: updatedAt,
  };
}

function verificationRow(verification: NonNullable<Property['verification']>) {
  return {
    property_id: verification.propertyId,
    verification_id: verification.verificationId,
    reviewer_id: verification.reviewerId || null,
    owner_identity_status: verification.ownerIdentityStatus,
    location_status: verification.locationStatus,
    authority_document_status: verification.authorityDocumentStatus,
    availability_status: verification.availabilityStatus,
    media_status: verification.mediaStatus,
    inspection_status: verification.inspectionStatus,
    overall_status: verification.overallStatus,
    review_notes: verification.reviewNotes || null,
    reviewed_at: verification.reviewedAt || null,
    last_verified_at: verification.lastVerifiedAt || null,
    trust_disclaimer: verification.trustDisclaimer || null,
  };
}

function propertyFromRows(row: SupabasePropertyRow, mediaRows: SupabasePropertyRow[], documentRows: SupabasePropertyRow[], verification: SupabasePropertyRow | null): Property {
  const documents = documentRows.map((document) => ({
    id: document.id, propertyId: document.property_id, uploadedBy: document.uploaded_by,
    documentType: document.document_type, fileName: document.file_name, fileReference: document.file_reference,
    mimeType: document.mime_type || undefined, sizeBytes: document.size_bytes == null ? undefined : Number(document.size_bytes),
    status: document.status, uploadedAt: document.uploaded_at,
    reviewedAt: document.review_data?.reviewedAt, reviewedBy: document.review_data?.reviewedBy,
    reviewNotes: document.review_data?.reviewNotes,
  }));
  const propertyVerification = verification ? {
    verificationId: verification.verification_id,
    propertyId: verification.property_id,
    reviewerId: verification.reviewer_id || undefined,
    ownerIdentityStatus: verification.owner_identity_status,
    locationStatus: verification.location_status,
    authorityDocumentStatus: verification.authority_document_status,
    availabilityStatus: verification.availability_status,
    mediaStatus: verification.media_status,
    inspectionStatus: verification.inspection_status,
    overallStatus: verification.overall_status,
    reviewNotes: verification.review_notes || undefined,
    reviewedAt: verification.reviewed_at || undefined,
    lastVerifiedAt: verification.last_verified_at || undefined,
    trustDisclaimer: verification.trust_disclaimer || undefined,
  } as Property['verification'] : undefined;
  return {
    ...(row.property_data || {}),
    id: row.id,
    ownerId: row.owner_id,
    authorizedAgentId: row.authorized_agent_id || undefined,
    listingStatus: row.listing_status,
    title: row.title,
    city: row.city,
    area: row.area,
    address: row.address,
    propertyType: row.property_type,
    listingType: row.listing_type,
    price: Number(row.price),
    latitude: row.latitude == null ? undefined : Number(row.latitude),
    longitude: row.longitude == null ? undefined : Number(row.longitude),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media: mediaRows.sort((a, b) => a.position - b.position).map((item) => ({ ...item.media_data, id: item.id, propertyId: row.id })) as PropertyMedia[],
    documents,
    verification: propertyVerification,
  } as Property;
}

export interface PropertyFilterOptions {
  search?: string;
  city?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  verifiedOnly?: boolean;
  status?: ListingStatus[];
}

export class PropertyRepository {
  private async loadSupabaseProperties(query: PromiseLike<{ data: any[] | null; error: any }>): Promise<Property[]> {
    const client = propertyClient();
    if (!client) return [];
    const { data: rows, error } = await query;
    if (error) throw new Error(`Could not load properties: ${error.message}`);
    if (!rows?.length) return [];
    const ids = rows.map((row) => row.id as string);
    const [mediaResult, documentResult, verificationResult] = await Promise.all([
      client.from('property_media').select('*').in('property_id', ids),
      client.from('property_documents').select('*').in('property_id', ids),
      client.from('property_verifications').select('*').in('property_id', ids),
    ]);
    if (mediaResult.error) throw new Error(`Could not load property media: ${mediaResult.error.message}`);
    if (documentResult.error) throw new Error(`Could not load property documents: ${documentResult.error.message}`);
    if (verificationResult.error) throw new Error(`Could not load property verification: ${verificationResult.error.message}`);
    return rows.map((row) => propertyFromRows(
      row,
      (mediaResult.data || []).filter((item) => item.property_id === row.id),
      (documentResult.data || []).filter((item) => item.property_id === row.id),
      (verificationResult.data || []).find((item) => item.property_id === row.id) || null,
    ));
  }

  private async syncSupabaseChildren(property: Property, parts: { media?: boolean; documents?: boolean; verification?: boolean }) {
    const client = propertyClient();
    if (!client) throw new Error('Supabase server credentials are required to persist property records.');
    if (parts.media) {
      const rows = property.media.map((item, index) => ({
        id: item.id, property_id: property.id, media_data: item, position: item.order ?? index + 1,
        created_at: item.createdAt || property.updatedAt,
      }));
      if (rows.length) {
        const { error } = await client.from('property_media').upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`Could not save property media: ${error.message}`);
      }
      const { data: existing, error: existingError } = await client.from('property_media').select('id').eq('property_id', property.id);
      if (existingError) throw new Error(`Could not inspect property media: ${existingError.message}`);
      const removedIds = (existing || []).map((item) => item.id as string).filter((id) => !rows.some((row) => row.id === id));
      if (removedIds.length) {
        const { error } = await client.from('property_media').delete().in('id', removedIds);
        if (error) throw new Error(`Could not remove old property media: ${error.message}`);
      }
    }
    if (parts.documents) {
      const rows = (property.documents || []).map((document) => ({
        id: document.id, property_id: property.id, uploaded_by: document.uploadedBy,
        document_type: document.documentType, file_name: document.fileName,
        file_reference: document.fileReference, mime_type: document.mimeType || null,
        size_bytes: document.sizeBytes ?? null, status: document.status,
        review_data: { reviewedAt: document.reviewedAt, reviewedBy: document.reviewedBy, reviewNotes: document.reviewNotes },
        uploaded_at: document.uploadedAt,
      }));
      if (rows.length) {
        const { error } = await client.from('property_documents').upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`Could not save property documents: ${error.message}`);
      }
      const { data: existing, error: existingError } = await client.from('property_documents').select('id').eq('property_id', property.id);
      if (existingError) throw new Error(`Could not inspect property documents: ${existingError.message}`);
      const removedIds = (existing || []).map((item) => item.id as string).filter((id) => !rows.some((row) => row.id === id));
      if (removedIds.length) {
        const { error } = await client.from('property_documents').delete().in('id', removedIds);
        if (error) throw new Error(`Could not remove old property documents: ${error.message}`);
      }
    }
    if (parts.verification) {
      if (property.verification) {
        const { error } = await client.from('property_verifications').upsert(verificationRow(property.verification), { onConflict: 'property_id' });
        if (error) throw new Error(`Could not save property verification: ${error.message}`);
      } else {
        const { error } = await client.from('property_verifications').delete().eq('property_id', property.id);
        if (error) throw new Error(`Could not remove property verification: ${error.message}`);
      }
    }
  }

  async findById(id: string): Promise<Property | null> {
    const client = propertyClient();
    if (client) {
      const rows = await this.loadSupabaseProperties(client.from('properties').select('*').eq('id', id).limit(1));
      return rows[0] || null;
    }
    const db = getDb();
    return db.properties.find((p) => p.id === id) || null;
  }

  async listAll(): Promise<Property[]> {
    const client = propertyClient();
    if (client) return this.loadSupabaseProperties(client.from('properties').select('*').order('created_at', { ascending: false }));
    const db = getDb();
    return [...db.properties];
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    const client = propertyClient();
    if (client) return this.loadSupabaseProperties(client.from('properties').select('*').or(`owner_id.eq.${ownerId},authorized_agent_id.eq.${ownerId}`).order('updated_at', { ascending: false }));
    const db = getDb();
    return db.properties.filter((p) => p.ownerId === ownerId || p.authorizedAgentId === ownerId);
  }

  async search(filters: PropertyFilterOptions): Promise<Property[]> {
    let results = await this.listAll();

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    if (filters.city && filters.city !== 'All') {
      results = results.filter((p) => p.city.toLowerCase() === filters.city!.toLowerCase());
    }

    if (filters.propertyType && filters.propertyType !== 'All') {
      results = results.filter((p) => p.propertyType.toLowerCase() === filters.propertyType!.toLowerCase());
    }

    if (filters.listingType && filters.listingType !== 'All') {
      results = results.filter((p) => p.listingType.toLowerCase() === filters.listingType!.toLowerCase());
    }

    if (filters.minPrice !== undefined) {
      results = results.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
      results = results.filter((p) => p.bedrooms >= filters.bedrooms!);
    }

    if (filters.verifiedOnly) {
      results = results.filter((p) => p.listingStatus === 'VERIFIED' || p.listingStatus === 'ACTIVE');
    }

    if (filters.status && filters.status.length > 0) {
      results = results.filter((p) => filters.status!.includes(p.listingStatus));
    }

    return results;
  }

  async create(propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    const client = propertyClient();
    if (client) {
      const now = new Date().toISOString();
      const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const property = {
        ...propertyData,
        id,
        createdAt: now,
        updatedAt: now,
        media: propertyData.media.map((item) => ({ ...item, propertyId: id })),
        verification: propertyData.verification ? { ...propertyData.verification, propertyId: id } : undefined,
      } as Property;
      const { error } = await client.from('properties').insert(propertyToDbRow(property));
      if (error) throw new Error(`Could not save property listing: ${error.message}`);
      try {
        await this.syncSupabaseChildren(property, { media: true, documents: true, verification: true });
      } catch (error) {
        await client.from('properties').delete().eq('id', id);
        throw error;
      }
      return property;
    }
    const db = getDb();
    const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newProperty: Property = {
      ...propertyData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    db.properties.unshift(newProperty);
    saveDb(db);
    return newProperty;
  }

  async update(id: string, partial: Partial<Property>): Promise<Property | null> {
    const client = propertyClient();
    if (client) {
      const current = await this.findById(id);
      if (!current) return null;
      const updated: Property = { ...current, ...partial, updatedAt: new Date().toISOString() };
      const { error } = await client.from('properties').update(propertyToDbRow(updated)).eq('id', id);
      if (error) throw new Error(`Could not update property listing: ${error.message}`);
      await this.syncSupabaseChildren(updated, {
        media: partial.media !== undefined,
        documents: partial.documents !== undefined,
        verification: partial.verification !== undefined,
      });
      return updated;
    }
    const db = getDb();
    const idx = db.properties.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    db.properties[idx] = {
      ...db.properties[idx],
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    saveDb(db);
    return db.properties[idx];
  }

  async delete(id: string): Promise<boolean> {
    const client = propertyClient();
    if (client) {
      const { data, error } = await client.from('properties').delete().eq('id', id).select('id');
      if (error) throw new Error(`Could not delete property listing: ${error.message}`);
      return Boolean(data?.length);
    }
    const db = getDb();
    const prevLen = db.properties.length;
    db.properties = db.properties.filter((p) => p.id !== id);
    const deleted = db.properties.length < prevLen;
    if (deleted) {
      saveDb(db);
    }
    return deleted;
  }

  async addMedia(propertyId: string, mediaItem: PropertyMedia): Promise<Property | null> {
    const client = propertyClient();
    if (client) {
      const property = await this.findById(propertyId);
      if (!property) return null;
      const media = [...(property.media || [])];
      if (mediaItem.isPrimary || media.length === 0) {
        media.forEach((item) => { item.isPrimary = false; });
        mediaItem.isPrimary = true;
      }
      media.push(mediaItem);
      return this.update(propertyId, { media });
    }
    const db = getDb();
    const idx = db.properties.findIndex((p) => p.id === propertyId);
    if (idx === -1) return null;

    const property = db.properties[idx];
    const currentMedia = property.media || [];

    if (mediaItem.isPrimary || currentMedia.length === 0) {
      currentMedia.forEach((m) => (m.isPrimary = false));
      mediaItem.isPrimary = true;
    }

    currentMedia.push(mediaItem);
    property.media = currentMedia;
    property.updatedAt = new Date().toISOString();
    saveDb(db);
    return property;
  }

  async updateMedia(propertyId: string, mediaId: string, updates: Partial<PropertyMedia>): Promise<Property | null> {
    const client = propertyClient();
    if (client) {
      const property = await this.findById(propertyId);
      if (!property) return null;
      const media = property.media.map((item) => item.id === mediaId ? { ...item, ...updates } : item);
      if (updates.isPrimary) media.forEach((item) => { item.isPrimary = item.id === mediaId; });
      return this.update(propertyId, { media });
    }
    const db = getDb();
    const idx = db.properties.findIndex((p) => p.id === propertyId);
    if (idx === -1) return null;

    const property = db.properties[idx];
    const mediaIdx = (property.media || []).findIndex((m) => m.id === mediaId);
    if (mediaIdx === -1) return null;

    if (updates.isPrimary) {
      property.media.forEach((m) => (m.isPrimary = false));
    }

    property.media[mediaIdx] = {
      ...property.media[mediaIdx],
      ...updates,
    };
    property.updatedAt = new Date().toISOString();
    saveDb(db);
    return property;
  }

  async deleteMedia(propertyId: string, mediaId: string): Promise<Property | null> {
    const client = propertyClient();
    if (client) {
      const property = await this.findById(propertyId);
      if (!property) return null;
      const media = property.media.filter((item) => item.id !== mediaId).map((item, index) => ({ ...item, order: index + 1 }));
      if (media.length && !media.some((item) => item.isPrimary)) media[0].isPrimary = true;
      return this.update(propertyId, { media });
    }
    const db = getDb();
    const idx = db.properties.findIndex((p) => p.id === propertyId);
    if (idx === -1) return null;

    const property = db.properties[idx];
    const currentMedia = property.media || [];
    const wasPrimary = currentMedia.find((m) => m.id === mediaId)?.isPrimary;

    property.media = currentMedia.filter((m) => m.id !== mediaId);
    if (wasPrimary && property.media.length > 0) {
      property.media[0].isPrimary = true;
    }

    property.media.forEach((m, i) => {
      m.order = i + 1;
    });

    property.updatedAt = new Date().toISOString();
    saveDb(db);
    return property;
  }

  async reorderMedia(propertyId: string, orderedIds: string[]): Promise<Property | null> {
    const client = propertyClient();
    if (client) {
      const property = await this.findById(propertyId);
      if (!property) return null;
      const mediaMap = new Map(property.media.map((item) => [item.id, item]));
      const media = orderedIds.flatMap((id) => { const item = mediaMap.get(id); if (!item) return []; mediaMap.delete(id); return [item]; });
      media.push(...mediaMap.values());
      return this.update(propertyId, { media: media.map((item, index) => ({ ...item, order: index + 1 })) });
    }
    const db = getDb();
    const idx = db.properties.findIndex((p) => p.id === propertyId);
    if (idx === -1) return null;

    const property = db.properties[idx];
    const mediaMap = new Map((property.media || []).map((m) => [m.id, m]));
    const reordered: PropertyMedia[] = [];

    orderedIds.forEach((id, index) => {
      const item = mediaMap.get(id);
      if (item) {
        item.order = index + 1;
        reordered.push(item);
        mediaMap.delete(id);
      }
    });

    mediaMap.forEach((item) => {
      item.order = reordered.length + 1;
      reordered.push(item);
    });

    property.media = reordered;
    property.updatedAt = new Date().toISOString();
    saveDb(db);
    return property;
  }
}

export const propertyRepository = new PropertyRepository();
