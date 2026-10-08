import { PropertyVerification } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class VerificationRepository {
  async findByPropertyId(propertyId: string): Promise<PropertyVerification | null> {
    const db = getDb();
    const prop = db.properties.find((p) => p.id === propertyId);
    return prop?.verification || null;
  }

  async upsert(verification: PropertyVerification): Promise<PropertyVerification> {
    const db = getDb();
    const propIdx = db.properties.findIndex((p) => p.id === verification.propertyId);

    if (propIdx !== -1) {
      db.properties[propIdx].verification = verification;
      // Synchronize property listing status with verification
      if (verification.overallStatus === 'PASSED') {
        db.properties[propIdx].listingStatus = 'VERIFIED';
        db.properties[propIdx].publishedAt = db.properties[propIdx].publishedAt || new Date().toISOString();
      } else if (verification.overallStatus === 'FAILED') {
        db.properties[propIdx].listingStatus = 'REJECTED';
      } else if (verification.overallStatus === 'CHANGES_REQUIRED') {
        db.properties[propIdx].listingStatus = 'CHANGES_REQUIRED';
      } else if (verification.overallStatus === 'IN_REVIEW') {
        db.properties[propIdx].listingStatus = 'UNDER_REVIEW';
      }

      db.properties[propIdx].updatedAt = new Date().toISOString();
      saveDb(db);
    }

    return verification;
  }

  async listPending(): Promise<{ propertyId: string; title: string; verification?: PropertyVerification }[]> {
    const db = getDb();
    return db.properties
      .filter(
        (p) =>
          p.listingStatus === 'SUBMITTED' ||
          p.listingStatus === 'UNDER_REVIEW' ||
          p.listingStatus === 'CHANGES_REQUIRED'
      )
      .map((p) => ({
        propertyId: p.id,
        title: p.title,
        verification: p.verification,
      }));
  }
}

export const verificationRepository = new VerificationRepository();
