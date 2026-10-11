'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { BarChart3, ShieldCheck, Scale, AlertTriangle, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function MarketIntelligencePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading market intelligence...</div>}>
      <MarketIntelligenceContent />
    </Suspense>
  );
}

function MarketIntelligenceContent() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Standalone Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-lime-600" />
            Market Intelligence & Fee Transparency
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Transparent fee guidelines, statutory legal fee caps, and escrow protection benchmarked under Lagos Tenancy Law.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/marketplace">Explore Marketplace</Link>
        </Button>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-1 min-w-0">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate block">Statutory Legal Cap</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">Max 10%</p>
          <p className="text-xs text-lime-700 font-medium truncate">Lagos Tenancy Law compliant</p>
        </Card>
        <Card className="rounded-2xl border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-1 min-w-0">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate block">Caution Escrow</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">100% Protected</p>
          <p className="text-xs text-lime-700 font-medium truncate">Held until verified move-out</p>
        </Card>
        <Card className="rounded-2xl border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-1 min-w-0">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate block">Agency Markup</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">₦0 Hidden</p>
          <p className="text-xs text-lime-700 font-medium truncate">Zero undocumented charges</p>
        </Card>
        <Card className="rounded-2xl border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-1 min-w-0">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate block">Dispute SLA</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">48 Hours</p>
          <p className="text-xs text-lime-700 font-medium truncate">Dedicated arbitration panel</p>
        </Card>
      </div>

      {/* Fee Itemization Card */}
      <Card className="rounded-2xl border-slate-200/90 shadow-xs">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Scale className="h-5 w-5 text-lime-700" />
            Mandatory Fee Itemization Guidelines
          </CardTitle>
          <CardDescription>
            Every transaction hosted on PropHunta must adhere to statutory breakdowns with zero undisclosed agency markup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4 text-lime-600" /> Annual Rent
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paid directly into an escrow-secured holding wallet until lease execution and key handover are mutually confirmed.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4 text-lime-600" /> Legal & Agreement Fee
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Statutorily capped at a maximum of 10% of total annual rent. Any demand above 10% is flagged as non-compliant.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4 text-lime-600" /> Refundable Caution Deposit
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Safeguarded in an independent trust account. Disbursed only upon mutual inspection sign-off during tenancy move-out.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4 text-lime-600" /> Verified Service Charge Schedule
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Estate maintenance, diesel power, security, and waste management costs must feature an itemized breakdown.
              </p>
            </div>
          </div>

          <Separator />

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Notice Suspicious Fees or Non-Compliance?</h4>
              <p className="text-xs text-muted-foreground">Submit a quick report to our Trust & Safety audit team.</p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl border-slate-300">
              <Link href="/messages">Contact Trust Desk</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
