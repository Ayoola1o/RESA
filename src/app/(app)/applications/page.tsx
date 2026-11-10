'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  FileText,
  BadgeCheck,
  ChevronRight,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  CreditCard,
  Building2,
  Lock,
  FileSignature,
  Key,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  getUserApplicationsAction,
  updateApplicationStatusAction,
  confirmKeyHandoverAction,
} from '@/server/actions/prophunta-actions';
import {
  Application,
  ApplicationStatus,
  UserRole,
} from '@/types/prophunta';
import { formatNaira } from '@/lib/utils';

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading applications...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}

function ApplicationsContent() {
  const { currentUser, role } = useUserRole();
  const activeRole: UserRole = currentUser?.role || role || 'SEEKER';
  const { toast } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Escrow payment modal state
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Key handover modal state
  const [handoverApp, setHandoverApp] = useState<Application | null>(null);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isProcessingHandover, setIsProcessingHandover] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadApplications() {
      try {
        const data = await getUserApplicationsAction().catch(() => []);
        if (mounted) setApplications(data || []);
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadApplications();
    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  const handleApplicationStatus = async (id: string, status: ApplicationStatus) => {
    setUpdatingId(id);
    const res = await updateApplicationStatusAction(id, status);
    setUpdatingId(null);
    if (res.success) {
      toast({
        title: `Application ${status.toLowerCase()}`,
        description: `Status updated to ${status}.`,
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: res.error || 'Failed to update application.',
      });
    }
  };

  const handleConfirmHandover = async () => {
    if (!handoverApp) return;
    setIsProcessingHandover(true);
    const res = await confirmKeyHandoverAction(handoverApp.id, handoverNotes);
    setIsProcessingHandover(false);

    if (res.success) {
      toast({
        title: 'Welcome to Your Home!',
        description: 'Key handover confirmed.',
      });
      setApplications((prev) =>
        prev.map((a) =>
          a.id === handoverApp.id
            ? {
                ...a,
                status: 'HANDOVER_COMPLETED',
                handoverRecord: {
                  confirmedAt: new Date().toISOString(),
                  confirmedBy: currentUser?.name || 'Tenant',
                  notes: handoverNotes,
                },
              }
            : a
        )
      );
      setHandoverApp(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Handover Confirmation Failed',
        description: res.error || 'Could not confirm key handover.',
      });
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-600 text-white shrink-0 gap-1 font-bold">
            <Check className="h-3 w-3" /> Approved • Ready for Payment
          </Badge>
        );
      case 'ESCROW_FUNDED':
        return (
          <Badge className="bg-lime-600 text-white shrink-0 gap-1 font-bold">
            <ShieldCheck className="h-3 w-3" /> Escrow Funded • Ready to Sign
          </Badge>
        );
      case 'LEASE_SIGNED':
        return (
          <Badge className="bg-emerald-700 text-white shrink-0 gap-1 font-bold">
            <FileSignature className="h-3 w-3" /> Lease Signed • Awaiting Handover
          </Badge>
        );
      case 'HANDOVER_COMPLETED':
        return (
          <Badge className="bg-slate-900 text-white shrink-0 gap-1 font-bold">
            <Key className="h-3 w-3 text-lime-400" /> Handover Complete • Occupied
          </Badge>
        );
      case 'SUBMITTED':
        return <Badge className="bg-amber-500 text-white shrink-0 font-bold">Submitted</Badge>;
      case 'UNDER_REVIEW':
        return <Badge className="bg-lime-700 text-white shrink-0 font-bold">Under Review</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-600 text-white shrink-0 font-bold">Declined</Badge>;
      default:
        return <Badge variant="outline" className="text-xs shrink-0">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Standalone Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-slate-900 tracking-tight">
            {activeRole === 'SEEKER' ? 'My Applications & Tenancy Offers' : 'Received Offers & Tenancy Applications'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeRole === 'SEEKER'
              ? 'Track post-inspection applications, fund escrow safely, sign tenancy agreements, and confirm key handover.'
              : 'Review verified seeker credentials, accept expressions of interest, and track escrow settlements.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-xl text-xs font-semibold">
            <Link href="/inspections">Inspection Schedule</Link>
          </Button>
          <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-xs">
            <Link href="/marketplace">Browse Homes</Link>
          </Button>
        </div>
      </div>

      {/* Main Applications Feed */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading applications and escrow status...
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-2xl bg-white">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold font-headline text-slate-900">No applications on record</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-4">
            {activeRole === 'SEEKER'
              ? 'After completing an inspection on a verified property, submit your tenancy application here to lock in your lease.'
              : 'You have not received any tenant applications for your listings yet.'}
          </p>
          {activeRole === 'SEEKER' && (
            <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs">
              <Link href="/marketplace">Browse Verified Listings</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isHost = activeRole === 'OWNER' || activeRole === 'AGENT';
            const dateFormatted = new Date(app.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            // Breakdown calculation fallback
            const baseRent = app.offerAmount || app.propertyPrice;
            const feeBreakdown = app.feeBreakdown || {
              basePrice: baseRent,
              agreementFee: Math.round(baseRent * 0.1),
              cautionFee: Math.round(baseRent * 0.1),
              serviceCharge: 0,
              agencyFee: Math.round(baseRent * 0.1),
              otherCharges: 0,
              totalInitialOutlay: Math.round(baseRent * 1.3),
              currency: 'NGN',
              escrowNotice: 'Funds held in Segregated Trust Escrow Account under Lagos State real estate guidelines.',
            };

            return (
              <Card key={app.id} className="p-5 border border-slate-200/90 shadow-xs rounded-2xl bg-white space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/property/${app.propertyId}`}
                        className="font-bold text-slate-900 hover:text-lime-700 text-base sm:text-lg truncate max-w-full"
                        title={app.propertyTitle}
                      >
                        {app.propertyTitle}
                      </Link>
                      {getStatusBadge(app.status)}
                      <Badge variant="outline" className="text-xs font-semibold">
                        {app.type === 'RENTAL' ? 'Rental Tenancy' : 'Outright Purchase'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                      <span>Applicant: <strong className="text-slate-800">{app.applicantName}</strong></span>
                      <span>•</span>
                      <span>Submitted: {dateFormatted}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-900">
                        Annual Rent: {formatNaira(baseRent)}
                      </span>
                      {app.occupation && (
                        <>
                          <span>•</span>
                          <span>Role: <strong className="text-slate-700">{app.occupation}</strong></span>
                        </>
                      )}
                    </div>

                    {app.message && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-2xl mt-1">
                        &ldquo;{app.message}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                    {/* Host Actions on SUBMITTED */}
                    {isHost && app.status === 'SUBMITTED' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                          disabled={updatingId === app.id}
                          onClick={() => handleApplicationStatus(app.id, 'APPROVED')}
                        >
                          Approve Application
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl text-xs"
                          disabled={updatingId === app.id}
                          onClick={() => handleApplicationStatus(app.id, 'REJECTED')}
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    {/* Seeker Actions on APPROVED (Proceed to Escrow Payment) */}
                    {!isHost && app.status === 'APPROVED' && (
                      <p className="text-sm text-slate-600">Online escrow payment is currently unavailable.</p>
                    )}

                    {/* Seeker Actions on ESCROW_FUNDED (Sign Lease) */}
                    {app.status === 'ESCROW_FUNDED' && (
                      <Button
                        asChild
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
                      >
                        <Link href={`/lease/${app.propertyId}?appId=${app.id}`}>
                          <FileSignature className="h-3.5 w-3.5" /> Review & Sign Lease
                        </Link>
                      </Button>
                    )}

                    {/* Seeker Actions on LEASE_SIGNED (Confirm Key Handover) */}
                    {app.status === 'LEASE_SIGNED' && (
                      <div className="flex items-center gap-2">
                        {!isHost && (
                          <Button
                            size="sm"
                            onClick={() => setHandoverApp(app)}
                            className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
                          >
                            <Key className="h-3.5 w-3.5" /> Confirm Key Handover
                          </Button>
                        )}
                        <Button asChild size="sm" variant="outline" className="text-xs font-semibold rounded-xl">
                          <Link href={`/lease/${app.propertyId}?appId=${app.id}`}>View Lease</Link>
                        </Button>
                      </div>
                    )}

                    {/* Actions on HANDOVER_COMPLETED */}
                    {app.status === 'HANDOVER_COMPLETED' && (
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="text-xs font-semibold rounded-xl">
                          <Link href={`/lease/${app.propertyId}?appId=${app.id}`}>View Executed Lease</Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          className="bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl gap-1"
                        >
                          <Link href={`/maintenance/${app.propertyId}`}>
                            Tenant Portal <ChevronRight className="h-3.5 w-3.5 text-lime-400" />
                          </Link>
                        </Button>
                      </div>
                    )}

                    <Button asChild size="sm" variant="ghost" className="text-xs">
                      <Link href={`/property/${app.propertyId}`}>
                        Listing Details <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="flex flex-col items-center gap-1 text-emerald-700 font-semibold">
                      <div className="h-2 w-full rounded-full bg-emerald-500" />
                      <span>1. Inspection Done</span>
                    </div>

                    <div className={`flex flex-col items-center gap-1 font-semibold ${
                      ['APPROVED', 'ESCROW_FUNDED', 'LEASE_SIGNED', 'HANDOVER_COMPLETED'].includes(app.status)
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}>
                      <div className={`h-2 w-full rounded-full ${
                        ['APPROVED', 'ESCROW_FUNDED', 'LEASE_SIGNED', 'HANDOVER_COMPLETED'].includes(app.status)
                          ? 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`} />
                      <span>2. Application Approved</span>
                    </div>

                    <div className={`flex flex-col items-center gap-1 font-semibold ${
                      ['ESCROW_FUNDED', 'LEASE_SIGNED', 'HANDOVER_COMPLETED'].includes(app.status)
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}>
                      <div className={`h-2 w-full rounded-full ${
                        ['ESCROW_FUNDED', 'LEASE_SIGNED', 'HANDOVER_COMPLETED'].includes(app.status)
                          ? 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`} />
                      <span>3. Escrow & Lease Signed</span>
                    </div>

                    <div className={`flex flex-col items-center gap-1 font-semibold ${
                      app.status === 'HANDOVER_COMPLETED' ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      <div className={`h-2 w-full rounded-full ${
                        app.status === 'HANDOVER_COMPLETED' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`} />
                      <span>4. Key Handover Complete</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}



      {/* MOVE-IN KEY HANDOVER VERIFICATION DIALOG */}
      <Dialog open={!!handoverApp} onOpenChange={(open) => !open && setHandoverApp(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          {handoverApp && (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-lime-600" />
                  Confirm Move-In Key Handover
                </DialogTitle>
                <DialogDescription>
                  Perform the pre-occupancy walkthrough and confirm that you have received physical keys and access to {handoverApp.propertyTitle}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <p className="font-bold">What happens next upon confirmation:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                    <li>Your key receipt is recorded on the application.</li>
                    <li>Caution deposit remains safely locked in ongoing escrow hold.</li>
                    <li>Your active Tenant Portal is unlocked for maintenance requests.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="notes" className="font-bold text-slate-800">
                    Walkthrough Observations or Handover Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="e.g. All keys, gate remotes, and prepaid electricity cards received in good working condition."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHandoverApp(null)}
                  disabled={isProcessingHandover}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmHandover}
                  disabled={isProcessingHandover}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs gap-1.5"
                >
                  {isProcessingHandover ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Finalizing Move-In...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Confirm Keys Received
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
