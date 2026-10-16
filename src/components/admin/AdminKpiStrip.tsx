'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Users,
  Home,
  Briefcase,
  FileCheck2,
  CalendarCheck2,
  BadgeAlert,
  History,
  Lock,
  RefreshCw,
  Loader2,
  Search,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StaffAccount, StaffRole, Property, User, ListingReport, InspectionRequest, ApprovalRequest, AuditLog } from '@/types/prophunta';

interface AdminKpiStripProps {
  staffContext: {
    staffAccount: StaffAccount;
    activeRoles: StaffRole[];
    customGrants?: any[];
  } | null;
  currentUser: any;
  allStaffRoles: { role: StaffRole; label: string; badgeClass: string }[];
  loading: boolean;
  onRefresh: () => void;
  properties: Property[];
  users: User[];
  reports: ListingReport[];
  inspections: InspectionRequest[];
  approvalRequests: ApprovalRequest[];
  auditLogs: AuditLog[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function AdminKpiStrip({
  staffContext,
  currentUser,
  allStaffRoles,
  loading,
  onRefresh,
  properties,
  users,
  reports,
  inspections,
  approvalRequests,
  auditLogs,
  searchQuery,
  onSearchChange,
}: AdminKpiStripProps) {
  // Pending approvals & SLA check (> 24 hours)
  const pendingApprovals = approvalRequests.filter((a) => a.status === 'PENDING');
  const now = Date.now();
  const hasBreachedApprovals = pendingApprovals.some((a) => {
    const elapsedMs = now - new Date(a.createdAt).getTime();
    return elapsedMs > 24 * 60 * 60 * 1000;
  });

  // Inspections metrics
  const scheduledInspections = inspections.filter((i) => i.status === 'SCHEDULED' || i.status === 'REQUESTED');
  const completedInspections = inspections.filter((i) => i.status === 'COMPLETED');

  // Open reports
  const openReports = reports.filter((r) => r.status === 'REPORTED' || r.status === 'UNDER_INVESTIGATION' || r.status === 'DOCUMENTATION_REQUESTED');

  // Audit events in the last 24h
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const recentAuditLogs = auditLogs.filter((l) => new Date(l.timestamp).getTime() >= oneDayAgo);

  return (
    <div className="space-y-4">
      {/* --- GOVERNANCE MODE BANNER & TOP COMMAND BAR --- */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-900 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="h-3 w-3 text-emerald-400" />
                Governance Command Center
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Activity className="h-3 w-3 animate-pulse text-emerald-600" />
                System Active &amp; Protected
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-headline">
              RESA PropTech &amp; Governance Operations
            </h1>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-slate-500 font-medium">Logged in as:</span>
              <span className="text-xs font-bold text-slate-800">{currentUser?.name || 'Administrator'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">({currentUser?.email})</span>

              {staffContext?.activeRoles.map((r) => {
                const meta = allStaffRoles.find((m) => m.role === r);
                return (
                  <Badge
                    key={r}
                    variant="outline"
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta?.badgeClass || 'bg-slate-100 text-slate-700'}`}
                  >
                    {meta?.label || r}
                  </Badge>
                );
              })}

              {staffContext?.staffAccount?.customGrants?.some(
                (g: any) => g.status === 'ACTIVE' && new Date(g.expiresAt) > new Date()
              ) && (
                <Badge className="text-[9px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Custom Grants Active
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="text-xs font-semibold rounded-xl h-9"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-600" />}
              Refresh Records
            </Button>
            <Button size="sm" asChild className="bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold text-white h-9 shadow-xs">
              <Link href="/marketplace">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Public Marketplace
              </Link>
            </Button>
          </div>
        </div>

        {/* Global Filter & Command Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Property ID, Address, Landlord, Submitter, or Audit Target..."
            className="pl-10 h-10 rounded-xl bg-slate-50/70 border-slate-200 text-xs sm:text-sm focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* --- TOP ROW: 4 HIGH-CONTRAST KPI & SLA METRIC CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Pending Approvals */}
        <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white hover:border-slate-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Approvals
              </span>
              <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <FileCheck2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {pendingApprovals.length}
              </span>
              {hasBreachedApprovals ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold px-1.5 py-0">
                  SLA Warning (&gt;24h)
                </Badge>
              ) : (
                <span className="text-xs text-emerald-600 font-semibold">In Compliance</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Four-Eyes Dual-Custody Queue</p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Inspections Today */}
        <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white hover:border-slate-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Inspections Active
              </span>
              <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <CalendarCheck2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {scheduledInspections.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({completedInspections.length} Completed)
              </span>
            </div>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">Certified Field Audits</p>
          </CardContent>
        </Card>

        {/* Metric 3: Open Trust & Safety Flags */}
        <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white hover:border-slate-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Trust &amp; Safety Flags
              </span>
              <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <BadgeAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {openReports.length}
              </span>
              {openReports.length > 0 ? (
                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold px-1.5 py-0">
                  Action Required
                </Badge>
              ) : (
                <span className="text-xs text-emerald-600 font-semibold">All Clear</span>
              )}
            </div>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">Fraud &amp; Incident Triage</p>
          </CardContent>
        </Card>

        {/* Metric 4: Sensitive Data / Audit Events (24h) */}
        <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white hover:border-slate-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Audit Events (24h)
              </span>
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <History className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {recentAuditLogs.length}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">
                SHA-256 Chained
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{auditLogs.length} Total Immutable Records</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
