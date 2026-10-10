'use server';

import { revalidatePath } from 'next/cache';
import {
  User,
  UserRole,
  Property,
  PropertyType,
  ListingType,
  ListingStatus,
  InspectionType,
  InspectionStatus,
  InspectionRecord,
  ReportReason,
  ReportStatus,
  ListingReport,
  ApplicationType,
  ApplicationStatus,
  VerificationSubStatus,
  VerificationOverallStatus,
  DocumentType,
  DocumentStatus,
  PropertyDocument,
  UserVerificationStatus,
  PropertyMedia,
  MediaType,
  KycStatus,
  AgentVerificationLevel,
  AgentCredential,
  OwnerAgentRelationship,
} from '@/types/prophunta';
import { authService } from '../services/auth-service';
import { propertyService } from '../services/property-service';
import { mediaService } from '../services/media-service';
import { documentService } from '../services/document-service';
import { verificationService } from '../services/verification-service';
import { inspectionService } from '../services/inspection-service';
import { enquiryService } from '../services/enquiry-service';
import { applicationService } from '../services/application-service';
import { reportService } from '../services/report-service';
import { auditService } from '../services/audit-service';
import { notificationService } from '../services/notification-service';
import { relationshipService } from '../services/relationship-service';
import { agentCredentialService } from '../services/agent-credential-service';

// --- AUTHENTICATION ACTIONS ---

export async function getCurrentUserAction(): Promise<User | null> {
  return authService.getCurrentUser();
}

export async function loginAction(formData: FormData): Promise<{ success: boolean; user?: User; error?: string }> {
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const res = await authService.login(email, password);
  if (res.error || !res.user) {
    return { success: false, error: res.error || 'Login failed.' };
  }

  revalidatePath('/', 'layout');
  return { success: true, user: res.user };
}

