'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building,
  PlusCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Percent,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  Users,
  Eye,
  Edit,
  ArrowRight,
  Filter,
  History,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatNaira, formatCurrency } from '@/lib/utils';
import {
  Property,
  InspectionRequest,
  Application,
  PropertyEnquiry,
  ListingStatus,
  AvailabilityStatus,
  InspectionStatus,
  ApplicationStatus,
} from '@/types/prophunta';
import {
  updateInspectionStatusAction,
  updateApplicationStatusAction,
  transitionPropertyStatusAction,
  getAgentActivityForOwnerAction,
} from '@/server/actions/prophunta-actions';
import { useToast } from '@/hooks/use-toast';

interface OwnerDashboardProps {
  properties: Property[];
  inspections: InspectionRequest[];
  applications: Application[];
  enquiries: PropertyEnquiry[];
  userName: string;
}

export default function OwnerDashboard({
  properties: initialProperties,
  inspections: initialInspections,
  applications: initialApplications,
  enquiries,
  userName,
}: OwnerDashboardProps) {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [inspections, setInspections] = useState<InspectionRequest[]>(initialInspections);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Verification detail modal
  const [selectedVerificationProp, setSelectedVerificationProp] = useState<Property | null>(null);

  // Agent activity history
  const [agentActivities, setAgentActivities] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    getAgentActivityForOwnerAction().then((res) => {
      if (mounted && res.success && res.activities) {
        setAgentActivities(res.activities.activities || []);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Status transitions
  const handleTransitionStatus = async (propertyId: string, newStatus: ListingStatus) => {
    setActionLoadingId(propertyId);
    const res = await transitionPropertyStatusAction(propertyId, newStatus);
    setActionLoadingId(null);
    if (res.success && res.property) {
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? res.property! : p)));
      toast({
        title: 'Listing Status Updated',
        description: `Property status transitioned to ${newStatus}.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Status Update Failed',
        description: res.error || 'Could not transition status.',
      });
    }
  };

  // Inspection confirmation / cancellation
  const handleConfirmInspection = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateInspectionStatusAction(id, 'SCHEDULED', 'Confirmed by property owner');
    setActionLoadingId(null);
    if (res.success) {
      toast({ title: 'Inspection Confirmed', description: 'The inspection slot is now locked.' });
      setInspections((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'SCHEDULED' as InspectionStatus } : i))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update.' });
    }
  };

  const handleCancelInspection = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateInspectionStatusAction(id, 'CANCELLED', 'Declined by property owner');
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

  // Application review
  const handleApproveApplication = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateApplicationStatusAction(id, 'APPROVED', 'Approved by owner');
    setActionLoadingId(null);
    if (res.success) {
      toast({ title: 'Application Approved', description: 'Candidate application marked APPROVED.' });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED' as ApplicationStatus } : a))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to approve.' });
    }
  };

  const handleDeclineApplication = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateApplicationStatusAction(id, 'REJECTED', 'Declined by owner');
    setActionLoadingId(null);
    if (res.success) {
      toast({ title: 'Application Declined', description: 'Application marked REJECTED.' });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'REJECTED' as ApplicationStatus } : a))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to decline.' });
    }
  };

  // Occupancy metrics calculations
  const totalUnits = properties.length;
  const availableUnits = properties.filter(
    (p) => p.availabilityStatus === 'AVAILABLE' || p.listingStatus === 'ACTIVE'
  ).length;
  const occupiedUnits = properties.filter(
    (p) => p.availabilityStatus === 'OCCUPIED' || p.listingStatus === 'OCCUPIED'
  ).length;
  const reservedUnits = properties.filter(
    (p) => p.availabilityStatus === 'UNDER_OFFER' || p.listingStatus === 'RESERVED'
  ).length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const totalPortfolioValue = properties.reduce((acc, curr) => acc + (curr.price || 0), 0);

  // Filtered properties
  const filteredProperties = properties.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.listingStatus === statusFilter;
  });

  const pendingInspections = inspections.filter((i) => i.status === 'REQUESTED');
  const pendingApplications = applications.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c140d] via-slate-900 to-[#142316] p-5 sm:p-7 text-white border border-lime-900/40 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-lime-500/20 text-lime-300 border border-lime-400/30 text-[11px] font-bold mb-2.5">
              <Building className="h-3.5 w-3.5 text-lime-400" />
              Property Owner & Asset Management
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Landlord Command Center, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Manage your property portfolio, track title verification status, approve inspection bookings, and review tenant expressions of interest with audit transparency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild className="bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-950/40 gap-1.5 h-9 px-3.5">
              <Link href="/landlord/add-property">
                <PlusCircle className="h-4 w-4" />
                Add New Property
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs h-9 px-3.5">
              <Link href="/profile?tab=properties">
                <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                Manage Documents
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Portfolio Occupancy & Availability KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-lime-50 text-lime-800 flex items-center justify-center font-bold">
              <Building className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portfolio</span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalUnits}</div>
            <span className="text-[11px] text-slate-500 font-medium">Total Listed</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Percent className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Occupancy</span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{occupancyRate}%</div>
            <span className="text-[11px] text-slate-500 font-medium">
              {occupiedUnits} Occupied &bull; {availableUnits} Vacant
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending</span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{pendingInspections.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Inspections to Confirm</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-lime-50 text-lime-800 flex items-center justify-center font-bold">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-bold text-lime-700 uppercase tracking-wider">Offers</span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{pendingApplications.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Pending Applications</span>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Asset Value</span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {formatNaira(totalPortfolioValue)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Portfolio Valuation</span>
          </div>
        </div>
      </div>

      {/* 3. Action Items: Inspection Requests & Incoming Applications */}
      {(pendingInspections.length > 0 || pendingApplications.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incoming Inspection Requests */}
          <Card className="border-amber-200 bg-amber-50/30 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-amber-950 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Incoming Inspection Requests ({pendingInspections.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-amber-800">
                    Seekers awaiting your slot confirmation.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {pendingInspections.slice(0, 3).map((insp) => (
                <div
                  key={insp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-amber-200 shadow-2xs text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{insp.propertyTitle}</p>
                    <div className="flex flex-wrap items-center gap-3 text-slate-600 mt-1">
                      <span>Seeker: <strong>{insp.seekerName}</strong> ({insp.seekerPhone})</span>
                      <span>Slot: <strong>{insp.preferredDate}</strong> ({insp.preferredTimeSlot})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1"
                      disabled={actionLoadingId === insp.id}
                      onClick={() => handleConfirmInspection(insp.id)}
                    >
                      <Check className="h-3.5 w-3.5" /> Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 border-red-200 text-xs h-8"
                      disabled={actionLoadingId === insp.id}
                      onClick={() => handleCancelInspection(insp.id)}
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Incoming Expressions of Interest / Applications */}
          <Card className="border-lime-200 bg-lime-50/20 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-lime-700" />
                    Incoming Applications & Offers ({pendingApplications.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Expressions of interest from prospective tenants & buyers.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {pendingApplications.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-lime-200 shadow-2xs text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{app.propertyTitle}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {app.type === 'RENTAL' ? 'Rental App' : 'Offer'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-600 mt-1">
                      <span>Applicant: <strong>{app.applicantName}</strong></span>
                      {app.offerAmount && (
                        <span className="font-bold text-slate-900">
                          Offer: {formatNaira(app.offerAmount)}
                        </span>
                      )}
                      {app.moveInDate && <span>Move-in: {app.moveInDate}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      disabled={actionLoadingId === app.id}
                      onClick={() => handleApproveApplication(app.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 border-red-200 text-xs h-8"
                      disabled={actionLoadingId === app.id}
                      onClick={() => handleDeclineApplication(app.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Properties Portfolio & Listing / Verification Status Table */}
      <Card className="border border-slate-200/90 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-lime-700" />
                Portfolio Listings, Verification & Occupancy
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Manage listing status, view granular verification audit checklist, and update occupancy availability.
              </CardDescription>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {['ALL', 'ACTIVE', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'DRAFT', 'OCCUPIED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12 border-dashed border rounded-2xl bg-slate-50/50">
              <Building className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No properties in this status</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add a new property to get title verification and unlock verified tenants.
              </p>
              <Button asChild size="sm" className="mt-4 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs">
                <Link href="/landlord/add-property">Add New Listing</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProperties.map((prop) => {
                const ver = prop.verification;
                const isVerified = prop.listingStatus === 'VERIFIED' || ver?.overallStatus === 'PASSED';
                const hasChangesRequired =
                  prop.listingStatus === 'CHANGES_REQUIRED' || ver?.overallStatus === 'CHANGES_REQUIRED';

                return (
                  <div
                    key={prop.id}
                    className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* Left: Property Info */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative h-16 w-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <Image
                          src={
                            prop.media?.[0]?.url ||
                            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={prop.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/property/${prop.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-lime-700 transition"
                          >
                            {prop.title}
                          </Link>
                          {/* Listing Status Badge */}
                          <Badge
                            className={
                              prop.listingStatus === 'ACTIVE'
                                ? 'bg-lime-700 text-white text-[10px]'
                                : prop.listingStatus === 'VERIFIED'
                                ? 'bg-slate-900 text-white text-[10px]'
                                : prop.listingStatus === 'SUBMITTED' || prop.listingStatus === 'UNDER_REVIEW'
                                ? 'bg-sky-600 text-white text-[10px]'
                                : prop.listingStatus === 'CHANGES_REQUIRED'
                                ? 'bg-amber-600 text-white text-[10px]'
                                : prop.listingStatus === 'OCCUPIED'
                                ? 'bg-purple-600 text-white text-[10px]'
                                : 'bg-slate-500 text-white text-[10px]'
                            }
                          >
                            {prop.listingStatus}
                          </Badge>

                          {/* Availability Badge */}
                          <Badge variant="outline" className="text-[10px]">
                            {prop.availabilityStatus}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>{prop.address}, {prop.city}</span>
                          <span>&bull;</span>
                          <span className="font-semibold text-slate-900">{formatNaira(prop.price)}</span>
                          <span>&bull;</span>
                          <span>{prop.bedrooms} Bed &bull; {prop.bathrooms} Bath</span>
                        </div>

                        {/* Granular Verification Summary Indicator */}
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedVerificationProp(prop)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-lime-50 text-slate-700 hover:text-lime-800 font-medium transition text-[11px] border border-slate-200"
                          >
                            <ShieldCheck className="h-3 w-3 text-lime-700" />
                            <span>Verification: <strong>{ver?.overallStatus || 'PENDING'}</strong></span>
                            <Eye className="h-3 w-3 ml-0.5 text-slate-400" />
                          </button>

                          {hasChangesRequired && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <AlertTriangle className="h-3 w-3 text-amber-600" /> Changes Requested
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Transition Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs h-8">
                            Status Controls &darr;
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          {prop.listingStatus === 'DRAFT' && (
                            <DropdownMenuItem onClick={() => handleTransitionStatus(prop.id, 'SUBMITTED')}>
                              Submit for Compliance Review
                            </DropdownMenuItem>
                          )}
                          {prop.listingStatus === 'VERIFIED' && (
                            <DropdownMenuItem onClick={() => handleTransitionStatus(prop.id, 'ACTIVE')}>
                              Publish as Active Marketplace Listing
                            </DropdownMenuItem>
                          )}
                          {prop.listingStatus === 'ACTIVE' && (
                            <>
                              <DropdownMenuItem onClick={() => handleTransitionStatus(prop.id, 'RESERVED')}>
                                Mark as Reserved / Under Offer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTransitionStatus(prop.id, 'OCCUPIED')}>
                                Mark as Occupied / Leased
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTransitionStatus(prop.id, 'SOLD')}>
                                Mark as Sold
                              </DropdownMenuItem>
                            </>
                          )}
                          {(prop.listingStatus === 'RESERVED' || prop.listingStatus === 'OCCUPIED') && (
                            <DropdownMenuItem onClick={() => handleTransitionStatus(prop.id, 'ACTIVE')}>
                              Re-activate Listing (Vacant)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button asChild variant="ghost" size="sm" className="text-xs h-8 px-2.5">
                        <Link href={`/property/${prop.id}`}>
                          View Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Inbound Enquiries Section */}
      <Card className="border border-slate-200/90 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                Seeker Enquiries on Your Properties ({enquiries.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Direct questions from serious seekers tied directly to your listings.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs h-8">
              <Link href="/messages">View Messages</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {enquiries.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No active enquiries yet. As seekers browse your verified listings, their questions will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enquiries.slice(0, 4).map((enq) => (
                <Link
                  key={enq.id}
                  href={`/messages/${enq.id}`}
                  className="block p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 transition text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600">
                      {enq.propertyTitle}
                    </span>
                    {enq.unreadCountForHost > 0 && (
                      <Badge className="bg-indigo-600 text-white text-[10px]">
                        {enq.unreadCountForHost} new
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-1 italic">
                    &ldquo;{enq.lastMessageText}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>From: <strong>{enq.seekerName}</strong></span>
                    <span>{new Date(enq.lastMessageAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Authorized Agent Activity & Property-Management History */}
      <Card className="border border-slate-200/90 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-600" />
                Authorized Agent Activity & Property-Management History
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Audited timeline of actions performed by your authorized agents, mandate status, and property mutations.
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              {agentActivities.length} {agentActivities.length === 1 ? 'event' : 'events'} logged
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {agentActivities.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No agent actions recorded yet</p>
              <p className="mt-1 max-w-sm mx-auto text-slate-400">
                Mandates granted to verified agents, inspection schedules, and property mutations will appear here with full immutable audit timestamps.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{act.title}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] py-0 px-1.5 h-4 ${
                          act.type === 'RELATIONSHIP_UPDATE'
                            ? 'bg-lime-50 text-lime-800 border-lime-200'
                            : act.type === 'INSPECTION'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : act.type === 'ENQUIRY'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {act.type}
                      </Badge>
                    </div>
                    <p className="text-slate-600">{act.description}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    {new Date(act.timestamp).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Checklist Details Dialog */}
      {selectedVerificationProp && (
        <Dialog open={!!selectedVerificationProp} onOpenChange={() => setSelectedVerificationProp(null)}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-5 w-5 text-lime-600" />
                6-Point Verification Audit Status
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {selectedVerificationProp.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border">
                  <span className="text-slate-500 block text-[11px]">Owner Identity:</span>
                  <Badge className="mt-1 text-[10px] bg-slate-800 text-white">
                    {selectedVerificationProp.verification?.ownerIdentityStatus || 'PENDING'}
                  </Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border">
                  <span className="text-slate-500 block text-[11px]">Property Location:</span>
                  <Badge className="mt-1 text-[10px] bg-slate-800 text-white">
                    {selectedVerificationProp.verification?.locationStatus || 'PENDING'}
                  </Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border">
                  <span className="text-slate-500 block text-[11px]">Title & Authority Docs:</span>
                  <Badge className="mt-1 text-[10px] bg-slate-800 text-white">
                    {selectedVerificationProp.verification?.authorityDocumentStatus || 'PENDING'}
                  </Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border">
                  <span className="text-slate-500 block text-[11px]">Availability Status:</span>
                  <Badge className="mt-1 text-[10px] bg-slate-800 text-white">
                    {selectedVerificationProp.verification?.availabilityStatus || 'PENDING'}
                  </Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border">
                  <span className="text-slate-500 block text-[11px]">Media Inspection:</span>
                  <Badge className="mt-1 text-[10px] bg-slate-800 text-white">
                    {selectedVerificationProp.verification?.mediaStatus || 'PENDING'}
                  </Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border">
                  <span className="text-slate-500 block text-[11px]">Physical Inspection:</span>
                  <Badge className="mt-1 text-[10px] bg-slate-800 text-white">
                    {selectedVerificationProp.verification?.inspectionStatus || 'PENDING'}
                  </Badge>
                </div>
              </div>

              {selectedVerificationProp.verification?.reviewNotes && (
                <div className="p-3 rounded-xl bg-lime-50/80 border border-lime-200 text-lime-950">
                  <p className="font-bold mb-1">Compliance Officer Notes:</p>
                  <p>{selectedVerificationProp.verification.reviewNotes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button asChild className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs">
                <Link href={`/property/${selectedVerificationProp.id}`}>Open Property Page</Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
