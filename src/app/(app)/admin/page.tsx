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
  updateReportStatusAction,
  updateInspectionStatusAction,
  completeInspectionAction,
} from '@/server/actions/prophunta-actions';
import {
  Property,
  ListingReport,
  InspectionRequest,
  AuditLog,
  VerificationSubStatus,
  ReportStatus,
} from '@/types/prophunta';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

function AdminPortalContent() {
  const { userRole, currentUser } = useUserRole();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'verification';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Dialog State
  const [reviewProperty, setReviewProperty] = useState<Property | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Granular states for review dialog
  const [ownerIdStatus, setOwnerIdStatus] = useState<VerificationSubStatus>('PASSED');
  const [locStatus, setLocStatus] = useState<VerificationSubStatus>('PASSED');
  const [docStatus, setDocStatus] = useState<VerificationSubStatus>('PASSED');
  const [availStatus, setAvailStatus] = useState<VerificationSubStatus>('PASSED');
  const [mediaStatus, setMediaStatus] = useState<VerificationSubStatus>('PASSED');
  const [inspStatus, setInspStatus] = useState<VerificationSubStatus>('PASSED');

  const loadData = async () => {
    setLoading(true);
    try {
      const [props, reps, insps, auds] = await Promise.all([
        getPropertiesAction(),
        getReportsAction().catch(() => []),
        getUserInspectionsAction().catch(() => []),
        getAuditLogsAction().catch(() => []),
      ]);
      setProperties(props);
      setReports(reps);
      setInspections(insps);
      setAuditLogs(auds);
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
    setOwnerIdStatus(v?.ownerIdentityStatus || 'PASSED');
    setLocStatus(v?.locationStatus || 'PASSED');
    setDocStatus(v?.authorityDocumentStatus || 'PASSED');
    setAvailStatus(v?.availabilityStatus || 'PASSED');
    setMediaStatus(v?.mediaStatus || 'PASSED');
    setInspStatus(v?.inspectionStatus || 'PASSED');
    setReviewNotes(v?.reviewNotes || '');
    setIsReviewOpen(true);
  };

  const handleApprove = async () => {
    if (!reviewProperty) return;
    setSubmittingAction(true);
    const res = await approveVerificationAction(reviewProperty.id, reviewNotes);
    setSubmittingAction(false);

    if (res.success) {
      toast({
        title: 'Listing Approved & Verified',
        description: `"${reviewProperty.title}" is now active with verified credentials.`,
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

  const handleUpdateReport = async (reportId: string, status: ReportStatus, notes: string) => {
    const res = await updateReportStatusAction(reportId, status, notes);
    if (res.success) {
      toast({ title: 'Report Status Updated', description: `Report is now ${status}` });
      loadData();
    }
  };

  const pendingVerificationList = properties.filter(
    (p) => p.listingStatus === 'SUBMITTED' || p.listingStatus === 'UNDER_REVIEW' || p.listingStatus === 'CHANGES_REQUIRED'
  );

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
            Refresh Records
          </Button>
          <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold">
            <Link href="/marketplace">View Public Marketplace</Link>
          </Button>
        </div>
      </div>

      {/* 5 Top Platform Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Queue</span>
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{pendingVerificationList.length}</div>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Pending Compliance Audit</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Listings</span>
              <Home className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{properties.length}</div>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              {properties.filter((p) => p.listingStatus === 'VERIFIED').length} Verified Active
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inspections</span>
              <CalendarCheck2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{inspections.length}</div>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Physical & Video Audits</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reports</span>
              <BadgeAlert className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{reports.length}</div>
            <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Trust & Safety Flags</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Audit Trail</span>
              <History className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{auditLogs.length}</div>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Immutable Logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Console */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl flex flex-wrap gap-1 w-full max-w-3xl">
          <TabsTrigger value="verification" className="rounded-xl text-xs font-bold gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verification Queue ({pendingVerificationList.length})
          </TabsTrigger>
          <TabsTrigger value="properties" className="rounded-xl text-xs font-bold gap-1.5">
            <Home className="h-3.5 w-3.5" />
            Property Moderation ({properties.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl text-xs font-bold gap-1.5">
            <BadgeAlert className="h-3.5 w-3.5" />
            Trust & Safety ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="inspections" className="rounded-xl text-xs font-bold gap-1.5">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            Inspections ({inspections.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-xl text-xs font-bold gap-1.5">
            <History className="h-3.5 w-3.5" />
            System Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VERIFICATION QUEUE (PRD Section 12 & 13) */}
        <TabsContent value="verification" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900">
                Pending Verification Queue
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Listings awaiting title validation, Cadaster check, and official PropHunta trust badge approval.
              </CardDescription>
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
                  {pendingVerificationList.map((p) => (
                    <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-start gap-3.5">
                        <div className="relative h-16 w-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={p.media[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{p.title}</h3>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border-amber-200">
                              {p.listingStatus}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {p.address}, {p.area}, {p.city} • <strong className="text-slate-800 font-bold">{formatCurrency(p.price, p.listingType === 'RENT' ? 'For Rent' : 'For Sale')}</strong>
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span>Docs Attached: <strong>{p.documents?.length || 0}</strong></span>
                            <span>Submitted: {new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-9 rounded-xl text-xs"
                        >
                          <Link href={`/property/${p.id}`} target="_blank">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Preview
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openReviewDialog(p)}
                          className="h-9 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-sm"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                          Perform Compliance Audit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PROPERTY MODERATION (PRD Section 13) */}
        <TabsContent value="properties" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900">All Platform Properties</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Inspect live properties, review titles, or suspend listings violating platform safety.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {properties.map((p) => (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                        <Badge
                          className={`text-[10px] font-bold ${
                            p.listingStatus === 'VERIFIED'
                              ? 'bg-emerald-600'
                              : p.listingStatus === 'SUSPENDED'
                              ? 'bg-rose-600'
                              : 'bg-slate-600'
                          }`}
                        >
                          {p.listingStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.area}, {p.city} • ₦{p.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                        <Link href={`/property/${p.id}`}>Inspect Page</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(p)}
                        className="h-8 text-xs font-semibold"
                      >
                        Audit Checklist
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: TRUST & SAFETY REPORTS (PRD Section 18) */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-rose-700 flex items-center gap-2">
                <BadgeAlert className="h-5 w-5" />
                Trust & Safety Incident Reports
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                User reports for suspected scam, incorrect info, or unavailable properties.
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
                    <div key={r.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/60">
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
                          className="h-8 text-xs font-semibold"
                        >
                          Mark Under Investigation
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateReport(r.id, 'DOCUMENTATION_REQUESTED', 'Requested fresh survey from host.')}
                          className="h-8 text-xs font-semibold"
                        >
                          Request Documents
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateReport(r.id, 'SUSPENDED', 'Suspended listing due to verified report.')}
                          className="h-8 text-xs font-bold"
                        >
                          Suspend Listing
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateReport(r.id, 'RESOLVED', 'Issue investigated and cleared.')}
                          className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500"
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

        {/* TAB 4: INSPECTIONS MANAGEMENT (PRD Section 15) */}
        <TabsContent value="inspections" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
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
                  <div key={i.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {i.type === 'IN_PERSON' ? 'Physical Visit' : 'Video Tour'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{i.propertyTitle}</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Seeker: <strong>{i.seekerName}</strong> ({i.seekerPhone}) • Window: {i.preferredDate} ({i.preferredTimeSlot})
                      </p>
                      {i.notes && (
                        <p className="text-[11px] text-slate-400 italic">Notes: {i.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs font-bold">
                        {i.status}
                      </Badge>
                      {i.status === 'REQUESTED' && (
                        <Button
                          size="sm"
                          onClick={() => updateInspectionStatusAction(i.id, 'ACCEPTED', 'Host accepted inspection')}
                          className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-500"
                        >
                          Accept
                        </Button>
                      )}
                      {i.status === 'ACCEPTED' && (
                        <Button
                          size="sm"
                          onClick={() => updateInspectionStatusAction(i.id, 'SCHEDULED', 'Time finalized')}
                          className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-500"
                        >
                          Confirm Schedule
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: SYSTEM AUDIT TRAIL (PRD Section 14) */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-600" />
                Immutable System Audit Logs
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Cryptographically tracked record of sensitive operational decisions, verifications, and suspensions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 font-mono text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50/80 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
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

      {/* --- MODAL: GRANULAR COMPLIANCE AUDIT CHECKLIST (PRD Section 12) --- */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Granular Verification Checklist
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Auditing: {reviewProperty?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Checklist parameter toggles */}
            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="font-bold text-slate-900">1. Owner / Authority Identity</p>
                  <p className="text-[11px] text-slate-400">KYC check & NIN / Passport verification</p>
                </div>
                <Select value={ownerIdStatus} onValueChange={(v: any) => setOwnerIdStatus(v)}>
                  <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-bold text-slate-900">2. Location & Cadaster</p>
                  <p className="text-[11px] text-slate-400">Coordinates confirmed against Land Survey</p>
                </div>
                <Select value={locStatus} onValueChange={(v: any) => setLocStatus(v)}>
                  <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-bold text-slate-900">3. Title Documents Reviewed</p>
                  <p className="text-[11px] text-slate-400">Governor&apos;s Consent / C of O / Deed</p>
                </div>
                <Select value={docStatus} onValueChange={(v: any) => setDocStatus(v)}>
                  <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-bold text-slate-900">4. Availability & Vacancy</p>
                  <p className="text-[11px] text-slate-400">Confirmed vacant and not double-let</p>
                </div>
                <Select value={availStatus} onValueChange={(v: any) => setAvailStatus(v)}>
                  <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-bold text-slate-900">5. Media Authenticity</p>
                  <p className="text-[11px] text-slate-400">Confirmed original non-misleading photos</p>
                </div>
                <Select value={mediaStatus} onValueChange={(v: any) => setMediaStatus(v)}>
                  <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-bold text-slate-900">6. Physical Inspection Record</p>
                  <p className="text-[11px] text-slate-400">Field agent verified score on site</p>
                </div>
                <Select value={inspStatus} onValueChange={(v: any) => setInspStatus(v)}>
                  <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
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
              variant="destructive"
              disabled={submittingAction}
              onClick={handleReject}
              className="text-xs font-bold rounded-xl"
            >
              Reject Listing
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submittingAction}
              onClick={handleRequestChanges}
              className="text-xs font-bold rounded-xl text-amber-700 border-amber-300"
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