export async function registerAction(formData: FormData): Promise<{ success: boolean; user?: User; error?: string }> {
  const name = (formData.get('name') as string) || '';
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';
  const phone = (formData.get('phone') as string) || '+234 800 000 0000';
  const role = ((formData.get('role') as string) || 'SEEKER') as UserRole;
  const agencyName = (formData.get('agencyName') as string) || undefined;
  const licenseNumber = (formData.get('licenseNumber') as string) || undefined;

  if (!name || !email || !password) {
    return { success: false, error: 'Name, email and password are required.' };
  }

  const res = await authService.register({
    name,
    email,
    password,
    phone,
    role,
    agencyName,
    licenseNumber,
  });

  if (res.error || !res.user) {
    return { success: false, error: res.error || 'Registration failed.' };
  }

  revalidatePath('/', 'layout');
  return { success: true, user: res.user };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  await authService.logout();
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function switchDemoRoleAction(role: UserRole): Promise<{ success: boolean; user?: User; error?: string }> {
  const user = await authService.switchDemoRole(role);
  if (!user) {
    return { success: false, error: `Could not switch to role ${role}` };
  }
  revalidatePath('/', 'layout');
  return { success: true, user };
}

export async function resetPasswordAction(email: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  return authService.resetPassword(email, newPassword);
}

export async function updateProfileDetailsAction(data: {
  name: string;
  phone: string;
  agencyName?: string;
  licenseNumber?: string;
  bio?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const user = await authService.requireUser();
    const { userRepository } = await import('../repositories/user-repository');
    const updated = await userRepository.update(user.id, data);
    revalidatePath('/profile');
    revalidatePath('/settings');
    return { success: true, user: updated || undefined };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update profile.' };
  }
}

// --- PROPERTY ACTIONS ---

export async function getPropertiesAction(filters: {
  search?: string;
  city?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  verifiedOnly?: boolean;
} = {}): Promise<Property[]> {
  return propertyService.searchProperties(filters);
}

export async function getPropertyAction(id: string): Promise<Property | null> {
  return propertyService.getProperty(id);
}

export async function getUserPropertiesAction(): Promise<Property[]> {
  const user = await authService.requireUser();
  return propertyService.getUserProperties(user.id);
}

export async function createPropertyDraftAction(data: {
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
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
}): Promise<{ success: boolean; property?: Property; error?: string }> {
  try {
    const user = await authService.requireRole(['OWNER', 'AGENT', 'ADMIN']);
    const property = await propertyService.createDraft(user, data);
    revalidatePath('/marketplace');
    revalidatePath('/dashboard');
    return { success: true, property };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create listing draft.' };
  }
}

export async function addPropertyDocumentAction(
  propertyId: string,
  documentType: DocumentType,
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await propertyService.addDocument(user, propertyId, documentType, fileName);
    revalidatePath(`/property/${propertyId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to upload document.' };
  }
}

export async function uploadPropertyDocumentAction(
  formData: FormData
): Promise<{ success: boolean; document?: PropertyDocument; error?: string }> {
  try {
    const user = await authService.requireUser();
    const propertyId = formData.get('propertyId') as string;
    const documentType = formData.get('documentType') as DocumentType;
    const file = formData.get('file') as File;

    if (!propertyId || !documentType || !file) {
      return { success: false, error: 'Property ID, document type, and file are required.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const doc = await documentService.uploadDocument(
      user,
      propertyId,
      buffer,
      file.name,
      file.type,
      documentType
    );

    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/landlord/add-property');
    return { success: true, document: doc };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to upload confidential document.' };
  }
}

export async function deletePropertyDocumentAction(
  propertyId: string,
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await documentService.deleteDocument(user, propertyId, documentId);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/landlord/add-property');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete document.' };
  }
}

export async function reviewPropertyDocumentAction(
  propertyId: string,
  documentId: string,
  status: DocumentStatus,
  reviewNotes?: string
): Promise<{ success: boolean; document?: PropertyDocument; error?: string }> {
  try {
    const admin = await authService.requireRole(['ADMIN']);
    const doc = await documentService.reviewDocument(admin, propertyId, documentId, status, reviewNotes);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/admin');
    return { success: true, document: doc };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to audit document.' };
  }
}

export async function updatePropertyDraftAction(
  propertyId: string,
  data: any
): Promise<{ success: boolean; property?: Property; error?: string }> {
  try {
    const user = await authService.requireUser();
    const property = await propertyService.updateDraft(user, propertyId, data);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/landlord/add-property');
    revalidatePath('/profile');
    return { success: true, property };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update draft.' };
  }
}

export async function getPropertyDraftAction(
  propertyId: string
): Promise<{ success: boolean; property?: Property; error?: string }> {
  try {
    const user = await authService.requireUser();
    const property = await propertyService.getProperty(propertyId);
    if (!property) return { success: false, error: 'Property not found.' };

    if (property.ownerId !== user.id && property.authorizedAgentId !== user.id && user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized to view this draft.' };
    }

    return { success: true, property };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retrieve draft.' };
  }
}

export async function submitPropertyAction(propertyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await propertyService.submitForReview(user, propertyId);
    revalidatePath('/marketplace');
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit property for review.' };
  }
}

// --- VERIFICATION ACTIONS (ADMIN) ---

export async function getVerificationQueueAction() {
  const user = await authService.requireRole(['ADMIN']);
  return verificationService.listQueue();
}

export async function updateVerificationChecklistAction(
  propertyId: string,
  updates: {
    ownerIdentityStatus?: VerificationSubStatus;
    locationStatus?: VerificationSubStatus;
    authorityDocumentStatus?: VerificationSubStatus;
    availabilityStatus?: VerificationSubStatus;
    mediaStatus?: VerificationSubStatus;
    inspectionStatus?: VerificationSubStatus;
    overallStatus?: VerificationOverallStatus;
    reviewNotes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await authService.requireRole(['ADMIN']);
    await verificationService.updateChecklist(admin, propertyId, updates);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update verification checklist.' };
  }
}

export async function approveVerificationAction(
  propertyId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await authService.requireRole(['ADMIN']);
    await verificationService.approveVerification(admin, propertyId, notes);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/marketplace');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve verification.' };
  }
}

export async function rejectVerificationAction(
  propertyId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await authService.requireRole(['ADMIN']);
    await verificationService.rejectVerification(admin, propertyId, notes);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/marketplace');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reject verification.' };
  }
}

export async function requestVerificationChangesAction(
  propertyId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await authService.requireRole(['ADMIN']);
    await verificationService.requestChanges(admin, propertyId, notes);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to request changes.' };
  }
}

// --- INSPECTION ACTIONS ---

export async function requestInspectionAction(data: {
  propertyId: string;
  preferredDate: string;
  preferredTimeSlot: string;
  type: InspectionType;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await inspectionService.requestInspection(user, data);
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to request inspection.' };
  }
}

export async function getUserInspectionsAction() {
  const user = await authService.requireUser();
  return inspectionService.getUserInspections(user);
}

export async function updateInspectionStatusAction(
  inspectionId: string,
  status: InspectionStatus,
  notes?: string,
  rescheduleData?: { preferredDate: string; preferredTimeSlot: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await inspectionService.updateStatus(user, inspectionId, status, notes, rescheduleData);
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update inspection.' };
  }
}

export async function proposeInspectionScheduleAction(
  inspectionId: string,
  proposedDate: string,
  proposedTimeSlot: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await inspectionService.updateStatus(user, inspectionId, 'RESCHEDULED', notes, {
      preferredDate: proposedDate,
      preferredTimeSlot: proposedTimeSlot,
    });
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to propose schedule.' };
  }
}

export async function completeInspectionAction(
  inspectionId: string,
  record: Partial<InspectionRecord>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await inspectionService.completeInspection(user, inspectionId, record);
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit inspection record.' };
  }
}

// --- ENQUIRY / MESSAGING ACTIONS ---

export async function sendEnquiryAction(
  propertyId: string,
  message: string
): Promise<{ success: boolean; enquiryId?: string; error?: string }> {
  try {
    const user = await authService.requireUser();
    const enquiry = await enquiryService.sendEnquiry(user, propertyId, message);
    revalidatePath('/messages');
    return { success: true, enquiryId: enquiry.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send message.' };
  }
}

export async function replyEnquiryAction(
  enquiryId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await enquiryService.reply(user, enquiryId, text);
    revalidatePath('/messages');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send reply.' };
  }
}

export async function getUserEnquiriesAction() {
  const user = await authService.requireUser();
  return enquiryService.getUserEnquiries(user);
}

export async function getEnquiryAction(id: string) {
  const user = await authService.requireUser();
  return enquiryService.getEnquiry(user, id);
}

// --- APPLICATION / EXPRESSION OF INTEREST ACTIONS ---

export async function submitApplicationAction(data: {
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
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await applicationService.submitApplication(user, data);
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit expression of interest.' };
  }
}

export async function getUserApplicationsAction() {
  const user = await authService.requireUser();
  return applicationService.getUserApplications(user);
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: ApplicationStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await applicationService.updateStatus(user, applicationId, status, notes);
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update application status.' };
  }
}

// --- TRUST & SAFETY / REPORT ACTIONS ---

export async function fileReportAction(
  propertyId: string,
  reason: ReportReason,
  description: string
): Promise<{ success: boolean; report?: ListingReport; error?: string }> {
  try {
    const user = await authService.requireUser();
    const report = await reportService.fileReport(user, { propertyId, reason, description });
    return { success: true, report };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to file report.' };
  }
}

export const createListingReportAction = fileReportAction;

export async function getReportsAction() {
  const admin = await authService.requireRole(['ADMIN']);
  return reportService.getAllReports(admin);
}

export async function updateReportStatusAction(
  reportId: string,
  status: ReportStatus,
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await authService.requireRole(['ADMIN']);
    await reportService.updateReportStatus(admin, reportId, status, resolutionNotes);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update report status.' };
  }
}

// --- AUDIT LOG ACTIONS ---

export async function getAuditLogsAction(limit = 50) {
  const admin = await authService.requireRole(['ADMIN']);
  return auditService.getRecentLogs(admin, limit);
}

// --- MODERATION & USER MANAGEMENT ACTIONS (PRD Section 13) ---

export async function suspendPropertyAction(
  propertyId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await authService.requireRole(['ADMIN']);
    await propertyService.suspendProperty(admin, propertyId, reason);
    revalidatePath('/admin');
    revalidatePath('/marketplace');
    revalidatePath(`/property/${propertyId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to suspend property.' };
  }
}

export async function restorePropertyAction(
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await authService.requireRole(['ADMIN']);
    await propertyService.restoreProperty(admin, propertyId);
    revalidatePath('/admin');
    revalidatePath('/marketplace');
    revalidatePath(`/property/${propertyId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to restore property.' };
  }
}

export async function getUsersAction(): Promise<User[]> {
  const admin = await authService.requireRole(['ADMIN']);
  return authService.getAllUsers(admin);
}

export async function updateUserStatusAction(
  userId: string,
  status: UserVerificationStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await authService.requireRole(['ADMIN']);
    await authService.updateUserVerificationStatus(admin, userId, status);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user status.' };
  }
}

// --- PROPERTY MEDIA ACTIONS (PRD Section 7) ---

export async function uploadPropertyMediaAction(
  formData: FormData
): Promise<{ success: boolean; media?: PropertyMedia; error?: string }> {
  try {
    const user = await authService.requireUser();
    const propertyId = (formData.get('propertyId') as string) || '';
    const file = formData.get('file') as File | null;
    const caption = (formData.get('caption') as string) || undefined;
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!propertyId) {
      return { success: false, error: 'Property ID is required.' };
    }
    if (!file) {
      return { success: false, error: 'Media file is required.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const media = await mediaService.uploadMedia(
      user,
      propertyId,
      buffer,
      file.name,
      file.type,
      caption,
      isPrimary
    );

    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/landlord/add-property');
    revalidatePath('/marketplace');
    return { success: true, media };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to upload property media.' };
  }
}

export async function addPropertyMediaRecordAction(
  propertyId: string,
  data: {
    url: string;
    type?: MediaType;
    caption?: string;
    isPrimary?: boolean;
    fileName?: string;
  }
): Promise<{ success: boolean; media?: PropertyMedia; error?: string }> {
  try {
    const user = await authService.requireUser();
    const media = await mediaService.addMediaRecord(user, propertyId, data);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/landlord/add-property');
    return { success: true, media };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add media record.' };
  }
}

export async function updatePropertyMediaAction(
  propertyId: string,
  mediaId: string,
  updates: {
    caption?: string;
    isPrimary?: boolean;
    order?: number;
  }
): Promise<{ success: boolean; media?: PropertyMedia; error?: string }> {
  try {
    const user = await authService.requireUser();
    const media = await mediaService.updateMedia(user, propertyId, mediaId, updates);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/landlord/add-property');
    return { success: true, media };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update media.' };
  }
}

export async function deletePropertyMediaAction(
  propertyId: string,
  mediaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await mediaService.deleteMedia(user, propertyId, mediaId);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/landlord/add-property');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete media.' };
  }
}

export async function reorderPropertyMediaAction(
  propertyId: string,
  orderedIds: string[]
): Promise<{ success: boolean; media?: PropertyMedia[]; error?: string }> {
  try {
    const user = await authService.requireUser();
    const media = await mediaService.reorderMedia(user, propertyId, orderedIds);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/landlord/add-property');
    return { success: true, media };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reorder media.' };
  }
}

export async function transitionPropertyStatusAction(
  propertyId: string,
  newStatus: ListingStatus,
  reason?: string
): Promise<{ success: boolean; property?: Property; error?: string }> {
  try {
    const user = await authService.requireUser();
    const property = await propertyService.transitionListingStatus(user, propertyId, newStatus, reason);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/marketplace');
    revalidatePath('/profile');
    revalidatePath('/admin');
    return { success: true, property };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update property status.' };
  }
}

// --- NOTIFICATION ACTIONS (PRD Section 16) ---

export async function getUserNotificationsAction() {
  const user = await authService.requireUser();
  return notificationService.getUserNotifications(user);
}

export async function markNotificationAsReadAction(notificationId: string) {
  const user = await authService.requireUser();
  return notificationService.markAsRead(user, notificationId);
}

export async function markAllNotificationsAsReadAction() {
  const user = await authService.requireUser();
  await notificationService.markAllAsRead(user);
  return { success: true };
}

export async function getUnreadNotificationCountAction() {
  const user = await authService.requireUser();
  return notificationService.getUnreadCount(user);
}

// --- PHASE 2: KYC & IDENTITY GOVERNANCE ACTIONS ---

export async function submitKycAction(data: {
  documentType: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD';
  documentNumber: string;
  documentUrl?: string;
}) {
  try {
    const user = await authService.requireUser();
    const updated = await authService.submitKyc(user, data);
    revalidatePath('/profile');
    revalidatePath('/landlord/dashboard');
    revalidatePath('/agent/dashboard');
    return { success: true, user: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit KYC.' };
  }
}

export async function reviewKycAction(
  targetUserId: string,
  outcome: 'VERIFIED' | 'REJECTED' | 'CHANGES_REQUIRED',
  notes?: string
) {
  try {
    const reviewer = await authService.requireUser();
    const updated = await authService.reviewKyc(reviewer, targetUserId, outcome, notes);
    revalidatePath('/admin');
    return { success: true, user: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to review KYC.' };
  }
}

export async function updateUserRoleAction(targetUserId: string, newRole: UserRole) {
  try {
    const actor = await authService.requireUser();
    const updated = await authService.updateUserRole(actor, targetUserId, newRole);
    revalidatePath('/admin');
    return { success: true, user: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user role.' };
  }
}

// --- PHASE 2: OWNER-AGENT RELATIONSHIP ACTIONS ---

export async function inviteAgentAction(data: {
  agentEmail: string;
  mandateType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | 'JOINT' | 'SUB_AGENT';
  commissionRate?: string;
  scope?: string;
  propertyIds?: string[];
  expiresAt?: string;
  notes?: string;
}) {
  try {
    const owner = await authService.requireUser();
    const relationship = await relationshipService.inviteAgent(owner, data);
    revalidatePath('/landlord/dashboard');
    return { success: true, relationship };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send agent invitation.' };
  }
}

export async function respondToInvitationAction(
  relationshipId: string,
  action: 'ACCEPT' | 'REJECT',
  notes?: string
) {
  try {
    const agent = await authService.requireUser();
    const relationship = await relationshipService.respondToInvitation(agent, relationshipId, action, notes);
    revalidatePath('/agent/dashboard');
    revalidatePath('/landlord/dashboard');
    return { success: true, relationship };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to respond to invitation.' };
  }
}

export async function revokeRelationshipAction(relationshipId: string, reason?: string) {
  try {
    const actor = await authService.requireUser();
    const relationship = await relationshipService.revokeRelationship(actor, relationshipId, reason);
    revalidatePath('/landlord/dashboard');
    revalidatePath('/agent/dashboard');
    return { success: true, relationship };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to revoke mandate.' };
  }
}

export async function getOwnerRelationshipsAction() {
  const owner = await authService.requireUser();
  return relationshipService.getOwnerRelationships(owner.id);
}

export async function getAgentRelationshipsAction() {
  const agent = await authService.requireUser();
  return relationshipService.getAgentRelationships(agent.id);
}

// --- PHASE 2: AGENT CREDENTIAL & VERIFICATION LEVEL ACTIONS ---

export async function submitAgentCredentialAction(data: {
  level: AgentVerificationLevel;
  credentialType: AgentCredential['credentialType'];
  title: string;
  issuingAuthority: string;
  registrationNumber: string;
  documentUrl?: string;
  fileReference?: string;
  issuedAt?: string;
  expiresAt?: string;
}) {
  try {
    const agent = await authService.requireUser();
    const credential = await agentCredentialService.submitCredential(agent, data);
    revalidatePath('/agent/dashboard');
    return { success: true, credential };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit agent credential.' };
  }
}

export async function reviewAgentCredentialAction(
  credentialId: string,
  status: 'VERIFIED' | 'REJECTED' | 'EXPIRED',
  reviewNotes?: string
) {
  try {
    const reviewer = await authService.requireUser();
    const result = await agentCredentialService.reviewCredential(reviewer, credentialId, status, reviewNotes);
    revalidatePath('/admin');
    revalidatePath('/agent/dashboard');
    return { success: true, ...result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to review credential.' };
  }
}

export async function getAgentCredentialsAction(agentId?: string) {
  const user = await authService.requireUser();
  const targetId = agentId || user.id;
  return agentCredentialService.getAgentCredentials(targetId);
}

export async function getAgentLevelExplanationAction(level?: AgentVerificationLevel) {
  const user = await authService.requireUser();
  const targetLevel = level || user.agentVerificationLevel || 'LEVEL_0_UNVERIFIED';
  return agentCredentialService.getVerificationLevelExplanation(targetLevel);
}

// --- PHASE 2: INSPECTION ESCALATION ACTIONS ---

export async function escalateInspectionAction(
  inspectionId: string,
  reason: string,
  discrepancyDetails: string
) {
  try {
    const reporter = await authService.requireUser();
    const result = await inspectionService.escalateInspection(reporter, inspectionId, reason, discrepancyDetails);
    revalidatePath('/admin');
    return { success: true, ...result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to escalate inspection.' };
  }
}

export async function resolveInspectionEscalationAction(
  inspectionId: string,
  resolutionNotes: string
) {
  try {
    const reviewer = await authService.requireUser();
    const updated = await inspectionService.resolveEscalation(reviewer, inspectionId, resolutionNotes);
    revalidatePath('/admin');
    return { success: true, inspection: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to resolve inspection escalation.' };
  }
}

// --- PHASE 3: AGENT ACTIVITY, LOCATION DISCREPANCY, & FEE BREAKDOWN ACTIONS ---

export async function getAgentActivityForOwnerAction(propertyId?: string) {
  try {
    const owner = await authService.requireUser();
    const activities = await relationshipService.getAgentActivityForOwner(owner, propertyId);
    return { success: true, activities };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch agent activities.' };
  }
}

export async function reportLocationDiscrepancyAction(
  propertyId: string,
  data: {
    reportedLatitude?: number;
    reportedLongitude?: number;
    discrepancyNotes: string;
  }
) {
  try {
    const reporter = await authService.requireUser();
    const result = await propertyService.reportLocationDiscrepancy(reporter, propertyId, data);
    revalidatePath(`/property/${propertyId}`);
    revalidatePath('/admin');
    return { success: true, ...result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to report location discrepancy.' };
  }
}

export async function calculateFeeBreakdownAction(
  propertyId: string,
  offerAmount?: number
) {
  try {
    const property = await propertyService.getPropertyById(propertyId);
    if (!property) {
      return { success: false, error: 'Property not found.' };
    }
    const feeBreakdown = applicationService.calculateFeeBreakdown(property, offerAmount);
    return { success: true, feeBreakdown };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to calculate fee breakdown.' };
  }
}
