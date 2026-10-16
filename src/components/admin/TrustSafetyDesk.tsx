'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BadgeAlert,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  FileText,
  Clock,
  Eye,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ListingReport, Property, AdminPermission, ReportStatus } from '@/types/prophunta';

interface TrustSafetyDeskProps {
  reports: ListingReport[];
  properties: Property[];
  can: (perm: AdminPermission) => boolean;
  onInvestigate: (reportId: string) => Promise<void>;
  onRequestHostDocs: (reportId: string) => Promise<void>;
  onSuspendListing: (propertyId: string, reportId: string) => Promise<void>;
  onRestoreListing: (propertyId: string, reportId: string) => Promise<void>;
  onResolveReport: (reportId: string, notes: string) => Promise<void>;
  onDismissReport: (reportId: string, notes: string) => Promise<void>;
  submittingAction: boolean;
  searchQuery: string;
}

export function TrustSafetyDesk({
  reports,
  properties,
  can,
  onInvestigate,
  onRequestHostDocs,
  onSuspendListing,
  onRestoreListing,
  onResolveReport,
  onDismissReport,
  submittingAction,
  searchQuery,
}: TrustSafetyDeskProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REPORTED' | 'UNDER_INVESTIGATION' | 'RESOLVED'>('ALL');

  // Resolve / Dismiss Dialog States
  const [activeReportForResolution, setActiveReportForResolution] = useState<ListingReport | null>(null);
  const [resolutionType, setResolutionType] = useState<'RESOLVE' | 'DISMISS'>('RESOLVE');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);

  // Expanded report history items
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<string[]>([]);

  const toggleHistory = (id: string) => {
    setExpandedHistoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredReports = reports.filter((rep) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'REPORTED' && rep.status !== 'REPORTED') return false;
      if (statusFilter === 'UNDER_INVESTIGATION' && rep.status !== 'UNDER_INVESTIGATION' && rep.status !== 'DOCUMENTATION_REQUESTED') return false;
      if (statusFilter === 'RESOLVED' && rep.status !== 'RESOLVED' && rep.status !== 'DISMISSED') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesProperty = (rep.propertyTitle || '').toLowerCase().includes(q) || rep.propertyId.toLowerCase().includes(q);
      const matchesReporter = (rep.reporterName || '').toLowerCase().includes(q) || (rep.reporterId || '').toLowerCase().includes(q);
      const matchesReason = (rep.reason || '').toLowerCase().includes(q);
      const matchesDesc = (rep.description || '').toLowerCase().includes(q);
      if (!matchesProperty && !matchesReporter && !matchesReason && !matchesDesc) return false;
    }

    return true;
  });

  const handleOpenResolveDialog = (rep: ListingReport, type: 'RESOLVE' | 'DISMISS') => {
    setActiveReportForResolution(rep);
    setResolutionType(type);
    setResolutionNotes(type === 'RESOLVE' ? 'Investigated and verified against land registry records.' : 'Inquiry deemed unsubstantiated upon host document audit.');
    setIsResolutionDialogOpen(true);
  };

  const handleConfirmResolution = async () => {
    if (!activeReportForResolution || !resolutionNotes.trim()) return;
    if (resolutionType === 'RESOLVE') {
      await onResolveReport(activeReportForResolution.id, resolutionNotes);
    } else {
      await onDismissReport(activeReportForResolution.id, resolutionNotes);
    }
    setIsResolutionDialogOpen(false);
    setActiveReportForResolution(null);
    setResolutionNotes('');
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 font-headline">
                  Trust &amp; Safety Incident Desk
                </CardTitle>
                <Badge className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5">
                  Phase 10 Incident Governance
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Investigate seeker fraud reports, request host documentation, and execute platform containment freezes.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'REPORTED', 'UNDER_INVESTIGATION', 'RESOLVED'] as const).map((filter) => {
                const count = reports.filter((r) => {
                  if (filter === 'REPORTED') return r.status === 'REPORTED';
                  if (filter === 'UNDER_INVESTIGATION') return r.status === 'UNDER_INVESTIGATION' || r.status === 'DOCUMENTATION_REQUESTED';
                  if (filter === 'RESOLVED') return r.status === 'RESOLVED' || r.status === 'DISMISSED';
                  return true;
                }).length;

                return (
                  <Button
                    key={filter}
                    size="sm"
                    variant={statusFilter === filter ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(filter)}
                    className={`h-7 text-[11px] rounded-lg font-semibold ${
                      statusFilter === filter ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 border-slate-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Incidents' : filter === 'REPORTED' ? 'New Reports' : filter === 'UNDER_INVESTIGATION' ? 'Active Inquiries' : 'Closed'}
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] tabular-nums ${
                        statusFilter === filter ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
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
          {filteredReports.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-700">Incident Desk is Clear</p>
              <p className="text-xs text-slate-400 mt-0.5">No reports matching the current filter: {statusFilter}.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReports.map((rep) => {
                const targetProp = properties.find((p) => p.id === rep.propertyId);
                const isSuspended = targetProp?.listingStatus === 'SUSPENDED';

                return (
                  <div
                    key={rep.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-2 min-w-0 flex-1 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rep.status === 'REPORTED'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : rep.status === 'UNDER_INVESTIGATION'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : rep.status === 'DOCUMENTATION_REQUESTED'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {rep.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-mono text-slate-600 bg-slate-50">
                          ID: {rep.id}
                        </Badge>
                        <span className="text-xs font-bold text-slate-900">Reason: {rep.reason}</span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                        <span>Target Listing:</span>
                        <Link
                          href={`/property/${rep.propertyId}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 underline flex items-center gap-1"
                          target="_blank"
                        >
                          {rep.propertyTitle || rep.propertyId}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        {isSuspended && (
                          <Badge className="bg-rose-700 text-white text-[9px] font-bold px-1.5 py-0">
                            LISTING FROZEN
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        &ldquo;{rep.description}&rdquo;
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <span>
                          Reported by: <strong className="text-slate-700">{rep.reporterName || 'Platform Seeker'}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>Date: {new Date(rep.reportedAt).toLocaleString()}</span>
                        {rep.resolvedAt && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Resolved: <strong className="text-emerald-700">{new Date(rep.resolvedAt).toLocaleDateString()}</strong> by {rep.resolvedBy || 'Compliance Officer'}</span>
                          </>
                        )}
                      </div>

                      {rep.resolutionNotes && (
                        <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-xs space-y-1 mt-2">
                          <span className="font-bold text-slate-800 text-[11px] block">Resolution Audit Note:</span>
                          <p className="text-slate-600 text-[11px]">{rep.resolutionNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Incident Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                      {rep.status === 'REPORTED' && can('reports.investigate') && (
                        <Button
                          size="sm"
                          onClick={() => onInvestigate(rep.id)}
                          disabled={submittingAction}
                          className="h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                        >
                          Investigate
                        </Button>
                      )}

                      {(rep.status === 'REPORTED' || rep.status === 'UNDER_INVESTIGATION') && can('reports.investigate') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRequestHostDocs(rep.id)}
                          disabled={submittingAction}
                          className="h-8 rounded-xl text-xs font-semibold border-purple-200 text-purple-800 hover:bg-purple-50"
                        >
                          <FileSignature className="h-3.5 w-3.5 mr-1" />
                          Query Host
                        </Button>
                      )}

                      {can('properties.suspend') && !isSuspended && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onSuspendListing(rep.propertyId, rep.id)}
                          disabled={submittingAction}
                          className="h-8 rounded-xl text-xs font-semibold"
                        >
                          <Lock className="h-3.5 w-3.5 mr-1" />
                          Freeze Listing
                        </Button>
                      )}

                      {can('properties.suspend') && isSuspended && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRestoreListing(rep.propertyId, rep.id)}
                          disabled={submittingAction}
                          className="h-8 rounded-xl text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                        >
                          <Unlock className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          Restore Listing
                        </Button>
                      )}

                      {rep.status !== 'RESOLVED' && rep.status !== 'DISMISSED' && can('reports.investigate') && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenResolveDialog(rep, 'RESOLVE')}
                          disabled={submittingAction}
                          className="h-8 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Resolve
                        </Button>
                      )}

                      {rep.status !== 'RESOLVED' && rep.status !== 'DISMISSED' && can('reports.investigate') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenResolveDialog(rep, 'DISMISS')}
                          disabled={submittingAction}
                          className="h-8 rounded-xl text-xs text-slate-500 hover:text-slate-800"
                        >
                          Dismiss
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

      {/* Resolve / Dismiss Dialog */}
      <Dialog open={isResolutionDialogOpen} onOpenChange={setIsResolutionDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900">
              {resolutionType === 'RESOLVE' ? 'Resolve Trust & Safety Incident' : 'Dismiss Incident Report'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide formal audit resolution notes explaining the outcome of this investigation.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <Label className="text-xs font-bold text-slate-800">Formal Resolution Rationale *</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Record investigation findings and regulatory compliance status..."
              className="rounded-xl text-xs min-h-[85px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsResolutionDialogOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmResolution}
              disabled={!resolutionNotes.trim() || submittingAction}
              className={`rounded-xl text-xs font-semibold text-white ${
                resolutionType === 'RESOLVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              Confirm &amp; Log Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
