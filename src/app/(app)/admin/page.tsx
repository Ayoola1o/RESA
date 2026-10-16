'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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

// Modular Admin Sub-Components
import { AdminKpiStrip } from '@/components/admin/AdminKpiStrip';
import { ApprovalWorkbench } from '@/components/admin/ApprovalWorkbench';
import { AuditLedgerView } from '@/components/admin/AuditLedgerView';
import { StaffManagementView } from '@/components/admin/StaffManagementView';
import { TrustSafetyDesk } from '@/components/admin/TrustSafetyDesk';
import { InspectionsDispatchView } from '@/components/admin/InspectionsDispatchView';
import { PropertyModerationView } from '@/components/admin/PropertyModerationView';
import { UserManagementView } from '@/components/admin/UserManagementView';

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const initialTab = tabParam || 'verification';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state if URL search param changes
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', newTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Staff Governance & Approval States
  const [staffContext, setStaffContext] = useState<{
    staffAccount: StaffAccount;
    effectivePermissions: AdminPermission[];
    activeRoles: StaffRole[];
    scope: any;
  } | null>(null);
  const [staffDirectory, setStaffDirectory] = useState<StaffAccount[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [integrityResult, setIntegrityResult] = useState<{ isValid: boolean; totalLogs: number; checkedAt: string; error?: string } | null>(null);

  // Dialog States
  const [submittingAction, setSubmittingAction] = useState(false);
  const [inspectDocsProperty, setInspectDocsProperty] = useState<Property | null>(null);
  const [isDocsDialogOpen, setIsDocsDialogOpen] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);
  const [isUserInspectOpen, setIsUserInspectOpen] = useState(false);

  const isSuperAdmin = Boolean(
    staffContext?.activeRoles.includes('SUPER_ADMIN') ||
    (!staffContext && currentUser?.email === 'admin@prophunta.ai')
  );

  const can = (perm: AdminPermission): boolean => {
    if (!staffContext) {
      // Fail-closed security: Only system fallback administrator holds access prior to staff context load
      return currentUser?.email === 'admin@prophunta.ai';
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

  // --- PROPERTY WORKBENCH ACTIONS ---
  const handleApproveProperty = async (
    prop: Property,
    notes: string,
    checklist: Record<string, VerificationSubStatus>
  ) => {
    setSubmittingAction(true);
    await updateVerificationChecklistAction(prop.id, {
      ownerIdentityStatus: checklist.ownerIdentityStatus === 'PENDING' ? 'PASSED' : checklist.ownerIdentityStatus,
      locationStatus: checklist.locationStatus === 'PENDING' ? 'PASSED' : checklist.locationStatus,
      authorityDocumentStatus: checklist.authorityDocumentStatus === 'PENDING' ? 'PASSED' : checklist.authorityDocumentStatus,
      availabilityStatus: checklist.availabilityStatus === 'PENDING' ? 'PASSED' : checklist.availabilityStatus,
      mediaStatus: checklist.mediaStatus === 'PENDING' ? 'PASSED' : checklist.mediaStatus,
      inspectionStatus: checklist.inspectionStatus === 'PENDING' ? 'PASSED' : checklist.inspectionStatus,
      reviewNotes: notes,
    });
    const res = await approveVerificationAction(prop.id, notes);
    setSubmittingAction(false);

    if (res.success) {
      toast({
        title: 'Listing Approved & Verified',
        description: `"${prop.title}" is now officially marked VERIFIED with audited badges.`,
      });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to approve.' });
    }
  };

  const handleRejectProperty = async (
    prop: Property,
    notes: string,
    checklist: Record<string, VerificationSubStatus>
  ) => {
    setSubmittingAction(true);
    await updateVerificationChecklistAction(prop.id, {
      ownerIdentityStatus: checklist.ownerIdentityStatus,
      locationStatus: checklist.locationStatus,
      authorityDocumentStatus: checklist.authorityDocumentStatus,
      availabilityStatus: checklist.availabilityStatus,
      mediaStatus: checklist.mediaStatus,
      inspectionStatus: checklist.inspectionStatus,
      reviewNotes: notes,
    });
    const res = await rejectVerificationAction(prop.id, notes);
    setSubmittingAction(false);

    if (res.success) {
      toast({
        title: 'Listing Rejected',
        description: `"${prop.title}" has been marked REJECTED with compliance notes logged.`,
      });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to reject.' });
    }
  };

  const handleRequestChangesProperty = async (
    prop: Property,
    notes: string,
    checklist: Record<string, VerificationSubStatus>
  ) => {
    setSubmittingAction(true);
    await updateVerificationChecklistAction(prop.id, {
      ownerIdentityStatus: checklist.ownerIdentityStatus,
      locationStatus: checklist.locationStatus,
      authorityDocumentStatus: checklist.authorityDocumentStatus,
      availabilityStatus: checklist.availabilityStatus,
      mediaStatus: checklist.mediaStatus,
      inspectionStatus: checklist.inspectionStatus,
      reviewNotes: notes,
    });
    const res = await requestVerificationChangesAction(prop.id, notes);
    setSubmittingAction(false);

    if (res.success) {
      toast({
        title: 'Changes Requested',
        description: `Notification dispatched to listing host. Status changed to CHANGES_REQUIRED.`,
      });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to request changes.' });
    }
  };

  // --- FOUR-EYES APPROVAL ACTIONS ---
  const handleApproveDualCustody = async (requestId: string) => {
    setSubmittingAction(true);
    const res = await decideApprovalAction(requestId, 'APPROVE');
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Approval Executed', description: 'Dual-custody request approved and target mutation executed.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Approval Blocked', description: res.error || 'Failed to approve.' });
    }
  };

  const handleRejectDualCustody = async (requestId: string, reason: string) => {
    setSubmittingAction(true);
    const res = await decideApprovalAction(requestId, 'REJECT', reason);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Request Rejected', description: 'Dual-custody approval request was rejected and audit history updated.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to reject.' });
    }
  };

  const handleCancelDualCustody = async (requestId: string) => {
    setSubmittingAction(true);
    const res = await cancelApprovalRequestAction(requestId);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Request Cancelled', description: 'Approval request safely withdrawn.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to cancel.' });
    }
  };

  const handleEmergencyOverride = async (
    actionType: ApprovalActionType,
    resourceId: string,
    incidentRef: string,
    justification: string
  ) => {
    setSubmittingAction(true);
    const res = await executeEmergencyOverrideAction({
      actionType,
      targetResourceType: 'PROPERTY',
      targetResourceId: resourceId,
      proposedPayload: {},
      incidentReference: incidentRef,
      mandatoryJustification: justification,
    });
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Emergency Override Executed', description: `Target resource [${resourceId}] mutated under incident ref: ${incidentRef}.` });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Override Blocked', description: res.error || 'Failed to execute override.' });
    }
  };

  // --- AUDIT TRAIL ACTIONS ---
  const handleVerifyAuditIntegrity = async () => {
    setSubmittingAction(true);
    const res = await verifyAuditTrailIntegrityAction();
    setSubmittingAction(false);
    if (res.success && res.verification) {
      setIntegrityResult({
        ...res.verification,
        checkedAt: new Date().toISOString(),
      });
      toast({
        title: res.verification.isValid ? 'Audit Trail Verified ✅' : 'Audit Trail Tampered ⚠️',
        description: res.verification.isValid
          ? `All ${res.verification.totalLogs} entries cryptographically intact.`
          : `Integrity failure: ${res.verification.error}`,
      });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Could not verify integrity.' });
    }
  };

  const handleExportAuditLogs = async (format: 'csv' | 'json') => {
    setSubmittingAction(true);
    const res = await exportAuditLogsAction(format);
    setSubmittingAction(false);
    if (res.success && res.exportData) {
      const blob = new Blob([res.exportData.content], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.exportData.fileName || `audit-logs-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export Successful', description: `Audit logs exported as ${format.toUpperCase()}. Security event recorded.` });
    } else {
      toast({ variant: 'destructive', title: 'Export Failed', description: res.error || 'Could not export logs.' });
    }
  };

  // --- STAFF ACTIONS ---
  const handleInviteStaff = async (name: string, email: string, roles: StaffRole[]) => {
    setSubmittingAction(true);
    const res = await inviteStaffAction({ name, email, roles });
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Staff Onboarded', description: `Account created for ${email} with assigned roles.` });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Onboarding Blocked', description: res.error || 'Failed to onboard staff.' });
    }
  };

  const handleUpdateRoles = async (staffId: string, roles: StaffRole[]) => {
    setSubmittingAction(true);
    const res = await updateStaffRolesAction(staffId, roles);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Roles Updated', description: 'Staff role boundaries updated successfully.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Role Update Blocked', description: res.error || 'Failed to update roles.' });
    }
  };

  const handleGrantCustomPerm = async (staffId: string, perm: AdminPermission, reason: string, durationHours: string) => {
    setSubmittingAction(true);
    const res = await grantCustomPermissionAction(
      staffId,
      perm,
      reason,
      Number(durationHours) || 48
    );
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Custom Permission Granted', description: `Permission [${perm}] active for ${durationHours} hours.` });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Grant Blocked', description: res.error || 'Failed to issue custom grant.' });
    }
  };

  const handleRevokeCustomPerm = async (staffId: string, grantId: string) => {
    setSubmittingAction(true);
    const res = await revokeCustomPermissionAction(staffId, grantId);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Grant Revoked', description: 'Custom permission grant immediately revoked.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to revoke grant.' });
    }
  };

  const handleToggleStaffStatus = async (st: StaffAccount) => {
    setSubmittingAction(true);
    const nextStatus: StaffStatus = st.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const res = await updateStaffStatusAction(st.id, nextStatus);
    setSubmittingAction(false);
    if (res.success) {
      toast({
        title: nextStatus === 'SUSPENDED' ? 'Staff Suspended' : 'Staff Reactivated',
        description: nextStatus === 'SUSPENDED'
          ? `${st.name} suspended. All active session tokens invalidated immediately.`
          : `${st.name} account restored to active status.`,
      });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update status.' });
    }
  };

  const handlePreviewPermissions = async (staffId: string) => {
    return await previewStaffPermissionsAction(staffId);
  };

  // --- TRUST & SAFETY ACTIONS ---
  const handleInvestigateReport = async (reportId: string) => {
    setSubmittingAction(true);
    const res = await updateReportStatusAction(reportId, 'UNDER_INVESTIGATION', 'Investigation initiated by staff officer.');
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Investigation Initiated', description: 'Status updated to UNDER_INVESTIGATION and logged.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update status.' });
    }
  };

  const handleRequestHostDocs = async (reportId: string) => {
    setSubmittingAction(true);
    const res = await updateReportStatusAction(reportId, 'DOCUMENTATION_REQUESTED', 'Formal documentation requested from host.');
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Documentation Requested', description: 'Status changed to DOCUMENTATION_REQUESTED.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to request documents.' });
    }
  };

  const handleSuspendListingFromReport = async (propId: string, repId: string) => {
    setSubmittingAction(true);
    await updateReportStatusAction(repId, 'UNDER_INVESTIGATION', 'Listing frozen pending investigation outcome.');
    const res = await suspendPropertyAction(propId, `Frozen due to active fraud report ${repId}`);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Listing Frozen', description: 'Property suspended from public marketplace immediately.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to suspend property.' });
    }
  };

  const handleRestoreListingFromReport = async (propId: string, repId: string) => {
    setSubmittingAction(true);
    await updateReportStatusAction(repId, 'RESOLVED', 'Listing restored following legal clearance.');
    const res = await restorePropertyAction(propId);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Listing Restored', description: 'Property restored to active marketplace.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to restore property.' });
    }
  };

  const handleResolveReport = async (reportId: string, notes: string) => {
    setSubmittingAction(true);
    const res = await updateReportStatusAction(reportId, 'RESOLVED', notes);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Incident Resolved', description: 'Report marked RESOLVED with audit note logged.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to resolve report.' });
    }
  };

  const handleDismissReport = async (reportId: string, notes: string) => {
    setSubmittingAction(true);
    const res = await updateReportStatusAction(reportId, 'DISMISSED', notes);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Report Dismissed', description: 'Report dismissed with formal audit note.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to dismiss report.' });
    }
  };

  // --- INSPECTION DISPATCH ACTIONS ---
  const handleResolveInspectionEscalation = async (inspectionId: string, notes: string) => {
    setSubmittingAction(true);
    const res = await resolveInspectionEscalationAction(inspectionId, notes);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Escalation Resolved', description: 'Inspection escalation successfully resolved and logged.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to resolve escalation.' });
    }
  };

  // --- USER DIRECTORY ACTIONS ---
  const handleToggleUserStatus = async (user: User) => {
    setSubmittingAction(true);
    const nextStatus: UserVerificationStatus = user.verificationStatus === 'SUSPENDED' ? 'VERIFIED' : 'SUSPENDED';
    const res = await updateUserStatusAction(user.id, nextStatus);
    setSubmittingAction(false);
    if (res.success) {
      toast({
        title: nextStatus === 'SUSPENDED' ? 'User Account Suspended' : 'User Account Reactivated',
        description: `Status updated to ${nextStatus}.`,
      });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update user status.' });
    }
  };

  // --- PROPERTY MODERATION ACTIONS ---
  const handleSuspendProperty = async (propertyId: string) => {
    setSubmittingAction(true);
    const res = await suspendPropertyAction(propertyId, 'Suspended by admin moderator for compliance audit');
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Property Suspended', description: 'Property listing removed from active marketplace.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to suspend listing.' });
    }
  };

  const handleRestoreProperty = async (propertyId: string) => {
    setSubmittingAction(true);
    const res = await restorePropertyAction(propertyId);
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Property Restored', description: 'Property listing restored to active marketplace.' });
      loadData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to restore listing.' });
    }
  };

  const pendingVerificationList = properties.filter(
    (p) => p.listingStatus === 'SUBMITTED' || p.listingStatus === 'UNDER_REVIEW'
  );

  return (
    <div className="space-y-6 pb-20">
      {/* --- EXECUTIVE COMMAND BAR & 4-METRIC KPI ROW --- */}
      <AdminKpiStrip
        staffContext={staffContext}
        currentUser={currentUser}
        allStaffRoles={ALL_STAFF_ROLES}
        loading={loading}
        onRefresh={loadData}
        properties={properties}
        users={users}
        reports={reports}
        inspections={inspections}
        approvalRequests={approvalRequests}
        auditLogs={auditLogs}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* --- URL-SYNCED SEGMENTED WORKSPACE NAVIGATION --- */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-slate-100/90 p-1.5 rounded-2xl flex overflow-x-auto no-scrollbar whitespace-nowrap gap-1 w-full max-w-full">
          {(can('verification.queue.view') || isSuperAdmin) && (
            <TabsTrigger value="verification" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              Property Approvals ({pendingVerificationList.length})
            </TabsTrigger>
          )}

          {(can('approvals.view_assigned') || can('approvals.approve') || isSuperAdmin) && (
            <TabsTrigger value="approvals" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
              <FileCheck2 className="h-3.5 w-3.5" />
              Dual-Custody Approvals ({approvalRequests.filter((a) => a.status === 'PENDING').length})
            </TabsTrigger>
          )}

          {(can('inspections.view') || isSuperAdmin) && (
            <TabsTrigger value="inspections" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Inspections ({inspections.length})
            </TabsTrigger>
          )}

          {(can('admin.staff.view') || isSuperAdmin) && (
            <TabsTrigger value="staff" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
              <Briefcase className="h-3.5 w-3.5" />
              Staff &amp; RBAC ({staffDirectory.length})
            </TabsTrigger>
          )}

          {(can('reports.view') || isSuperAdmin) && (
            <TabsTrigger value="reports" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
              <BadgeAlert className="h-3.5 w-3.5" />
              Trust &amp; Safety ({reports.length})
            </TabsTrigger>
          )}

          {(can('audit_logs.view') || isSuperAdmin) && (
            <TabsTrigger value="audit" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
              <History className="h-3.5 w-3.5" />
              Audit Ledger ({auditLogs.length})
            </TabsTrigger>
          )}

          {(can('properties.moderate') || isSuperAdmin) && (
            <TabsTrigger value="properties" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
              <Home className="h-3.5 w-3.5" />
              Property Moderation ({properties.length})
            </TabsTrigger>
          )}

          {(can('users.view_limited') || isSuperAdmin) && (
            <TabsTrigger value="users" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
              <Users className="h-3.5 w-3.5" />
              User Directory ({users.filter((u) => isSuperAdmin || u.role !== 'ADMIN').length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* --- TAB 1: PROPERTY VERIFICATION QUEUE & DUAL CUSTODY WORKBENCH --- */}
        <TabsContent value="verification" className="space-y-4">
          <ApprovalWorkbench
            properties={properties}
            users={users}
            approvalRequests={approvalRequests}
            can={can}
            currentUser={currentUser}
            submittingAction={submittingAction}
            onApproveProperty={handleApproveProperty}
            onRejectProperty={handleRejectProperty}
            onRequestChangesProperty={handleRequestChangesProperty}
            onApproveDualCustody={handleApproveDualCustody}
            onRejectDualCustody={handleRejectDualCustody}
            onCancelDualCustody={handleCancelDualCustody}
            onEmergencyOverride={handleEmergencyOverride}
            searchQuery={searchQuery}
          />
        </TabsContent>

        {/* --- TAB 2: FOUR-EYES APPROVALS --- */}
        <TabsContent value="approvals" className="space-y-4">
          <ApprovalWorkbench
            properties={properties}
            users={users}
            approvalRequests={approvalRequests}
            can={can}
            currentUser={currentUser}
            submittingAction={submittingAction}
            onApproveProperty={handleApproveProperty}
            onRejectProperty={handleRejectProperty}
            onRequestChangesProperty={handleRequestChangesProperty}
            onApproveDualCustody={handleApproveDualCustody}
            onRejectDualCustody={handleRejectDualCustody}
            onCancelDualCustody={handleCancelDualCustody}
            onEmergencyOverride={handleEmergencyOverride}
            searchQuery={searchQuery}
          />
        </TabsContent>

        {/* --- TAB 3: INSPECTIONS DISPATCH --- */}
        <TabsContent value="inspections" className="space-y-4">
          <InspectionsDispatchView
            inspections={inspections}
            properties={properties}
            can={can}
            onResolveEscalation={handleResolveInspectionEscalation}
            submittingAction={submittingAction}
            searchQuery={searchQuery}
          />
        </TabsContent>

        {/* --- TAB 4: STAFF & RBAC GOVERNANCE --- */}
        <TabsContent value="staff" className="space-y-4">
          {can('admin.staff.view') || isSuperAdmin ? (
            <StaffManagementView
              staffDirectory={staffDirectory}
              currentUser={currentUser}
              allStaffRoles={ALL_STAFF_ROLES}
              grantablePermissions={GRANTABLE_PERMISSIONS}
              can={can}
              isSuperAdmin={isSuperAdmin}
              onInviteStaff={handleInviteStaff}
              onUpdateRoles={handleUpdateRoles}
              onGrantCustomPerm={handleGrantCustomPerm}
              onRevokeCustomPerm={handleRevokeCustomPerm}
              onToggleStatus={handleToggleStaffStatus}
              onPreviewPermissions={handlePreviewPermissions}
              submittingAction={submittingAction}
              searchQuery={searchQuery}
            />
          ) : (
            <Card className="p-8 text-center rounded-2xl bg-slate-50 border-slate-200">
              <Lock className="h-10 w-10 text-rose-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Privilege Ceilings Enforced</h3>
              <p className="text-xs text-slate-500 mt-1">Staff management and RBAC access matrix is restricted to authorized Super Administrators and Staff Managers.</p>
            </Card>
          )}
        </TabsContent>

        {/* --- TAB 5: TRUST & SAFETY INCIDENT DESK --- */}
        <TabsContent value="reports" className="space-y-4">
          <TrustSafetyDesk
            reports={reports}
            properties={properties}
            can={can}
            onInvestigate={handleInvestigateReport}
            onRequestHostDocs={handleRequestHostDocs}
            onSuspendListing={handleSuspendListingFromReport}
            onRestoreListing={handleRestoreListingFromReport}
            onResolveReport={handleResolveReport}
            onDismissReport={handleDismissReport}
            submittingAction={submittingAction}
            searchQuery={searchQuery}
          />
        </TabsContent>

        {/* --- TAB 6: IMMUTABLE AUDIT LEDGER & SENSITIVE DATA VAULT --- */}
        <TabsContent value="audit" className="space-y-4">
          <AuditLedgerView
            auditLogs={auditLogs}
            can={can}
            onVerifyIntegrity={handleVerifyAuditIntegrity}
            onExport={handleExportAuditLogs}
            integrityResult={integrityResult}
            submittingAction={submittingAction}
            searchQuery={searchQuery}
          />
        </TabsContent>

        {/* --- TAB 7: PROPERTY MODERATION --- */}
        <TabsContent value="properties" className="space-y-4">
          <PropertyModerationView
            properties={properties}
            reports={reports}
            can={can}
            onOpenReviewDialog={(p) => {
              handleTabChange('verification');
            }}
            onOpenDocsDialog={(p) => {
              setInspectDocsProperty(p);
              setIsDocsDialogOpen(true);
            }}
            onSuspendProperty={handleSuspendProperty}
            onRestoreProperty={handleRestoreProperty}
            onSwitchToReports={() => handleTabChange('reports')}
            submittingAction={submittingAction}
            searchQuery={searchQuery}
          />
        </TabsContent>

        {/* --- TAB 8: USER DIRECTORY --- */}
        <TabsContent value="users" className="space-y-4">
          {can('users.view_limited') || isSuperAdmin ? (
            <UserManagementView
              users={users}
              properties={properties}
              can={can}
              isSuperAdmin={isSuperAdmin}
              onInspectUser={(u) => {
                setInspectedUser(u);
                setIsUserInspectOpen(true);
              }}
              onToggleStatus={handleToggleUserStatus}
              submittingAction={submittingAction}
              searchQuery={searchQuery}
            />
          ) : (
            <Card className="p-8 text-center rounded-2xl bg-slate-50 border-slate-200">
              <Lock className="h-10 w-10 text-rose-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Privilege Ceilings Enforced</h3>
              <p className="text-xs text-slate-500 mt-1">User management directory is restricted to authorized support personnel and Super Administrators.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* --- STANDALONE USER INSPECTION DIALOG --- */}
      <Dialog open={isUserInspectOpen} onOpenChange={setIsUserInspectOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-[500px] rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <span>User Profile &amp; Role Inspection</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Platform identity details for {inspectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          {inspectedUser && (
            <div className="space-y-4 pt-2 text-xs">
              {inspectedUser.role === 'ADMIN' && !isSuperAdmin ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Lock className="h-4 w-4 text-amber-700" />
                    <span>Super Admin Authorization Required</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Administrative staff identities and security permissions can only be inspected or audited by a Super Administrator.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center justify-center text-base shrink-0">
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
                      <span className="font-bold text-slate-900">
                        {properties.filter((p) => p.ownerId === inspectedUser.id || p.authorizedAgentId === inspectedUser.id).length} Listings
                      </span>
                    </div>
                  </div>

                  {inspectedUser.role !== 'ADMIN' && can('users.suspend') && (
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
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsUserInspectOpen(false)} className="rounded-xl text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- STANDALONE PROPERTY DOCUMENTS VAULT DIALOG --- */}
      <Dialog open={isDocsDialogOpen} onOpenChange={setIsDocsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-2xl rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span>Title Documents Vault: {inspectDocsProperty?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Access-controlled property title documentation and authority records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {(!inspectDocsProperty?.documents || inspectDocsProperty.documents.length === 0) ? (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                <FileWarning className="h-8 w-8 mx-auto mb-1 text-slate-300" />
                <p className="font-semibold">No confidential title documents uploaded for this asset.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inspectDocsProperty.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">{doc.fileName}</span>
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {doc.documentType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()} • Status: {doc.status}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`/api/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline shrink-0"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsDocsDialogOpen(false)} className="rounded-xl text-xs">
              Close Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Governance Command Center...
        </div>
      }
    >
      <AdminPortalContent />
    </Suspense>
  );
}
