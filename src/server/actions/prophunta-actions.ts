'use server';

import { revalidatePath } from 'next/cache';
import {
  User,
  UserRole,
  Property,
  PropertyType,
  ListingType,
  InspectionType,
  InspectionStatus,
  InspectionRecord,
  ReportReason,
  ReportStatus,
  ApplicationType,
  ApplicationStatus,
  VerificationSubStatus,
  VerificationOverallStatus,
  DocumentType,
  UserVerificationStatus,
} from '@/types/prophunta';
import { authService } from '../services/auth-service';
import { propertyService } from '../services/property-service';
import { verificationService } from '../services/verification-service';
import { inspectionService } from '../services/inspection-service';
import { enquiryService } from '../services/enquiry-service';
import { applicationService } from '../services/application-service';
import { reportService } from '../services/report-service';
import { auditService } from '../services/audit-service';

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
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await inspectionService.updateStatus(user, inspectionId, status, notes);
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update inspection.' };
  }
}

export async function completeInspectionAction(
  inspectionId: string,
  record: Omit<InspectionRecord, 'completedAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await inspectionService.completeInspection(user, inspectionId, record);
    revalidatePath('/profile');
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
  return enquiryService.getEnquiry(id);
}

// --- APPLICATION / EXPRESSION OF INTEREST ACTIONS ---

export async function submitApplicationAction(data: {
  propertyId: string;
  type: ApplicationType;
  occupation?: string;
  moveInDate?: string;
  occupants?: number;
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authService.requireUser();
    await reportService.fileReport(user, { propertyId, reason, description });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to file report.' };
  }
}

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

