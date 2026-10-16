'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { BarChart3, Banknote, ShieldCheck, ArrowUpRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUserRole } from '@/context/UserRoleContext';
import { getUserPropertiesAction, getUserApplicationsAction, getUserInspectionsAction } from '@/server/actions/prophunta-actions';
import { Property, Application, InspectionRequest, UserRole } from '@/types/prophunta';

export default function FinancialsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading financial records...</div>}>
      <FinancialsContent />
    </Suspense>
  );
}

function FinancialsContent() {
  const { currentUser, role } = useUserRole();
  const activeRole: UserRole = currentUser?.role || role || 'SEEKER';

  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [propData, appData, inspData] = await Promise.all([
          getUserPropertiesAction().catch(() => []),
          getUserApplicationsAction().catch(() => []),
          getUserInspectionsAction().catch(() => []),
        ]);
        if (mounted) {
          setProperties(propData || []);
          setApplications(appData || []);
          setInspections(inspData || []);
        }
      } catch (err) {
        console.error('Failed to load financial records', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Standalone Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-emerald-600" />
            Financial Records & Escrow Disbursement
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Portfolio rent flow, escrow security holdings, and verified payout schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-xs">
            <Link href="/landlord/add-property">
              <Plus className="mr-2 h-4 w-4" /> Add Listing
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/settings">Payout Settings</Link>
          </Button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs p-4 sm:p-5 space-y-1 min-w-0">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate block">Managed Listings</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">{properties.length}</p>
          <p className="text-xs text-emerald-700 font-medium truncate">Active in portfolio</p>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs p-4 sm:p-5 space-y-1 min-w-0">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate block">Total Offers & EOIs</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">{applications.length}</p>
          <p className="text-xs text-emerald-700 font-medium truncate">Verified applicant pool</p>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs p-4 sm:p-5 space-y-1 min-w-0">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate block">Completed Audits</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">
            {inspections.filter((i) => i.status === 'COMPLETED').length}
          </p>
          <p className="text-xs text-emerald-700 font-medium truncate">Signed inspection reports</p>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs p-4 sm:p-5 space-y-1 min-w-0">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate block">Disbursement Channel</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">Direct NGN</p>
          <p className="text-xs text-emerald-700 font-medium truncate">Escrow-backed clearing</p>
        </Card>
      </div>

      {/* Financial Escrow Details Card */}
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-700" />
            Rent Disbursement & Tenancy Security
          </CardTitle>
          <CardDescription>
            All incoming rent and offer deposits are escrow-verified before disbursement. Automated e-receipts and digital tenancy agreements are generated upon completion of mutual sign-off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Automated Payment Clearing Timeline
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rent disbursements are processed to the owner&apos;s verified bank account within 24 hours of mutual lease signing and move-in inspection confirmation. Caution deposits remain locked in segregated trust accounts.
            </p>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Bank Account & Tax Verification</p>
              <p className="text-xs text-muted-foreground">Manage your settlement account and direct debit authorizations.</p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href="/settings">Configure Settlement</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
