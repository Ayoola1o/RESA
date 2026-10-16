'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Home,
  Check,
  X,
  FileSignature,
  Clock,
  MapPin,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck2,
  ChevronRight,
  ExternalLink,
  Download,
  AlertCircle,
  Sparkles,
  Building2,
  UserCheck,
  CalendarCheck2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Property,
  User,
  VerificationSubStatus,
  ApprovalRequest,
  ApprovalActionType,
  AdminPermission,
} from '@/types/prophunta';
import { formatCurrency } from '@/lib/utils';

const VERIFICATION_STATUS_OPTIONS: { value: VerificationSubStatus; label: string }[] = [
  { value: 'PASSED', label: 'Passed' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CHANGES_REQUIRED', label: 'Changes Required' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'NOT_REVIEWED', label: 'Not Reviewed' },
];

interface ApprovalWorkbenchProps {
  properties: Property[];
  users: User[];
  approvalRequests: ApprovalRequest[];
  can: (perm: AdminPermission) => boolean;
  currentUser: any;
  submittingAction: boolean;
  onApproveProperty: (property: Property, notes: string, checklist: Record<string, VerificationSubStatus>) => Promise<void>;
  onRejectProperty: (property: Property, notes: string, checklist: Record<string, VerificationSubStatus>) => Promise<void>;
  onRequestChangesProperty: (property: Property, notes: string, checklist: Record<string, VerificationSubStatus>) => Promise<void>;
  onApproveDualCustody: (requestId: string) => Promise<void>;
  onRejectDualCustody: (requestId: string, reason: string) => Promise<void>;
  onCancelDualCustody: (requestId: string) => Promise<void>;
  onEmergencyOverride: (actionType: ApprovalActionType, resourceId: string, incidentRef: string, justification: string) => Promise<void>;
  searchQuery: string;
}

export function ApprovalWorkbench({
  properties,
  users,
  approvalRequests,
  can,
  currentUser,
  submittingAction,
  onApproveProperty,
  onRejectProperty,
  onRequestChangesProperty,
  onApproveDualCustody,
  onRejectDualCustody,
  onCancelDualCustody,
  onEmergencyOverride,
  searchQuery,
}: ApprovalWorkbenchProps) {
  // Status filter for property queue
  const [propertyFilter, setPropertyFilter] = useState<'ALL' | 'PENDING' | 'CHANGES_REQUIRED' | 'VERIFIED' | 'REJECTED'>('PENDING');

  // Slide-over Sheet / Drawer State for Property Inspection
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorNotes, setInspectorNotes] = useState('');

  // 6 Checklist items
  const [ownerIdStatus, setOwnerIdStatus] = useState<VerificationSubStatus>('PENDING');
  const [locStatus, setLocStatus] = useState<VerificationSubStatus>('PENDING');
  const [docStatus, setDocStatus] = useState<VerificationSubStatus>('PENDING');
  const [availStatus, setAvailStatus] = useState<VerificationSubStatus>('PENDING');
  const [mediaStatus, setMediaStatus] = useState<VerificationSubStatus>('PENDING');
  const [inspStatus, setInspStatus] = useState<VerificationSubStatus>('PENDING');

  // Sub-tab in Inspector Drawer
  const [inspectorTab, setInspectorTab] = useState<'CHECKLIST' | 'DOCUMENTS' | 'MEDIA'>('CHECKLIST');

  // Four-Eyes Approval Filter
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('PENDING');
  const [rejectingApprovalId, setRejectingApprovalId] = useState<string | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Emergency Override State
  const [isEmergencyOverrideOpen, setIsEmergencyOverrideOpen] = useState(false);
  const [overrideActionType, setOverrideActionType] = useState<ApprovalActionType>('PROPERTY_RESTORE');
  const [overrideResourceId, setOverrideResourceId] = useState('');
  const [overrideIncidentRef, setOverrideIncidentRef] = useState('');
  const [overrideJustification, setOverrideJustification] = useState('');

  const getHostForProperty = (prop: Property): User | undefined => {
    return users.find((u) => u.id === prop.ownerId || u.id === prop.authorizedAgentId);
  };

  // Open inspector sheet
  const handleOpenInspector = (prop: Property) => {
    setSelectedProperty(prop);
    const v = prop.verification;
    setOwnerIdStatus(v?.ownerIdentityStatus || 'PENDING');
    setLocStatus(v?.locationStatus || 'PENDING');
    setDocStatus(v?.authorityDocumentStatus || 'PENDING');
    setAvailStatus(v?.availabilityStatus || 'PENDING');
    setMediaStatus(v?.mediaStatus || 'PENDING');
    setInspStatus(v?.inspectionStatus || 'PENDING');
    setInspectorNotes(v?.reviewNotes || '');
    setInspectorTab('CHECKLIST');
    setIsInspectorOpen(true);
  };

  const getChecklistPayload = () => ({
    ownerIdentityStatus: ownerIdStatus,
    locationStatus: locStatus,
    authorityDocumentStatus: docStatus,
    availabilityStatus: availStatus,
    mediaStatus: mediaStatus,
    inspectionStatus: inspStatus,
  });

  const handleApproveFromSheet = async () => {
    if (!selectedProperty) return;
    await onApproveProperty(selectedProperty, inspectorNotes, getChecklistPayload());
    setIsInspectorOpen(false);
  };

  const handleRejectFromSheet = async () => {
    if (!selectedProperty) return;
    await onRejectProperty(selectedProperty, inspectorNotes, getChecklistPayload());
    setIsInspectorOpen(false);
  };

  const handleRequestChangesFromSheet = async () => {
    if (!selectedProperty) return;
    await onRequestChangesProperty(selectedProperty, inspectorNotes, getChecklistPayload());
    setIsInspectorOpen(false);
  };

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Status filter
      if (propertyFilter === 'PENDING') {
        if (p.listingStatus !== 'SUBMITTED' && p.listingStatus !== 'UNDER_REVIEW') return false;
      } else if (propertyFilter === 'CHANGES_REQUIRED') {
        if (p.listingStatus !== 'CHANGES_REQUIRED') return false;
      } else if (propertyFilter === 'VERIFIED') {
        if (p.listingStatus !== 'VERIFIED' && p.listingStatus !== 'ACTIVE') return false;
      } else if (propertyFilter === 'REJECTED') {
        if (p.listingStatus !== 'REJECTED') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const host = getHostForProperty(p);
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesAddress = (p.address || '').toLowerCase().includes(q);
        const matchesCity = (p.city || '').toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesHost = host?.name?.toLowerCase().includes(q) || host?.email?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAddress && !matchesCity && !matchesId && !matchesHost) {
          return false;
        }
      }

      return true;
    });
  }, [properties, propertyFilter, searchQuery, users]);

  // Filtered approval requests
  const filteredApprovals = useMemo(() => {
    return approvalRequests.filter((a) => {
      if (approvalFilter !== 'ALL' && a.status !== approvalFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = a.actionType.toLowerCase().includes(q);
        const matchesTarget = a.targetResourceId.toLowerCase().includes(q) || a.targetResourceType.toLowerCase().includes(q);
        const matchesEmail = a.requesterEmail.toLowerCase().includes(q);
        const matchesId = a.id.toLowerCase().includes(q);
        if (!matchesAction && !matchesTarget && !matchesEmail && !matchesId) return false;
      }
      return true;
    });
  }, [approvalRequests, approvalFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* =========================================================================
          SECTION 1: PROPERTY VERIFICATION & APPROVAL QUEUE
         ========================================================================= */}
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 font-headline">
                  Property Verification Workbench
                </CardTitle>
                <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5">
                  Phase 5 Cadaster &amp; Title Verification
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Inspect cadastral land coordinates, legal title proofs, and KYC evidence before issuing marketplace trust badges.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['PENDING', 'CHANGES_REQUIRED', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((st) => {
                const count = properties.filter((p) => {
                  if (st === 'PENDING') return p.listingStatus === 'SUBMITTED' || p.listingStatus === 'UNDER_REVIEW';
                  if (st === 'CHANGES_REQUIRED') return p.listingStatus === 'CHANGES_REQUIRED';
                  if (st === 'VERIFIED') return p.listingStatus === 'VERIFIED' || p.listingStatus === 'ACTIVE';
                  if (st === 'REJECTED') return p.listingStatus === 'REJECTED';
                  return true;
                }).length;

                return (
                  <Button
                    key={st}
                    size="sm"
                    variant={propertyFilter === st ? 'default' : 'outline'}
                    onClick={() => setPropertyFilter(st)}
                    className={`h-7 text-[11px] rounded-lg font-semibold ${
                      propertyFilter === st ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 border-slate-200'
                    }`}
                  >
                    {st === 'PENDING' ? 'Pending Review' : st === 'CHANGES_REQUIRED' ? 'Queried' : st === 'VERIFIED' ? 'Approved' : st}
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] tabular-nums ${
                        propertyFilter === st ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredProperties.length === 0 ? (
            <div className="py-14 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-800">Verification Queue is Clear</p>
              <p className="text-xs text-slate-400 mt-0.5">No properties found matching current filter: {propertyFilter}.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProperties.map((p) => {
                const host = getHostForProperty(p);
                const submittedDate = new Date(p.createdAt);
                const hoursWaiting = Math.round((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60));
                const isOverdue = hoursWaiting > 24;

                return (
                  <div
                    key={p.id}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
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

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 truncate max-w-sm" title={p.title}>
                            {p.title}
                          </h3>
                          <Badge variant="outline" className="text-[10px] font-mono text-slate-500 bg-slate-50">
                            {p.id}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-bold uppercase rounded-full ${
                              p.listingStatus === 'SUBMITTED'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : p.listingStatus === 'VERIFIED' || p.listingStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : p.listingStatus === 'CHANGES_REQUIRED'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}
                          >
                            {p.listingStatus}
                          </Badge>
                          <span className="text-xs font-bold tabular-nums text-slate-900">
                            {formatCurrency(p.price, p.listingType === 'RENT' ? 'For Rent' : 'For Sale')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{p.address}, {p.area}, {p.city}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                          <span>
                            Landlord: <strong className="text-slate-800">{host?.name || 'Direct Owner'}</strong>{' '}
                            <span className="text-[10px] font-mono">({host?.email || 'N/A'})</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>Wait time:</span>
                            <span className={`font-semibold tabular-nums ${isOverdue ? 'text-amber-600 font-bold' : 'text-slate-700'}`}>
                              {hoursWaiting}h {isOverdue && '(SLA Alert)'}
                            </span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>
                            Docs Attached: <strong className="text-slate-800">{p.documents?.length || 0}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                      <Button
                        size="sm"
                        onClick={() => handleOpenInspector(p)}
                        className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                        Inspect &amp; Review
                      </Button>

                      {p.listingStatus !== 'VERIFIED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenInspector(p)}
                          className="h-9 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenInspector(p)}
                        className="h-9 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold"
                      >
                        <FileSignature className="h-3.5 w-3.5 mr-1" />
                        Clarify
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          SECTION 2: FOUR-EYES DUAL-CUSTODY APPROVAL QUEUE (PHASE 5)
         ========================================================================= */}
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 font-headline">
                  Four-Eyes Dual-Custody Approval Queue
                </CardTitle>
                <Badge className="bg-purple-600 text-white font-bold text-[10px] px-2 py-0.5">
                  Mandatory Dual Custody
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                High-impact administrative changes require independent verification. Requesters cannot approve their own mutations.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsEmergencyOverrideOpen(true)}
                className="rounded-xl text-xs font-semibold h-8"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                Emergency Override
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((filterStatus) => (
              <Button
                key={filterStatus}
                size="sm"
                variant={approvalFilter === filterStatus ? 'default' : 'outline'}
                onClick={() => setApprovalFilter(filterStatus)}
                className={`h-7 text-[11px] rounded-lg font-semibold ${
                  approvalFilter === filterStatus ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 border-slate-200'
                }`}
              >
                {filterStatus}
                {filterStatus === 'PENDING' && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-slate-900 tabular-nums">
                    {approvalRequests.filter((a) => a.status === 'PENDING').length}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredApprovals.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-700">Approval Queue is Clear</p>
              <p className="text-xs text-slate-400 mt-0.5">No approval requests matching filter: {approvalFilter}.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredApprovals.map((req) => {
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

                      {isMyRequest && isPending && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Self-Approval Restricted: You cannot approve your own change request.</span>
                        </div>
                      )}

                      {req.decisionNotes && (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px]">
                          <strong>Decision Note:</strong> {req.decisionNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isPending && can('approvals.approve') && !isMyRequest && (
                        <Button
                          size="sm"
                          onClick={() => onApproveDualCustody(req.id)}
                          disabled={submittingAction}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve Request
                        </Button>
                      )}

                      {isPending && can('approvals.reject') && !isMyRequest && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setRejectingApprovalId(req.id);
                            setIsRejectDialogOpen(true);
                          }}
                          disabled={submittingAction}
                          className="rounded-xl text-xs font-semibold"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      )}

                      {isPending && isMyRequest && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCancelDualCustody(req.id)}
                          disabled={submittingAction}
                          className="rounded-xl text-xs text-slate-600"
                        >
                          Cancel Request
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

      {/* =========================================================================
          SLIDE-OVER INSPECTION SHEET (DRAWER)
         ========================================================================= */}
      <Sheet open={isInspectorOpen} onOpenChange={setIsInspectorOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto no-scrollbar p-6 space-y-6">
          <SheetHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-900 text-white text-[10px] font-mono">
                {selectedProperty?.id}
              </Badge>
              <Badge
                className={`text-[10px] font-bold uppercase rounded-full ${
                  selectedProperty?.listingStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedProperty?.listingStatus}
              </Badge>
            </div>
            <SheetTitle className="text-xl font-bold text-slate-900 font-headline mt-1">
              {selectedProperty?.title}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              {selectedProperty?.address}, {selectedProperty?.area}, {selectedProperty?.city} •{' '}
              <strong className="text-slate-900 tabular-nums">
                {selectedProperty ? formatCurrency(selectedProperty.price, selectedProperty.listingType === 'RENT' ? 'For Rent' : 'For Sale') : ''}
              </strong>
            </SheetDescription>
          </SheetHeader>

          {/* Sub-Tabs: Checklist | Documents | Media */}
          <div className="flex items-center gap-1 border-b border-slate-100 pb-2">
            <button
              onClick={() => setInspectorTab('CHECKLIST')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                inspectorTab === 'CHECKLIST' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Compliance Checklist
            </button>
            <button
              onClick={() => setInspectorTab('DOCUMENTS')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                inspectorTab === 'DOCUMENTS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Title Documents ({selectedProperty?.documents?.length || 0})
            </button>
            <button
              onClick={() => setInspectorTab('MEDIA')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                inspectorTab === 'MEDIA' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Media Gallery ({selectedProperty?.media?.length || 0})
            </button>
          </div>

          {/* TAB 1: 6-POINT CHECKLIST */}
          {inspectorTab === 'CHECKLIST' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Owner Identity */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">1. Owner / Host Identity</Label>
                    <span className="text-[10px] text-slate-400">KYC Matched</span>
                  </div>
                  <Select value={ownerIdStatus} onValueChange={(v: any) => setOwnerIdStatus(v)}>
                    <SelectTrigger className="h-9 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Location */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">2. Cadastral Coordinates</Label>
                    <span className="text-[10px] text-slate-400">GIS Audit</span>
                  </div>
                  <Select value={locStatus} onValueChange={(v: any) => setLocStatus(v)}>
                    <SelectTrigger className="h-9 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Authority Documents */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">3. Legal Title Documents</Label>
                    <span className="text-[10px] text-slate-400">Deed/C of O</span>
                  </div>
                  <Select value={docStatus} onValueChange={(v: any) => setDocStatus(v)}>
                    <SelectTrigger className="h-9 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 4. Availability */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">4. Availability &amp; Keys</Label>
                    <span className="text-[10px] text-slate-400">Not Rented Out</span>
                  </div>
                  <Select value={availStatus} onValueChange={(v: any) => setAvailStatus(v)}>
                    <SelectTrigger className="h-9 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 5. Media */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">5. 4K Photos &amp; Video</Label>
                    <span className="text-[10px] text-slate-400">No Watermarks</span>
                  </div>
                  <Select value={mediaStatus} onValueChange={(v: any) => setMediaStatus(v)}>
                    <SelectTrigger className="h-9 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 6. Inspection */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">6. Physical Inspection</Label>
                    <span className="text-[10px] text-slate-400">Field Auditor</span>
                  </div>
                  <Select value={inspStatus} onValueChange={(v: any) => setInspStatus(v)}>
                    <SelectTrigger className="h-9 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Review Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="inspectorNotes" className="text-xs font-bold text-slate-800">
                  Mandatory Audit Rationale / Verification Notes
                </Label>
                <Textarea
                  id="inspectorNotes"
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  placeholder="Record formal reasons for approval, changes requested, or rejection..."
                  className="rounded-xl text-xs min-h-[90px]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ATTACHED TITLE DOCUMENTS */}
          {inspectorTab === 'DOCUMENTS' && (
            <div className="space-y-3">
              {(!selectedProperty?.documents || selectedProperty.documents.length === 0) ? (
                <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                  <FileText className="h-8 w-8 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-semibold">No confidential title documents uploaded.</p>
                </div>
              ) : (
                selectedProperty.documents.map((doc) => (
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
                          <Badge variant="outline" className="text-[9px] font-semibold">
                            {doc.documentType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
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
                ))
              )}
            </div>
          )}

          {/* TAB 3: MEDIA GALLERY */}
          {inspectorTab === 'MEDIA' && (
            <div className="space-y-3">
              {(!selectedProperty?.media || selectedProperty.media.length === 0) ? (
                <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                  <p className="text-xs font-semibold">No media attached to listing.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedProperty.media.map((med, idx) => (
                    <div key={med.id || idx} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video relative group">
                      {med.type === 'video' ? (
                        <div className="h-full w-full flex items-center justify-center bg-slate-900 text-white text-xs font-semibold">
                          Video Walkthrough
                        </div>
                      ) : (
                        <img src={med.url} alt={med.caption || 'Media'} className="h-full w-full object-cover" />
                      )}
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        #{med.order}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <SheetFooter className="border-t border-slate-100 pt-4 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRequestChangesFromSheet}
              disabled={submittingAction}
              className="rounded-xl text-xs font-semibold border-amber-300 text-amber-800 hover:bg-amber-50 h-10 flex-1"
            >
              <FileSignature className="h-3.5 w-3.5 mr-1.5" />
              Request Clarification
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleRejectFromSheet}
              disabled={submittingAction}
              className="rounded-xl text-xs font-semibold h-10 flex-1"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Reject Listing
            </Button>

            <Button
              type="button"
              onClick={handleApproveFromSheet}
              disabled={submittingAction}
              className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white h-10 flex-1 shadow-xs"
            >
              {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
              Approve &amp; Verify
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Reject Dual-Custody Approval Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900">
              Reject Change Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter formal compliance notes detailing why this high-impact mutation is rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs font-bold text-slate-800">Formal Rejection Notes *</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete title deed documentation or mismatched owner credentials."
              className="rounded-xl text-xs min-h-[80px]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRejectDialogOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (rejectingApprovalId) {
                  await onRejectDualCustody(rejectingApprovalId, rejectionReason);
                  setIsRejectDialogOpen(false);
                  setRejectionReason('');
                  setRejectingApprovalId(null);
                }
              }}
              disabled={!rejectionReason.trim() || submittingAction}
              className="rounded-xl text-xs font-semibold"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Override Dialog */}
      <Dialog open={isEmergencyOverrideOpen} onOpenChange={setIsEmergencyOverrideOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Super Admin Emergency Override
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Emergency bypass of the Four-Eyes principle. Every override generates a permanent incident log and compliance flag.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Mutation Action Type</Label>
              <Select value={overrideActionType} onValueChange={(v: any) => setOverrideActionType(v)}>
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROPERTY_SUSPEND">PROPERTY_SUSPEND (Take Down Listing)</SelectItem>
                  <SelectItem value="PROPERTY_RESTORE">PROPERTY_RESTORE (Restore Active Listing)</SelectItem>
                  <SelectItem value="USER_SUSPEND">USER_SUSPEND (Freeze Platform Account)</SelectItem>
                  <SelectItem value="USER_RESTORE">USER_RESTORE (Reactivate Platform Account)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Target Resource ID *</Label>
              <Input
                placeholder="e.g. prop_1791901868531_5tdw"
                value={overrideResourceId}
                onChange={(e) => setOverrideResourceId(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Security Incident Reference *</Label>
              <Input
                placeholder="e.g. INC-SEC-88219"
                value={overrideIncidentRef}
                onChange={(e) => setOverrideIncidentRef(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Formal Justification *</Label>
              <Textarea
                placeholder="Explain the urgent business or legal justification for emergency bypass..."
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                className="rounded-xl text-xs min-h-[70px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEmergencyOverrideOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                await onEmergencyOverride(overrideActionType, overrideResourceId, overrideIncidentRef, overrideJustification);
                setIsEmergencyOverrideOpen(false);
                setOverrideResourceId('');
                setOverrideIncidentRef('');
                setOverrideJustification('');
              }}
              disabled={!overrideResourceId.trim() || !overrideIncidentRef.trim() || !overrideJustification.trim() || submittingAction}
              className="rounded-xl text-xs font-semibold"
            >
              Execute Emergency Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
