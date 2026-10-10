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
  getUsersAction,
  updateUserStatusAction,
  suspendPropertyAction,
  restorePropertyAction,
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

function AdminPortalContent() {
  const { userRole, currentUser } = useUserRole();
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

  // Property Documents Modal State (PRD Section 13)
  const [inspectDocsProperty, setInspectDocsProperty] = useState<Property | null>(null);
  const [isDocsDialogOpen, setIsDocsDialogOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [props, reps, insps, auds, usrs] = await Promise.all([
        getPropertiesAction(),
        getReportsAction().catch(() => []),
        getUserInspectionsAction().catch(() => []),
        getAuditLogsAction().catch(() => []),
        getUsersAction().catch(() => []),
      ]);
      setProperties(props);
      setReports(reps);
      setInspections(insps);
      setAuditLogs(auds);
      setUsers(usrs);
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
          <p className="text-xs text-slate-500 mt-1">
            Administered by {currentUser?.name || 'Amina Bello'} (Verification Officer) • Lagos & Abuja Trust Nodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs font-semibold rounded-xl"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Refresh Records
          </Button>
          <Button size="sm" asChild className="bg-lime-600 hover:bg-lime-500 rounded-xl text-xs font-bold text-white">
            <Link href="/marketplace">View Public Marketplace</Link>
          </Button>
        </div>
      </div>

      {/* --- SECTION 13: OVERVIEW METRIC CARDS --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Users */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{users.length}</div>
            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Seekers, Hosts & Agents</p>
          </CardContent>
        </Card>

        {/* Total Properties */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Properties</span>
              <Home className="h-4 w-4 text-lime-700" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{properties.length}</div>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              {properties.filter((p) => p.listingStatus === 'VERIFIED' || p.listingStatus === 'ACTIVE').length} Verified Active
            </p>
          </CardContent>
        </Card>

        {/* Pending Verification */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Verification</span>
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{pendingVerificationList.length}</div>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Awaiting Compliance Audit</p>
          </CardContent>
        </Card>

        {/* Inspections */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inspections</span>
              <CalendarCheck2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{inspections.length}</div>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Physical & Video Audits</p>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reports</span>
              <BadgeAlert className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{reports.length}</div>
            <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Trust & Safety Flags</p>
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
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900">
                Scheduled Inspections & Field Audits
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Physical visits and live video walkthroughs conducted with verified condition records.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {inspections.map((i) => (
                  <div key={i.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{i.propertyTitle}</span>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {i.type === 'IN_PERSON' ? 'Physical Visit' : 'Video Tour'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Requested by <strong>{i.seekerName}</strong> for{' '}
                        <strong>{new Date(i.preferredDate).toLocaleDateString()} ({i.preferredTimeSlot})</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs font-bold ${
                          i.status === 'COMPLETED'
                            ? 'bg-emerald-600'
                            : i.status === 'SCHEDULED' || i.status === 'ACCEPTED'
                            ? 'bg-lime-600 text-white font-bold'
                            : i.status === 'CANCELLED'
                            ? 'bg-rose-600'
                            : 'bg-amber-500'
                        }`}
                      >
                        {i.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 6: SYSTEM AUDIT TRAIL (PRD Section 14) --- */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900">
                Immutable System Audit Logs
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Cryptographically tracked record of sensitive operational decisions, verifications, and suspensions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 font-mono text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/80 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lime-900 bg-lime-50 px-1.5 py-0.5 rounded text-[11px] border border-lime-200">
                          {log.action}
                        </span>
                        <span className="text-slate-700 font-sans font-semibold">
                          Actor: {log.actorEmail} ({log.actorRole})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Target: {log.objectType} [{log.objectId}] {log.metadata ? `• Details: ${JSON.stringify(log.metadata)}` : ''}
                      </p>
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
