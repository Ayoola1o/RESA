export type UserRole = 'SEEKER' | 'OWNER' | 'AGENT' | 'ADMIN';

export type UserVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'SUSPENDED';

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'CHANGES_REQUIRED';

export type AgentVerificationLevel =
  | 'LEVEL_0_UNVERIFIED'
  | 'LEVEL_1_IDENTITY_VERIFIED'
  | 'LEVEL_2_BUSINESS_REGISTERED'
  | 'LEVEL_3_LICENSED_PRACTITIONER';

export interface AgentCredential {
  id: string;
  agentId: string;
  level: AgentVerificationLevel;
  credentialType: 'GOVERNMENT_ID' | 'CAC_CERTIFICATE' | 'ASSOCIATION_REGISTRATION' | 'STATE_LICENSE' | 'OTHER';
  title: string;
  issuingAuthority: string; // e.g., "CAC", "LASRERA", "ERCAAN", "NIESV", "NIMC"
  registrationNumber: string;
  documentUrl?: string;
  fileReference?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  issuedAt?: string;
  expiresAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

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
  // Explicit Identity KYC Verification
  kycStatus?: KycStatus;
  kycDocumentType?: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD';
  kycDocumentNumber?: string;
  kycDocumentUrl?: string;
  kycSubmittedAt?: string;
  kycReviewedAt?: string;
  kycReviewedBy?: string;
  kycRejectionReason?: string;
  // Configurable Agent Credential Level
  agentVerificationLevel?: AgentVerificationLevel;
  agentCredentials?: AgentCredential[];
  isDemo?: boolean;
}

export type OwnerAgentRelationshipStatus =
  | 'INVITED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'REVOKED'
  | 'EXPIRED';

export interface OwnerAgentRelationship {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone?: string;
  propertyIds?: string[]; // Empty means all current/future owner listings in scope, or specific properties
  mandateType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | 'JOINT' | 'SUB_AGENT';
  commissionRate?: string;
  status: OwnerAgentRelationshipStatus;
  scope?: string;
  invitedBy: 'OWNER' | 'AGENT';
  invitedAt: string;
  respondedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  | 'Commercial'
  | 'Duplex'
  | 'Semi-Detached Duplex'
  | 'Fully Detached Duplex'
  | 'Terrace'
  | 'Maisonette'
  | 'Mini Flat';

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
  trustDisclaimer?: string; // Standard legal disclaimer that audit review is not a state land title guarantee
}

export interface Property {
  id: string;
  ownerId: string;
  authorizedAgentId?: string;
  relationshipId?: string; // Reference to OwnerAgentRelationship if managed on behalf of owner
  isDirectListing?: boolean; // True if listed directly by titleholder or directly by agent for their own asset
  isDemo?: boolean;
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
  coordinates?: { lat: number; lng: number };
  lga?: string;
  cadastralNumber?: string;

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

export type InspectionMethod =
  | 'IN_PERSON_FIELD_OFFICER'
  | 'IN_PERSON_HOST_ACCOMPANIED'
  | 'LIVE_VIDEO_WALKTHROUGH'
  | 'HOST_SUBMITTED_MEDIA';

export type InspectionEscalationStatus =
  | 'NONE'
  | 'DISCREPANCY_FLAGGED'
  | 'ESCALATED_FRAUD_INVESTIGATION'
  | 'RESOLVED';

export interface InspectionParticipant {
  userId: string;
  name: string;
  role: UserRole;
}

export interface InspectionRecord {
  completedAt: string;
  date?: string;
  inspectorName: string;
  inspector?: string;
  inspectorRole?: UserRole;
  method: InspectionMethod;
  isIndependentInspection: boolean; // Host-submitted video is NOT proof of independently verified physical inspection
  conditionRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  utilitiesFunctional: boolean;
  utilities?: boolean;
  meterReadings?: string;
  meters?: string;
  observations: string;
  discrepancies?: string;
  photos?: string[];
  video?: string;
  videoUrl?: string;
  escalationStatus?: InspectionEscalationStatus;
  escalationNotes?: string;
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
  method?: InspectionMethod;
  notes?: string;
  participants?: InspectionParticipant[];
  escalationStatus?: InspectionEscalationStatus;
  escalationNotes?: string;
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
  hasOffPlatformWarning?: boolean;
  warningNotice?: string;
}

export interface PropertyEnquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage?: string;
  seekerId: string;
  seekerName: string;
  hostId: string; // primary host responder
  hostName: string;
  ownerId?: string; // Property owner (shared conversation)
  authorizedAgentId?: string; // Authorized agent (shared conversation)
  lastMessageText: string;
  lastMessageAt: string;
  unreadCountForSeeker: number;
  unreadCountForHost: number;
  messages: EnquiryMessage[];
  hasOffPlatformWarning?: boolean;
  offPlatformWarningNotice?: string;

