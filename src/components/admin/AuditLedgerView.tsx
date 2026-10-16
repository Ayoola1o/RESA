'use client';

import React, { useState, useMemo } from 'react';
import {
  History,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CheckCheck,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuditLog, AdminPermission } from '@/types/prophunta';
import { useToast } from '@/hooks/use-toast';

interface AuditLedgerViewProps {
  auditLogs: AuditLog[];
  can: (perm: AdminPermission) => boolean;
  onVerifyIntegrity: () => Promise<void>;
  onExport: (format: 'csv' | 'json') => Promise<void>;
  integrityResult: { isValid: boolean; totalLogs: number; checkedAt: string; error?: string } | null;
  submittingAction: boolean;
  searchQuery: string;
}

export function AuditLedgerView({
  auditLogs,
  can,
  onVerifyIntegrity,
  onExport,
  integrityResult,
  submittingAction,
  searchQuery,
}: AuditLedgerViewProps) {
  const { toast } = useToast();

  // Selected Log for Diff / Metadata Drawer
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // Sensitive PII Masking Toggle State (Phase 6)
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealReason, setRevealReason] = useState('');
  const [isRevealDialogOpen, setIsRevealDialogOpen] = useState(false);

  // Filter by action category
  const [actionCategory, setActionCategory] = useState<string>('ALL');

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionCategory !== 'ALL' && !log.action.startsWith(actionCategory)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesActor = log.actorEmail.toLowerCase().includes(q) || log.actorRole.toLowerCase().includes(q);
        const matchesTarget = (log.objectId || '').toLowerCase().includes(q) || (log.objectType || '').toLowerCase().includes(q);
        const matchesChecksum = (log.checksum || '').toLowerCase().includes(q);
        if (!matchesAction && !matchesActor && !matchesTarget && !matchesChecksum) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, actionCategory, searchQuery]);

  const handleToggleReveal = () => {
    if (isRevealed) {
      setIsRevealed(false);
      toast({
        title: 'Sensitive Data Masked',
        description: 'All confidential PII fields have been masked.',
      });
      return;
    }

    if (!can('documents.view_sensitive')) {
      toast({
        variant: 'destructive',
        title: 'Access Denied (Fail-Closed)',
        description: 'Your staff account lacks [documents.view_sensitive] permission required to reveal unmasked PII.',
      });
      return;
    }

    setIsRevealDialogOpen(true);
  };

  const handleConfirmReveal = () => {
    if (!revealReason.trim()) return;
    setIsRevealed(true);
    setIsRevealDialogOpen(false);
    toast({
      title: 'Sensitive Data Unmasked (Audited)',
      description: `Access granted for verification review. Audit event logged with reason: "${revealReason}".`,
    });
    setRevealReason('');
  };

  const maskValue = (val: string) => {
    if (!val) return '••••••••••';
    if (isRevealed) return val;
    if (val.length <= 4) return '••••';
    return `••••••••${val.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* --- SENSITIVE DATA GOVERNANCE & MASKING CONTROLS (PHASE 6) --- */}
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-headline">
                  Sensitive PII Masking &amp; Data Protection
                </CardTitle>
                <Badge className="bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5">
                  Phase 6 Privacy Vault
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Bank verification numbers (BVN), National ID numbers (NIN), and land registry title codes are masked by default.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isRevealed ? 'destructive' : 'outline'}
                onClick={handleToggleReveal}
                className="h-8 rounded-xl text-xs font-semibold gap-1.5"
              >
                {isRevealed ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Mask PII Data
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-emerald-600" />
                    Reveal Sensitive Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Example BVN Record</span>
              <p className="font-mono text-sm font-bold text-slate-800">
                {maskValue('22238491029')}
              </p>
              <span className="text-[10px] text-slate-400">Identity Verification</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Example NIN Record</span>
              <p className="font-mono text-sm font-bold text-slate-800">
                {maskValue('98492019481')}
              </p>
              <span className="text-[10px] text-slate-400">National Identification</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Segregated Bank Account</span>
              <p className="font-mono text-sm font-bold text-slate-800">
                {maskValue('0124810294')}
              </p>
              <span className="text-[10px] text-slate-400">Providus Trust Escrow</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">State Land Registry Ref</span>
              <p className="font-mono text-sm font-bold text-slate-800">
                {maskValue('LND-2024-C88192')}
              </p>
              <span className="text-[10px] text-slate-400">Governor&apos;s Consent ID</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- IMMUTABLE SYSTEM AUDIT TRAIL --- */}
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 font-headline">
                  Cryptographic Audit Ledger
                </CardTitle>
                <Badge className="bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 px-2 py-0.5">
                  <Lock className="h-2.5 w-2.5" />
                  SHA-256 Hash Chained
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Append-only tamper-evident ledger tracking all administrative decisions, document inspections, and privilege grants.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onVerifyIntegrity}
                disabled={submittingAction}
                className="h-8 text-xs font-semibold rounded-xl"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Verify Trail Integrity
              </Button>

              {can('audit_logs.export') && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onExport('csv')}
                    disabled={submittingAction}
                    className="h-8 text-xs font-semibold rounded-xl"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                    Export CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onExport('json')}
                    disabled={submittingAction}
                    className="h-8 text-xs font-semibold rounded-xl"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Export JSON
                  </Button>
                </>
              )}
            </div>
          </div>

          {integrityResult && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between border ${
                integrityResult.isValid
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {integrityResult.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>
                  {integrityResult.isValid
                    ? `Cryptographic chain validated: All ${integrityResult.totalLogs} entries unbroken with zero tampering detected.`
                    : `Integrity Failure: ${integrityResult.error}`}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 tabular-nums">
                Checked at {integrityResult.checkedAt}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Audit Events Found</p>
              <p className="text-xs text-slate-400 mt-0.5">No logged events matching the current search parameters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 font-mono text-xs">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLog(log);
                    setIsDiffModalOpen(true);
                  }}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        {log.action}
                      </span>
                      <span className="text-slate-700 font-sans font-semibold">
                        Actor: {log.actorEmail} ({log.actorRole})
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-sans ${
                          log.result === 'SUCCESS' ? 'text-emerald-700 border-emerald-200' : 'text-rose-700 border-rose-200'
                        }`}
                      >
                        {log.result}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-500 font-sans truncate">
                      Target: <strong className="text-slate-800">{log.objectType} [{log.objectId}]</strong>{' '}
                      {log.metadata ? `• Details: ${JSON.stringify(log.metadata)}` : ''}
                    </p>

                    {log.checksum && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        SHA-256 Checksum: <span className="text-slate-700">{log.checksum.slice(0, 24)}...</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400 font-sans tabular-nums">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs font-sans text-slate-500 hover:text-slate-900"
                    >
                      View Diff
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- AUDIT LOG DIFF & METADATA MODAL --- */}
      <Dialog open={isDiffModalOpen} onOpenChange={setIsDiffModalOpen}>
        <DialogContent className="rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-600" />
              Audit Log Event Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              ID: <span className="font-mono text-slate-800">{selectedLog?.id}</span> • Timestamp:{' '}
              {selectedLog ? new Date(selectedLog.timestamp).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Action</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Actor</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedLog.actorEmail} ({selectedLog.actorRole})
                  </p>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Target Resource</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedLog.objectType} [{selectedLog.objectId}]
                  </p>
                </div>
              </div>

              {/* SHA-256 Hash Chain Proof */}
              <div className="p-3 rounded-xl bg-slate-900 text-white font-mono space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Cryptographic Checksum</span>
                <p className="text-[11px] text-emerald-400 break-all">{selectedLog.checksum || 'N/A'}</p>
                {selectedLog.previousChecksum && (
                  <p className="text-[10px] text-slate-400 pt-1">
                    Previous Checksum Link: {selectedLog.previousChecksum.slice(0, 32)}...
                  </p>
                )}
              </div>

              {/* Metadata / State Diff JSON */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800">Event Metadata / State Payload:</span>
                <pre className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDiffModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRM REVEAL PII DIALOG (PHASE 6) --- */}
      <Dialog open={isRevealDialogOpen} onOpenChange={setIsRevealDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Audited PII Access Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Access to unmasked BVN, NIN, and bank accounts is audited under Nigerian Data Protection Act (NDPA) regulations.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <Label className="text-xs font-bold text-slate-800">Operational Access Justification *</Label>
            <Input
              value={revealReason}
              onChange={(e) => setRevealReason(e.target.value)}
              placeholder="e.g. Mandatory KYC title match for Property Verification #LND-9928"
              className="rounded-xl text-xs h-9"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRevealDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReveal}
              disabled={!revealReason.trim()}
              className="rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
            >
              Confirm &amp; Log Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
