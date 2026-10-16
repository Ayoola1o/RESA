'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  ClipboardCheck,
  ChevronRight,
  Camera,
  Video,
  ExternalLink,
  ShieldAlert,
  Loader2,
  FileCheck,
  AlertOctagon,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/context/UserRoleContext';
import {
  getUserInspectionsAction,
  updateInspectionStatusAction,
  completeInspectionAction,
  proposeInspectionScheduleAction,
  escalateInspectionAction,
} from '@/server/actions/prophunta-actions';
import {
  InspectionRequest,
  InspectionStatus,
  InspectionRecord,
  UserRole,
} from '@/types/prophunta';

export default function InspectionsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading inspections...</div>}>
      <InspectionsContent />
    </Suspense>
  );
}

function InspectionsContent() {
  const { currentUser, role } = useUserRole();
  const activeRole: UserRole = currentUser?.role || role || 'SEEKER';
  const { toast } = useToast();

  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load inspections
  useEffect(() => {
    let mounted = true;
    async function loadInspections() {
      try {
        const data = await getUserInspectionsAction().catch(() => []);
        if (mounted) setInspections(data || []);
      } catch (err) {
        console.error('Failed to load inspections', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadInspections();
    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  // Inspection status handlers
  const handleCancelInspection = async (id: string) => {
    setUpdatingId(id);
    const res = await updateInspectionStatusAction(id, 'CANCELLED', 'Cancelled by user');
    setUpdatingId(null);
    if (res.success) {
      toast({ title: 'Inspection Cancelled', description: 'The inspection request has been cancelled.' });
      setInspections(prev => prev.map(i => i.id === id ? { ...i, status: 'CANCELLED' as InspectionStatus } : i));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to cancel inspection.' });
    }
  };

  const handleConfirmInspection = async (id: string) => {
    setUpdatingId(id);
    const res = await updateInspectionStatusAction(id, 'SCHEDULED', 'Confirmed by host');
    setUpdatingId(null);
    if (res.success) {
      toast({ title: 'Inspection Confirmed', description: 'The inspection slot has been confirmed with the seeker.' });
      setInspections(prev => prev.map(i => i.id === id ? { ...i, status: 'SCHEDULED' as InspectionStatus } : i));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to confirm inspection.' });
    }
  };

  const handleMarkNoShow = async (id: string) => {
    setUpdatingId(id);
    const res = await updateInspectionStatusAction(id, 'NO_SHOW', 'Attendee did not show up for scheduled inspection');
    setUpdatingId(null);
    if (res.success) {
      toast({ title: 'Marked as No-Show', description: 'Inspection status updated to NO_SHOW.' });
      setInspections(prev => prev.map(i => i.id === id ? { ...i, status: 'NO_SHOW' as InspectionStatus } : i));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to mark no-show.' });
    }
  };

  // Escalation state & handlers
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [escalateTarget, setEscalateTarget] = useState<InspectionRequest | null>(null);
  const [escalateReason, setEscalateReason] = useState('Misleading Price/Photos');
  const [escalateDetails, setEscalateDetails] = useState('');
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);

  const openEscalateModal = (insp: InspectionRequest) => {
    setEscalateTarget(insp);
    setEscalateReason('Misleading Price/Photos');
    setEscalateDetails('');
    setEscalateDialogOpen(true);
  };

  const handleEscalateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalateTarget) return;
    setIsSubmittingEscalation(true);
    const res = await escalateInspectionAction(escalateTarget.id, escalateReason, escalateDetails);
    setIsSubmittingEscalation(false);
    if (res.success) {
      toast({
        title: 'Discrepancy Escalated',
        description: 'Inspection issue filed with Trust & Safety for compliance review.',
      });
      setEscalateDialogOpen(false);
      setInspections(prev => prev.map(i => i.id === escalateTarget.id ? {
        ...i,
        escalationStatus: 'ESCALATED_FRAUD_INVESTIGATION',
        escalationNotes: `${escalateReason}: ${escalateDetails}`,
      } : i));
    } else {
      toast({ variant: 'destructive', title: 'Escalation Failed', description: res.error || 'Failed to file escalation.' });
    }
  };

  // Complete inspection modal state & handlers
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [targetInspection, setTargetInspection] = useState<InspectionRequest | null>(null);
  const [inspectorName, setInspectorName] = useState(currentUser?.name || 'Authorized Field Inspector');
  const [conditionRating, setConditionRating] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'>('GOOD');
  const [utilitiesFunctional, setUtilitiesFunctional] = useState(true);
  const [meterReadings, setMeterReadings] = useState('');
  const [observations, setObservations] = useState('');
  const [discrepancies, setDiscrepancies] = useState('');
  const [photoUrlsInput, setPhotoUrlsInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

  // Reschedule Modal state & handlers
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<InspectionRequest | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTimeSlot, setProposedTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const openRescheduleModal = (insp: InspectionRequest) => {
    setRescheduleTarget(insp);
    setProposedDate(insp.preferredDate || new Date().toISOString().split('T')[0]);
    setProposedTimeSlot(insp.preferredTimeSlot || '10:00 AM - 12:00 PM');
    setRescheduleNotes('');
    setRescheduleDialogOpen(true);
  };

  const handleProposeSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setIsSubmittingReschedule(true);
    const res = await proposeInspectionScheduleAction(rescheduleTarget.id, proposedDate, proposedTimeSlot, rescheduleNotes);
    setIsSubmittingReschedule(false);
    if (res.success) {
      toast({ title: 'Schedule Proposed', description: 'New inspection schedule proposed and status updated to RESCHEDULED.' });
      setRescheduleDialogOpen(false);
      setInspections(prev => prev.map(i => i.id === rescheduleTarget.id ? {
        ...i,
        status: 'RESCHEDULED' as InspectionStatus,
        preferredDate: proposedDate,
        preferredTimeSlot: proposedTimeSlot,
        notes: rescheduleNotes || i.notes,
      } : i));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to propose schedule.' });
    }
  };

  // View Record Modal
  const [viewRecordDialogOpen, setViewRecordDialogOpen] = useState(false);
  const [activeInspectionRecord, setActiveInspectionRecord] = useState<InspectionRecord | null>(null);
  const [recordPropertyTitle, setRecordPropertyTitle] = useState('');

  const openCompleteInspectionModal = (insp: InspectionRequest) => {
    setTargetInspection(insp);
    setInspectorName(currentUser?.name || 'Authorized Field Inspector');
    setConditionRating('GOOD');
    setUtilitiesFunctional(true);
    setMeterReadings('');
    setObservations('');
    setDiscrepancies('');
    setPhotoUrlsInput('');
    setVideoUrlInput('');
    setCompleteDialogOpen(true);
  };

  const openViewInspectionRecord = (insp: InspectionRequest) => {
    if (insp.inspectionRecord) {
      setActiveInspectionRecord(insp.inspectionRecord);
      setRecordPropertyTitle(insp.propertyTitle);
      setViewRecordDialogOpen(true);
    }
  };

  const handleSaveInspectionRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInspection) return;

    setIsSubmittingRecord(true);
    const photos = photoUrlsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const recordPayload = {
      inspectorName,
      conditionRating,
      utilitiesFunctional,
      meterReadings: meterReadings || undefined,
      observations,
      discrepancies: discrepancies || undefined,
      photos,
      video: videoUrlInput.trim() || undefined,
      method: 'IN_PERSON_FIELD_OFFICER' as const,
      isIndependentInspection: true,
    };

    const res = await completeInspectionAction(targetInspection.id, recordPayload);
    setIsSubmittingRecord(false);

    if (res.success) {
      toast({
        title: 'Inspection Completed',
        description: 'Physical inspection record successfully logged to platform trust store.',
      });
      setCompleteDialogOpen(false);
      setInspections((prev) =>
        prev.map((i) =>
          i.id === targetInspection.id
            ? {
                ...i,
                status: 'COMPLETED' as InspectionStatus,
                inspectionRecord: {
                  completedAt: new Date().toISOString(),
                  ...recordPayload,
                },
              }
            : i
        )
      );
    } else {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: res.error || 'Could not complete inspection.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Standalone Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-slate-900 tracking-tight">
            Scheduled Inspections
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeRole === 'SEEKER'
              ? 'Your requested physical and virtual property walkthrough appointments.'
              : 'Incoming and scheduled inspection appointments for your properties.'}
          </p>
        </div>
        {activeRole === 'SEEKER' && (
          <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs">
            <Link href="/marketplace">Find Properties to Inspect</Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading inspection schedules...
        </div>
      ) : inspections.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-slate-200/80 bg-white">
          <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-lg">No inspections scheduled</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {activeRole === 'SEEKER'
              ? 'Explore properties and schedule an on-site or virtual inspection with the verified host.'
              : 'You have no pending or completed inspections for your listings.'}
          </p>
          {activeRole === 'SEEKER' && (
            <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-xs">
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp) => {
            const isHost = currentUser?.id === insp.hostId || activeRole === 'OWNER' || activeRole === 'AGENT';
            const dateFormatted = new Date(insp.preferredDate).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <Card key={insp.id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-200/80 bg-white shadow-xs rounded-2xl min-w-0">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1 w-full">
                  <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/property/${insp.propertyId}`}
                        className="font-semibold text-slate-900 hover:text-lime-700 text-base truncate max-w-full inline-block"
                        title={insp.propertyTitle}
                      >
                        {insp.propertyTitle}
                      </Link>
                      <Badge
                        className={
                          insp.status === 'SCHEDULED' || insp.status === 'ACCEPTED'
                            ? 'bg-emerald-600 text-white shrink-0'
                            : insp.status === 'REQUESTED'
                            ? 'bg-amber-500 text-white shrink-0'
                            : insp.status === 'COMPLETED'
                            ? 'bg-lime-700 text-white shrink-0'
                            : insp.status === 'NO_SHOW'
                            ? 'bg-rose-500 text-white shrink-0'
                            : 'bg-slate-200 text-slate-700 shrink-0'
                        }
                      >
                        {insp.status === 'NO_SHOW' ? 'No Show' : insp.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {insp.type === 'IN_PERSON' ? 'Physical Visit' : 'Virtual Video Tour'}
                      </Badge>
                      {insp.escalationStatus === 'ESCALATED_FRAUD_INVESTIGATION' && (
                        <Badge className="bg-rose-700 text-white text-[10px] font-bold gap-1 shrink-0">
                          <ShieldAlert className="h-3 w-3" /> Under Fraud Investigation
                        </Badge>
                      )}
                      {insp.escalationStatus === 'DISCREPANCY_FLAGGED' && (
                        <Badge className="bg-amber-600 text-white text-[10px] font-bold gap-1 shrink-0">
                          <AlertOctagon className="h-3 w-3" /> Discrepancy Flagged
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-slate-700 shrink-0">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {dateFormatted} &bull; {insp.preferredTimeSlot}
                      </span>
                      <span className="truncate">
                        {isHost ? `Requested by: ${insp.seekerName}` : `Host Assigned`}
                      </span>
                    </div>

                    {insp.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 max-w-xl break-words">
                        Note: &ldquo;{insp.notes}&rdquo;
                      </p>
                    )}
                    {insp.escalationNotes && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 max-w-xl break-words">
                        Escalation: {insp.escalationNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0 w-full md:w-auto">
                  {insp.status === 'COMPLETED' && (
                    <>
                      {insp.inspectionRecord && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs font-semibold gap-1 rounded-xl"
                          onClick={() => openViewInspectionRecord(insp)}
                        >
                          <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
                          View Inspection Report
                        </Button>
                      )}
                      {!isHost && (
                        <Button
                          asChild
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 rounded-xl shadow-xs"
                        >
                          <Link href={`/apply/${insp.propertyId}`}>
                            Apply / Make Offer <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </>
                  )}
                  {isHost && (insp.status === 'SCHEDULED' || insp.status === 'ACCEPTED') && (
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs rounded-xl"
                      onClick={() => openCompleteInspectionModal(insp)}
                    >
                      Complete & Log Report
                    </Button>
                  )}
                  {isHost && insp.status === 'REQUESTED' && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                      disabled={updatingId === insp.id}
                      onClick={() => handleConfirmInspection(insp.id)}
                    >
                      Confirm
                    </Button>
                  )}
                  {isHost && insp.status === 'SCHEDULED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-300 text-xs font-semibold rounded-xl"
                      disabled={updatingId === insp.id}
                      onClick={() => handleMarkNoShow(insp.id)}
                    >
                      <UserX className="h-3.5 w-3.5 mr-1" />
                      Mark No-Show
                    </Button>
                  )}
                  {isHost && insp.status !== 'COMPLETED' && insp.status !== 'CANCELLED' && insp.status !== 'NO_SHOW' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-300 text-xs font-semibold rounded-xl"
                      onClick={() => openRescheduleModal(insp)}
                    >
                      Propose Schedule
                    </Button>
                  )}
                  {insp.status !== 'CANCELLED' && insp.status !== 'COMPLETED' && insp.status !== 'NO_SHOW' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs rounded-xl"
                      disabled={updatingId === insp.id}
                      onClick={() => handleCancelInspection(insp.id)}
                    >
                      Cancel
                    </Button>
                  )}
                  {insp.status !== 'CANCELLED' && insp.escalationStatus !== 'ESCALATED_FRAUD_INVESTIGATION' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-slate-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 text-xs rounded-xl gap-1"
                      onClick={() => openEscalateModal(insp)}
                    >
                      <AlertOctagon className="h-3 w-3 text-rose-500" />
                      Report Discrepancy
                    </Button>
                  )}
                  <Button asChild size="sm" variant="ghost" className="text-xs">
                    <Link href={`/property/${insp.propertyId}`}>
                      View Listing <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Complete Inspection & File Official Record */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveInspectionRecord}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="h-5 w-5 text-lime-600" />
                Complete Inspection & Log Findings
              </DialogTitle>
              <DialogDescription>
                Record the on-site physical inspection findings for <strong>{targetInspection?.propertyTitle}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inspectorName">Inspector / Host Name</Label>
                  <Input
                    id="inspectorName"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conditionRating">Condition Rating</Label>
                  <Select
                    value={conditionRating}
                    onValueChange={(val: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR') => setConditionRating(val)}
                  >
                    <SelectTrigger id="conditionRating">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCELLENT">EXCELLENT (Pristine / Turnkey)</SelectItem>
                      <SelectItem value="GOOD">GOOD (Well maintained)</SelectItem>
                      <SelectItem value="FAIR">FAIR (Minor wear & tear)</SelectItem>
                      <SelectItem value="POOR">POOR (Requires major maintenance)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Functional Utilities Verified</p>
                  <p className="text-xs text-muted-foreground">Water, electrical wiring, switches & drainage checked</p>
                </div>
                <Button
                  type="button"
                  variant={utilitiesFunctional ? "default" : "outline"}
                  size="sm"
                  className={utilitiesFunctional ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-300"}
                  onClick={() => setUtilitiesFunctional(!utilitiesFunctional)}
                >
                  {utilitiesFunctional ? 'Verified Functional' : 'Not Functional'}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meterReadings">Meter Readings / Serial Identifiers</Label>
                <Input
                  id="meterReadings"
                  placeholder="e.g. Prepaid meter #04291882103, Initial Units: 142.5 kWh"
                  value={meterReadings}
                  onChange={(e) => setMeterReadings(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="observations">Inspector Observations & Remarks</Label>
                <Textarea
                  id="observations"
                  rows={3}
                  placeholder="State condition of walls, ceilings, fixtures, compound access..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discrepancies">Noted Discrepancies (if any)</Label>
                <Textarea
                  id="discrepancies"
                  rows={2}
                  placeholder="Note any discrepancies against the listing specifications (e.g. 1 AC unit needing repair)"
                  value={discrepancies}
                  onChange={(e) => setDiscrepancies(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t">
                <div className="space-y-1.5">
                  <Label htmlFor="photos" className="flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-slate-500" />
                    Inspection Photo URLs
                  </Label>
                  <Input
                    id="photos"
                    placeholder="Comma separated image URLs"
                    value={photoUrlsInput}
                    onChange={(e) => setPhotoUrlsInput(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="video" className="flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-slate-500" />
                    Video Walkthrough URL
                  </Label>
                  <Input
                    id="video"
                    placeholder="https://..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingRecord} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl">
                {isSubmittingRecord ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Report...
                  </>
                ) : (
                  'Sign & File Record'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Propose Reschedule */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleProposeSchedule}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
                Propose New Inspection Schedule
              </DialogTitle>
              <DialogDescription>
                Propose an alternate walkthrough date/time for <strong>{rescheduleTarget?.propertyTitle}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-1.5">
                <Label htmlFor="proposedDate">Proposed Date</Label>
                <Input
                  id="proposedDate"
                  type="date"
                  value={proposedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setProposedDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proposedSlot">Preferred Time Slot</Label>
                <Select value={proposedTimeSlot} onValueChange={setProposedTimeSlot}>
                  <SelectTrigger id="proposedSlot">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</SelectItem>
                    <SelectItem value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</SelectItem>
                    <SelectItem value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</SelectItem>
                    <SelectItem value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rescheduleNotes">Host Note / Reason</Label>
                <Textarea
                  id="rescheduleNotes"
                  rows={3}
                  placeholder="e.g. Host unavailable on current date; proposing Friday morning slot..."
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingReschedule} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {isSubmittingReschedule ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Send Proposed Schedule'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: View Inspection Report Record */}
      <Dialog open={viewRecordDialogOpen} onOpenChange={setViewRecordDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              Verified Inspection Report
            </DialogTitle>
            <DialogDescription>
              Official walkthrough record for <strong>{recordPropertyTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          {activeInspectionRecord && (
            <div className="space-y-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-lg">
                <div>
                  <span className="text-xs text-muted-foreground block">Inspector</span>
                  <span className="font-semibold text-slate-800">{activeInspectionRecord.inspectorName}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Completion Date</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(activeInspectionRecord.completedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Condition Rating</span>
                  <Badge className="mt-1 bg-lime-600 text-white font-bold">{activeInspectionRecord.conditionRating}</Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Utilities Functional</span>
                  <Badge variant={activeInspectionRecord.utilitiesFunctional ? 'default' : 'destructive'} className="mt-1">
                    {activeInspectionRecord.utilitiesFunctional ? '✓ Verified Functional' : 'Discrepancy Noted'}
                  </Badge>
                </div>
              </div>

              {activeInspectionRecord.meterReadings && (
                <div className="p-3 bg-white border rounded-lg">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                    Meter Readings
                  </span>
                  <p className="text-slate-800 font-mono text-xs">{activeInspectionRecord.meterReadings}</p>
                </div>
              )}

              <div className="p-3 bg-white border rounded-lg">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Observations
                </span>
                <p className="text-slate-700 text-xs leading-relaxed">{activeInspectionRecord.observations}</p>
              </div>

              {activeInspectionRecord.discrepancies && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                    Noted Discrepancies
                  </span>
                  <p className="text-amber-900 text-xs">{activeInspectionRecord.discrepancies}</p>
                </div>
              )}

              {activeInspectionRecord.photos && activeInspectionRecord.photos.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                    Evidence Photos ({activeInspectionRecord.photos.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeInspectionRecord.photos.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block aspect-video rounded-lg overflow-hidden border bg-slate-100"
                      >
                        <img src={url} alt={`Inspection Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute bottom-1 right-1 p-1 bg-black/60 rounded text-white text-[10px]">
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {activeInspectionRecord.video && (
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <a href={activeInspectionRecord.video} target="_blank" rel="noreferrer">
                      <Video className="h-4 w-4 text-lime-600" />
                      Watch Video Walkthrough
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewRecordDialogOpen(false)}>Close Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Report Discrepancy & Escalate to Trust and Safety */}
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleEscalateInspection}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg text-rose-700">
                <AlertOctagon className="h-5 w-5 text-rose-600" />
                Report Inspection Discrepancy
              </DialogTitle>
              <DialogDescription>
                Flag an issue observed during walkthrough for <strong>{escalateTarget?.propertyTitle}</strong>. This initiates a Trust & Safety compliance review.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-1.5">
                <Label htmlFor="escalateReason">Category of Discrepancy</Label>
                <Select value={escalateReason} onValueChange={setEscalateReason}>
                  <SelectTrigger id="escalateReason">
                    <SelectValue placeholder="Select discrepancy reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Misleading Price/Photos">Misleading Photos or Fake Features</SelectItem>
                    <SelectItem value="Structural/Safety Hazard">Severe Damage or Safety Hazard</SelectItem>
                    <SelectItem value="Unavailable/Occupied Asset">Property Not Vacant / Occupied Without Disclosure</SelectItem>
                    <SelectItem value="Host Misrepresentation">Host / Agent Impersonation or Demanding Off-Platform Cash</SelectItem>
                    <SelectItem value="Location Mismatch">Physical Location Discrepancy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="escalateDetails">Detailed Observations</Label>
                <Textarea
                  id="escalateDetails"
                  rows={4}
                  required
                  placeholder="Detail what was observed on-site that contradicts the verified listing description..."
                  value={escalateDetails}
                  onChange={(e) => setEscalateDetails(e.target.value)}
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <p className="font-semibold flex items-center gap-1 mb-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                  Trust & Safety Protection
                </p>
                PropHunta compliance officers will review this escalation, inspect geotagged evidence, and can freeze or suspend listings with verified fraud.
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEscalateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingEscalation || !escalateDetails.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isSubmittingEscalation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Escalation...
                  </>
                ) : (
                  'File Escalation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