  // Direct aliases matching PRD Section 16
  user?: { id: string; name: string; role: UserRole };
  property?: { id: string; title: string; image?: string };
  timestamp?: string;
  message?: string;
}

export interface FeeBreakdown {
  basePrice: number;
  agreementFee: number;
  cautionFee: number;
  serviceCharge: number;
  agencyFee: number;
  otherCharges: number;
  totalInitialOutlay: number;
  currency: string; // 'NGN' (₦)
  escrowNotice: string;
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

  // Transparent fee breakdown
  feeBreakdown?: FeeBreakdown;

  message: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: string;

  // Direct aliases matching PRD Section 17 specifications
  name?: string;
  contact?: string;
  offer?: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ENQUIRY' | 'INSPECTION' | 'APPLICATION' | 'VERIFICATION' | 'REPORT' | 'SYSTEM';
  link?: string;
  read: boolean;
  createdAt: string;
}

export type ReportReason =
  | 'Suspected Scam'
  | 'Incorrect Information'
  | 'Unavailable Property'
  | 'Unauthorized Representation'
  | 'Duplicate Listing'
  | 'Misleading Price/Photos'
  | 'Location Discrepancy'
  | 'Off-Platform Solicitation'
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
  | 'KYC_SUBMITTED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'KYC_CHANGES_REQUESTED'
  | 'AGENT_CREDENTIAL_SUBMITTED'
  | 'AGENT_CREDENTIAL_REVIEWED'
  | 'OWNER_AGENT_INVITED'
  | 'OWNER_AGENT_ACCEPTED'
  | 'OWNER_AGENT_REJECTED'
  | 'OWNER_AGENT_REVOKED'
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
  | 'INSPECTION_STATUS_CHANGED'
  | 'INSPECTION_CANCELLED'
  | 'INSPECTION_RESCHEDULED'
  | 'INSPECTION_ESCALATED'
  | 'INSPECTION_ESCALATION_RESOLVED'
  | 'ENQUIRY_SENT'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_STATUS_UPDATED'
  | 'REPORT_FILED'
  | 'REPORT_INVESTIGATED'
  | 'REPORT_DOCUMENTATION_REQUESTED'
  | 'REPORT_RESOLVED'
  | 'REPORT_DISMISSED'
  | 'REPORT_SUSPENDED'
  | 'REPORT_ESCALATED'
  | 'REPORT_STATUS_CHANGED'
  | 'NOTIFICATION_SENT'
  | 'MEDIA_UPLOADED'
  | 'MEDIA_DELETED'
  | 'MEDIA_ORDER_UPDATED'
  | 'OFF_PLATFORM_WARNING_TRIGGERED'
  | 'LOCATION_DISCREPANCY_REPORTED'
  | 'PROPERTY_STATUS_TRANSITIONED';

export interface AuditActor {
  id: string;
  email: string;
  role: UserRole;
  ipAddress?: string;
}

export interface AuditLog {
  id: string;
  actor: AuditActor;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: AuditAction;
  objectType: 'PROPERTY' | 'USER' | 'DOCUMENT' | 'INSPECTION' | 'REPORT' | 'APPLICATION' | 'ENQUIRY' | 'MEDIA' | 'RELATIONSHIP' | 'CREDENTIAL';
  objectId: string;
  timestamp: string;
  result: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, any>;
}
