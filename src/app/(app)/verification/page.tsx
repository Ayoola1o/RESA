'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle,
  FileCheck,
  Shield,
  Lock,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUserRole } from '@/context/UserRoleContext';
import { UserRole } from '@/types/prophunta';

export default function VerificationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading verification...</div>}>
      <VerificationContent />
    </Suspense>
  );
}

function VerificationContent() {
  const { currentUser, role } = useUserRole();
  const activeRole: UserRole = currentUser?.role || role || 'SEEKER';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Standalone Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-lime-600" />
            Trust & Verification Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Immutable trust status, identity credentials, and LASRERA regulatory compliance verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeRole === 'ADMIN' && (
            <Button asChild className="bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-xs">
              <Link href="/admin?tab=verification">
                <ShieldCheck className="mr-2 h-4 w-4 text-lime-400" /> Administrative Queue
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/profile">View Profile</Link>
          </Button>
        </div>
      </div>

      {/* Main Verification Card */}
      <Card className="rounded-2xl border-slate-200/90 shadow-xs">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-lime-700" />
                PropHunta Trust Infrastructure Status
              </CardTitle>
              <CardDescription>
                Tier-1 verified status ensures protection against rental fraud, fee extortion, and impersonation.
              </CardDescription>
            </div>
            <Badge className="bg-lime-600 text-white font-bold px-3 py-1 text-xs self-start sm:self-auto gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Tier 1 Verified Account
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity Anchor</span>
                <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px]">
                  VERIFIED
                </Badge>
              </div>
              <p className="text-base font-bold text-slate-900">National NIN / BVN Match</p>
              <p className="text-xs text-muted-foreground">Full biometric registry checksum verified against active phone number.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LASRERA Alignment</span>
                <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px]">
                  ACTIVE
                </Badge>
              </div>
              <p className="text-base font-bold text-slate-900">Regulatory Standing</p>
              <p className="text-xs text-muted-foreground">Lagos State Tenancy Law & real estate agency code of conduct validated.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Escrow Security</span>
                <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px]">
                  ENABLED
                </Badge>
              </div>
              <p className="text-base font-bold text-slate-900">Zero-Extortion Shield</p>
              <p className="text-xs text-muted-foreground">100% cautioned payments held in segregated trust escrow accounts.</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-sm text-slate-900 mb-3">Verified Regulatory Safeguards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs text-slate-900">National Identity & Biometric Verification</p>
                  <p className="text-xs text-muted-foreground mt-0.5">NIN/BVN database check cleared with zero duplicate claims.</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs text-slate-900">LASRERA / Regulatory Standing</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Lagos State Real Estate Regulatory Authority compliance standard applied.</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs text-slate-900">Title Documentation Audit</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Governor&apos;s Consent, C of O, and Survey Plans verified by authorized officers.</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-lime-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs text-slate-900">Field Inspection Guarantee</p>
                  <p className="text-xs text-muted-foreground mt-0.5">On-site independent field officer reports required prior to deal closure.</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-900">Audit & Accountability Guarantees</h3>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>Every action taken (inspection scheduling, enquiry dispatch, review submission) is immutably logged to the PropHunta audit store.</li>
              <li>Title documentation undergoes independent verification by authorized officers prior to receiving the verified trust shield.</li>
              <li>Pricing transparency enforces explicit itemization of legal fees, caution deposits, and service charges.</li>
            </ul>
          </div>

          {activeRole === 'ADMIN' && (
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm">Administrative Verification Authority</h4>
                <p className="text-xs text-slate-300">You hold Verification Officer privileges to audit titles and approve listings.</p>
              </div>
              <Button asChild size="sm" className="bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold shrink-0">
                <Link href="/admin?tab=verification">Open Verification Queue</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
