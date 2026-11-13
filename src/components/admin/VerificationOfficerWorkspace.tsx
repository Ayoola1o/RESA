'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Activity, BarChart3, Check, ChevronRight, Clock3, Download, FileCheck2, FileText, Fingerprint, Loader2, RefreshCw, Scale, Settings2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminPermission, AuditLog, Property, User, UserDocument } from '@/types/prophunta';
import { StaffAccount, StaffRole } from '@/types/admin-governance';
import { VerificationSubStatus } from '@/types/prophunta';
import { ApprovalWorkbench } from '@/components/admin/ApprovalWorkbench';
import {
  getAdminPropertiesAction,
  getVerificationAuditAction,
  getVerificationOfficerDocumentsAction,
  getVerificationOfficerUsersAction,
  approveVerificationAction,
  changePasswordAction,
  rejectVerificationAction,
  requestVerificationChangesAction,
  updateVerificationChecklistAction,
  reviewKycAction,
  reviewPropertyDocumentAction,
  reviewUserDocumentAction,
} from '@/server/actions/prophunta-actions';
import { useToast } from '@/hooks/use-toast';

type Screen = 'overview' | 'queue' | 'documents' | 'identity' | 'compliance' | 'reports' | 'audit' | 'settings';
type UserDocumentRecord = { document: UserDocument; user: Pick<User, 'id' | 'name' | 'email' | 'role'> | null };
type IdentityUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'verificationStatus' | 'kycStatus' | 'kycDocumentType' | 'kycSubmittedAt' | 'kycReviewedAt' | 'kycRejectionReason' | 'createdAt' | 'updatedAt'>;
const navigation: { id: Screen; label: string; icon: typeof ShieldCheck }[] = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3 },
  { id: 'queue', label: 'Verification Queue', icon: ShieldCheck },
  { id: 'documents', label: 'Document Reviews', icon: FileText },
  { id: 'identity', label: 'Identity Checks', icon: Fingerprint },
  { id: 'compliance', label: 'Compliance Monitor', icon: Scale },
  { id: 'reports', label: 'Reports', icon: FileCheck2 },
  { id: 'audit', label: 'Audit Logs', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const decisionLabel: Record<string, string> = {
  PENDING: 'Pending', IN_REVIEW: 'Under review', UNDER_REVIEW: 'Under review',
  VERIFIED: 'Verified', APPROVED: 'Approved', REJECTED: 'Rejected',
  CHANGES_REQUIRED: 'Changes required', PASSED: 'Passed', FAILED: 'Failed',
  NOT_REVIEWED: 'Not reviewed',
};

export function VerificationOfficerWorkspace({
  staffContext,
  currentUser,
  can,
}: {
  staffContext: { staffAccount: StaffAccount; effectivePermissions: AdminPermission[]; activeRoles: StaffRole[] };
  currentUser: User | null;
  can: (permission: AdminPermission) => boolean;
}) {
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedScreen = searchParams.get('tab') as Screen | null;
  const screen: Screen = navigation.some((item) => item.id === requestedScreen) ? requestedScreen! : 'overview';
  const setScreen = (next: Screen) => router.replace(`${pathname}?tab=${next}`, { scroll: false });
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [documents, setDocuments] = useState<UserDocumentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [propertyRows, identityRows, documentRows, auditRows] = await Promise.all([
        getAdminPropertiesAction(),
        getVerificationOfficerUsersAction(),
        getVerificationOfficerDocumentsAction(),
        getVerificationAuditAction(100),
      ]);
      setProperties(propertyRows);
      setUsers(identityRows);
      setDocuments(documentRows);
      setAuditLogs(auditRows);
    } catch {
      setError('Verification records could not be loaded. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const propertyDocuments = useMemo(() => properties.flatMap((property) => (property.documents || []).map((document) => ({ property, document }))), [properties]);
  const pendingPropertyVerifications = properties.filter((property) => ['SUBMITTED', 'UNDER_REVIEW'].includes(property.listingStatus));
  const pendingUserDocuments = documents.filter(({ document }) => ['PENDING', 'UNDER_REVIEW'].includes(document.status));
  const pendingIdentityChecks = users.filter((user) => ['PENDING', 'IN_REVIEW'].includes(user.kycStatus || ''));
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthEvents = auditLogs.filter((log) => Date.parse(log.timestamp) >= monthStart.getTime());
  const verifiedEvents = monthEvents.filter((log) => ['KYC_APPROVED', 'VERIFICATION_APPROVED'].includes(log.action) || (log.action === 'DOCUMENT_REVIEWED' && log.metadata?.status === 'VERIFIED'));
  const rejectedEvents = monthEvents.filter((log) => ['KYC_REJECTED', 'VERIFICATION_REJECTED'].includes(log.action) || (log.action === 'DOCUMENT_REVIEWED' && log.metadata?.status === 'REJECTED'));
  const openQueueCount = pendingPropertyVerifications.length + pendingUserDocuments.length + pendingIdentityChecks.length;

  const runDecision = async (id: string, action: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    setBusyId(id);
    const result = await action();
    setBusyId(null);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Review failed', description: result.error || 'The verification record could not be updated.' });
      return;
    }
    toast({ title: 'Verification updated', description: successMessage });
    await load();
  };

  const saveChecklist = (propertyId: string, notes: string, checklist: Record<string, VerificationSubStatus>) => updateVerificationChecklistAction(propertyId, {
    ownerIdentityStatus: checklist.ownerIdentityStatus,
    locationStatus: checklist.locationStatus,
    authorityDocumentStatus: checklist.authorityDocumentStatus,
    availabilityStatus: checklist.availabilityStatus,
    reviewNotes: notes,
  });
  const decideProperty = async (property: Property, notes: string, checklist: Record<string, VerificationSubStatus>, outcome: 'APPROVE' | 'REJECT' | 'CHANGES'): Promise<boolean> => {
    const saved = await saveChecklist(property.id, notes, checklist);
    if (!saved.success) { toast({ variant: 'destructive', title: 'Checklist update failed', description: saved.error }); return false; }
    const result = outcome === 'APPROVE'
      ? await approveVerificationAction(property.id, notes)
      : outcome === 'REJECT'
        ? await rejectVerificationAction(property.id, notes)
        : await requestVerificationChangesAction(property.id, notes);
    if (!result.success) { toast({ variant: 'destructive', title: 'Decision failed', description: result.error }); return false; }
    toast({ title: 'Verification decision recorded', description: `${property.title} was updated.` });
    await load();
    return true;
  };

  const exportReport = () => {
    const rows = [
      ['timestamp', 'action', 'record_type', 'record_id', 'result'],
      ...auditLogs.map((log) => [log.timestamp, log.action, log.objectType, log.objectId, log.result]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `verification-report-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyId('password');
    const result = await changePasswordAction(currentPassword, newPassword);
    setBusyId(null);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Password not changed', description: result.error || 'Please try again.' });
      return;
    }
    setCurrentPassword(''); setNewPassword('');
    toast({ title: 'Password updated', description: 'Your sign-in password was changed.' });
  };

  return (
    <div className="w-full min-w-0">
       <main className="min-w-0">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold text-[#159447]">PropHunta AI · Verification</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{screen === 'overview' ? 'Verification Officer Dashboard' : navigation.find((item) => item.id === screen)?.label}</h1><p className="mt-1 text-xs text-slate-500">Review submitted identity and property verification records.</p></div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="rounded-xl"><RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
        </header>

        {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}<Button size="sm" variant="outline" onClick={() => void load()}>Retry</Button></div>}
        {loading && !properties.length && !users.length && !documents.length ? <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading verification records…</div> : (
          <>
            {(screen === 'overview' || screen === 'queue') && <>
              <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Stat label="Pending verification" value={openQueueCount} tone="blue" icon={<FileText className="h-5 w-5" />} />
                <Stat label="Approved events loaded this month" value={verifiedEvents.length} tone="green" icon={<Check className="h-5 w-5" />} />
                <Stat label="Under review" value={pendingUserDocuments.filter(({ document }) => document.status === 'UNDER_REVIEW').length + pendingIdentityChecks.filter((user) => user.kycStatus === 'IN_REVIEW').length} tone="amber" icon={<Clock3 className="h-5 w-5" />} />
                <Stat label="Rejected events loaded this month" value={rejectedEvents.length} tone="violet" icon={<X className="h-5 w-5" />} />
              </div>
              {screen === 'overview' && <div className="mb-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                <Card className="rounded-2xl border-slate-200"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Verification queue</CardTitle><button className="flex items-center gap-1 text-xs font-semibold text-[#168b43]" onClick={() => setScreen('queue')}>View queue <ChevronRight className="h-4 w-4" /></button></CardHeader><CardContent><QueueRows properties={pendingPropertyVerifications} users={pendingIdentityChecks} documents={pendingUserDocuments} onReview={(kind) => setScreen(kind === 'property' ? 'queue' : kind === 'identity' ? 'identity' : 'documents')} /></CardContent></Card>
                <Card className="rounded-2xl border-slate-200"><CardHeader><CardTitle className="text-base">Verification overview</CardTitle></CardHeader><CardContent><div className="mb-4 grid grid-cols-2 gap-3"><Mini label="Approved events" value={verifiedEvents.length} /><Mini label="Rejected events" value={rejectedEvents.length} /><Mini label="Open identity checks" value={pendingIdentityChecks.length} /><Mini label="Open listing checks" value={pendingPropertyVerifications.length} /></div><p className="text-xs leading-relaxed text-slate-500">Counts reflect the verification and document records currently available to your account. No trend estimates are shown.</p></CardContent></Card>
              </div>}
              {screen === 'overview' ? <Card className="rounded-2xl border-slate-200"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Recent verification activity</CardTitle><button className="text-xs font-semibold text-[#168b43]" onClick={() => setScreen('audit')}>View audit logs →</button></CardHeader><CardContent><ActivityRows logs={auditLogs.slice(0, 5)} /><div className="mt-3 text-right text-[11px] text-slate-400">{auditLogs.length} verification audit events loaded</div></CardContent></Card> : <><Card className="mb-5 rounded-2xl border-slate-200"><CardHeader><CardTitle className="text-base">Identity records awaiting review</CardTitle></CardHeader><CardContent><QueueRows properties={[]} users={pendingIdentityChecks} documents={pendingUserDocuments} onReview={(kind) => setScreen(kind === 'identity' ? 'identity' : 'documents')} /></CardContent></Card><ApprovalWorkbench mode="verification" properties={pendingPropertyVerifications} users={users} approvalRequests={[]} can={can} currentUser={currentUser} submittingAction={busyId !== null} onApproveProperty={(property, notes, checklist) => decideProperty(property, notes, checklist, 'APPROVE')} onRejectProperty={(property, notes, checklist) => decideProperty(property, notes, checklist, 'REJECT')} onRequestChangesProperty={(property, notes, checklist) => decideProperty(property, notes, checklist, 'CHANGES')} onApproveDualCustody={async () => {}} onRejectDualCustody={async () => {}} onCancelDualCustody={async () => {}} onEmergencyOverride={async () => {}} searchQuery="" /></>}
            </>}

            {screen === 'documents' && <Card className="rounded-2xl border-slate-200"><CardHeader><CardTitle className="text-base">Submitted identity documents</CardTitle></CardHeader><CardContent className="space-y-3">
              {documents.length ? documents.map(({ document, user }) => <div key={document.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-green-50 text-[#168b43]"><FileText className="h-4 w-4" /></div><div className="min-w-48 flex-1"><p className="text-xs font-semibold text-slate-800">{document.title || document.fileName}</p><p className="text-[11px] text-slate-500">{user?.name || 'Account'} · {document.documentType.replaceAll('_', ' ').toLowerCase()} · {new Date(document.uploadedAt).toLocaleDateString()}</p></div><Status status={document.status} />{document.status !== 'VERIFIED' && <div className="flex gap-2"><a className="rounded-lg border px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer">Open file</a>{can('documents.review') && <Button size="sm" className="bg-[#25D366] text-slate-950 hover:bg-[#20bd5b]" disabled={busyId === document.id} onClick={() => void runDecision(document.id, () => reviewUserDocumentAction(document.id, 'VERIFIED'), `${document.fileName} was verified.`)}>Approve</Button>}<Button size="sm" variant="outline" disabled={busyId === document.id} onClick={() => void runDecision(document.id, () => reviewUserDocumentAction(document.id, 'REJECTED'), `${document.fileName} was rejected.`)}>Reject</Button></div>}</div>) : <Empty text="No identity document uploads are available." />}
              {propertyDocuments.length > 0 && <div className="mt-6"><h3 className="mb-3 text-sm font-semibold">Property verification documents</h3>{propertyDocuments.map(({ property, document }) => <div key={document.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3"><FileText className="h-4 w-4 text-[#168b43]" /><div className="min-w-44 flex-1"><p className="text-xs font-semibold">{document.fileName}</p><p className="text-[11px] text-slate-500">{property.title} · {document.documentType.replaceAll('_', ' ').toLowerCase()}</p></div><Status status={document.status} /><a className="rounded-lg border px-3 py-2 text-xs" href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer">Open file</a>{can('documents.review') && document.status === 'PENDING' && <><Button size="sm" className="bg-[#25D366] text-slate-950 hover:bg-[#20bd5b]" onClick={() => void runDecision(document.id, () => reviewPropertyDocumentAction(property.id, document.id, 'APPROVED'), `${document.fileName} was approved.`)}>Approve</Button><Button size="sm" variant="outline" onClick={() => void runDecision(document.id, () => reviewPropertyDocumentAction(property.id, document.id, 'REJECTED', 'Document did not satisfy verification requirements.'), `${document.fileName} was rejected.`)}>Reject</Button></>}</div>)}</div>}
            </CardContent></Card>}

            {screen === 'identity' && <Card className="rounded-2xl border-slate-200"><CardHeader><CardTitle className="text-base">Identity submissions</CardTitle></CardHeader><CardContent className="space-y-3">{users.length ? users.map((user) => <div key={user.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-green-50 text-xs font-bold text-[#168b43]">{user.name.slice(0, 2).toUpperCase()}</div><div className="min-w-44 flex-1"><p className="text-xs font-semibold">{user.name}</p><p className="text-[11px] text-slate-500">{user.role} · {user.email} · {user.kycDocumentType || 'Identity document not specified'}</p><p className="text-[11px] text-slate-400">Submitted {user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleString() : 'date not recorded'}</p></div><Status status={user.kycStatus || 'NOT_SUBMITTED'} />{['PENDING', 'IN_REVIEW'].includes(user.kycStatus || '') && can('verification.approve') && <Button size="sm" className="bg-[#25D366] text-slate-950 hover:bg-[#20bd5b]" disabled={busyId === user.id} onClick={() => void runDecision(user.id, () => reviewKycAction(user.id, 'VERIFIED'), `${user.name}'s identity status was verified.`)}>Verify</Button>}{['PENDING', 'IN_REVIEW'].includes(user.kycStatus || '') && can('verification.reject') && <Button size="sm" variant="outline" disabled={busyId === user.id} onClick={() => void runDecision(user.id, () => reviewKycAction(user.id, 'REJECTED', 'Identity submission requires correction.'), `${user.name}'s identity submission was rejected.`)}>Reject</Button>}</div>) : <Empty text="No user identity verification submissions are available." />}</CardContent></Card>}

            {screen === 'compliance' && <div className="grid gap-4 lg:grid-cols-2"><Card className="rounded-2xl border-slate-200"><CardHeader><CardTitle className="text-base">Document review status</CardTitle></CardHeader><CardContent className="space-y-3">{(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUIRED'] as const).map((status) => { const count = propertyDocuments.filter(({ document }) => document.status === status).length + documents.filter(({ document }) => document.status === status).length; return <div key={status} className="flex justify-between border-b pb-2 text-xs"><span className="text-slate-600">{decisionLabel[status]}</span><strong>{count}</strong></div>; })}<p className="pt-2 text-[11px] text-slate-500">These are current document statuses from available records, not a regulatory compliance score.</p></CardContent></Card><Card className="rounded-2xl border-slate-200"><CardHeader><CardTitle className="text-base">Listing verification checks</CardTitle></CardHeader><CardContent className="space-y-3">{(['PENDING', 'IN_REVIEW', 'PASSED', 'FAILED', 'CHANGES_REQUIRED'] as const).map((status) => { const count = properties.filter((property) => property.verification?.overallStatus === status).length; return <div key={status} className="flex justify-between border-b pb-2 text-xs"><span className="text-slate-600">{decisionLabel[status]}</span><strong>{count}</strong></div>; })}</CardContent></Card></div>}

            {screen === 'reports' && <Card className="rounded-2xl border-slate-200"><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base">Verification activity report</CardTitle><p className="mt-1 text-xs text-slate-500">Export the verification and document decisions currently available in the audit trail.</p></div><Button onClick={exportReport} className="bg-[#25D366] text-slate-950 hover:bg-[#20bd5b]"><Download className="mr-2 h-4 w-4" />Export CSV</Button></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Mini label="Audit events loaded" value={auditLogs.length} /><Mini label="Approved this month" value={verifiedEvents.length} /><Mini label="Rejected this month" value={rejectedEvents.length} /><Mini label="Open queue records" value={openQueueCount} /></div><p className="mt-4 text-[11px] text-slate-500">Report totals are based on available verification records and the most recent 100 events per verification action.</p></CardContent></Card>}

            {screen === 'audit' && <Card className="rounded-2xl border-slate-200"><CardHeader><CardTitle className="text-base">Verification audit trail</CardTitle></CardHeader><CardContent className="divide-y p-0">{auditLogs.length ? auditLogs.map((log) => <div key={log.id} className="grid gap-1 px-4 py-3 text-xs sm:grid-cols-[160px_1fr_180px]"><time className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</time><span className="font-semibold text-slate-800">{log.action.replaceAll('_', ' ').toLowerCase()} · {log.objectType.toLowerCase()} {log.objectId}</span><span className="text-slate-500">{log.actorEmail} · {log.result.toLowerCase()}</span></div>) : <Empty text="No verification decisions are in the audit trail yet." />}</CardContent></Card>}

            {screen === 'settings' && <div className="grid gap-4 xl:grid-cols-2"><Card className="rounded-2xl border-slate-200"><CardHeader><CardTitle className="text-base">Verification officer access</CardTitle><p className="text-xs text-slate-500">This account has a read-only permissions summary. Platform-wide settings are not available to verification staff.</p></CardHeader><CardContent><div className="mb-4 rounded-xl bg-green-50 p-4"><p className="text-sm font-semibold text-slate-900">{currentUser?.name}</p><p className="text-xs text-slate-600">{currentUser?.email}</p><p className="mt-2 text-xs font-semibold text-[#168b43]">{staffContext.activeRoles.join(', ')}</p></div><h3 className="mb-2 text-xs font-semibold text-slate-700">Granted verification permissions</h3><div className="flex flex-wrap gap-2">{staffContext.effectivePermissions.filter((permission) => permission.startsWith('verification.') || permission.startsWith('documents.') || permission === 'admin.dashboard.view').map((permission) => <Badge variant="outline" key={permission} className="border-green-200 bg-green-50 text-green-800">{permission}</Badge>)}</div><p className="mt-4 text-[11px] text-slate-500">Role and platform settings can only be changed by authorized staff managers.</p></CardContent></Card><Card className="rounded-2xl border-slate-200"><CardHeader><CardTitle className="text-base">Account security</CardTitle><p className="text-xs text-slate-500">Change your own sign-in password.</p></CardHeader><CardContent><form className="space-y-3" onSubmit={handlePasswordChange}><label className="block text-xs font-medium text-slate-700">Current password<input required autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3" /></label><label className="block text-xs font-medium text-slate-700">New password<input required minLength={16} autoComplete="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3" /></label><p className="text-[11px] text-slate-500">Staff passwords must be at least 16 characters.</p><Button disabled={busyId === 'password'} className="bg-[#25D366] text-slate-950 hover:bg-[#20bd5b]">{busyId === 'password' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update password</Button></form></CardContent></Card></div>}
          </>
        )}
       </main>
    </div>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: number; tone: 'blue' | 'green' | 'amber' | 'violet'; icon: React.ReactNode }) {
  const style = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-[#168b43]', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' };
  return <Card className="rounded-2xl border-slate-200"><CardContent className="flex items-start justify-between p-4"><div><p className="text-[11px] font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value.toLocaleString()}</p></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${style[tone]}`}>{icon}</span></CardContent></Card>;
}

function Mini({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-lg font-bold tabular-nums">{value.toLocaleString()}</p></div>; }
function Status({ status }: { status: string }) { const positive = ['VERIFIED', 'APPROVED', 'PASSED'].includes(status); const negative = ['REJECTED', 'FAILED'].includes(status); return <Badge className={positive ? 'border-green-200 bg-green-50 text-green-800' : negative ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-blue-200 bg-blue-50 text-blue-700'}>{decisionLabel[status] || status}</Badge>; }
function Empty({ text }: { text: string }) { return <div className="py-12 text-center text-xs text-slate-500">{text}</div>; }
function ActivityRows({ logs }: { logs: AuditLog[] }) {
  return logs.length ? <div className="divide-y">{logs.map((log) => <div key={log.id} className="flex items-center gap-3 py-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${log.result === 'SUCCESS' ? 'bg-green-50 text-[#168b43]' : 'bg-rose-50 text-rose-700'}`}><Activity className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{log.action.replaceAll('_', ' ').toLowerCase()}</p><p className="truncate text-[11px] text-slate-500">{log.actorEmail} · {log.objectType.toLowerCase()} {log.objectId}</p></div><time className="shrink-0 text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</time></div>)}</div> : <Empty text="No verification activity has been recorded yet." />;
}
function QueueRows({ properties, users, documents, onReview }: { properties: Property[]; users: IdentityUser[]; documents: UserDocumentRecord[]; onReview: (kind: 'property' | 'identity' | 'document') => void }) {
  const rows = [
    ...users.map((user) => ({ id: user.id, name: user.name, kind: `${user.role} identity review`, status: user.kycStatus || 'PENDING', date: user.kycSubmittedAt, target: 'identity' as const })),
    ...documents.map(({ document, user }) => ({ id: document.id, name: user?.name || document.fileName, kind: document.documentType.replaceAll('_', ' ').toLowerCase(), status: document.status, date: document.uploadedAt, target: 'document' as const })),
    ...properties.map((property) => ({ id: property.id, name: property.title, kind: `Property · ${property.area || property.city}`, status: property.listingStatus, date: property.updatedAt, target: 'property' as const })),
  ].slice(0, 7);
  return rows.length ? <div className="divide-y">{rows.map((row) => <div key={`${row.kind}-${row.id}`} className="flex items-center gap-3 py-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-50 text-[10px] font-bold text-[#168b43]">{row.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{row.name}</p><p className="truncate text-[11px] capitalize text-slate-500">{row.kind}{row.date ? ` · ${new Date(row.date).toLocaleDateString()}` : ''}</p></div><Status status={row.status} /><Button size="sm" variant="outline" className="shrink-0" onClick={() => onReview(row.target)}>Review</Button></div>)}</div> : <div className="py-8 text-center text-xs text-slate-500">No pending verification records in the available data.</div>;
}
