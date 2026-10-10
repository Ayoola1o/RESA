'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Building,
  PlusCircle,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  MessageSquare,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Phone,
  Mail,
  UserCheck,
  Check,
  X,
  Eye,
  ArrowRight,
  FileSignature,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatNaira, formatCurrency } from '@/lib/utils';
import {
  Property,
  InspectionRequest,
  Application,
  PropertyEnquiry,
  InspectionStatus,
} from '@/types/prophunta';
import { updateInspectionStatusAction } from '@/server/actions/prophunta-actions';
import { useToast } from '@/hooks/use-toast';

interface AgentDashboardProps {
  properties: Property[];
  inspections: InspectionRequest[];
  applications: Application[];
  enquiries: PropertyEnquiry[];
  userName: string;
}

// Sample representations representing landlord-agent relationships
interface PropertyRelationship {
  id: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  propertyTitle: string;
  propertyId: string;
  mandateType: 'Exclusive Agency' | 'Joint Mandate' | 'Facility Management';
  commissionRate: string;
  status: 'ACTIVE' | 'PENDING_DOCUMENTATION' | 'EXPIRED';
  expiryDate: string;
}

const DEFAULT_RELATIONSHIPS: PropertyRelationship[] = [
  {
    id: 'rel_1',
    landlordName: 'Chief Adebayo Alabi',
    landlordPhone: '+234 803 234 5678',
    landlordEmail: 'adebayo.alabi@investment.ng',
    propertyTitle: 'Luxury 4-Bedroom Semi-Detached Duplex',
    propertyId: 'prop_lekki_001',
    mandateType: 'Exclusive Agency',
    commissionRate: '10% Legal & Agency',
    status: 'ACTIVE',
    expiryDate: '15 Dec 2026',
  },
  {
    id: 'rel_2',
    landlordName: 'Engr. Emeka Okonkwo',
    landlordPhone: '+234 802 888 1234',
    landlordEmail: 'emeka.okonkwo@holding.ng',
    propertyTitle: 'Modern Serviced 2-Bedroom Apartment',
    propertyId: 'prop_ikoyi_002',
    mandateType: 'Facility Management',
    commissionRate: '10% Annual Management',
    status: 'ACTIVE',
    expiryDate: '30 Oct 2026',
  },
  {
    id: 'rel_3',
    landlordName: 'Dr. (Mrs) Amina Bello',
    landlordPhone: '+234 809 555 9012',
    landlordEmail: 'amina.bello@abuja.ng',
    propertyTitle: 'Contemporary 3-Bedroom Penthouse',
    propertyId: 'prop_vi_003',
    mandateType: 'Joint Mandate',
    commissionRate: '5% Sales Commission',
    status: 'PENDING_DOCUMENTATION',
    expiryDate: '20 Nov 2026',
  },
];

