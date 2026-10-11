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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/context/UserRoleContext';
import {
  getUserApplicationsAction,
  updateApplicationStatusAction,
} from '@/server/actions/prophunta-actions';
import {
  Application,
  ApplicationStatus,
  UserRole,
} from '@/types/prophunta';

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Standalone Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-slate-900 tracking-tight">
            {activeRole === 'SEEKER' ? 'My Applications & Offers' : 'Received Offers & Applications'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeRole === 'SEEKER'
              ? 'Track your tenancy proposals, offers, and expressions of interest with transparent fee audits.'
              : 'Review, approve, or decline tenancy applications and offers submitted for your properties.'}
          </p>
        </div>
        {activeRole === 'SEEKER' && (
          <Button asChild className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs">
            <Link href="/marketplace">Explore Verified Listings</Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-lime-600" />
          Loading applications...
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-slate-200">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-lg">No applications on file</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {activeRole === 'SEEKER'
              ? 'Submit an expression of interest on any verified listing to commence tenancy or purchase discussions.'
              : 'No seekers have submitted applications for your listings yet.'}
          </p>
          {activeRole === 'SEEKER' && (
            <Button asChild className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl shadow-xs">
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

            return (
              <Card key={app.id} className="p-4 sm:p-5 border border-slate-200/90 shadow-xs rounded-2xl min-w-0">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-w-0">
                  <div className="space-y-1.5 min-w-0 flex-1 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/property/${app.propertyId}`}
                        className="font-semibold text-slate-900 hover:text-lime-700 text-base truncate max-w-full inline-block"
                        title={app.propertyTitle}
                      >
                        {app.propertyTitle}
                      </Link>
                      <Badge
                        className={
                          app.status === 'APPROVED'
                            ? 'bg-emerald-600 text-white shrink-0'
                            : app.status === 'SUBMITTED'
                            ? 'bg-amber-500 text-white shrink-0'
                            : app.status === 'UNDER_REVIEW'
                            ? 'bg-lime-700 text-white shrink-0'
                            : 'bg-slate-200 text-slate-700 shrink-0'
                        }
                      >
                        {app.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {app.type === 'RENTAL' ? 'Rental Application' : 'Purchase Offer'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                      <span className="truncate">Applicant: <strong>{app.applicantName}</strong></span>
                      <span className="shrink-0">Submitted: {dateFormatted}</span>
                      {app.offerAmount && (
                        <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                          Offer: {formatNaira(app.offerAmount)}
                        </span>
                      )}
                      {app.financingStatus && (
                        <span className="truncate">Financing: <strong className="text-slate-700">{app.financingStatus}</strong></span>
                      )}
                    </div>

                    {app.message && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 max-w-2xl mt-1 break-words">
                        &ldquo;{app.message}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    {isHost && app.status === 'SUBMITTED' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                          disabled={updatingId === app.id}
                          onClick={() => handleApplicationStatus(app.id, 'APPROVED')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl text-xs"
                          disabled={updatingId === app.id}
                          onClick={() => handleApplicationStatus(app.id, 'REJECTED')}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                    <Button asChild size="sm" variant="ghost" className="text-xs">
                      <Link href={`/property/${app.propertyId}`}>
                        View Listing <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
