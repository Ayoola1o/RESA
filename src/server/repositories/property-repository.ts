import { Property, ListingStatus, PropertyType, ListingType } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

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
  async findById(id: string): Promise<Property | null> {
    const db = getDb();
    return db.properties.find((p) => p.id === id) || null;
  }

  async listAll(): Promise<Property[]> {
    const db = getDb();
    return [...db.properties];
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    const db = getDb();
    return db.properties.filter((p) => p.ownerId === ownerId || p.authorizedAgentId === ownerId);
  }

  async search(filters: PropertyFilterOptions): Promise<Property[]> {
    const db = getDb();
    let results = [...db.properties];

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
    const db = getDb();
    const prevLen = db.properties.length;
    db.properties = db.properties.filter((p) => p.id !== id);
    const deleted = db.properties.length < prevLen;
    if (deleted) {
      saveDb(db);
    }
    return deleted;
  }
}

export const propertyRepository = new PropertyRepository();
