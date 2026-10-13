'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  Home,
  Users,
  FileText,
  CalendarCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSignature,
  Building2,
  Search,
  Check,
  X,
  ExternalLink,
  Loader2,
  BadgeAlert,
  ArrowRight,
  Eye,
  History,
  Lock,
  UserCheck,
  UserX,
  Download,
  FileCheck,
  FileWarning,
  Info,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase,
  Key,
  FileCheck2,
  UserPlus,
  RefreshCw,
  FileSpreadsheet,
  CheckCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUserRole } from '@/context/UserRoleContext';
import { useToast } from '@/hooks/use-toast';
import {
  getPropertiesAction,
  getReportsAction,
  getUserInspectionsAction,
  getAuditLogsAction,
  approveVerificationAction,
  rejectVerificationAction,
  requestVerificationChangesAction,
  updateVerificationChecklistAction,
  reviewPropertyDocumentAction,
  updateReportStatusAction,
  updateInspectionStatusAction,
  completeInspectionAction,
  resolveInspectionEscalationAction,
  getUsersAction,
  updateUserStatusAction,
  suspendPropertyAction,
  restorePropertyAction,
  getCurrentStaffContextAction,
  getStaffDirectoryAction,
  inviteStaffAction,
  updateStaffRolesAction,
  grantCustomPermissionAction,
  revokeCustomPermissionAction,
  updateStaffStatusAction,
  previewStaffPermissionsAction,
  getAllApprovalsAction,
  decideApprovalAction,
  cancelApprovalRequestAction,
  executeEmergencyOverrideAction,
  verifyAuditTrailIntegrityAction,
  exportAuditLogsAction,
} from '@/server/actions/prophunta-actions';
import {
  Property,
  ListingReport,
  InspectionRequest,
  AuditLog,
  VerificationSubStatus,
  ReportStatus,
  User,
  UserVerificationStatus,
  PropertyDocument,
  DocumentStatus,
  StaffAccount,
  StaffRole,
  StaffStatus,
  AdminPermission,
  ApprovalRequest,
  ApprovalActionType,
} from '@/types/prophunta';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const VERIFICATION_STATUS_OPTIONS: { value: VerificationSubStatus; label: string }[] = [
  { value: 'PASSED', label: 'Passed' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CHANGES_REQUIRED', label: 'Changes Required' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'NOT_REVIEWED', label: 'Not Reviewed' },
];

const ALL_STAFF_ROLES: { role: StaffRole; label: string; desc: string; badgeClass: string }[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full administrative authority', badgeClass: 'bg-red-100 text-red-800 border-red-200' },
  { role: 'VERIFICATION_OFFICER', label: 'Verification Officer', desc: 'Title document authentication & review', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { role: 'PROPERTY_MODERATOR', label: 'Property Moderator', desc: 'Listing moderation & suspension', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  { role: 'TRUST_SAFETY_INVESTIGATOR', label: 'Trust & Safety', desc: 'Fraud reports & investigations', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
  { role: 'INSPECTION_COORDINATOR', label: 'Inspection Coordinator', desc: 'Field & video inspection audits', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { role: 'USER_SUPPORT_OFFICER', label: 'User Support', desc: 'Account support & KYC inquiries', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { role: 'COMPLIANCE_AUDITOR', label: 'Compliance Auditor', desc: 'Read-only audit trail & approval reviewer', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { role: 'STAFF_MANAGER', label: 'Staff Manager', desc: 'Delegated staff provisioning within ceilings', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
];

const GRANTABLE_PERMISSIONS: { perm: AdminPermission; label: string; desc: string }[] = [
  { perm: 'documents.view_sensitive', label: 'View Sensitive Documents', desc: 'Access confidential title deeds and land registry certificates' },
  { perm: 'properties.suspend', label: 'Suspend Property Listings', desc: 'Take down fraudulent or non-compliant listings' },
  { perm: 'users.suspend', label: 'Suspend Platform Users', desc: 'Restrict user access for safety violations' },
  { perm: 'audit_logs.export', label: 'Export Audit Logs', desc: 'Generate compliance export files (CSV/JSON)' },
  { perm: 'approvals.approve', label: 'Four-Eyes Dual Approver', desc: 'Authorize independent approval of high-impact changes' },
  { perm: 'approvals.reject', label: 'Four-Eyes Rejector', desc: 'Reject non-compliant high-impact change requests' },
];

function AdminPortalContent() {
  const { userRole, currentUser, isLoading } = useUserRole();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'verification';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Phase 7 Staff Governance & Approval States
  const [staffContext, setStaffContext] = useState<{
    staffAccount: StaffAccount;
    effectivePermissions: AdminPermission[];
    activeRoles: StaffRole[];
    scope: any;
  } | null>(null);
  const [staffDirectory, setStaffDirectory] = useState<StaffAccount[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('ALL');
  const [integrityResult, setIntegrityResult] = useState<{ isValid: boolean; totalLogs: number; checkedAt: string; error?: string } | null>(null);

  // Staff Modals State
  const [isInviteStaffOpen, setIsInviteStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRoles, setNewStaffRoles] = useState<StaffRole[]>(['VERIFICATION_OFFICER']);

  const [selectedStaffForRoleEdit, setSelectedStaffForRoleEdit] = useState<StaffAccount | null>(null);
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false);
  const [editingRoles, setEditingRoles] = useState<StaffRole[]>([]);

  const [selectedStaffForGrant, setSelectedStaffForGrant] = useState<StaffAccount | null>(null);
  const [isCustomGrantOpen, setIsCustomGrantOpen] = useState(false);
  const [grantPerm, setGrantPerm] = useState<AdminPermission>('documents.view_sensitive');
  const [grantReason, setGrantReason] = useState('');
  const [grantDuration, setGrantDuration] = useState('48');

  const [selectedStaffForPreview, setSelectedStaffForPreview] = useState<StaffAccount | null>(null);
  const [isPreviewPermsOpen, setIsPreviewPermsOpen] = useState(false);
  const [permsPreview, setPermsPreview] = useState<any>(null);

  // Four-Eyes Approval Modals State
  const [rejectingApprovalId, setRejectingApprovalId] = useState<string | null>(null);
  const [isRejectApprovalOpen, setIsRejectApprovalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [isEmergencyOverrideOpen, setIsEmergencyOverrideOpen] = useState(false);
  const [overrideActionType, setOverrideActionType] = useState<ApprovalActionType>('PROPERTY_RESTORE');
  const [overrideResourceId, setOverrideResourceId] = useState('');
  const [overrideIncidentRef, setOverrideIncidentRef] = useState('');
  const [overrideJustification, setOverrideJustification] = useState('');

  // Review Dialog State (PRD Section 12)
  const [reviewProperty, setReviewProperty] = useState<Property | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Granular sub-statuses for verification checklist
  const [ownerIdStatus, setOwnerIdStatus] = useState<VerificationSubStatus>('PENDING');
  const [locStatus, setLocStatus] = useState<VerificationSubStatus>('PENDING');
  const [docStatus, setDocStatus] = useState<VerificationSubStatus>('PENDING');
  const [availStatus, setAvailStatus] = useState<VerificationSubStatus>('PENDING');
  const [mediaStatus, setMediaStatus] = useState<VerificationSubStatus>('PENDING');
  const [inspStatus, setInspStatus] = useState<VerificationSubStatus>('PENDING');

  // User Inspection Modal State (PRD Section 13)
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);
  const [isUserInspectOpen, setIsUserInspectOpen] = useState(false);

  // Admin Inspection Findings & Escalation Modal State (PRD Section 15)
  const [adminInspectionRecordDialogOpen, setAdminInspectionRecordDialogOpen] = useState(false);
  const [adminSelectedInspection, setAdminSelectedInspection] = useState<InspectionRequest | null>(null);
  const [adminEscalationDialogOpen, setAdminEscalationDialogOpen] = useState(false);
  const [adminTargetEscalation, setAdminTargetEscalation] = useState<InspectionRequest | null>(null);
  const [adminResolutionNotes, setAdminResolutionNotes] = useState('');
  const [adminResolvingEscalation, setAdminResolvingEscalation] = useState(false);

  const handleResolveInspectionEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTargetEscalation) return;
    setAdminResolvingEscalation(true);
    const res = await resolveInspectionEscalationAction(adminTargetEscalation.id, adminResolutionNotes);
    setAdminResolvingEscalation(false);
    if (res.success) {
      toast({ title: 'Escalation Resolved', description: 'Inspection escalation successfully resolved and logged.' });
      setAdminEscalationDialogOpen(false);
      setInspections((prev) =>
        prev.map((i) =>
          i.id === adminTargetEscalation.id
            ? { ...i, escalationStatus: 'RESOLVED', escalationNotes: adminResolutionNotes }
            : i
        )
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to resolve escalation.' });
    }
  };

  // Property Documents Modal State (PRD Section 13)
  const [inspectDocsProperty, setInspectDocsProperty] = useState<Property | null>(null);
  const [isDocsDialogOpen, setIsDocsDialogOpen] = useState(false);

  const can = (perm: AdminPermission): boolean => {
    if (!staffContext) {
      return currentUser?.role === 'ADMIN';
    }
    return staffContext.effectivePermissions.includes(perm);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [props, reps, insps, auds, usrs, staffCtxRes, staffDirRes, approvalsRes] = await Promise.all([
        getPropertiesAction(),
        getReportsAction().catch(() => []),
        getUserInspectionsAction().catch(() => []),
        getAuditLogsAction().catch(() => []),
        getUsersAction().catch(() => []),
        getCurrentStaffContextAction().catch(() => ({ success: false, context: null })),
        getStaffDirectoryAction().catch(() => ({ success: false, staff: [] })),
        getAllApprovalsAction().catch(() => ({ success: false, requests: [] })),
      ]);
      setProperties(props);
      setReports(reps);
      setInspections(insps);
      setAuditLogs(auds);
      setUsers(usrs);
      if (staffCtxRes?.success && staffCtxRes.context) {
        setStaffContext(staffCtxRes.context);
      }
      if (staffDirRes?.success && staffDirRes.staff) {
        setStaffDirectory(staffDirRes.staff);
      }
      if (approvalsRes?.success && approvalsRes.requests) {
        setApprovalRequests(approvalsRes.requests);
      }
    } catch (err) {
      console.warn('Error loading admin portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReviewDialog = (prop: Property) => {
    setReviewProperty(prop);
    const v = prop.verification;
    setOwnerIdStatus(v?.ownerIdentityStatus || 'PENDING');
    setLocStatus(v?.locationStatus || 'PENDING');
    setDocStatus(v?.authorityDocumentStatus || 'PENDING');
    setAvailStatus(v?.availabilityStatus || 'PENDING');
    setMediaStatus(v?.mediaStatus || 'PENDING');
    setInspStatus(v?.inspectionStatus || 'PENDING');
    setReviewNotes(v?.reviewNotes || '');
    setIsReviewOpen(true);
  };

  const handleApprove = async () => {
    if (!reviewProperty) return;
    setSubmittingAction(true);
    await updateVerificationChecklistAction(reviewProperty.id, {
      ownerIdentityStatus: ownerIdStatus === 'PENDING' ? 'PASSED' : ownerIdStatus,
      locationStatus: locStatus === 'PENDING' ? 'PASSED' : locStatus,
      authorityDocumentStatus: docStatus === 'PENDING' ? 'PASSED' : docStatus,
      availabilityStatus: availStatus === 'PENDING' ? 'PASSED' : availStatus,
      mediaStatus: mediaStatus === 'PENDING' ? 'PASSED' : mediaStatus,
      inspectionStatus: inspStatus === 'PENDING' ? 'PASSED' : inspStatus,
      reviewNotes,
    });
    const res = await approveVerificationAction(reviewProperty.id, reviewNotes);
    setSubmittingAction(false);

    if (res.success) {
      toast({
        title: 'Listing Approved & Verified',
        description: `"${reviewProperty.title}" is now officially marked VERIFIED with audited badges.`,
      });
      setIsReviewOpen(false);
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to approve.' });
    }
  };

  const handleReject = async () => {
    if (!reviewProperty) return;
    setSubmittingAction(true);
    await updateVerificationChecklistAction(reviewProperty.id, {
      ownerIdentityStatus: ownerIdStatus,
      locationStatus: locStatus,
      authorityDocumentStatus: docStatus,
      availabilityStatus: availStatus,
      mediaStatus: mediaStatus,
      inspectionStatus: inspStatus,
      reviewNotes,
    });
    const res = await rejectVerificationAction(reviewProperty.id, reviewNotes);
    setSubmittingAction(false);

    if (res.success) {
      toast({
        variant: 'destructive',
        title: 'Listing Rejected',
        description: `"${reviewProperty.title}" was marked as failed verification.`,
      });
      setIsReviewOpen(false);
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to reject.' });
    }
  };

  const handleRequestChanges = async () => {
    if (!reviewProperty) return;
    setSubmittingAction(true);
    await updateVerificationChecklistAction(reviewProperty.id, {
      ownerIdentityStatus: ownerIdStatus,
      locationStatus: locStatus,
      authorityDocumentStatus: docStatus,
      availabilityStatus: availStatus,
      mediaStatus: mediaStatus,
      inspectionStatus: inspStatus,
      reviewNotes,
    });
    const res = await requestVerificationChangesAction(reviewProperty.id, reviewNotes);
    setSubmittingAction(false);

    if (res.success) {
      toast({
        title: 'Changes Requested',
        description: `Owner/Agent has been instructed to upload clarified documentation.`,
      });
      setIsReviewOpen(false);
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to request changes.' });
    }
  };

  const handleSaveChecklistDraft = async () => {
    if (!reviewProperty) return;
    setSubmittingAction(true);
    const res = await updateVerificationChecklistAction(reviewProperty.id, {
      ownerIdentityStatus: ownerIdStatus,
      locationStatus: locStatus,
      authorityDocumentStatus: docStatus,
      availabilityStatus: availStatus,
      mediaStatus: mediaStatus,
      inspectionStatus: inspStatus,
      reviewNotes,
    });
    setSubmittingAction(false);

    if (res.success) {
      toast({
        title: 'Verification Checklist Saved',
        description: 'Audit parameters updated without finalizing approval.',
      });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to save checklist.' });
    }
  };

  const handleReviewDocument = async (propertyId: string, docId: string, status: DocumentStatus, notes?: string) => {
    const res = await reviewPropertyDocumentAction(propertyId, docId, status, notes);
    if (res.success) {
      toast({
        title: 'Document Audited',
        description: `Document status updated to ${status}.`,
      });
      loadData();
      if (reviewProperty && reviewProperty.id === propertyId) {
        setReviewProperty((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            documents: prev.documents?.map((d) => (d.id === docId ? { ...d, status, reviewNotes: notes } : d)),
          };
        });
      }
      if (inspectDocsProperty && inspectDocsProperty.id === propertyId) {
        setInspectDocsProperty((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            documents: prev.documents?.map((d) => (d.id === docId ? { ...d, status, reviewNotes: notes } : d)),
          };
        });
      }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to review document.' });
    }
  };

  const handleUpdateReport = async (reportId: string, status: ReportStatus, notes: string) => {
    const res = await updateReportStatusAction(reportId, status, notes);
    if (res.success) {
      toast({ title: 'Report Status Updated', description: `Report is now ${status}` });
      loadData();
    }
  };

  const handleSuspendProperty = async (propId: string) => {
    const res = await suspendPropertyAction(propId, 'Suspended by compliance officer.');
    if (res.success) {
      toast({ title: 'Listing Suspended', description: 'Listing pulled from public marketplace.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to suspend property.' });
    }
  };

  const handleRestoreProperty = async (propId: string) => {
    const res = await restorePropertyAction(propId);
    if (res.success) {
      toast({ title: 'Listing Restored', description: 'Listing is now active on public marketplace.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to restore property.' });
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const nextStatus: UserVerificationStatus = user.verificationStatus === 'SUSPENDED' ? 'VERIFIED' : 'SUSPENDED';
    const res = await updateUserStatusAction(user.id, nextStatus);
    if (res.success) {
      toast({
        title: nextStatus === 'SUSPENDED' ? 'User Suspended' : 'User Reinstated',
        description: `${user.name} status is now ${nextStatus}.`,
      });
      loadData();
      if (inspectedUser && inspectedUser.id === user.id) {
        setInspectedUser({ ...inspectedUser, verificationStatus: nextStatus });
      }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update user.' });
    }
  };

  // --- PHASE 7: STAFF MANAGEMENT HANDLERS ---
  const handleInviteStaff = async () => {
    if (!newStaffName.trim() || !newStaffEmail.trim() || newStaffRoles.length === 0) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Name, email, and at least one staff role are required.' });
      return;
    }
    setSubmittingAction(true);
    const res = await inviteStaffAction({
      name: newStaffName.trim(),
      email: newStaffEmail.trim().toLowerCase(),
      roles: newStaffRoles,
    });
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Staff Onboarded', description: `${newStaffName} has been invited as ${newStaffRoles.join(', ')}.` });
      setIsInviteStaffOpen(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffRoles(['VERIFICATION_OFFICER']);
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Onboarding Failed', description: res.error || 'Failed to onboard staff.' });
    }
  };

  const handleOpenRoleEdit = (staff: StaffAccount) => {
    setSelectedStaffForRoleEdit(staff);
    setEditingRoles([...staff.roles]);
    setIsManageRolesOpen(true);
  };

  const handleSaveStaffRoles = async () => {
    if (!selectedStaffForRoleEdit || editingRoles.length === 0) return;
    setSubmittingAction(true);
    const res = await updateStaffRolesAction(selectedStaffForRoleEdit.id, editingRoles);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Roles Updated', description: `Assigned roles updated for ${selectedStaffForRoleEdit.name}.` });
      setIsManageRolesOpen(false);
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: res.error || 'Failed to update roles.' });
    }
  };

  const handleOpenCustomGrant = (staff: StaffAccount) => {
    setSelectedStaffForGrant(staff);
    setGrantPerm('documents.view_sensitive');
    setGrantReason('');
    setGrantDuration('48');
    setIsCustomGrantOpen(true);
  };

  const handleGrantCustomPermission = async () => {
    if (!selectedStaffForGrant || !grantReason.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'A justification reason is required for custom grants.' });
      return;
    }
    setSubmittingAction(true);
    const res = await grantCustomPermissionAction(
      selectedStaffForGrant.id,
      grantPerm,
      grantReason.trim(),
      parseInt(grantDuration, 10) || 48
    );
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Custom Permission Granted', description: `[${grantPerm}] granted to ${selectedStaffForGrant.name} for ${grantDuration}h.` });
      setIsCustomGrantOpen(false);
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Grant Failed', description: res.error || 'Failed to grant permission.' });
    }
  };

  const handleRevokeCustomGrant = async (staffId: string, grantId: string) => {
    setSubmittingAction(true);
    const res = await revokeCustomPermissionAction(staffId, grantId);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Permission Revoked', description: 'Custom permission grant has been revoked.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Revocation Failed', description: res.error || 'Failed to revoke grant.' });
    }
  };

  const handleToggleStaffStatus = async (staff: StaffAccount) => {
    const nextStatus: StaffStatus = staff.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const reason = nextStatus === 'SUSPENDED' ? 'Administrative suspension' : 'Administrative reinstatement';
    setSubmittingAction(true);
    const res = await updateStaffStatusAction(staff.id, nextStatus, reason);
    setSubmittingAction(false);
    if (res.success) {
      toast({
        title: nextStatus === 'ACTIVE' ? 'Staff Reinstated' : 'Staff Suspended',
        description: `${staff.name} status is now ${nextStatus}. Active sessions invalidated.`,
      });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Status Update Failed', description: res.error || 'Failed to update status.' });
    }
  };

  const handleOpenPermsPreview = async (staff: StaffAccount) => {
    setSelectedStaffForPreview(staff);
    const res = await previewStaffPermissionsAction(staff.id);
    if (res.success && res.preview) {
      setPermsPreview(res.preview);
      setIsPreviewPermsOpen(true);
    } else {
      toast({ variant: 'destructive', title: 'Preview Error', description: res.error || 'Failed to preview permissions.' });
    }
  };

  // --- PHASE 7: FOUR-EYES APPROVAL HANDLERS ---
  const handleApproveRequest = async (approvalId: string) => {
    setSubmittingAction(true);
    const res = await decideApprovalAction(approvalId, 'APPROVE');
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Request Approved & Executed', description: 'High-impact operation successfully confirmed and atomically executed.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Approval Failed', description: res.error || 'Dual-custody approval failed.' });
    }
  };

  const handleOpenRejectModal = (approvalId: string) => {
    setRejectingApprovalId(approvalId);
    setRejectionReason('');
    setIsRejectApprovalOpen(true);
  };

  const handleRejectRequest = async () => {
    if (!rejectingApprovalId || !rejectionReason.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Mandatory rejection justification is required.' });
      return;
    }
    setSubmittingAction(true);
    const res = await decideApprovalAction(rejectingApprovalId, 'REJECT', rejectionReason.trim());
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Request Rejected', description: 'Approval request formally rejected and audited.' });
      setIsRejectApprovalOpen(false);
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Rejection Failed', description: res.error || 'Failed to reject request.' });
    }
  };

  const handleCancelRequest = async (approvalId: string) => {
    setSubmittingAction(true);
    const res = await cancelApprovalRequestAction(approvalId);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Request Cancelled', description: 'Pending approval request was retracted.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Cancellation Failed', description: res.error || 'Failed to cancel request.' });
    }
  };

  const handleExecuteEmergencyOverride = async () => {
    if (!overrideResourceId.trim() || !overrideIncidentRef.trim() || !overrideJustification.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Resource ID, incident ticket reference, and justification are mandatory.' });
      return;
    }
    setSubmittingAction(true);
    const targetResourceType =
      overrideActionType === 'PROPERTY_RESTORE'
        ? 'PROPERTY'
        : overrideActionType === 'PRIVILEGED_STAFF_ROLE_CHANGE'
        ? 'STAFF'
        : overrideActionType === 'PLATFORM_SETTINGS_CHANGE'
        ? 'SETTINGS'
        : 'USER';

    const res = await executeEmergencyOverrideAction({
      actionType: overrideActionType,
      targetResourceType,
      targetResourceId: overrideResourceId.trim(),
      proposedPayload: { reason: overrideJustification.trim() },
      incidentReference: overrideIncidentRef.trim(),
      mandatoryJustification: overrideJustification.trim(),
    });
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Emergency Override Executed', description: 'Action executed with incident reference and high-severity audit logging.' });
      setIsEmergencyOverrideOpen(false);
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Override Blocked', description: res.error || 'Emergency override execution failed.' });
    }
  };

  // --- PHASE 7: AUDIT INTEGRITY & EXPORT HANDLERS ---
  const handleVerifyAuditIntegrity = async () => {
    setSubmittingAction(true);
    const res = await verifyAuditTrailIntegrityAction();
    setSubmittingAction(false);
    if (res.success && res.verification) {
      setIntegrityResult({
        isValid: res.verification.isValid,
        totalLogs: res.verification.totalLogs,
        checkedAt: new Date().toLocaleTimeString(),
        error: res.verification.error,
      });
      if (res.verification.isValid) {
        toast({ title: 'Audit Trail Verified', description: `All ${res.verification.totalLogs} logs pass cryptographic SHA-256 hash chaining.` });
      } else {
        toast({ variant: 'destructive', title: 'Tamper Detected!', description: res.verification.error });
      }
    } else {
      toast({ variant: 'destructive', title: 'Verification Failed', description: res.error || 'Integrity check failed.' });
    }
  };

  const handleExportAuditLogs = async (format: 'csv' | 'json') => {
    setSubmittingAction(true);
    const res = await exportAuditLogsAction(format);
    setSubmittingAction(false);
    if (res.success && res.exportData) {
      const blob = new Blob([res.exportData.content], { type: res.exportData.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.exportData.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Audit Logs Exported', description: `Downloaded ${res.exportData.recordCount} audit entries as ${format.toUpperCase()}.` });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Export Failed', description: res.error || 'Failed to export audit logs.' });
    }
  };

  const pendingVerificationList = properties.filter(
    (p) => p.listingStatus === 'SUBMITTED' || p.listingStatus === 'UNDER_REVIEW' || p.listingStatus === 'CHANGES_REQUIRED'
  );

  const getHostForProperty = (p: Property) => {
    const hostId = p.authorizedAgentId || p.ownerId;
    return users.find((u) => u.id === hostId);
  };

  const getReportsForProperty = (propertyId: string) => {
    return reports.filter((r) => r.propertyId === propertyId);
  };

  if (isLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
        <div className="h-12 w-12 rounded-2xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700 shadow-sm mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-lime-700" />
        </div>
        <p className="text-sm font-bold text-slate-900 tracking-tight">Verifying Administrative Credentials...</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">Authenticating cryptographic staff session and platform verification permissions.</p>
      </div>
    );
  }

  const isAdminUser = currentUser?.role === 'ADMIN' || userRole === 'ADMIN' || !!staffContext;

  if (!isAdminUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Card className="max-w-md w-full p-8 text-center rounded-2xl border-slate-200/90 shadow-lg bg-white">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight font-headline">Access Restricted</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The Trust &amp; Verification Portal is strictly reserved for authorized platform administrators and verification officers.
          </p>
          <Button asChild className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl shadow-xs">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              PropHunta Trust & Verification Portal
            </h1>
            <Badge className="bg-emerald-600 text-white font-bold text-xs">
              Officer Console
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-xs text-slate-500">
              Administered by <strong>{currentUser?.name || 'Amina Bello'}</strong> ({currentUser?.email})
            </span>
            {staffContext?.activeRoles.map((r) => {
              const meta = ALL_STAFF_ROLES.find((m) => m.role === r);
              return (
                <Badge
                  key={r}
                  variant="outline"
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta?.badgeClass || 'bg-slate-100 text-slate-700'}`}
                >
                  {meta?.label || r}
                </Badge>
              );
            })}
            {staffContext?.staffAccount?.customGrants?.some((g: any) => g.status === 'ACTIVE' && new Date(g.expiresAt) > new Date()) && (
              <Badge className="text-[9px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                Custom Grants Active
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs font-semibold rounded-xl"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Refresh Records
          </Button>
          <Button size="sm" asChild className="bg-lime-600 hover:bg-lime-500 rounded-xl text-xs font-bold text-white">
            <Link href="/marketplace">View Public Marketplace</Link>
          </Button>
        </div>
      </div>

      {/* --- OVERVIEW METRIC CARDS --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Users */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Users</span>
              <Users className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{users.length}</div>
            <p className="text-[9px] text-purple-600 font-semibold mt-0.5">Seekers, Hosts & Agents</p>
          </CardContent>
        </Card>

        {/* Total Properties */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Properties</span>
              <Home className="h-3.5 w-3.5 text-lime-700" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{properties.length}</div>
            <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">
              {properties.filter((p) => p.listingStatus === 'VERIFIED' || p.listingStatus === 'ACTIVE').length} Verified
            </p>
          </CardContent>
        </Card>

        {/* Pending Verification */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verification</span>
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{pendingVerificationList.length}</div>
            <p className="text-[9px] text-amber-600 font-semibold mt-0.5">Audit Required</p>
          </CardContent>
        </Card>

        {/* Inspections */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inspections</span>
              <CalendarCheck2 className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{inspections.length}</div>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Field Audits</p>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reports</span>
              <BadgeAlert className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{reports.length}</div>
            <p className="text-[9px] text-rose-600 font-semibold mt-0.5">Trust & Safety</p>
          </CardContent>
        </Card>

        {/* Staff & Access */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Staff</span>
              <Briefcase className="h-3.5 w-3.5 text-cyan-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{staffDirectory.length}</div>
            <p className="text-[9px] text-cyan-700 font-semibold mt-0.5">RBAC Governed</p>
          </CardContent>
        </Card>

        {/* Four-Eyes Approvals */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approvals</span>
              <FileCheck2 className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {approvalRequests.filter((a) => a.status === 'PENDING').length}
            </div>
            <p className="text-[9px] text-purple-700 font-semibold mt-0.5">Dual-Custody Queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Console */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/90 p-1.5 rounded-2xl flex overflow-x-auto no-scrollbar whitespace-nowrap gap-1 w-full max-w-full">
          <TabsTrigger value="verification" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verification Queue ({pendingVerificationList.length})
          </TabsTrigger>
          <TabsTrigger value="properties" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
            <Home className="h-3.5 w-3.5" />
            Property Moderation ({properties.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
            <Users className="h-3.5 w-3.5" />
            User Management ({users.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
            <BadgeAlert className="h-3.5 w-3.5" />
            Trust & Safety ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="inspections" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            Inspections ({inspections.length})
          </TabsTrigger>
          <TabsTrigger value="staff" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
            <Briefcase className="h-3.5 w-3.5" />
            Staff & Governance ({staffDirectory.length})
          </TabsTrigger>
          <TabsTrigger value="approvals" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
            <FileCheck2 className="h-3.5 w-3.5" />
            Approval Queue ({approvalRequests.filter((a) => a.status === 'PENDING').length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
            <History className="h-3.5 w-3.5" />
            System Audit Trail ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: VERIFICATION QUEUE (PRD Section 12 & 13) --- */}
        <TabsContent value="verification" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">
                    Verification Queue
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Mandatory review queue for submitted listings requiring title authentication, location cadaster audit, and checklist verification.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-bold text-amber-700 bg-amber-50 border-amber-200">
                  {pendingVerificationList.length} Awaiting Audit
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pendingVerificationList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold text-slate-700">Verification Queue is Clear</p>
                  <p className="text-xs text-slate-400 mt-0.5">All submitted properties have been reviewed.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingVerificationList.map((p) => {
                    const host = getHostForProperty(p);
                    return (
                      <div
                        key={p.id}
                        className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Property Details */}
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="relative h-20 w-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <img
                              src={
                                p.media[0]?.url ||
                                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'
                              }
                              alt={p.title}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 truncate max-w-[280px]">
                                {p.title}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold uppercase ${
                                  p.listingStatus === 'SUBMITTED'
                                    ? 'text-lime-800 bg-lime-50 border-lime-200'
                                    : p.listingStatus === 'CHANGES_REQUIRED'
                                    ? 'text-orange-700 bg-orange-50 border-orange-200'
                                    : 'text-amber-700 bg-amber-50 border-amber-200'
                                }`}
                              >
                                {p.listingStatus}
                              </Badge>
                              <span className="text-xs font-black text-slate-900">
                                {formatCurrency(p.price, p.listingType === 'RENT' ? 'For Rent' : 'For Sale')}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {p.address}, {p.area}, {p.city}
                            </p>

                            {/* Owner / Agent & Submission Date Info */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">Host:</span>
                                <span className="font-bold text-slate-800">
                                  {host ? host.name : (p.authorizedAgentId ? 'Authorized Agent' : 'Direct Owner')}
                                </span>
                                <Badge variant="secondary" className="text-[10px] font-semibold py-0">
                                  {host?.role || (p.authorizedAgentId ? 'AGENT' : 'OWNER')}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1 text-slate-400">
                                <Clock className="h-3 w-3" />
                                <span>Submitted: {new Date(p.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Documents Attached Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[11px] font-bold text-slate-500">Documents ({p.documents?.length || 0}):</span>
                              {(!p.documents || p.documents.length === 0) ? (
                                <span className="text-[11px] text-amber-600 italic">No title documents uploaded yet</span>
                              ) : (
                                p.documents.map((doc) => (
                                  <a
                                    key={doc.id}
                                    href={`/api/documents/${doc.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                                  >
                                    <FileText className="h-2.5 w-2.5 text-lime-700" />
                                    <span>{doc.documentType.replace(/_/g, ' ')}</span>
                                    <span
                                      className={`text-[9px] px-1 rounded ${
                                        doc.status === 'APPROVED'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : doc.status === 'REJECTED'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {doc.status}
                                    </span>
                                  </a>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions (Review, Approve, Reject, Request Changes) */}
                        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                          {/* Review Action */}
                          <Button
                            size="sm"
                            onClick={() => openReviewDialog(p)}
                            className="h-9 rounded-xl bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs shadow-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                            Review
                          </Button>

                          {/* Quick Approve Action */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              openReviewDialog(p);
                            }}
                            className="h-9 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>

                          {/* Quick Request Changes Action */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              openReviewDialog(p);
                            }}
                            className="h-9 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold text-xs"
                          >
                            <FileSignature className="h-3.5 w-3.5 mr-1" />
                            Request Changes
                          </Button>

                          {/* Quick Reject Action */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              openReviewDialog(p);
                            }}
                            className="h-9 rounded-xl font-semibold text-xs"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: PROPERTY MODERATION (PRD Section 13) --- */}
        <TabsContent value="properties" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900">Property Moderation</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Inspect platform listings, audit title documentation, review user incident reports, and suspend non-compliant properties.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {properties.map((p) => {
                  const propReports = getReportsForProperty(p.id);
                  return (
                    <div
                      key={p.id}
                      className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                          <Badge
                            className={`text-[10px] font-bold ${
                              p.listingStatus === 'VERIFIED' || p.listingStatus === 'ACTIVE'
                                ? 'bg-emerald-600 text-white'
                                : p.listingStatus === 'UNDER_REVIEW' || p.listingStatus === 'SUBMITTED'
                                ? 'bg-amber-500 text-white'
                                : p.listingStatus === 'CHANGES_REQUIRED'
                                ? 'bg-orange-500 text-white'
                                : p.listingStatus === 'RESERVED'
                                ? 'bg-purple-600 text-white'
                                : p.listingStatus === 'OCCUPIED'
                                ? 'bg-slate-700 text-white'
                                : p.listingStatus === 'SOLD'
                                ? 'bg-slate-800 text-white'
                                : p.listingStatus === 'SUSPENDED' || p.listingStatus === 'REJECTED'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-600 text-white'
                            }`}
                          >
                            {p.listingStatus}
                          </Badge>
                          {propReports.length > 0 && (
                            <Badge variant="destructive" className="text-[10px] font-bold animate-pulse">
                              {propReports.length} Active Flag{propReports.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {p.area}, {p.city} • {formatCurrency(p.price, p.listingType === 'RENT' ? 'For Rent' : 'For Sale')} • {p.bedrooms} Beds, {p.bathrooms} Baths
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                          <span>Docs: <strong>{p.documents?.length || 0}</strong></span>
                          <span>Reports: <strong>{propReports.length}</strong></span>
                          <span>Created: {new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Moderation Actions: Inspect Property, Review Documents, Review Reports, Suspend/Restore */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Inspect Property */}
                        <Button variant="outline" size="sm" asChild className="h-8 text-xs rounded-xl">
                          <Link href={`/property/${p.id}`} target="_blank">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Inspect Property
                          </Link>
                        </Button>

                        {/* 2. Review Documents */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInspectDocsProperty(p);
                            setIsDocsDialogOpen(true);
                          }}
                          className="h-8 text-xs font-semibold rounded-xl text-lime-900 border-lime-200 hover:bg-lime-50"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1 text-lime-700" />
                          Review Documents ({p.documents?.length || 0})
                        </Button>

                        {/* 3. Review Reports */}
                        {propReports.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveTab('reports');
                            }}
                            className="h-8 text-xs font-bold rounded-xl text-rose-700 border-rose-200 hover:bg-rose-50"
                          >
                            <BadgeAlert className="h-3.5 w-3.5 mr-1 text-rose-600" />
                            Review Reports ({propReports.length})
                          </Button>
                        )}

                        {/* 4. Audit Checklist */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openReviewDialog(p)}
                          className="h-8 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200"
                        >
                          Audit Checklist
                        </Button>

                        {/* 5. Suspend / Restore Listing */}
                        {p.listingStatus === 'SUSPENDED' ? (
                          <Button
                            size="sm"
                            onClick={() => handleRestoreProperty(p.id)}
                            className="h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            Restore Listing
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSuspendProperty(p.id)}
                            className="h-8 text-xs font-bold rounded-xl"
                          >
                            Suspend Listing
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 3: USER MANAGEMENT (PRD Section 13) --- */}
        <TabsContent value="users" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-lime-700" />
                User Management Directory
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Inspect registered users, view roles, verify credentials, and suspend accounts where appropriate.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm font-bold text-slate-700">No Registered Users</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
                          <Badge
                            className={`text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-600'
                                : u.role === 'AGENT'
                                ? 'bg-lime-600 text-white font-bold'
                                : u.role === 'OWNER'
                                ? 'bg-amber-600'
                                : 'bg-slate-600'
                            }`}
                          >
                            {u.role}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              u.verificationStatus === 'VERIFIED'
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : u.verificationStatus === 'SUSPENDED'
                                ? 'text-rose-700 bg-rose-50 border-rose-200'
                                : 'text-amber-700 bg-amber-50 border-amber-200'
                            }`}
                          >
                            {u.verificationStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {u.email} • {u.phone}
                          {u.agencyName ? ` • Agency: ${u.agencyName}` : ''}
                          {u.licenseNumber ? ` • Lic: ${u.licenseNumber}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Joined: {new Date(u.createdAt).toLocaleDateString()} • ID: {u.id}
                        </p>
                      </div>

                      {/* User Actions: Inspect User & Suspend / Reactivate */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Inspect User Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setInspectedUser(u);
                            setIsUserInspectOpen(true);
                          }}
                          className="h-8 text-xs font-semibold rounded-xl text-lime-900 border-lime-200 hover:bg-lime-50"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-lime-700" />
                          Inspect User
                        </Button>

                        {/* Suspend / Reactivate User */}
                        {u.role !== 'ADMIN' && (
                          <>
                            {u.verificationStatus === 'SUSPENDED' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleUserStatus(u)}
                                className="h-8 text-xs font-bold rounded-xl text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                Reactivate
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleToggleUserStatus(u)}
                                className="h-8 text-xs font-bold rounded-xl"
                              >
                                <UserX className="h-3.5 w-3.5 mr-1" />
                                Suspend
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 4: TRUST & SAFETY REPORTS (PRD Section 18) --- */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-rose-700 flex items-center gap-2">
                <BadgeAlert className="h-5 w-5" />
                Trust & Safety Incident Reports
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                User reports for suspected scam, incorrect info, unauthorized representation, or unavailable properties.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {reports.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold text-slate-700">No Active Reports</p>
                  <p className="text-xs text-slate-400 mt-0.5">Platform is clean with no unresolved fraud flags.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reports.map((r) => (
                    <div key={r.id} className="p-5 space-y-3 hover:bg-slate-50/60">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                              {r.reason}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{r.propertyTitle}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Reported by <strong>{r.reporterName}</strong> on {new Date(r.reportedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs font-bold self-start">
                          Status: {r.status}
                        </Badge>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        &quot;{r.description}&quot;
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateReport(r.id, 'UNDER_INVESTIGATION', 'Investigating with land registry.')}
                          className="h-8 text-xs font-semibold rounded-xl"
                        >
                          Mark Under Investigation
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateReport(r.id, 'DOCUMENTATION_REQUESTED', 'Requested fresh survey from host.')}
                          className="h-8 text-xs font-semibold rounded-xl"
                        >
                          Request Documents
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateReport(r.id, 'SUSPENDED', 'Suspended listing due to verified report.')}
                          className="h-8 text-xs font-bold rounded-xl"
                        >
                          Suspend Listing
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateReport(r.id, 'RESOLVED', 'Issue investigated and cleared.')}
                          className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                        >
                          Resolve & Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 5: INSPECTIONS MANAGEMENT (PRD Section 15) --- */}
        <TabsContent value="inspections" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CalendarCheck2 className="h-5 w-5 text-lime-700" />
                  Scheduled Inspections & Field Audits
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Physical visits and live video walkthroughs conducted with verified condition records.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-bold text-slate-700">
                {inspections.length} Total Appointments
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {inspections.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CalendarCheck2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No Inspections Logged</p>
                  <p className="text-xs text-slate-400 mt-1">Walkthrough appointments requested by seekers will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {inspections.map((i) => (
                    <div key={i.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/property/${i.propertyId}`}
                            className="text-sm font-bold text-slate-900 hover:text-lime-700 hover:underline truncate"
                          >
                            {i.propertyTitle}
                          </Link>
                          <Badge variant="outline" className="text-xs font-semibold">
                            {i.type === 'IN_PERSON' ? 'Physical Visit' : 'Video Tour'}
                          </Badge>
                          {i.escalationStatus === 'ESCALATED_FRAUD_INVESTIGATION' && (
                            <Badge className="bg-rose-700 text-white text-[10px] font-bold gap-1">
                              <ShieldAlert className="h-3 w-3" /> Fraud Review Escalated
                            </Badge>
                          )}
                          {i.escalationStatus === 'DISCREPANCY_FLAGGED' && (
                            <Badge className="bg-amber-600 text-white text-[10px] font-bold gap-1">
                              <AlertTriangle className="h-3 w-3" /> Discrepancy Flagged
                            </Badge>
                          )}
                          {i.escalationStatus === 'RESOLVED' && (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Escalation Cleared
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Requested by <strong>{i.seekerName}</strong> ({i.seekerEmail}) for{' '}
                          <strong>{new Date(i.preferredDate).toLocaleDateString()} ({i.preferredTimeSlot})</strong>
                        </p>
                        {i.escalationNotes && (
                          <p className="text-xs text-rose-700 bg-rose-50/80 p-2 rounded-lg border border-rose-200">
                            <strong>Officer Note:</strong> {i.escalationNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Badge
                          className={`text-xs font-bold ${
                            i.status === 'COMPLETED'
                              ? 'bg-emerald-600 text-white'
                              : i.status === 'SCHEDULED' || i.status === 'ACCEPTED'
                              ? 'bg-lime-600 text-white font-bold'
                              : i.status === 'NO_SHOW'
                              ? 'bg-rose-500 text-white'
                              : i.status === 'CANCELLED'
                              ? 'bg-slate-400 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {i.status === 'NO_SHOW' ? 'No Show' : i.status}
                        </Badge>

                        {i.inspectionRecord && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAdminSelectedInspection(i);
                              setAdminInspectionRecordDialogOpen(true);
                            }}
                            className="h-8 text-xs font-semibold rounded-xl text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          >
                            <FileCheck2 className="h-3.5 w-3.5 mr-1" />
                            Inspection Report
                          </Button>
                        )}

                        {i.escalationStatus === 'ESCALATED_FRAUD_INVESTIGATION' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setAdminTargetEscalation(i);
                              setAdminResolutionNotes('Walkthrough evidence and land boundary coordinates reviewed. Case cleared.');
                              setAdminEscalationDialogOpen(true);
                            }}
                            className="h-8 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                          >
                            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                            Resolve Escalation
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 6: STAFF & ACCESS MANAGEMENT (PHASE 4 & 7) --- */}
        <TabsContent value="staff" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-black text-slate-900">
                      Staff &amp; Access Governance
                    </CardTitle>
                    <Badge className="bg-cyan-600 text-white font-bold text-xs">
                      Delegated Least Privilege
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Manage operational staff accounts, predefined role assignments, and controlled expiring custom permissions.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {can('admin.staff.invite') && (
                    <Button
                      size="sm"
                      onClick={() => setIsInviteStaffOpen(true)}
                      className="bg-lime-600 hover:bg-lime-500 rounded-xl text-xs font-bold text-white shadow-xs"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      Onboard Staff Member
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {staffDirectory.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No Staff Accounts Provisioned</p>
                  <p className="text-xs text-slate-400 mt-0.5">Use the onboarding button above to assign operational duties.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {staffDirectory.map((st) => {
                    const activeGrants = (st.customGrants || []).filter(
                      (g: any) => g.status === 'ACTIVE' && new Date(g.expiresAt) > new Date()
                    );
                    return (
                      <div
                        key={st.id}
                        className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{st.name}</span>
                            <span className="text-xs text-slate-500 font-mono">({st.email})</span>
                            <Badge
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                st.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : st.status === 'SUSPENDED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {st.status}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 mr-1">Roles:</span>
                            {st.roles.map((r) => {
                              const meta = ALL_STAFF_ROLES.find((m) => m.role === r);
                              return (
                                <Badge
                                  key={r}
                                  variant="outline"
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta?.badgeClass || 'bg-slate-100 text-slate-700'}`}
                                >
                                  {meta?.label || r}
                                </Badge>
                              );
                            })}
                            {activeGrants.length > 0 && (
                              <Badge className="text-[9px] bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                                {activeGrants.length} Custom Grant{activeGrants.length > 1 ? 's' : ''} Active
                              </Badge>
                            )}
                          </div>

                          {st.scope?.scopeType && st.scope.scopeType !== 'GLOBAL' && (
                            <p className="text-[11px] text-slate-400">
                              Scope: <strong className="text-slate-600">{st.scope.scopeType}</strong> {st.scope.region ? `(${st.scope.region})` : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPermsPreview(st)}
                            className="h-8 text-xs font-semibold rounded-xl"
                          >
                            <Key className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            Effective Perms
                          </Button>

                          {can('admin.staff.update_role') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRoleEdit(st)}
                              className="h-8 text-xs font-semibold rounded-xl"
                            >
                              Edit Roles
                            </Button>
                          )}

                          {can('admin.staff.update_role') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCustomGrant(st)}
                              className="h-8 text-xs font-semibold rounded-xl text-purple-700 border-purple-200 hover:bg-purple-50"
                            >
                              Grant Perm
                            </Button>
                          )}

                          {can('admin.staff.deactivate') && st.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant={st.status === 'SUSPENDED' ? 'outline' : 'destructive'}
                              onClick={() => handleToggleStaffStatus(st)}
                              className="h-8 text-xs font-bold rounded-xl"
                            >
                              {st.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 7: DUAL-CUSTODY APPROVAL QUEUE (PHASE 5 & 7) --- */}
        <TabsContent value="approvals" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-black text-slate-900">
                      Four-Eyes Dual-Custody Approval Queue
                    </CardTitle>
                    <Badge className="bg-purple-600 text-white font-bold text-xs">
                      Mandatory Dual Custody
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    High-impact administrative mutations require independent review. Requesters cannot approve their own requests.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {staffContext?.activeRoles.includes('SUPER_ADMIN') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setIsEmergencyOverrideOpen(true)}
                      className="rounded-xl text-xs font-bold"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      Emergency Override
                    </Button>
                  )}
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((filterStatus) => (
                  <Button
                    key={filterStatus}
                    size="sm"
                    variant={approvalStatusFilter === filterStatus ? 'default' : 'outline'}
                    onClick={() => setApprovalStatusFilter(filterStatus)}
                    className={`h-7 text-[11px] rounded-lg font-bold ${
                      approvalStatusFilter === filterStatus
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 border-slate-200'
                    }`}
                  >
                    {filterStatus}
                    {filterStatus === 'PENDING' && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-slate-900">
                        {approvalRequests.filter((a) => a.status === 'PENDING').length}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {approvalRequests.filter((a) => approvalStatusFilter === 'ALL' || a.status === approvalStatusFilter).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold text-slate-700">Approval Queue is Clear</p>
                  <p className="text-xs text-slate-400 mt-0.5">No requests matching filter: {approvalStatusFilter}.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {approvalRequests
                    .filter((a) => approvalStatusFilter === 'ALL' || a.status === approvalStatusFilter)
                    .map((req) => {
                      const isMyRequest = req.requesterUserId === currentUser?.id;
                      const isPending = req.status === 'PENDING';
                      return (
                        <div
                          key={req.id}
                          className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-5 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="space-y-2 min-w-0 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="bg-slate-900 text-white font-mono text-[10px]">
                                {req.actionType}
                              </Badge>
                              <Badge
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  req.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : req.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : req.status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {req.status}
                              </Badge>
                              <span className="text-xs text-slate-400 font-mono">ID: {req.id}</span>
                            </div>

                            <p className="text-xs text-slate-600">
                              Target Resource: <strong className="text-slate-900">{req.targetResourceType} [{req.targetResourceId}]</strong>
                            </p>

                            <p className="text-xs text-slate-500">
                              Requested by <strong>{req.requesterEmail}</strong> on {new Date(req.createdAt).toLocaleString()}
                            </p>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                              <span className="font-bold text-slate-700 block mb-1">Reason &amp; Evidence:</span>
                              <p className="text-slate-600 italic">&quot;{req.reason}&quot;</p>
                              {req.supportingEvidence && (
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Evidence: {req.supportingEvidence}
                                </p>
                              )}
                            </div>

                            {(req.approverEmail || req.approverStaffId) && (
                              <div className="text-[11px] text-slate-500 border-l-2 border-slate-300 pl-2">
                                Decided by: <strong>{req.approverEmail || req.approverStaffId}</strong> on {req.decidedAt ? new Date(req.decidedAt).toLocaleString() : ''}
                                {req.decisionNotes && <div>Notes: &quot;{req.decisionNotes}&quot;</div>}
                                {req.executionResult && <div className="text-emerald-600 font-bold">Outcome: {req.executionResult}</div>}
                              </div>
                            )}

                            {isMyRequest && isPending && (
                              <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                                🔒 <strong>Dual-Custody Lock:</strong> You submitted this request. Independent peer confirmation is required.
                              </p>
                            )}
                          </div>

                          {isPending && (
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {can('approvals.approve') && !isMyRequest && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveRequest(req.id)}
                                  disabled={submittingAction}
                                  className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Approve &amp; Execute
                                </Button>
                              )}

                              {can('approvals.reject') && !isMyRequest && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleOpenRejectModal(req.id)}
                                  disabled={submittingAction}
                                  className="h-8 text-xs font-bold rounded-xl"
                                >
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  Reject
                                </Button>
                              )}

                              {isMyRequest && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelRequest(req.id)}
                                  disabled={submittingAction}
                                  className="h-8 text-xs font-semibold rounded-xl text-slate-600"
                                >
                                  Cancel Request
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 8: SYSTEM AUDIT TRAIL (PHASE 6 & 7) --- */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-black text-slate-900">
                      Immutable System Audit Trail
                    </CardTitle>
                    <Badge className="bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      SHA-256 Hash Chained
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Cryptographically tamper-evident event log. Automatically redacts passwords, tokens, and identity numbers.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleVerifyAuditIntegrity}
                    disabled={submittingAction}
                    className="h-8 text-xs font-semibold rounded-xl"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Verify Trail Integrity
                  </Button>

                  {can('audit_logs.export') && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportAuditLogs('csv')}
                        disabled={submittingAction}
                        className="h-8 text-xs font-semibold rounded-xl"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-lime-700" />
                        Export CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportAuditLogs('json')}
                        disabled={submittingAction}
                        className="h-8 text-xs font-semibold rounded-xl"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Export JSON
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {integrityResult && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs font-sans flex items-center justify-between border ${
                    integrityResult.isValid
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {integrityResult.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    )}
                    <span>
                      {integrityResult.isValid
                        ? `Cryptographic chain validated: All ${integrityResult.totalLogs} entries unbroken.`
                        : `Integrity Failure: ${integrityResult.error}`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">Checked at {integrityResult.checkedAt}</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 font-mono text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/80 flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-lime-900 bg-lime-50 px-1.5 py-0.5 rounded text-[11px] border border-lime-200">
                          {log.action}
                        </span>
                        <span className="text-slate-700 font-sans font-semibold">
                          Actor: {log.actorEmail} ({log.actorRole})
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-sans ${log.result === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'}`}
                        >
                          {log.result}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Target: {log.objectType} [{log.objectId}] {log.metadata ? `• Details: ${JSON.stringify(log.metadata)}` : ''}
                      </p>
                      {log.checksum && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          SHA-256: <span className="text-slate-600">{log.checksum.slice(0, 16)}...</span>
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODAL 1: GRANULAR VERIFICATION CHECKLIST (PRD Section 12) --- */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[620px] rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-lime-600 shrink-0" />
              <span>Granular Verification Checklist</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Auditing listing: <strong>{reviewProperty?.title}</strong> ({reviewProperty?.id})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Attached Confidential Documents Audit Panel */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-lime-700" />
                  Attached Title & Survey Documents ({reviewProperty?.documents?.length || 0})
                </span>
                <span className="text-[10px] text-slate-500">Access-Controlled Vault</span>
              </div>

              {(!reviewProperty?.documents || reviewProperty.documents.length === 0) ? (
                <p className="text-xs text-amber-700 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ⚠️ No legal title documents have been attached to this property.
                </p>
              ) : (
                <div className="space-y-2">
                  {reviewProperty.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {doc.documentType.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              doc.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {doc.fileName} {doc.sizeBytes ? `• ${(doc.sizeBytes / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" asChild className="h-7 text-[10px] rounded-lg">
                          <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer">
                            <Download className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReviewDocument(reviewProperty.id, doc.id, 'APPROVED', 'Verified by officer')}
                          className="h-7 text-[10px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReviewDocument(reviewProperty.id, doc.id, 'REJECTED', 'Illegible or incorrect')}
                          className="h-7 text-[10px] rounded-lg"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checklist Parameter Toggles (Supporting all 6 states) */}
            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              {/* 1. Owner Identity */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-1">
                <div>
                  <p className="font-bold text-slate-900">1. Owner / Authority Identity</p>
                  <p className="text-[11px] text-slate-400">KYC check & NIN / Passport verification</p>
                </div>
                <Select value={ownerIdStatus} onValueChange={(v: any) => setOwnerIdStatus(v)}>
                  <SelectTrigger className="w-full xs:w-36 h-9 xs:h-8 text-xs rounded-lg shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Location Status */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2">
                <div>
                  <p className="font-bold text-slate-900">2. Location & Cadaster</p>
                  <p className="text-[11px] text-slate-400">Coordinates confirmed against Land Survey</p>
                </div>
                <Select value={locStatus} onValueChange={(v: any) => setLocStatus(v)}>
                  <SelectTrigger className="w-full xs:w-36 h-9 xs:h-8 text-xs rounded-lg shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Authority Document Status */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2">
                <div>
                  <p className="font-bold text-slate-900">3. Title Documents Reviewed</p>
                  <p className="text-[11px] text-slate-400">Governor&apos;s Consent / C of O / Deed of Assignment</p>
                </div>
                <Select value={docStatus} onValueChange={(v: any) => setDocStatus(v)}>
                  <SelectTrigger className="w-full xs:w-36 h-9 xs:h-8 text-xs rounded-lg shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Availability Status */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2">
                <div>
                  <p className="font-bold text-slate-900">4. Availability & Vacancy</p>
                  <p className="text-[11px] text-slate-400">Confirmed vacant and not double-let or disputed</p>
                </div>
                <Select value={availStatus} onValueChange={(v: any) => setAvailStatus(v)}>
                  <SelectTrigger className="w-full xs:w-36 h-9 xs:h-8 text-xs rounded-lg shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Media Status */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2">
                <div>
                  <p className="font-bold text-slate-900">5. Media Authenticity</p>
                  <p className="text-[11px] text-slate-400">Confirmed non-misleading photos & timestamped video</p>
                </div>
                <Select value={mediaStatus} onValueChange={(v: any) => setMediaStatus(v)}>
                  <SelectTrigger className="w-full xs:w-36 h-9 xs:h-8 text-xs rounded-lg shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 6. Inspection Status */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2">
                <div>
                  <p className="font-bold text-slate-900">6. Physical Inspection Record</p>
                  <p className="text-[11px] text-slate-400">Field agent verified condition log on-site</p>
                </div>
                <Select value={inspStatus} onValueChange={(v: any) => setInspStatus(v)}>
                  <SelectTrigger className="w-full xs:w-36 h-9 xs:h-8 text-xs rounded-lg shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Officer Audit Notes */}
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="reviewNotes" className="text-xs font-bold text-slate-800">
                Official Compliance Notes / Registry References
              </Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Alausa Lands Registry volume reference verified. Cadastral beacon coordinates match survey plan."
                rows={3}
                className="rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={submittingAction}
              onClick={handleSaveChecklistDraft}
              className="text-xs font-semibold rounded-xl"
            >
              Save Checklist
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={submittingAction}
              onClick={handleReject}
              className="text-xs font-bold rounded-xl"
            >
              Reject
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submittingAction}
              onClick={handleRequestChanges}
              className="text-xs font-bold rounded-xl text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              Request Changes
            </Button>
            <Button
              type="button"
              disabled={submittingAction}
              onClick={handleApprove}
              className="text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {submittingAction ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Approve as VERIFIED
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: INSPECT USER DETAILS (PRD Section 13) --- */}
      <Dialog open={isUserInspectOpen} onOpenChange={setIsUserInspectOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[500px] rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-lime-700" />
              <span>User Profile & Role Inspection</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Platform identity details for {inspectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          {inspectedUser && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="h-12 w-12 rounded-full bg-lime-100 text-lime-800 font-bold border border-lime-300 flex items-center justify-center text-base shrink-0">
                  {inspectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{inspectedUser.name}</p>
                  <p className="text-slate-500 truncate">{inspectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="text-[10px]">{inspectedUser.role}</Badge>
                    <Badge variant="outline" className="text-[10px]">{inspectedUser.verificationStatus}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">User ID</span>
                  <span className="font-mono text-slate-800">{inspectedUser.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Phone Number</span>
                  <span className="font-semibold text-slate-800">{inspectedUser.phone}</span>
                </div>
                {inspectedUser.agencyName && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Agency Name</span>
                    <span className="font-semibold text-slate-800">{inspectedUser.agencyName}</span>
                  </div>
                )}
                {inspectedUser.licenseNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">License / Reg Number</span>
                    <span className="font-mono font-semibold text-slate-800">{inspectedUser.licenseNumber}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Account Created</span>
                  <span className="text-slate-800">{new Date(inspectedUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Properties Owned / Represented</span>
                  <span className="font-bold text-lime-800">
                    {properties.filter((p) => p.ownerId === inspectedUser.id || p.authorizedAgentId === inspectedUser.id).length} Listings
                  </span>
                </div>
              </div>

              {inspectedUser.role !== 'ADMIN' && (
                <div className="pt-2">
                  <Button
                    variant={inspectedUser.verificationStatus === 'SUSPENDED' ? 'outline' : 'destructive'}
                    className="w-full text-xs font-bold rounded-xl"
                    onClick={() => handleToggleUserStatus(inspectedUser)}
                  >
                    {inspectedUser.verificationStatus === 'SUSPENDED' ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-1 text-emerald-600" />
                        Reactivate User Account
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Suspend User Account
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- MODAL 3: REVIEW DOCUMENTS FOR PROPERTY (PRD Section 13) --- */}
      <Dialog open={isDocsDialogOpen} onOpenChange={setIsDocsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[550px] rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-lime-700" />
              Confidential Documents Audit
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Reviewing legal papers for {inspectDocsProperty?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {(!inspectDocsProperty?.documents || inspectDocsProperty.documents.length === 0) ? (
              <div className="p-6 text-center text-slate-400">
                <FileWarning className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Attached Documents</p>
                <p className="text-[11px] text-slate-400">The host has not uploaded survey or title certificates.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inspectDocsProperty.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {doc.documentType.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            doc.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {doc.fileName} {doc.sizeBytes ? `• ${(doc.sizeBytes / 1024).toFixed(1)} KB` : ''} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                      {doc.reviewNotes && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          Audit note: &quot;{doc.reviewNotes}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" asChild className="h-7 text-[10px] rounded-lg">
                        <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer">
                          <Download className="h-3 w-3 mr-1" />
                          View
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReviewDocument(inspectDocsProperty.id, doc.id, 'APPROVED', 'Approved by officer')}
                        className="h-7 text-[10px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReviewDocument(inspectDocsProperty.id, doc.id, 'REJECTED', 'Rejected')}
                        className="h-7 text-[10px] rounded-lg"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 4: ONBOARD STAFF MEMBER (PHASE 4 & 7) --- */}
      <Dialog open={isInviteStaffOpen} onOpenChange={setIsInviteStaffOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[500px] rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-lime-700" />
              Onboard Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provision administrative staff with least-privilege predefined roles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Full Name</Label>
              <Input
                placeholder="e.g. Babatunde Lawal"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. babatunde.vo@prophunta.ai"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Assign Operational Roles</Label>
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                {ALL_STAFF_ROLES.filter((r) => r.role !== 'SUPER_ADMIN' || staffContext?.activeRoles.includes('SUPER_ADMIN')).map((r) => {
                  const isChecked = newStaffRoles.includes(r.role);
                  return (
                    <label key={r.role} className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStaffRoles([...newStaffRoles, r.role]);
                          } else {
                            setNewStaffRoles(newStaffRoles.filter((role) => role !== r.role));
                          }
                        }}
                        className="mt-0.5 rounded text-lime-600 focus:ring-lime-500"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block">{r.label}</span>
                        <span className="text-[11px] text-slate-500">{r.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInviteStaffOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteStaff}
              disabled={submittingAction}
              className="text-xs font-bold bg-lime-600 hover:bg-lime-500 text-white rounded-xl"
            >
              {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Confirm Onboarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 5: MANAGE STAFF ROLES (PHASE 4 & 7) --- */}
      <Dialog open={isManageRolesOpen} onOpenChange={setIsManageRolesOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[480px] rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-cyan-700" />
              Manage Staff Roles
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update operational duties for <strong>{selectedStaffForRoleEdit?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              {ALL_STAFF_ROLES.filter((r) => r.role !== 'SUPER_ADMIN' || staffContext?.activeRoles.includes('SUPER_ADMIN')).map((r) => {
                const isChecked = editingRoles.includes(r.role);
                return (
                  <label key={r.role} className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingRoles([...editingRoles, r.role]);
                        } else {
                          setEditingRoles(editingRoles.filter((role) => role !== r.role));
                        }
                      }}
                      className="mt-0.5 rounded text-lime-600 focus:ring-lime-500"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block">{r.label}</span>
                      <span className="text-[11px] text-slate-500">{r.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsManageRolesOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveStaffRoles}
              disabled={submittingAction || editingRoles.length === 0}
              className="text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl"
            >
              {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Save Assigned Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 6: GRANT CUSTOM EXPIRING PERMISSION (PHASE 4 & 7) --- */}
      <Dialog open={isCustomGrantOpen} onOpenChange={setIsCustomGrantOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[480px] rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-700" />
              Issue Controlled Custom Grant
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Grant a temporary, auto-expiring permission to <strong>{selectedStaffForGrant?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Permission to Grant</Label>
              <Select value={grantPerm} onValueChange={(v: any) => setGrantPerm(v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRANTABLE_PERMISSIONS.map((p) => (
                    <SelectItem key={p.perm} value={p.perm}>
                      {p.label} [{p.perm}]
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Expiry Duration</Label>
              <Select value={grantDuration} onValueChange={setGrantDuration}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 Hours (1 Day)</SelectItem>
                  <SelectItem value="48">48 Hours (2 Days)</SelectItem>
                  <SelectItem value="72">72 Hours (3 Days)</SelectItem>
                  <SelectItem value="120">120 Hours (5 Days)</SelectItem>
                  <SelectItem value="168">168 Hours (7 Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Mandatory Justification Reason</Label>
              <Textarea
                rows={3}
                placeholder="Document operational reason, audit ticket, or regulatory requirement..."
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCustomGrantOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrantCustomPermission}
              disabled={submittingAction || !grantReason.trim()}
              className="text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white rounded-xl"
            >
              {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Confirm Custom Grant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 7: PREVIEW EFFECTIVE PERMISSIONS (PHASE 4 & 7) --- */}
      <Dialog open={isPreviewPermsOpen} onOpenChange={setIsPreviewPermsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[520px] rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key className="h-5 w-5 text-slate-700" />
              Effective Permissions Preview
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Resolved permissions and active custom grants for <strong>{selectedStaffForPreview?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {permsPreview && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Account Status</span>
                  <Badge className="text-[10px] font-bold">{permsPreview.status}</Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Predefined Roles</span>
                  <span className="font-bold text-slate-800">{permsPreview.roles.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-semibold">Effective Permissions Count</span>
                  <span className="font-bold text-emerald-700">{permsPreview.effectivePermissions.length} Granted</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Resolved Granted Permissions</Label>
                <div className="flex flex-wrap gap-1 p-3 rounded-xl bg-slate-50 border border-slate-200/80 max-h-48 overflow-y-auto font-mono text-[11px]">
                  {permsPreview.effectivePermissions.map((p: string) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {permsPreview.activeCustomGrants?.length > 0 && (
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Active Custom Grants</Label>
                  <div className="space-y-1.5">
                    {permsPreview.activeCustomGrants.map((g: any) => (
                      <div key={g.id} className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-purple-900 block font-mono">{g.permission}</span>
                          <span className="text-[10px] text-purple-700">Reason: &quot;{g.reason}&quot; • Expires: {new Date(g.expiresAt).toLocaleString()}</span>
                        </div>
                        {can('admin.staff.update_role') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRevokeCustomGrant(selectedStaffForPreview!.id, g.id)}
                            className="h-6 text-[10px] rounded-lg"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- MODAL 8: REJECT APPROVAL REQUEST (PHASE 5 & 7) --- */}
      <Dialog open={isRejectApprovalOpen} onOpenChange={setIsRejectApprovalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[460px] rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              Reject Approval Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide formal audit reasoning for declining this high-impact change.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <Label className="text-xs font-bold text-slate-700">Rejection Justification</Label>
            <Textarea
              rows={3}
              placeholder="State compliance reason, missing documentation, or policy conflict..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRejectApprovalOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRequest}
              disabled={submittingAction || !rejectionReason.trim()}
              className="text-xs font-bold rounded-xl"
            >
              {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Confirm Formal Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 9: EMERGENCY OVERRIDE (PHASE 5 & 7) --- */}
      <Dialog open={isEmergencyOverrideOpen} onOpenChange={setIsEmergencyOverrideOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[500px] rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Super Admin Emergency Override
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Narrowly-scoped fail-safe execution. Requires verified security incident ticket and permanent audit logging.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Action Type</Label>
              <Select value={overrideActionType} onValueChange={(v: any) => setOverrideActionType(v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROPERTY_RESTORE">Restore Suspended Property</SelectItem>
                  <SelectItem value="PLATFORM_SETTINGS_CHANGE">Modify Platform Security Settings</SelectItem>
                  <SelectItem value="PRIVILEGED_STAFF_ROLE_CHANGE">Emergency Staff Reassignment</SelectItem>
                  <SelectItem value="USER_SUSPENSION">Emergency User Suspension</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Target Resource ID</Label>
              <Input
                placeholder="e.g. prop-1 or user-123"
                value={overrideResourceId}
                onChange={(e) => setOverrideResourceId(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Incident Reference Number</Label>
              <Input
                placeholder="e.g. INC-SEC-88219"
                value={overrideIncidentRef}
                onChange={(e) => setOverrideIncidentRef(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Mandatory Justification</Label>
              <Textarea
                rows={3}
                placeholder="Full operational explanation for bypassing independent peer approval..."
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEmergencyOverrideOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleExecuteEmergencyOverride}
              disabled={submittingAction || !overrideResourceId.trim() || !overrideIncidentRef.trim() || !overrideJustification.trim()}
              className="text-xs font-bold rounded-xl"
            >
              {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Execute Emergency Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 10: INSPECTION RECORD VIEWER (PRD Section 15) --- */}
      <Dialog open={adminInspectionRecordDialogOpen} onOpenChange={setAdminInspectionRecordDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-2xl rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-emerald-600" />
              Verified Walkthrough & Condition Report
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Field officer inspection record for <strong>{adminSelectedInspection?.propertyTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          {adminSelectedInspection?.inspectionRecord && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Inspector</span>
                  <span className="font-semibold text-slate-800">{adminSelectedInspection.inspectionRecord.inspectorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Date Completed</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(adminSelectedInspection.inspectionRecord.completedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Condition Rating</span>
                  <Badge className="mt-1 bg-lime-600 text-white font-bold">{adminSelectedInspection.inspectionRecord.conditionRating}</Badge>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Utilities Status</span>
                  <Badge variant={adminSelectedInspection.inspectionRecord.utilitiesFunctional ? 'default' : 'destructive'} className="mt-1">
                    {adminSelectedInspection.inspectionRecord.utilitiesFunctional ? 'Verified Functional' : 'Discrepancy Noted'}
                  </Badge>
                </div>
              </div>

              {adminSelectedInspection.inspectionRecord.meterReadings && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Meter Readings
                  </span>
                  <p className="font-mono text-slate-800">{adminSelectedInspection.inspectionRecord.meterReadings}</p>
                </div>
              )}

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Inspector Observations
                </span>
                <p className="text-slate-700 leading-relaxed">{adminSelectedInspection.inspectionRecord.observations}</p>
              </div>

              {adminSelectedInspection.inspectionRecord.discrepancies && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                    Noted Discrepancies
                  </span>
                  <p className="text-amber-900">{adminSelectedInspection.inspectionRecord.discrepancies}</p>
                </div>
              )}

              {adminSelectedInspection.inspectionRecord.photos && adminSelectedInspection.inspectionRecord.photos.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
                    Evidence Photos ({adminSelectedInspection.inspectionRecord.photos.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {adminSelectedInspection.inspectionRecord.photos.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block aspect-video rounded-lg overflow-hidden border bg-slate-100"
                      >
                        <img src={url} alt={`Inspection Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {adminSelectedInspection.inspectionRecord.video && (
                <div className="pt-1">
                  <Button asChild variant="outline" size="sm" className="text-xs rounded-xl">
                    <a href={adminSelectedInspection.inspectionRecord.video} target="_blank" rel="noreferrer">
                      Watch Video Walkthrough
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button onClick={() => setAdminInspectionRecordDialogOpen(false)} className="text-xs font-bold rounded-xl">
              Close Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 11: RESOLVE INSPECTION ESCALATION --- */}
      <Dialog open={adminEscalationDialogOpen} onOpenChange={setAdminEscalationDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-md rounded-2xl">
          <form onSubmit={handleResolveInspectionEscalation}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Resolve Inspection Escalation
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Log compliance resolution for <strong>{adminTargetEscalation?.propertyTitle}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Compliance Resolution Notes</Label>
                <Textarea
                  rows={4}
                  required
                  placeholder="State investigation findings, whether discrepancy was addressed, and audit justification..."
                  value={adminResolutionNotes}
                  onChange={(e) => setAdminResolutionNotes(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdminEscalationDialogOpen(false)}
                className="text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={adminResolvingEscalation || !adminResolutionNotes.trim()}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
              >
                {adminResolvingEscalation ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Resolve & Clear Flag
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPortalPage() {
  return (
    <Suspense>
      <AdminPortalContent />
    </Suspense>
  );
}
