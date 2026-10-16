'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  UserPlus,
  Key,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Clock,
  Lock,
  Layers,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StaffAccount, StaffRole, AdminPermission } from '@/types/prophunta';

interface StaffManagementViewProps {
  staffDirectory: StaffAccount[];
  currentUser: any;
  allStaffRoles: { role: StaffRole; label: string; desc: string; badgeClass: string }[];
  grantablePermissions: { perm: AdminPermission; label: string; desc: string }[];
  can: (perm: AdminPermission) => boolean;
  isSuperAdmin?: boolean;
  onInviteStaff: (name: string, email: string, roles: StaffRole[]) => Promise<void>;
  onUpdateRoles: (staffId: string, roles: StaffRole[]) => Promise<void>;
  onGrantCustomPerm: (staffId: string, perm: AdminPermission, reason: string, durationHours: string) => Promise<void>;
  onRevokeCustomPerm: (staffId: string, grantId: string) => Promise<void>;
  onToggleStatus: (staff: StaffAccount) => Promise<void>;
  onPreviewPermissions: (staffId: string) => Promise<any>;
  submittingAction: boolean;
  searchQuery: string;
}

export function StaffManagementView({
  staffDirectory,
  currentUser,
  allStaffRoles,
  grantablePermissions,
  can,
  isSuperAdmin = false,
  onInviteStaff,
  onUpdateRoles,
  onGrantCustomPerm,
  onRevokeCustomPerm,
  onToggleStatus,
  onPreviewPermissions,
  submittingAction,
  searchQuery,
}: StaffManagementViewProps) {
  // Modal states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoles, setInviteRoles] = useState<StaffRole[]>(['VERIFICATION_OFFICER']);

  const [selectedStaffForRole, setSelectedStaffForRole] = useState<StaffAccount | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoles, setEditingRoles] = useState<StaffRole[]>([]);

  const [selectedStaffForGrant, setSelectedStaffForGrant] = useState<StaffAccount | null>(null);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantPerm, setGrantPerm] = useState<AdminPermission>('documents.view_sensitive');
  const [grantReason, setGrantReason] = useState('');
  const [grantDuration, setGrantDuration] = useState('48');

  const [selectedStaffForPreview, setSelectedStaffForPreview] = useState<StaffAccount | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);

  // Filter staff directory
  const filteredStaff = staffDirectory.filter((st) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return st.name.toLowerCase().includes(q) || st.email.toLowerCase().includes(q);
  });

  const handleOpenRoleModal = (st: StaffAccount) => {
    setSelectedStaffForRole(st);
    setEditingRoles([...st.roles]);
    setIsRoleModalOpen(true);
  };

  const handleOpenGrantModal = (st: StaffAccount) => {
    setSelectedStaffForGrant(st);
    setGrantPerm('documents.view_sensitive');
    setGrantReason('');
    setGrantDuration('48');
    setIsGrantModalOpen(true);
  };

  const handleOpenPreviewModal = async (st: StaffAccount) => {
    setSelectedStaffForPreview(st);
    const res = await onPreviewPermissions(st.id);
    if (res?.success) {
      setPreviewResult(res.preview);
      setIsPreviewModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 font-headline">
                  Staff &amp; RBAC Access Matrix
                </CardTitle>
                <Badge className="bg-cyan-600 text-white font-bold text-[10px] px-2 py-0.5">
                  Phase 4 Delegated Ceilings
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Manage operational staff accounts, predefined role assignments, and controlled expiring custom permissions.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {can('admin.staff.invite') && (
                <Button
                  size="sm"
                  onClick={() => setIsInviteOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold text-white shadow-xs h-9"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                  Onboard Staff Member
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredStaff.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Staff Accounts Found</p>
              <p className="text-xs text-slate-400 mt-0.5">Use the onboarding button above to assign operational duties.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStaff.map((st) => {
                const activeGrants = (st.customGrants || []).filter(
                  (g: any) => g.status === 'ACTIVE' && new Date(g.expiresAt) > new Date()
                );

                return (
                  <div
                    key={st.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{st.name}</span>
                        <span className="text-xs text-slate-500 font-mono">({st.email})</span>
                        <Badge
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            st.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : st.status === 'SUSPENDED'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {st.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] font-semibold text-slate-400 mr-1">Roles:</span>
                        {st.roles.map((r) => {
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
                        {activeGrants.length > 0 && (
                          <Badge className="text-[9px] bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                            {activeGrants.length} Custom Grant{activeGrants.length > 1 ? 's' : ''} Active
                          </Badge>
                        )}
                      </div>

                      {st.scope?.scopeType && st.scope.scopeType !== 'GLOBAL' && (
                        <p className="text-[11px] text-slate-500">
                          Scope: <strong className="text-slate-700">{st.scope.scopeType}</strong>{' '}
                          {st.scope.region ? `(${st.scope.region})` : ''}
                        </p>
                      )}
                    </div>

                    {(() => {
                      const isTargetSuperAdmin = st.roles.includes('SUPER_ADMIN');
                      const canEditThisStaff = isSuperAdmin || (!isTargetSuperAdmin && can('admin.staff.update_role'));
                      const canDeactivateThisStaff = (isSuperAdmin || (!isTargetSuperAdmin && can('admin.staff.deactivate'))) && st.id !== currentUser?.id;

                      return (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPreviewModal(st)}
                            className="h-8 text-xs font-semibold rounded-xl"
                          >
                            <Key className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            Effective Perms
                          </Button>

                          {isTargetSuperAdmin && !isSuperAdmin && (
                            <Badge variant="outline" className="text-[10px] font-bold text-red-700 bg-red-50 border-red-200 py-1 px-2 rounded-lg flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Protected Super Admin
                            </Badge>
                          )}

                          {canEditThisStaff && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRoleModal(st)}
                              className="h-8 text-xs font-semibold rounded-xl"
                            >
                              Edit Roles
                            </Button>
                          )}

                          {canEditThisStaff && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenGrantModal(st)}
                              className="h-8 text-xs font-semibold rounded-xl text-purple-700 border-purple-200 hover:bg-purple-50"
                            >
                              Grant Perm
                            </Button>
                          )}

                          {canDeactivateThisStaff && (
                            <Button
                              size="sm"
                              variant={st.status === 'SUSPENDED' ? 'outline' : 'destructive'}
                              onClick={() => onToggleStatus(st)}
                              disabled={submittingAction}
                              className="h-8 text-xs font-bold rounded-xl"
                            >
                              {st.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- MODAL 1: ONBOARD STAFF MEMBER --- */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900">
              Onboard Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provision a new operational staff account with predefined role boundaries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Staff Full Name *</Label>
              <Input
                placeholder="e.g. Babatunde Alabi"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Staff Corporate Email *</Label>
              <Input
                type="email"
                placeholder="e.g. babatunde.vo@prophunta.ai"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-slate-800">Assign Operational Roles *</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {allStaffRoles
                  .filter((r) => isSuperAdmin || r.role !== 'SUPER_ADMIN')
                  .map((r) => {
                  const isChecked = inviteRoles.includes(r.role);
                  return (
                    <label
                      key={r.role}
                      className="flex items-center space-x-2 p-1.5 rounded hover:bg-white cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setInviteRoles((prev) => [...prev, r.role]);
                          } else {
                            setInviteRoles((prev) => prev.filter((item) => item !== r.role));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 text-[11px]">{r.label}</span>
                        <p className="text-[10px] text-slate-400">{r.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsInviteOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await onInviteStaff(inviteName, inviteEmail, inviteRoles);
                setIsInviteOpen(false);
                setInviteName('');
                setInviteEmail('');
                setInviteRoles(['VERIFICATION_OFFICER']);
              }}
              disabled={!inviteName.trim() || !inviteEmail.trim() || inviteRoles.length === 0 || submittingAction}
              className="rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
            >
              Provision Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: MANAGE STAFF ROLES --- */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900">
              Manage Roles: {selectedStaffForRole?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update assigned RBAC roles subject to your administrative delegation ceilings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-xs space-y-1.5">
            <div className="space-y-1 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {allStaffRoles
                .filter((r) => isSuperAdmin || r.role !== 'SUPER_ADMIN')
                .map((r) => {
                const isChecked = editingRoles.includes(r.role);
                return (
                  <label
                    key={r.role}
                    className="flex items-center space-x-2 p-1.5 rounded hover:bg-white cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditingRoles((prev) => [...prev, r.role]);
                        } else {
                          setEditingRoles((prev) => prev.filter((item) => item !== r.role));
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-[11px]">{r.label}</span>
                      <p className="text-[10px] text-slate-400">{r.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRoleModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                if (selectedStaffForRole) {
                  await onUpdateRoles(selectedStaffForRole.id, editingRoles);
                  setIsRoleModalOpen(false);
                }
              }}
              disabled={editingRoles.length === 0 || submittingAction}
              className="rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
            >
              Save Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 3: ISSUE EXPIRING CUSTOM GRANT --- */}
      <Dialog open={isGrantModalOpen} onOpenChange={setIsGrantModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-purple-600" />
              Issue Expiring Custom Grant
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Issue an isolated privilege augmentation to {selectedStaffForGrant?.name} with mandatory audit justification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Target Permission</Label>
              <Select value={grantPerm} onValueChange={(v: any) => setGrantPerm(v)}>
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {grantablePermissions.map((gp) => (
                    <SelectItem key={gp.perm} value={gp.perm} className="text-xs">
                      {gp.label} ({gp.perm})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Validity Duration (Hours)</Label>
              <Select value={grantDuration} onValueChange={setGrantDuration}>
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 Hours (Emergency Investigation)</SelectItem>
                  <SelectItem value="24">24 Hours (Standard Shift)</SelectItem>
                  <SelectItem value="48">48 Hours (Weekend Audit)</SelectItem>
                  <SelectItem value="168">7 Days (Temporary Coverage)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Mandatory Justification *</Label>
              <Input
                placeholder="e.g. Special Title Audit for High-Value Lekki Waterfront Asset"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsGrantModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                if (selectedStaffForGrant) {
                  await onGrantCustomPerm(selectedStaffForGrant.id, grantPerm, grantReason, grantDuration);
                  setIsGrantModalOpen(false);
                }
              }}
              disabled={!grantReason.trim() || submittingAction}
              className="rounded-xl text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white"
            >
              Issue Custom Grant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 4: EFFECTIVE PERMISSIONS PREVIEW --- */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-slate-900 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-600" />
              Effective Permissions: {selectedStaffForPreview?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Evaluated runtime capability set combining role hierarchy and active custom grants.
            </DialogDescription>
          </DialogHeader>
          {previewResult && (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-600">Total Effective Permissions:</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">
                  {previewResult.effectivePermissions?.length || 0} / 32
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2.5">
                {(previewResult.effectivePermissions || []).map((p: string) => (
                  <div key={p} className="flex items-center gap-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsPreviewModalOpen(false)} className="rounded-xl text-xs">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
