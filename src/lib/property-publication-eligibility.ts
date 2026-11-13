export type PublicationDocument = { documentType: string; status: string };
export type PublicationMedia = { type: string; uploadStatus?: string; url?: string };
export type PublicationProperty = {
  listingStatus: string;
  publishedAt?: string;
  moderationStatus?: string;
  verification?: {
    overallStatus: string;
    ownerIdentityStatus: string;
    locationStatus: string;
    authorityDocumentStatus: string;
    availabilityStatus: string;
    mediaStatus: string;
    inspectionStatus: string;
  };
  documents?: PublicationDocument[];
  media?: PublicationMedia[];
};

const AUTHORITY_DOCUMENT_TYPES = new Set([
  'DEED_OF_ASSIGNMENT', 'CERTIFICATE_OF_OCCUPANCY', 'GOVERNORS_CONSENT',
  'LETTER_OF_AUTHORITY', 'RECEIPT_OF_PURCHASE',
]);
const REQUIRED_CHECKS = [
  'ownerIdentityStatus', 'locationStatus', 'authorityDocumentStatus',
  'availabilityStatus', 'mediaStatus', 'inspectionStatus',
] as const;

export function isEligibleMarketplaceListing(property: PublicationProperty): boolean {
  const verification = property.verification;
  return ['VERIFIED', 'ACTIVE', 'RESERVED', 'OCCUPIED'].includes(property.listingStatus)
    && Boolean(property.publishedAt)
    && property.moderationStatus === 'APPROVED'
    && verification?.overallStatus === 'PASSED'
    && REQUIRED_CHECKS.every((check) => verification[check] === 'PASSED')
    && Boolean(property.documents?.some((document) => document.status === 'APPROVED' && AUTHORITY_DOCUMENT_TYPES.has(document.documentType)))
    && Boolean(property.media?.some((media) => media.type === 'image' && media.uploadStatus === 'COMPLETED' && Boolean(media.url)));
}
