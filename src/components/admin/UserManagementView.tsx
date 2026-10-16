'use client';

import React from 'react';
import {
  Users,
  Eye,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, AdminPermission, Property } from '@/types/prophunta';

interface UserManagementViewProps {
  users: User[];
  properties: Property[];
  can: (perm: AdminPermission) => boolean;
  isSuperAdmin?: boolean;
  onInspectUser: (user: User) => void;
  onToggleStatus: (user: User) => Promise<void>;
  submittingAction: boolean;
  searchQuery: string;
}

export function UserManagementView({
  users,
  properties,
  can,
  isSuperAdmin = false,
  onInspectUser,
  onToggleStatus,
  submittingAction,
  searchQuery,
}: UserManagementViewProps) {
  const filteredUsers = users.filter((u) => {
    // SECURITY GUARDRAIL: Non-super-admins cannot view, inspect, or manage Admin/Staff accounts in User Directory
    if (!isSuperAdmin && u.role === 'ADMIN') {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesName = u.name.toLowerCase().includes(q);
    const matchesEmail = u.email.toLowerCase().includes(q);
    const matchesPhone = (u.phone || '').toLowerCase().includes(q);
    const matchesId = u.id.toLowerCase().includes(q);
    return matchesName || matchesEmail || matchesPhone || matchesId;
  });

  return (
    <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-slate-900 font-headline">
                User Management Directory
              </CardTitle>
              <Badge className="bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5">
                Phase 13 Users
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Inspect registered seekers, property owners, and authorized agents. Audit identity credentials and manage account standing.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-bold text-slate-700 bg-slate-50 border-slate-200">
            {filteredUsers.length} Platform Account{filteredUsers.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Users Found</p>
            <p className="text-xs text-slate-400 mt-0.5">No platform accounts matching the search query.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const ownedPropsCount = properties.filter(
                (p) => p.ownerId === u.id || p.authorizedAgentId === u.id
              ).length;

              return (
                <div
                  key={u.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
                      <Badge
                        className={`text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-600 text-white'
                            : u.role === 'AGENT'
                            ? 'bg-emerald-600 text-white'
                            : u.role === 'OWNER'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        {u.role}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          u.verificationStatus === 'VERIFIED'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : u.verificationStatus === 'SUSPENDED'
                            ? 'text-rose-700 bg-rose-50 border-rose-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {u.verificationStatus}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500">
                      {u.email} • {u.phone}
                      {u.agencyName ? ` • Agency: ${u.agencyName}` : ''}
                      {u.licenseNumber ? ` • Lic: ${u.licenseNumber}` : ''}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Joined: {new Date(u.createdAt).toLocaleDateString()} • ID: <span className="font-mono">{u.id}</span> •{' '}
                      <strong className="text-slate-600">{ownedPropsCount} Properties</strong>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onInspectUser(u)}
                      className="h-8 text-xs font-semibold rounded-xl text-slate-700 border-slate-200 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Inspect Profile
                    </Button>

                    {u.role !== 'ADMIN' && can('users.suspend') && (
                      <>
                        {u.verificationStatus === 'SUSPENDED' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onToggleStatus(u)}
                            disabled={submittingAction}
                            className="h-8 text-xs font-bold rounded-xl text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onToggleStatus(u)}
                            disabled={submittingAction}
                            className="h-8 text-xs font-bold rounded-xl"
                          >
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            Suspend
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
