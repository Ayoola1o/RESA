'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ExternalLink,
  ShieldCheck,
  Eye,
  Check,
  X,
  User,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InspectionRequest, AdminPermission, Property } from '@/types/prophunta';

interface InspectionsDispatchViewProps {
  inspections: InspectionRequest[];
  properties: Property[];
  can: (perm: AdminPermission) => boolean;
  onResolveEscalation: (inspectionId: string, notes: string) => Promise<void>;
  submittingAction: boolean;
  searchQuery: string;
}

export function InspectionsDispatchView({
  inspections,
  properties,
  can,
  onResolveEscalation,
  submittingAction,
  searchQuery,
}: InspectionsDispatchViewProps) {
  const [selectedInspectionForRecord, setSelectedInspectionForRecord] = useState<InspectionRequest | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [selectedInspectionForEscalation, setSelectedInspectionForEscalation] = useState<InspectionRequest | null>(null);
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [escalationResolutionNotes, setEscalationResolutionNotes] = useState('');

  const filteredInspections = inspections.filter((insp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesProperty = (insp.propertyTitle || '').toLowerCase().includes(q) || insp.propertyId.toLowerCase().includes(q);
    const matchesSeeker = (insp.seekerName || '').toLowerCase().includes(q);
    const matchesHost = (insp.hostId || '').toLowerCase().includes(q);
    const matchesId = insp.id.toLowerCase().includes(q);
    return matchesProperty || matchesSeeker || matchesHost || matchesId;
  });

  const handleOpenRecord = (insp: InspectionRequest) => {
    setSelectedInspectionForRecord(insp);
    setIsRecordModalOpen(true);
  };

  const handleOpenEscalation = (insp: InspectionRequest) => {
    setSelectedInspectionForEscalation(insp);
    setEscalationResolutionNotes(insp.escalationNotes || '');
    setIsEscalationModalOpen(true);
  };

  const handleConfirmResolveEscalation = async () => {
    if (!selectedInspectionForEscalation || !escalationResolutionNotes.trim()) return;
    await onResolveEscalation(selectedInspectionForEscalation.id, escalationResolutionNotes);
    setIsEscalationModalOpen(false);
    setSelectedInspectionForEscalation(null);
    setEscalationResolutionNotes('');
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 font-headline">
                  Field &amp; Virtual Inspections Dispatch
                </CardTitle>
                <Badge className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5">
                  Phase 7 Field Audits
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Audit scheduled physical viewings, certified officer inspection reports, and resolve seeker disputes.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
              {inspections.length} Total Field Audits
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredInspections.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CalendarCheck2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Inspections Found</p>
              <p className="text-xs text-slate-400 mt-0.5">No inspections matching current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredInspections.map((insp) => (
                <div
                  key={insp.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/property/${insp.propertyId}`}
                        className="text-sm font-bold text-slate-900 hover:text-emerald-700 truncate max-w-sm"
                        target="_blank"
                      >
                        {insp.propertyTitle || insp.propertyId}
                      </Link>
                      <Badge
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          insp.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : insp.status === 'SCHEDULED'
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : insp.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {insp.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono text-slate-500">
                        ID: {insp.id}
                      </Badge>
                      {(insp.escalationStatus === 'ESCALATED_FRAUD_INVESTIGATION' || insp.escalationStatus === 'DISCREPANCY_FLAGGED') && (
                        <Badge className="bg-rose-600 text-white font-bold text-[9px] px-1.5 py-0">
                          ESCALATED DISPUTE
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Seeker: <strong className="text-slate-800">{insp.seekerName}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Host ID: <strong className="text-slate-800 font-mono">{insp.hostId}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>Date: {new Date(insp.preferredDate).toLocaleDateString()} at {insp.preferredTimeSlot}</span>
                      </span>
                    </div>

                    {insp.inspectionRecord && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Field Officer: <strong>{insp.inspectionRecord.inspectorName}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>Rating: <strong>{insp.inspectionRecord.conditionRating}</strong></span>
                        {insp.inspectionRecord.meterReadings && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Meter: {insp.inspectionRecord.meterReadings}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {insp.inspectionRecord && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRecord(insp)}
                        className="h-8 rounded-xl text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Field Findings
                      </Button>
                    )}

                    {(insp.escalationStatus === 'ESCALATED_FRAUD_INVESTIGATION' || insp.escalationStatus === 'DISCREPANCY_FLAGGED') && can('reports.investigate') && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenEscalation(insp)}
                        className="h-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
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

      {/* Field Inspection Findings Modal */}
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Certified Field Inspection Report
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Verified on-site condition filed by certified inspection officer.
            </DialogDescription>
          </DialogHeader>

          {selectedInspectionForRecord?.inspectionRecord && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Officer</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedInspectionForRecord.inspectionRecord.inspectorName}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Condition Rating</span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {selectedInspectionForRecord.inspectionRecord.conditionRating}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Meter Reading / Observations</span>
                  <p className="font-mono text-slate-700 mt-0.5">
                    {selectedInspectionForRecord.inspectionRecord.meterReadings || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800">Officer Observations:</span>
                <p className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
                  {selectedInspectionForRecord.inspectionRecord.observations}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsRecordModalOpen(false)} className="rounded-xl text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Escalation Modal */}
      <Dialog open={isEscalationModalOpen} onOpenChange={setIsEscalationModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900">
              Resolve Inspection Dispute
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record formal resolution notes for this inspection dispute.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <Label className="text-xs font-bold text-slate-800">Resolution Findings *</Label>
            <Textarea
              value={escalationResolutionNotes}
              onChange={(e) => setEscalationResolutionNotes(e.target.value)}
              placeholder="Record findings after mediation between seeker and host..."
              className="rounded-xl text-xs min-h-[85px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEscalationModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmResolveEscalation}
              disabled={!escalationResolutionNotes.trim() || submittingAction}
              className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Resolve Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
