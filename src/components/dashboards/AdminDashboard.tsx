'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Building,
  Calendar,
  FileText,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Search,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  Lock,
  UserCheck,
  UserX,
  Filter,
  ArrowRight,
  AlertCircle,
  Building2,
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
import { formatNaira, formatCurrency } from '@/lib/utils';
import {
  Property,
  ListingReport,
  InspectionRequest,
  AuditLog,
  VerificationSubStatus,
  ReportStatus,
  User,
  UserVerificationStatus,
} from '@/types/prophunta';
import {
  approveVerificationAction,
  rejectVerificationAction,
  requestVerificationChangesAction,
  updateVerificationChecklistAction,
  updateReportStatusAction,
  suspendPropertyAction,
  restorePropertyAction,
  updateUserStatusAction,
} from '@/server/actions/prophunta-actions';
import { useToast } from '@/hooks/use-toast';

interface AdminDashboardProps {
  properties: Property[];
  reports: ListingReport[];
  inspections: InspectionRequest[];
  auditLogs: AuditLog[];
  users: User[];
  userName: string;
}

const VERIFICATION_STATUS_OPTIONS: { value: VerificationSubStatus; label: string }[] = [
  { value: 'PASSED', label: 'Passed' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CHANGES_REQUIRED', label: 'Changes Required' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'NOT_REVIEWED', label: 'Not Reviewed' },
];

export default function AdminDashboard({
  properties: initialProperties,
  reports: initialReports,
  inspections,
  auditLogs,
  users: initialUsers,
  userName,
}: AdminDashboardProps) {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [reports, setReports] = useState<ListingReport[]>(initialReports);
  const [users, setUsers] = useState<User[]>(initialUsers);

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
  const [medStatus, setMedStatus] = useState<VerificationSubStatus>('PENDING');
  const [inspStatus, setInspStatus] = useState<VerificationSubStatus>('PENDING');

  // Report resolution dialog state
  const [selectedReport, setSelectedReport] = useState<ListingReport | null>(null);
  const [newReportStatus, setNewReportStatus] = useState<ReportStatus>('UNDER_INVESTIGATION');
  const [reportResolutionNotes, setReportResolutionNotes] = useState('');

  // Queue and moderation lists
  const pendingVerification = properties.filter(
    (p) =>
      p.listingStatus === 'SUBMITTED' ||
      p.listingStatus === 'UNDER_REVIEW' ||
      p.verification?.overallStatus === 'PENDING' ||
      p.verification?.overallStatus === 'IN_REVIEW'
  );

  const propertiesRequiringReview = properties.filter(
    (p) =>
      p.listingStatus === 'CHANGES_REQUIRED' ||
      p.listingStatus === 'SUSPENDED' ||
      p.verification?.overallStatus === 'CHANGES_REQUIRED' ||
      reports.some((r) => r.propertyId === p.id && r.status !== 'RESOLVED' && r.status !== 'DISMISSED')
  );

  const openReports = reports.filter(
    (r) => r.status !== 'RESOLVED' && r.status !== 'DISMISSED'
  );

  const handleOpenReview = (prop: Property) => {
    setReviewProperty(prop);
    const ver = prop.verification;
    setOwnerIdStatus(ver?.ownerIdentityStatus || 'PENDING');
    setLocStatus(ver?.locationStatus || 'PENDING');
    setDocStatus(ver?.authorityDocumentStatus || 'PENDING');
    setAvailStatus(ver?.availabilityStatus || 'PENDING');
    setMedStatus(ver?.mediaStatus || 'PENDING');
    setInspStatus(ver?.inspectionStatus || 'PENDING');
    setReviewNotes(ver?.reviewNotes || '');
    setIsReviewOpen(true);
  };

  const handleApprove = async () => {
    if (!reviewProperty) return;
    setSubmittingAction(true);
    await updateVerificationChecklistAction(reviewProperty.id, {
      ownerIdentityStatus: ownerIdStatus,
      locationStatus: locStatus,
      authorityDocumentStatus: docStatus,
      availabilityStatus: availStatus,
      mediaStatus: medStatus,
      inspectionStatus: inspStatus,
    });
    const res = await approveVerificationAction(reviewProperty.id, reviewNotes || 'All 6 points verified');
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Verification Approved', description: 'Listing is now VERIFIED.' });
      setProperties((prev) =>
        prev.map((p) =>
          p.id === reviewProperty.id
            ? {
                ...p,
                listingStatus: 'VERIFIED',
                verification: {
                  ...p.verification!,
                  overallStatus: 'PASSED',
                  reviewNotes: reviewNotes || 'All 6 points verified',
                },
              }
            : p
        )
      );
      setIsReviewOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Approval Failed', description: res.error });
    }
  };

  const handleReject = async () => {
    if (!reviewProperty) return;
    setSubmittingAction(true);
    const res = await rejectVerificationAction(reviewProperty.id, reviewNotes || 'Failed verification checks.');
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Verification Rejected', description: 'Listing has been rejected.' });
      setProperties((prev) =>
        prev.map((p) =>
          p.id === reviewProperty.id
            ? {
                ...p,
                listingStatus: 'REJECTED',
                verification: { ...p.verification!, overallStatus: 'FAILED', reviewNotes },
              }
            : p
        )
      );
      setIsReviewOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Action Failed', description: res.error });
    }
  };

  const handleRequestChanges = async () => {
    if (!reviewProperty) return;
    setSubmittingAction(true);
    const res = await requestVerificationChangesAction(
      reviewProperty.id,
      reviewNotes || 'Additional documentation requested.'
    );
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Changes Requested', description: 'Owner requested to provide further documents.' });
      setProperties((prev) =>
        prev.map((p) =>
          p.id === reviewProperty.id
            ? {
                ...p,
                listingStatus: 'CHANGES_REQUIRED',
                verification: { ...p.verification!, overallStatus: 'CHANGES_REQUIRED', reviewNotes },
              }
            : p
        )
      );
      setIsReviewOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Action Failed', description: res.error });
    }
  };

  const handleSuspendProperty = async (propId: string) => {
    const res = await suspendPropertyAction(propId, 'Suspended by compliance officer from dashboard');
    if (res.success) {
      toast({ title: 'Property Suspended', description: 'Listing removed from active marketplace.' });
      setProperties((prev) =>
        prev.map((p) => (p.id === propId ? { ...p, listingStatus: 'SUSPENDED', availabilityStatus: 'UNAVAILABLE' } : p))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error });
    }
  };

  const handleRestoreProperty = async (propId: string) => {
    const res = await restorePropertyAction(propId);
    if (res.success) {
      toast({ title: 'Property Restored', description: 'Listing is now active.' });
      setProperties((prev) =>
        prev.map((p) => (p.id === propId ? { ...p, listingStatus: 'ACTIVE', availabilityStatus: 'AVAILABLE' } : p))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error });
    }
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;
    setSubmittingAction(true);
    const res = await updateReportStatusAction(
      selectedReport.id,
      newReportStatus,
      reportResolutionNotes || 'Status updated from admin dashboard'
    );
    setSubmittingAction(false);
    if (res.success) {
      toast({ title: 'Report Updated', description: `Report status updated to ${newReportStatus}.` });
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? { ...r, status: newReportStatus, resolutionNotes: reportResolutionNotes } : r
        )
      );
      setSelectedReport(null);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error });
    }
  };

  const handleToggleUserVerification = async (userId: string, currentStatus: UserVerificationStatus) => {
    const nextStatus: UserVerificationStatus = currentStatus === 'VERIFIED' ? 'UNVERIFIED' : 'VERIFIED';
    const res = await updateUserStatusAction(userId, nextStatus);
    if (res.success) {
      toast({ title: 'User Status Updated', description: `User identity status changed to ${nextStatus}.` });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, verificationStatus: nextStatus } : u))
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              Compliance Officer & Platform Trust Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Admin Governance Center, {userName}
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Audit submitted titles, manage the 6-point verification queue, govern trust & safety incident reports, inspect field observations, and view the immutable audit ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-950/50 gap-2 h-10 px-4">
              <Link href="/admin">
                <ShieldCheck className="h-4 w-4" />
                Open Full Admin Portal
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Platform Overview KPIs Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Listings</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{properties.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Total Properties</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-amber-600 uppercase">Queue</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-950">{pendingVerification.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Pending Verification</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-red-600 uppercase">Review</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-red-950">{propertiesRequiringReview.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Require Review</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <AlertCircle className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-purple-600 uppercase">Reports</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-purple-950">{openReports.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Active Safety Reports</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 uppercase">Showings</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{inspections.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Field Inspections</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <History className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 uppercase">Audit</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{auditLogs.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Audit Events</span>
          </div>
        </div>
      </div>

      {/* 3. Pending Verification Queue */}
      <Card className="border border-slate-200/90 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Pending Verification Queue ({pendingVerification.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Listings submitted for compliance signoff. Conduct 6-point checklist review before awarding Verified Shield.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {pendingVerification.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              Verification queue is completely clear.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingVerification.map((prop) => (
                <div
                  key={prop.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{prop.title}</p>
                      <Badge className="bg-sky-600 text-white text-[10px]">
                        {prop.verification?.overallStatus || 'PENDING'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 mt-1">
                      <span>{prop.address}, {prop.city}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-slate-900">{formatNaira(prop.price)}</span>
                      <span>&bull;</span>
                      <span>Documents: {prop.documents?.length || 0} attached</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
                      onClick={() => handleOpenReview(prop)}
                    >
                      Audit & Verify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Properties Requiring Review & Safety Reports (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties Requiring Review */}
        <Card className="border border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Properties Requiring Review ({propertiesRequiringReview.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Suspended, changes requested, or flagged listings.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {propertiesRequiringReview.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No properties requiring immediate moderation.
              </div>
            ) : (
              propertiesRequiringReview.slice(0, 4).map((prop) => (
                <div
                  key={prop.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 line-clamp-1">{prop.title}</p>
                      <Badge
                        className={
                          prop.listingStatus === 'SUSPENDED'
                            ? 'bg-red-600 text-white text-[10px]'
                            : 'bg-amber-500 text-white text-[10px]'
                        }
                      >
                        {prop.listingStatus}
                      </Badge>
                    </div>
                    <p className="text-slate-500 mt-0.5">{prop.address}, {prop.city}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {prop.listingStatus === 'SUSPENDED' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs h-8"
                        onClick={() => handleRestoreProperty(prop.id)}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8"
                        onClick={() => handleSuspendProperty(prop.id)}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Trust & Safety Reports (7-State Workflow) */}
        <Card className="border border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-purple-600" />
                  Trust & Safety Incident Reports ({reports.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Scam prevention & misrepresentation investigations.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {reports.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Zero reported incidents recorded.
              </div>
            ) : (
              reports.slice(0, 4).map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {rep.reason}
                      </Badge>
                      <Badge
                        className={
                          rep.status === 'RESOLVED'
                            ? 'bg-emerald-600 text-white text-[10px]'
                            : rep.status === 'SUSPENDED'
                            ? 'bg-red-600 text-white text-[10px]'
                            : 'bg-purple-600 text-white text-[10px]'
                        }
                      >
                        {rep.status}
                      </Badge>
                    </div>
                    <p className="text-slate-600 mt-1 line-clamp-1 italic">&ldquo;{rep.description}&rdquo;</p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0"
                    onClick={() => {
                      setSelectedReport(rep);
                      setNewReportStatus(rep.status);
                      setReportResolutionNotes(rep.resolutionNotes || '');
                    }}
                  >
                    Manage
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Platform Inspections & User Compliance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inspections Oversight */}
        <Card className="border border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Platform Inspections ({inspections.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Physical walkthrough schedule and condition reports.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {inspections.slice(0, 4).map((insp) => (
              <div
                key={insp.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{insp.propertyTitle}</p>
                  <p className="text-slate-500 mt-0.5">
                    {insp.seekerName} &bull; {insp.preferredDate} ({insp.preferredTimeSlot})
                  </p>
                </div>
                <Badge
                  className={
                    insp.status === 'COMPLETED'
                      ? 'bg-emerald-600 text-white text-[10px]'
                      : 'bg-blue-600 text-white text-[10px]'
                  }
                >
                  {insp.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Users Oversight */}
        <Card className="border border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  User Directory & Identity Verification ({users.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Role assignments and KYC verification status.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {users.slice(0, 4).map((u) => (
              <div
                key={u.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                  </div>
                  <p className="text-slate-500 mt-0.5">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      u.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-600 text-white text-[10px]'
                        : 'bg-slate-400 text-white text-[10px]'
                    }
                  >
                    {u.verificationStatus}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={() => handleToggleUserVerification(u.id, u.verificationStatus)}
                  >
                    Toggle
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 6. Immutable Audit Activity Stream */}
      <Card className="border border-slate-200/90 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-600" />
                Immutable Audit Activity Stream ({auditLogs.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Cryptographically tracked ledger of all sensitive platform actions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <Badge variant="outline" className="text-[10px]">{log.objectType}</Badge>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Actor: {log.actorEmail} ({log.actorRole})
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <Badge className="bg-emerald-600 text-white text-[10px] mr-2">
                    {log.result}
                  </Badge>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Review Checklist Dialog (PRD Section 12) */}
      {reviewProperty && (
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                6-Point Verification Audit & Compliance
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {reviewProperty.title} &bull; {reviewProperty.address}, {reviewProperty.city}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border bg-slate-50">
                  <Label className="text-xs font-bold text-slate-800">1. Owner / Agent Identity</Label>
                  <Select value={ownerIdStatus} onValueChange={(val: any) => setOwnerIdStatus(val)}>
                    <SelectTrigger className="mt-1.5 h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50">
                  <Label className="text-xs font-bold text-slate-800">2. Physical Location & Coordinates</Label>
                  <Select value={locStatus} onValueChange={(val: any) => setLocStatus(val)}>
                    <SelectTrigger className="mt-1.5 h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50">
                  <Label className="text-xs font-bold text-slate-800">3. Title / Authority Documentation</Label>
                  <Select value={docStatus} onValueChange={(val: any) => setDocStatus(val)}>
                    <SelectTrigger className="mt-1.5 h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50">
                  <Label className="text-xs font-bold text-slate-800">4. Availability & Vacancy</Label>
                  <Select value={availStatus} onValueChange={(val: any) => setAvailStatus(val)}>
                    <SelectTrigger className="mt-1.5 h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50">
                  <Label className="text-xs font-bold text-slate-800">5. Media Accuracy (Photos/Video)</Label>
                  <Select value={medStatus} onValueChange={(val: any) => setMedStatus(val)}>
                    <SelectTrigger className="mt-1.5 h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50">
                  <Label className="text-xs font-bold text-slate-800">6. Physical Inspection Walkthrough</Label>
                  <Select value={inspStatus} onValueChange={(val: any) => setInspStatus(val)}>
                    <SelectTrigger className="mt-1.5 h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Reviewer Audit Notes & Compliance Directives</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record findings regarding C of O, Governor's consent, survey plan, or discrepancy notes..."
                  className="mt-1 text-xs min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs"
                disabled={submittingAction}
                onClick={handleRequestChanges}
              >
                Request Changes
              </Button>
              <Button
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-50 text-xs"
                disabled={submittingAction}
                onClick={handleReject}
              >
                Reject Listing
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                disabled={submittingAction}
                onClick={handleApprove}
              >
                Approve & Issue Shield
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Safety Report Status Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <ShieldAlert className="h-5 w-5 text-purple-600" />
                Investigate Safety Report
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Reason: {selectedReport.reason}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border">
                <p className="font-bold text-slate-800 mb-1">User Reported Description:</p>
                <p className="text-slate-600 italic">&ldquo;{selectedReport.description}&rdquo;</p>
              </div>

              <div>
                <Label className="text-xs font-bold">Update Investigation Status</Label>
                <Select value={newReportStatus} onValueChange={(val: any) => setNewReportStatus(val)}>
                  <SelectTrigger className="mt-1 h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        'REPORTED',
                        'UNDER_INVESTIGATION',
                        'DOCUMENTATION_REQUESTED',
                        'RESOLVED',
                        'DISMISSED',
                        'SUSPENDED',
                        'ESCALATED',
                      ] as ReportStatus[]
                    ).map((st) => (
                      <SelectItem key={st} value={st} className="text-xs">
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold">Resolution Notes (Logged to Audit)</Label>
                <Textarea
                  value={reportResolutionNotes}
                  onChange={(e) => setReportResolutionNotes(e.target.value)}
                  placeholder="Enter findings and action taken..."
                  className="mt-1 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs w-full"
                disabled={submittingAction}
                onClick={handleUpdateReport}
              >
                Save Status & Record in Audit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
