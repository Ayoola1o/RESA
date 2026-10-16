'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Eye,
  FileText,
  BadgeAlert,
  Lock,
  Unlock,
  Building2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Property, ListingReport, AdminPermission } from '@/types/prophunta';
import { formatCurrency } from '@/lib/utils';

interface PropertyModerationViewProps {
  properties: Property[];
  reports: ListingReport[];
  can: (perm: AdminPermission) => boolean;
  onOpenReviewDialog: (prop: Property) => void;
  onOpenDocsDialog: (prop: Property) => void;
  onSuspendProperty: (propertyId: string) => Promise<void>;
  onRestoreProperty: (propertyId: string) => Promise<void>;
  onSwitchToReports: () => void;
  submittingAction: boolean;
  searchQuery: string;
}

export function PropertyModerationView({
  properties,
  reports,
  can,
  onOpenReviewDialog,
  onOpenDocsDialog,
  onSuspendProperty,
  onRestoreProperty,
  onSwitchToReports,
  submittingAction,
  searchQuery,
}: PropertyModerationViewProps) {
  const getReportsForProperty = (propId: string) => {
    return reports.filter((r) => r.propertyId === propId && r.status !== 'RESOLVED' && r.status !== 'DISMISSED');
  };

  const filteredProperties = properties.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = p.title.toLowerCase().includes(q);
    const matchesAddress = (p.address || '').toLowerCase().includes(q);
    const matchesCity = (p.city || '').toLowerCase().includes(q);
    const matchesId = p.id.toLowerCase().includes(q);
    return matchesTitle || matchesAddress || matchesCity || matchesId;
  });

  return (
    <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-slate-900 font-headline">
                Property Moderation &amp; Lifecycle
              </CardTitle>
              <Badge className="bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5">
                Phase 13 Moderation
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Inspect platform listings, audit title documentation, review user incident reports, and suspend non-compliant properties.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-bold text-slate-700 bg-slate-50 border-slate-200">
            {properties.length} Total Inventory
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {filteredProperties.map((p) => {
            const propReports = getReportsForProperty(p.id);

            return (
              <div
                key={p.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate max-w-sm" title={p.title}>
                      {p.title}
                    </h4>
                    <Badge variant="outline" className="text-[10px] font-mono text-slate-500">
                      {p.id}
                    </Badge>
                    <Badge
                      className={`text-[10px] font-bold ${
                        p.listingStatus === 'VERIFIED' || p.listingStatus === 'ACTIVE'
                          ? 'bg-emerald-600 text-white'
                          : p.listingStatus === 'UNDER_REVIEW' || p.listingStatus === 'SUBMITTED'
                          ? 'bg-amber-500 text-white'
                          : p.listingStatus === 'CHANGES_REQUIRED'
                          ? 'bg-orange-500 text-white'
                          : p.listingStatus === 'RESERVED'
                          ? 'bg-purple-600 text-white'
                          : p.listingStatus === 'OCCUPIED'
                          ? 'bg-slate-700 text-white'
                          : p.listingStatus === 'SOLD'
                          ? 'bg-slate-800 text-white'
                          : p.listingStatus === 'SUSPENDED' || p.listingStatus === 'REJECTED'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-600 text-white'
                      }`}
                    >
                      {p.listingStatus}
                    </Badge>
                    {propReports.length > 0 && (
                      <Badge variant="destructive" className="text-[10px] font-bold animate-pulse">
                        {propReports.length} Active Flag{propReports.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{p.area}, {p.city}</span>
                    <span className="text-slate-300">•</span>
                    <strong className="text-slate-900 tabular-nums">
                      {formatCurrency(p.price, p.listingType === 'RENT' ? 'For Rent' : 'For Sale')}
                    </strong>
                    <span className="text-slate-300">•</span>
                    <span>{p.bedrooms} Beds, {p.bathrooms} Baths</span>
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>Docs Attached: <strong>{p.documents?.length || 0}</strong></span>
                    <span>Open Reports: <strong>{propReports.length}</strong></span>
                    <span>Created: {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild className="h-8 text-xs rounded-xl">
                    <Link href={`/property/${p.id}`} target="_blank">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Public View
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenDocsDialog(p)}
                    className="h-8 text-xs font-semibold rounded-xl text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Documents ({p.documents?.length || 0})
                  </Button>

                  {propReports.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSwitchToReports}
                      className="h-8 text-xs font-bold rounded-xl text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      <BadgeAlert className="h-3.5 w-3.5 mr-1 text-rose-600" />
                      Flags ({propReports.length})
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenReviewDialog(p)}
                    className="h-8 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200"
                  >
                    Checklist
                  </Button>

                  {p.listingStatus === 'SUSPENDED' ? (
                    <Button
                      size="sm"
                      onClick={() => onRestoreProperty(p.id)}
                      disabled={submittingAction}
                      className="h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Restore Listing
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onSuspendProperty(p.id)}
                      disabled={submittingAction}
                      className="h-8 text-xs font-bold rounded-xl"
                    >
                      Suspend Listing
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
