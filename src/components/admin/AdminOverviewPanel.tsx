'use client';

import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, Clock3, FileWarning, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPermission, AuditLog, ListingReport, Property, User } from '@/types/prophunta';

interface Props {
  properties: Property[];
  users: User[];
  reports: ListingReport[];
  auditLogs: AuditLog[];
  can: (permission: AdminPermission) => boolean;
}

const roleLabel: Record<User['role'], string> = { SEEKER: 'Seekers', OWNER: 'Owners', AGENT: 'Agents', ADMIN: 'Staff' };

function timeAgo(timestamp: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AdminOverviewPanel({ properties, users, reports, auditLogs, can }: Props) {
  const openReports = reports.filter((report) => !['RESOLVED', 'DISMISSED'].includes(report.status));
  const pending = properties.filter((property) => ['SUBMITTED', 'UNDER_REVIEW'].includes(property.listingStatus));
  const roleCounts = (['SEEKER', 'OWNER', 'AGENT'] as const).map((role) => ({
    role,
    label: roleLabel[role],
    count: users.filter((user) => user.role === role).length,
    color: role === 'SEEKER' ? 'bg-blue-500' : role === 'OWNER' ? 'bg-emerald-500' : 'bg-violet-500',
  }));
  const distributionTotal = roleCounts.reduce((sum, item) => sum + item.count, 0);
  const areas = new Map<string, { count: number; property: Property }>();
  for (const property of properties) {
    const area = property.area?.trim() || property.city?.trim();
    if (!area) continue;
    const current = areas.get(area);
    if (!current) areas.set(area, { count: 1, property });
    else current.count += 1;
  }
  const topAreas = [...areas.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 4);
  const imageArea = topAreas.map(([area]) => ({
    area,
    property: properties.find((property) => (property.area?.trim() || property.city?.trim()) === area && property.media?.some((media) => media.type === 'image' && media.url)),
  })).find((entry) => entry.property);
  const areaImage = imageArea?.property?.media.find((media) => media.type === 'image' && media.url)?.url;
  const activities = [...auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  return (
    <section aria-label="Platform overview" className="grid gap-4 xl:grid-cols-12">
      <Card className="rounded-2xl border-slate-200 xl:col-span-7">
        <CardHeader className="pb-3"><CardTitle className="text-base">Platform overview</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {can('users.view_limited') && <Metric icon={<Users className="h-4 w-4" />} label="Users in view" value={users.length} tone="blue" />}
          {(can('properties.moderate') || can('verification.queue.view')) && <Metric icon={<Building2 className="h-4 w-4" />} label="Properties in view" value={properties.length} tone="green" />}
          {can('verification.queue.view') && <Metric icon={<Clock3 className="h-4 w-4" />} label="Pending verification" value={pending.length} tone="violet" />}
          {can('reports.view') && <Metric icon={<FileWarning className="h-4 w-4" />} label="Open reports" value={openReports.length} tone="amber" />}
        </CardContent>
        {can('users.view_limited') && <div className="border-t px-5 py-4">
          <div className="mb-3 flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">User distribution</span><span className="text-slate-500">{distributionTotal} accounts in view</span></div>
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-100" aria-label="User distribution by role">
            {roleCounts.map((item) => <div key={item.role} className={item.color} style={{ width: `${distributionTotal ? item.count / distributionTotal * 100 : 0}%` }} title={`${item.label}: ${item.count}`} />)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{roleCounts.map((item) => <div key={item.role} className="flex items-center gap-2 text-xs text-slate-600"><span className={`h-2 w-2 rounded-full ${item.color}`} />{item.label}<strong className="text-slate-900">{item.count}</strong></div>)}</div>
        </div>}
      </Card>

      <Card className="overflow-hidden rounded-2xl border-slate-200 xl:col-span-5">
        <CardHeader className="flex-row items-center justify-between pb-3"><CardTitle className="text-base">Areas with most listings</CardTitle>{can('properties.moderate') && <Link href="/admin?tab=properties" className="flex items-center gap-1 text-xs font-semibold text-blue-700">Listings <ArrowRight className="h-3.5 w-3.5" /></Link>}</CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[minmax(130px,0.9fr)_1.1fr]">
          <div className="relative min-h-36 overflow-hidden rounded-xl bg-slate-100">
            {areaImage ? <div role="img" aria-label={`Property photo from ${imageArea?.area}`} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${areaImage.replace(/["\\]/g, '\\$&')}")` }} /> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-500"><Building2 className="h-7 w-7" />{properties.length ? 'No listing photos available' : 'No property listings yet'}</div>}
            {imageArea && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 pt-8 text-xs font-semibold text-white">{imageArea.area}</div>}
          </div>
          <div className="space-y-3">
            {topAreas.length ? topAreas.map(([area, data], index) => <div key={area} className="grid grid-cols-[22px_minmax(0,1fr)_30px] items-center gap-2 text-xs"><span className="text-slate-400">{index + 1}</span><div className="min-w-0"><div className="truncate font-semibold text-slate-800">{area}</div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${Math.max(8, data.count / topAreas[0][1].count * 100)}%` }} /></div></div><span className="text-right font-semibold tabular-nums text-slate-700">{data.count}</span></div>) : <p className="text-xs text-slate-500">Areas appear here when property locations are available.</p>}
            <p className="pt-1 text-[11px] text-slate-400">Ranked by listing count from current property records.</p>
          </div>
        </CardContent>
      </Card>

      {can('audit_logs.view') && <Card className="xl:col-span-7 rounded-2xl border-slate-200">
        <CardHeader className="flex-row items-center justify-between pb-3"><CardTitle className="text-base">Recent activity</CardTitle><Link href="/admin?tab=audit" className="flex items-center gap-1 text-xs font-semibold text-blue-700">View audit ledger <ArrowRight className="h-3.5 w-3.5" /></Link></CardHeader>
        <CardContent className="divide-y p-0">
          {activities.length ? activities.map((activity) => <div key={activity.id} className="flex items-center gap-3 px-5 py-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700"><CheckCircle2 className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{activity.action.replaceAll('_', ' ').toLowerCase()}</p><p className="truncate text-[11px] text-slate-500">{activity.actorEmail} · {activity.objectType.toLowerCase()} {activity.objectId}</p></div><time className="shrink-0 text-[11px] text-slate-500">{timeAgo(activity.timestamp)}</time></div>) : <p className="px-5 py-8 text-center text-xs text-slate-500">No audit activity is available in your view.</p>}
        </CardContent>
      </Card>}

      <Card className="xl:col-span-5 rounded-2xl border-slate-200">
        <CardHeader className="pb-3"><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {can('admin.staff.view') && <Action href="/admin?tab=staff" label="Manage staff" />}
          {can('verification.queue.view') && <Action href="/admin?tab=verification" label="Review verification queue" />}
          {can('properties.moderate') && <Action href="/admin?tab=properties" label="Moderate listings" />}
          {can('reports.view') && <Action href="/admin?tab=reports" label="Review trust & safety reports" />}
          {can('audit_logs.view') && <Action href="/admin?tab=audit" label="View audit ledger" />}
          {!can('admin.staff.view') && !can('verification.queue.view') && !can('properties.moderate') && !can('reports.view') && !can('audit_logs.view') && <p className="text-xs text-slate-500">No quick actions are available for your current permissions.</p>}
        </CardContent>
      </Card>
    </section>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'blue' | 'green' | 'violet' | 'amber' }) {
  const tones = { blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', violet: 'bg-violet-50 text-violet-700', amber: 'bg-amber-50 text-amber-700' };
  return <div className="rounded-xl border border-slate-100 p-3"><span className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span><div className="text-xl font-bold tabular-nums text-slate-900">{value.toLocaleString()}</div><div className="mt-1 text-[11px] leading-tight text-slate-500">{label}</div></div>;
}

function Action({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex min-h-10 items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-blue-50 hover:text-blue-800">{label}<ArrowRight className="h-3.5 w-3.5 shrink-0" /></Link>;
}
