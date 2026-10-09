export type UserRole = 'SEEKER' | 'OWNER' | 'AGENT' | 'ADMIN';

export type UserVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profilePhoto?: string;
  location?: string;
  verificationStatus: UserVerificationStatus;
  createdAt: string;
  updatedAt: string;
  // Professional details for AGENT / OWNER
  agencyName?: string;
  licenseNumber?: string;
  bio?: string;
}

export type PropertyType =
  | 'Apartment'
  | 'House'
  | 'Condo'
  | 'Land'
  | 'Single Room'
  | 'Self Apart'
  | 'R&P Apart'
  | 'Office Space'
  | 'Warehouse'
  | 'Shop'
  | 'Commercial';

export type ListingType = 'RENT' | 'SALE' | 'LEASE';

export type ListingStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'CHANGES_REQUIRED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'SOLD'
  | 'SUSPENDED';

export type AvailabilityStatus = 'AVAILABLE' | 'UNDER_OFFER' | 'OCCUPIED' | 'UNAVAILABLE';

export type MediaType = 'image' | 'video';
export type MediaUploadStatus = 'UPLOADING' | 'COMPLETED' | 'FAILED';

export interface PropertyMedia {
  id: string;
  propertyId: string;
  url: string;
  type: MediaType;
  caption?: string;
  isPrimary: boolean;
  order: number;
  uploadStatus?: MediaUploadStatus;
  fileReference?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt?: string;
}

export type DocumentType =
  | 'DEED_OF_ASSIGNMENT'
  | 'SURVEY_PLAN'
  | 'CERTIFICATE_OF_OCCUPANCY'
  | 'GOVERNORS_CONSENT'
  | 'LETTER_OF_AUTHORITY'
  | 'RECEIPT_OF_PURCHASE'
  | 'UTILITY_BILL'
  | 'NATIONAL_ID'
  | 'OTHER';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUIRED';

export interface PropertyDocument {
  id: string;
  propertyId: string;
  uploadedBy: string;
  documentType: DocumentType;
  fileName: string;
  fileReference: string; // secure storage identifier / path
  status: DocumentStatus;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export type VerificationSubStatus = 'PENDING' | 'IN_REVIEW' | 'PASSED' | 'FAILED' | 'CHANGES_REQUIRED' | 'NOT_REVIEWED';

export type VerificationOverallStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'PASSED'
  | 'FAILED'
  | 'CHANGES_REQUIRED';

export interface PropertyVerification {
  verificationId: string;
  propertyId: string;
  reviewerId?: string;

  ownerIdentityStatus: VerificationSubStatus;
  locationStatus: VerificationSubStatus;
  authorityDocumentStatus: VerificationSubStatus;
  availabilityStatus: VerificationSubStatus;
  mediaStatus: VerificationSubStatus;
  inspectionStatus: VerificationSubStatus;

  overallStatus: VerificationOverallStatus;

  reviewNotes?: string;
  reviewedAt?: string;
  lastVerifiedAt?: string;
}

export interface Property {
  id: string;
  ownerId: string;
  authorizedAgentId?: string;
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  description: string;

  state: string;
  city: string;
  area: string;
  address: string;
  latitude?: number;
  longitude?: number;

  price: number;
  priceUnit?: string; // e.g. '/year', '/month', 'total'
  agreementFee?: number;
  cautionFee?: number;
  serviceCharge?: number;
  otherCharges?: number;

  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  features: string[];

  availabilityStatus: AvailabilityStatus;
  intendedUse?: 'Residential' | 'Commercial' | 'Mixed';

  listingStatus: ListingStatus;

  media: PropertyMedia[];
  documents?: PropertyDocument[];
  verification?: PropertyVerification;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  // View & insight metrics
  viewsCount?: number;
  isFeatured?: boolean;
  floodRisk?: 'Low' | 'Medium' | 'High' | 'None';
}

export type InspectionStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW';

export type InspectionType = 'IN_PERSON' | 'VIDEO';

export interface InspectionRecord {
  completedAt: string;
  inspectorName: string;
  conditionRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  utilitiesFunctional: boolean;
  meterReadings?: string;
  observations: string;
  discrepancies?: string;
  photos?: string[];
}

export interface InspectionRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  seekerPhone: string;
  hostId: string; // owner or agent
  preferredDate: string;
  preferredTimeSlot: string; // e.g. "10:00 AM - 12:00 PM"
  type: InspectionType;
  status: InspectionStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  inspectionRecord?: InspectionRecord;
}

export interface EnquiryMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface PropertyEnquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage?: string;
  seekerId: string;
  seekerName: string;
  hostId: string; // owner or agent
  hostName: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCountForSeeker: number;
  unreadCountForHost: number;
  messages: EnquiryMessage[];
}

export type ApplicationType = 'RENTAL' | 'SALE_OFFER';
export type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Application {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyImage?: string;
  seekerId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  type: ApplicationType;

  // Rental specific
  occupation?: string;
  moveInDate?: string;
  occupants?: number;

  // Sale specific
  offerAmount?: number;
  financingStatus?: 'CASH' | 'MORTGAGE_PRE_APPROVED' | 'INSTALLMENT';

  message: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: string;
}

export type ReportReason =
  | 'Suspected Scam'
  | 'Incorrect Information'
  | 'Unavailable Property'
  | 'Unauthorized Representation'
  | 'Duplicate Listing'
  | 'Misleading Price/Photos'
  | 'Other';

export type ReportStatus =
  | 'REPORTED'
  | 'UNDER_INVESTIGATION'
  | 'DOCUMENTATION_REQUESTED'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'SUSPENDED'
  | 'ESCALATED';

export interface ListingReport {
  id: string;
  propertyId: string;
  propertyTitle: string;
  reporterId: string;
  reporterName: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  reportedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export type AuditAction =
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'USER_ROLE_CHANGED'
  | 'USER_PASSWORD_RESET'
  | 'USER_PROFILE_UPDATED'
  | 'USER_SUSPENDED'
  | 'USER_STATUS_UPDATED'
  | 'PROPERTY_DRAFT_CREATED'
  | 'PROPERTY_SUBMITTED'
  | 'PROPERTY_EDITED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_REVIEWED'
  | 'DOCUMENT_DELETED'
  | 'VERIFICATION_UPDATED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'VERIFICATION_CHANGES_REQUESTED'
  | 'LISTING_SUSPENDED'
  | 'LISTING_RESTORED'
  | 'INSPECTION_REQUESTED'
  | 'INSPECTION_ACCEPTED'
  | 'INSPECTION_SCHEDULED'
  | 'INSPECTION_COMPLETED'
  | 'ENQUIRY_SENT'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_STATUS_UPDATED'
  | 'REPORT_FILED'
  | 'REPORT_INVESTIGATED'
  | 'REPORT_RESOLVED'
  | 'MEDIA_UPLOADED'
  | 'MEDIA_DELETED'
  | 'MEDIA_ORDER_UPDATED'
  | 'PROPERTY_STATUS_TRANSITIONED';

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: AuditAction;
  objectType: 'PROPERTY' | 'USER' | 'DOCUMENT' | 'INSPECTION' | 'REPORT' | 'APPLICATION' | 'ENQUIRY' | 'MEDIA';
  objectId: string;
  timestamp: string;
  result: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, any>;
}