export default function AgentDashboard({
  properties,
  inspections: initialInspections,
  applications,
  enquiries,
  userName,
}: AgentDashboardProps) {
  const { toast } = useToast();
  const [inspections, setInspections] = useState<InspectionRequest[]>(initialInspections);
  const [relationships, setRelationships] = useState<PropertyRelationship[]>(DEFAULT_RELATIONSHIPS);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<PropertyRelationship | null>(null);

  // Verification pipeline stats
  const submittedListings = properties.filter(
    (p) => p.listingStatus === 'SUBMITTED' || p.listingStatus === 'UNDER_REVIEW'
  );
  const changesRequiredListings = properties.filter(
    (p) => p.listingStatus === 'CHANGES_REQUIRED' || p.verification?.overallStatus === 'CHANGES_REQUIRED'
  );
  const verifiedListings = properties.filter(
    (p) => p.listingStatus === 'VERIFIED' || p.listingStatus === 'ACTIVE'
  );
  const draftListings = properties.filter((p) => p.listingStatus === 'DRAFT');

  const upcomingInspections = inspections.filter(
    (i) => i.status === 'SCHEDULED' || i.status === 'REQUESTED'
  );

  const handleConfirmInspection = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateInspectionStatusAction(id, 'SCHEDULED', 'Confirmed by managing agent');
    setActionLoadingId(null);
    if (res.success) {
      toast({ title: 'Inspection Confirmed', description: 'Field walkthrough locked on your calendar.' });
      setInspections((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'SCHEDULED' as InspectionStatus } : i))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update.' });
    }
  };

  const handleDeclineInspection = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateInspectionStatusAction(id, 'CANCELLED', 'Declined by managing agent');
    setActionLoadingId(null);
    if (res.success) {
      toast({ title: 'Inspection Cancelled', description: 'Inspection status updated to CANCELLED.' });
      setInspections((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'CANCELLED' as InspectionStatus } : i))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to cancel.' });
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c140d] via-slate-900 to-[#142316] p-5 sm:p-7 text-white border border-lime-900/40 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-lime-500/20 text-lime-300 border border-lime-400/30 text-[11px] font-bold mb-2.5">
              <Briefcase className="h-3.5 w-3.5 text-lime-400" />
              Verified Agent & Property Manager Suite
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Agent Workspace, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Coordinate managed client portfolios, track verification queues for landlord submissions, schedule physical showings, and govern agency relationships.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild className="bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-950/40 gap-1.5 h-9 px-3.5">
              <Link href="/landlord/add-property">
                <PlusCircle className="h-4 w-4" />
                Submit Client Listing
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs h-9 px-3.5">
              <Link href="/messages">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Seeker Inquiries ({enquiries.length})
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-lime-50 text-lime-800 flex items-center justify-center font-bold">
              <Building className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portfolio</span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{properties.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Managed Properties</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Verification</span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{submittedListings.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">In Audit Queue</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Showings</span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{upcomingInspections.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Field Inspections</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <FileSignature className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mandates</span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{relationships.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Landlord Mandates</span>
          </div>
        </div>
      </div>

      {/* 3. Verification Queue Status Alert & Tracker */}
      <Card className="border border-slate-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                Submitted Listings & Verification Queue Status
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Track compliance pipeline status for your client listings (Draft &rarr; Submitted &rarr; In Review &rarr; Verified).
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 self-start sm:self-auto">
              {verifiedListings.length} Active Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Progress Breakdown Bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Drafts</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{draftListings.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
              <span className="text-[11px] text-sky-700 font-medium">In Verification Queue</span>
              <p className="text-lg font-bold text-sky-950 mt-0.5">{submittedListings.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] text-amber-700 font-medium">Changes Required</span>
              <p className="text-lg font-bold text-amber-950 mt-0.5">{changesRequiredListings.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] text-emerald-700 font-medium">Verified Shield Active</span>
              <p className="text-lg font-bold text-emerald-950 mt-0.5">{verifiedListings.length}</p>
            </div>
          </div>

          {/* Listing Rows */}
          <div className="divide-y divide-slate-100">
            {properties.slice(0, 5).map((prop) => (
              <div
                key={prop.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/property/${prop.id}`}
                      className="font-bold text-slate-900 hover:text-sky-600 line-clamp-1"
                    >
                      {prop.title}
                    </Link>
                    <Badge
                      className={
                        prop.listingStatus === 'ACTIVE'
                          ? 'bg-lime-600 text-white text-[10px] font-bold'
                          : prop.listingStatus === 'VERIFIED'
                          ? 'bg-lime-700 text-white text-[10px] font-bold'
                          : prop.listingStatus === 'SUBMITTED' || prop.listingStatus === 'UNDER_REVIEW'
                          ? 'bg-lime-500 text-slate-950 text-[10px] font-bold'
                          : prop.listingStatus === 'CHANGES_REQUIRED'
                          ? 'bg-amber-500 text-white text-[10px]'
                          : 'bg-slate-400 text-white text-[10px]'
                      }
                    >
                      {prop.listingStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 mt-1">
                    <span>{prop.address}, {prop.city}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-slate-900">{formatNaira(prop.price)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                    <Link href={`/property/${prop.id}`}>Audit Status</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Field Inspections & Client Enquiries (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Inspections */}
        <Card className="border border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Field Inspection Schedule ({inspections.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Walkthrough appointments with prospective seekers.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs h-8">
                <Link href="/profile?tab=inspections">Manage All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {inspections.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No inspections currently scheduled.
              </div>
            ) : (
              inspections.slice(0, 4).map((insp) => (
                <div
                  key={insp.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{insp.propertyTitle}</p>
                      <Badge
                        className={
                          insp.status === 'SCHEDULED' || insp.status === 'ACCEPTED'
                            ? 'bg-lime-600 text-white text-[10px] font-bold'
                            : insp.status === 'COMPLETED'
                            ? 'bg-slate-900 text-white text-[10px]'
                            : 'bg-amber-500 text-white text-[10px]'
                        }
                      >
                        {insp.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 mt-1">
                      <span>Seeker: <strong>{insp.seekerName}</strong> ({insp.seekerPhone})</span>
                      <span>Slot: <strong>{insp.preferredDate}</strong> ({insp.preferredTimeSlot})</span>
                    </div>
                  </div>

                  {insp.status === 'REQUESTED' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                        disabled={actionLoadingId === insp.id}
                        onClick={() => handleConfirmInspection(insp.id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 text-xs h-8"
                        disabled={actionLoadingId === insp.id}
                        onClick={() => handleDeclineInspection(insp.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Client Enquiries */}
        <Card className="border border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-sky-600" />
                  Client Inquiries & Leads ({enquiries.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Communications across all managed listings.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs h-8">
                <Link href="/messages">Open Inbox</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {enquiries.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active buyer or tenant inquiries.
              </div>
            ) : (
              enquiries.slice(0, 4).map((enq) => (
                <Link
                  key={enq.id}
                  href={`/messages/${enq.id}`}
                  className="block p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/30 transition text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 group-hover:text-sky-600">
                      {enq.propertyTitle}
                    </span>
                    {enq.unreadCountForHost > 0 && (
                      <Badge className="bg-sky-600 text-white text-[10px]">
                        {enq.unreadCountForHost} new
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-1 italic">
                    &ldquo;{enq.lastMessageText}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Lead: <strong>{enq.seekerName}</strong></span>
                    <span>{new Date(enq.lastMessageAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Property Relationships & Landlord Representations */}
      <Card className="border border-slate-200/90 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-indigo-600" />
                Property Relationships & Landlord Representations
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Authorizations, agency mandates, and commission agreements governed under PropHunta verification rules.
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 self-start sm:self-auto"
              onClick={() => {
                toast({
                  title: 'New Mandate Agreement',
                  description: 'Mandate registration workflow opened. Upload authorization letter and owner ID to verify authority.',
                });
              }}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Register Landlord Mandate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-slate-100">
            {relationships.map((rel) => (
              <div
                key={rel.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs group"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900 text-sm">{rel.landlordName}</p>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 font-semibold">
                      {rel.mandateType}
                    </Badge>
                    <Badge
                      className={
                        rel.status === 'ACTIVE'
                          ? 'bg-emerald-600 text-white text-[10px]'
                          : 'bg-amber-500 text-white text-[10px]'
                      }
                    >
                      {rel.status}
                    </Badge>
                  </div>
                  <p className="text-slate-600 font-medium mt-1">Property: {rel.propertyTitle}</p>
                  <div className="flex flex-wrap items-center gap-3 text-slate-500 mt-1">
                    <span>Phone: {rel.landlordPhone}</span>
                    <span>&bull;</span>
                    <span>Email: {rel.landlordEmail}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-slate-900">Terms: {rel.commissionRate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setSelectedRelationship(rel)}
                  >
                    View Mandate Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mandate Detail Modal */}
      {selectedRelationship && (
        <Dialog open={!!selectedRelationship} onOpenChange={() => setSelectedRelationship(null)}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <FileSignature className="h-5 w-5 text-indigo-600" />
                Landlord Representation Mandate
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {selectedRelationship.propertyTitle}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs text-slate-700">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Landlord / Principal:</span>
                <span className="font-semibold">{selectedRelationship.landlordName}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Contact:</span>
                <span className="font-semibold">{selectedRelationship.landlordPhone}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Mandate Type:</span>
                <Badge variant="outline">{selectedRelationship.mandateType}</Badge>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Commission / Fee:</span>
                <span className="font-bold text-slate-900">{selectedRelationship.commissionRate}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Expiry Date:</span>
                <span className="font-semibold">{selectedRelationship.expiryDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Authority Verification Shield:</p>
                <p className="text-slate-600 text-[11px]">
                  PropHunta requires signed authorization documents for any agent representing a property on behalf of a titleholder before the listing can receive the Verified Shield badge.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
