'use client';

import { ArrowRight, Building2, CheckCircle2, Clock3, Flag, ShieldAlert, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Property, ListingReport, AuditLog } from '@/types/prophunta';

type OperationsRole = 'PROPERTY_MODERATOR' | 'TRUST_SAFETY_INVESTIGATOR';

export function RoleOperationsOverview({ role, properties, reports, auditLogs }: {
  role: OperationsRole;
  properties: Property[];
  reports: ListingReport[];
  auditLogs: AuditLog[];
}) {
  const isModerator = role === 'PROPERTY_MODERATOR';
  const pendingProperties = properties.filter((property) => ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUIRED'].includes(property.listingStatus));
  const approvedProperties = properties.filter((property) => property.moderationStatus === 'APPROVED');
  const rejectedProperties = properties.filter((property) => property.moderationStatus === 'REJECTED' || property.listingStatus === 'REJECTED');
  const openReports = reports.filter((report) => !['RESOLVED', 'DISMISSED'].includes(report.status));
  const investigatedReports = reports.filter((report) => ['UNDER_INVESTIGATION', 'DOCUMENTATION_REQUESTED'].includes(report.status));
  const resolvedReports = reports.filter((report) => ['RESOLVED', 'DISMISSED'].includes(report.status));
  const escalatedReports = reports.filter((report) => report.status === 'ESCALATED');
  const recentActivity = [...auditLogs].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 5);
  const pendingRows = isModerator ? pendingProperties.slice(0, 5) : [];
  const categoryCounts = new Map<string, number>();
  for (const property of properties) categoryCounts.set(property.propertyType, (categoryCounts.get(property.propertyType) || 0) + 1);
  const reportReasonCounts = new Map<string, number>();
  for (const report of reports) reportReasonCounts.set(report.reason, (reportReasonCounts.get(report.reason) || 0) + 1);
  const distribution = isModerator ? [...categoryCounts] : [...reportReasonCounts];
  const distributionTotal = isModerator ? properties.length : reports.length;
  const primaryRows = isModerator ? pendingRows : openReports.slice(0, 5);

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {isModerator ? <>
        <Metric label="Listings in view" value={properties.length} icon={<Building2 />} tone="blue" />
        <Metric label="Awaiting moderation" value={pendingProperties.length} icon={<Clock3 />} tone="amber" />
        <Metric label="Approved content" value={approvedProperties.length} icon={<CheckCircle2 />} tone="green" />
        <Metric label="Rejected listings" value={rejectedProperties.length} icon={<XCircle />} tone="rose" />
      </> : <>
        <Metric label="Reports in view" value={reports.length} icon={<Flag />} tone="blue" />
        <Metric label="Open investigations" value={investigatedReports.length} icon={<Clock3 />} tone="amber" />
        <Metric label="Resolved reports" value={resolvedReports.length} icon={<CheckCircle2 />} tone="green" />
        <Metric label="Escalated reports" value={escalatedReports.length} icon={<ShieldAlert />} tone="rose" />
      </>}
    </div>

    <div className="grid gap-4 xl:grid-cols-12">
      <Card className="overflow-hidden rounded-2xl border-slate-200 xl:col-span-7">
        <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-base">{isModerator ? 'Moderation queue' : 'Open investigations'}</CardTitle><Link className="flex items-center gap-1 text-xs font-semibold text-[#15803d]" href={`/admin?tab=${isModerator ? 'properties' : 'reports'}`}>View all <ArrowRight className="h-3.5 w-3.5" /></Link></CardHeader>
        <CardContent className="divide-y p-0">
          {primaryRows.length ? primaryRows.map((row) => {
            const isProperty = 'propertyType' in row;
            const title = isProperty ? row.title : row.propertyTitle || row.reason;
            const location = isProperty ? [row.area, row.city].filter(Boolean).join(', ') : row.reason;
            const image = isProperty ? row.media.find((media) => media.type === 'image' && media.url)?.url : undefined;
            return <div key={row.id} className="flex items-center gap-3 px-4 py-3">
              {image ? <div role="img" aria-label={`Photo of ${title}`} className="h-12 w-16 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url("${image.replace(/["\\]/g, '\\$&')}")` }} /> : <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">{isProperty ? <Building2 className="h-5 w-5" /> : <Flag className="h-5 w-5" />}</div>}
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-900">{title}</p><p className="truncate text-[11px] text-slate-500">{location || 'Location not recorded'} · {isProperty ? row.listingStatus : row.status}</p></div>
              <Link href={`/admin?tab=${isModerator ? 'properties' : 'reports'}`} className="rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-slate-950 hover:bg-[#20bd5b]">{isModerator ? 'Review' : 'Investigate'}</Link>
            </div>;
          }) : <p className="px-4 py-10 text-center text-xs text-slate-500">No {isModerator ? 'pending listings' : 'open reports'} in the records available to this account.</p>}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 xl:col-span-5">
        <CardHeader className="pb-2"><CardTitle className="text-base">{isModerator ? 'Listing categories' : 'Report reasons'}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {distribution.length ? distribution.sort((a, b) => b[1] - a[1]).map(([label, count]) => <div key={label} className="grid grid-cols-[minmax(0,1fr)_2fr_34px] items-center gap-3 text-xs"><span className="truncate text-slate-600">{label.replaceAll('_', ' ')}</span><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#25D366]" style={{ width: `${distributionTotal ? count / distributionTotal * 100 : 0}%` }} /></div><strong className="text-right tabular-nums text-slate-800">{count}</strong></div>) : <p className="py-8 text-center text-xs text-slate-500">No category data available.</p>}
          <p className="border-t pt-3 text-[10px] text-slate-400">Counts use the {isModerator ? 'property types' : 'reported reasons'} recorded in the current data.</p>
        </CardContent>
      </Card>
    </div>

    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-base">Recent moderation activity</CardTitle><Link className="flex items-center gap-1 text-xs font-semibold text-[#15803d]" href="/admin?tab=audit">Audit logs <ArrowRight className="h-3.5 w-3.5" /></Link></CardHeader>
      <CardContent className="divide-y p-0">{recentActivity.length ? recentActivity.map((entry) => <div key={entry.id} className="flex items-center gap-3 px-4 py-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{entry.action.replaceAll('_', ' ').toLowerCase()}</p><p className="truncate text-[11px] text-slate-500">{entry.actorEmail} · {entry.objectType.toLowerCase()}</p></div><time className="shrink-0 text-[11px] text-slate-500">{new Date(entry.timestamp).toLocaleString()}</time></div>) : <p className="px-4 py-8 text-center text-xs text-slate-500">No audit activity available.</p>}</CardContent>
    </Card>
  </div>;
}

function Metric({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'blue' | 'amber' | 'green' | 'rose' }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700', rose: 'bg-rose-50 text-rose-700' };
  return <Card className="rounded-2xl border-slate-200 bg-white"><CardContent className="flex items-center gap-3 p-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span><div className="min-w-0"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value.toLocaleString()}</p></div></CardContent></Card>;
}
