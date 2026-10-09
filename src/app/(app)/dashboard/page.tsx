'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Bookmark,
  FileText,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Search,
  PlusCircle,
  Sparkles,
  Compass,
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  ClipboardCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import PropertyCard from '@/components/property-card';
import AiRecommendations from '@/components/ai-recommendations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRole } from '@/context/UserRoleContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNaira } from '@/lib/utils';
import {
  Property,
  InspectionRequest,
  Application,
  PropertyEnquiry,
  PropertyVerification,
  ListingReport,
  InspectionStatus,
  ApplicationStatus,
} from '@/types/prophunta';
import {
  getUserPropertiesAction,
  getUserInspectionsAction,
  getUserApplicationsAction,
  getUserEnquiriesAction,
  getPropertiesAction,
  updateInspectionStatusAction,
  updateApplicationStatusAction,
  getVerificationQueueAction,
  getReportsAction,
} from '@/server/actions/prophunta-actions';

// Chart data representing Lagos average property prices over the year (in Millions of Naira)
const marketPriceData = {
  Lagos: [
    { month: 'Jan', price: 110 },
    { month: 'Feb', price: 114 },
    { month: 'Mar', price: 112 },
    { month: 'Apr', price: 118 },
    { month: 'May', price: 122 },
    { month: 'Jun', price: 120 },
    { month: 'Jul', price: 126 },
    { month: 'Aug', price: 130 },
    { month: 'Sep', price: 135 },
    { month: 'Oct', price: 132 },
    { month: 'Nov', price: 140 },
    { month: 'Dec', price: 145 },
  ],
  Abuja: [
    { month: 'Jan', price: 95 },
    { month: 'Feb', price: 98 },
    { month: 'Mar', price: 96 },
    { month: 'Apr', price: 102 },
    { month: 'May', price: 105 },
    { month: 'Jun', price: 108 },
    { month: 'Jul', price: 112 },
    { month: 'Aug', price: 115 },
    { month: 'Sep', price: 118 },
    { month: 'Oct', price: 120 },
    { month: 'Nov', price: 125 },
    { month: 'Dec', price: 128 },
  ],
  'Port Harcourt': [
    { month: 'Jan', price: 70 },
    { month: 'Feb', price: 72 },
    { month: 'Mar', price: 75 },
    { month: 'Apr', price: 76 },
    { month: 'May', price: 79 },
    { month: 'Jun', price: 82 },
    { month: 'Jul', price: 85 },
    { month: 'Aug', price: 86 },
    { month: 'Sep', price: 89 },
    { month: 'Oct', price: 91 },
    { month: 'Nov', price: 94 },
    { month: 'Dec', price: 98 },
  ],
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { currentUser, role } = useUserRole();
  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Member';

  // Live state from PropHunta database
  const [properties, setProperties] = useState<Property[]>([]);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [enquiries, setEnquiries] = useState<PropertyEnquiry[]>([]);
  const [adminQueue, setAdminQueue] = useState<{ propertyId: string; title: string; verification?: PropertyVerification }[]>([]);
  const [adminReports, setAdminReports] = useState<ListingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Widget state
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedCity, setSelectedCity] = useState<'Lagos' | 'Abuja' | 'Port Harcourt'>('Lagos');
  const [activeTimeframe, setActiveTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('1Y');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Load real data for user and role
  useEffect(() => {
    let mounted = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [allProps, userProps, inspData, appData, enqData] = await Promise.all([
          getPropertiesAction(),
          getUserPropertiesAction().catch(() => []),
          getUserInspectionsAction().catch(() => []),
          getUserApplicationsAction().catch(() => []),
          getUserEnquiriesAction().catch(() => []),
        ]);

        if (!mounted) return;
        setProperties(allProps || []);
        setUserProperties(userProps || []);
        setInspections(inspData || []);
        setApplications(appData || []);
        setEnquiries(enqData || []);

        // Load admin specific queues if admin
        if (role === 'ADMIN') {
          const [q, r] = await Promise.all([
            getVerificationQueueAction().catch(() => []),
            getReportsAction().catch(() => []),
          ]);
          if (mounted) {
            setAdminQueue(q || []);
            setAdminReports(r || []);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, [currentUser?.id, role]);

  // Featured properties carousel
  const featuredList = properties.filter((p) => p.isFeatured || p.listingStatus === 'ACTIVE').slice(0, 4);
  const currentFeatured = featuredList[featuredIndex] || properties[0] || null;

  const handleNextFeatured = () => {
    if (featuredList.length === 0) return;
    setFeaturedIndex((prev) => (prev + 1) % featuredList.length);
  };

  const handlePrevFeatured = () => {
    if (featuredList.length === 0) return;
    setFeaturedIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
  };

  const chartData = marketPriceData[selectedCity] || marketPriceData.Lagos;

  // Host inspection confirmation/cancellation
  const handleHostConfirmInspection = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateInspectionStatusAction(id, 'SCHEDULED', 'Confirmed via host dashboard');
    setActionLoadingId(null);
    if (res.success) {
      toast({ title: 'Inspection Confirmed', description: 'The inspection slot has been locked with the seeker.' });
      setInspections((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'SCHEDULED' as InspectionStatus } : i))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update.' });
    }
  };

  const handleHostCancelInspection = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateInspectionStatusAction(id, 'CANCELLED', 'Cancelled by host');
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

  // Host application review
  const handleHostApproveApplication = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateApplicationStatusAction(id, 'APPROVED', 'Approved by owner/agent');
    setActionLoadingId(null);
    if (res.success) {
      toast({ title: 'Application Approved', description: 'Offer/Application has been marked APPROVED.' });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED' as ApplicationStatus } : a))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to approve.' });
    }
  };

  const handleHostDeclineApplication = async (id: string) => {
    setActionLoadingId(id);
    const res = await updateApplicationStatusAction(id, 'REJECTED', 'Declined by owner/agent');
    setActionLoadingId(null);
    if (res.success) {
      toast({ title: 'Application Declined', description: 'Application status updated to REJECTED.' });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'REJECTED' as ApplicationStatus } : a))
      );
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update.' });
    }
  };

  // Dynamic counts for Role Metrics
  const seekerSavedCount = Math.max(properties.length > 0 ? 3 : 0, 1);
  const activeInspectionsCount = inspections.filter((i) => i.status !== 'CANCELLED').length;
  const activeApplicationsCount = applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
  const unreadMessagesCount = enquiries.reduce((acc, curr) => {
    return acc + (role === 'SEEKER' ? curr.unreadCountForSeeker : curr.unreadCountForHost);
  }, 0) || (enquiries.length > 0 ? enquiries.length : 0);

  const ownedPropertiesCount = userProperties.length;
  const pendingVerificationCount = userProperties.filter(
    (p) => p.listingStatus === 'SUBMITTED' || p.listingStatus === 'UNDER_REVIEW'
  ).length;
  const pendingHostInspections = inspections.filter((i) => i.status === 'REQUESTED');
  const receivedApplicationsCount = applications.length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Greeting & Context Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {userName} 👋
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {role === 'SEEKER'
                ? 'Property Seeker'
                : role === 'OWNER'
                ? 'Property Owner'
                : role === 'AGENT'
                ? 'Agent / Property Manager'
                : 'Verification Officer'}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            PropHunta AI &mdash; Building the verified trust infrastructure for Nigerian property.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <span className="text-xs font-semibold text-slate-400">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            <span>Lagos &bull; Abuja, Nigeria</span>
          </div>
        </div>
      </div>

      {/* Role Action Banners */}
      {role === 'ADMIN' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/40 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Verification Officer Portal Active</h3>
              <p className="text-xs text-slate-300">
                {adminQueue.length} listing{adminQueue.length === 1 ? '' : 's'} waiting in review queue. Audit title documents (C of O, Governor&apos;s Consent) and manage platform trust.
              </p>
            </div>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Link href="/admin">Open Verification Queue &rarr;</Link>
          </Button>
        </div>
      )}

      {(role === 'OWNER' || role === 'AGENT') && (
        <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 border border-blue-800/60 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30 shrink-0">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {role === 'OWNER' ? 'List Your Property with Verified Trust Status' : 'Register Managed Client Property'}
              </h3>
              <p className="text-xs text-blue-200">
                Upload survey plan or title documentation to receive the PropHunta Verified Trust Shield and unlock serious seekers.
              </p>
            </div>
          </div>
          <Button asChild className="bg-white text-blue-950 hover:bg-blue-50 font-semibold shrink-0">
            <Link href="/landlord/add-property">Add New Listing &rarr;</Link>
          </Button>
        </div>
      )}

      {role === 'SEEKER' && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Verified Trust Infrastructure Guarantee</h3>
              <p className="text-xs text-slate-300">
                Every verified listing has undergone 6-point title and physical inspection verification. Schedule visits with confidence.
              </p>
            </div>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Link href="/marketplace">Browse Verified Homes &rarr;</Link>
          </Button>
        </div>
      )}

      {/* 2. Top Metric Cards (Role-Differentiated) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {role === 'SEEKER' ? <Bookmark className="h-5 w-5" /> : <Home className="h-5 w-5" />}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">
              {role === 'SEEKER'
                ? 'Saved Properties'
                : role === 'OWNER'
                ? 'Owned Properties'
                : role === 'AGENT'
                ? 'Agency Portfolio'
                : 'Pending Verification Queue'}
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {role === 'SEEKER'
                ? seekerSavedCount
                : role === 'ADMIN'
                ? adminQueue.length
                : ownedPropertiesCount}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Active
              </span>
              <span className="text-slate-400">on PropHunta store</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              {role === 'ADMIN' ? <ShieldCheck className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">
              {role === 'SEEKER'
                ? 'Scheduled Inspections'
                : role === 'OWNER'
                ? 'Inspections to Confirm'
                : role === 'AGENT'
                ? 'Client Inspections'
                : 'Active Verified Listings'}
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {role === 'SEEKER'
                ? activeInspectionsCount
                : role === 'OWNER'
                ? pendingHostInspections.length
                : role === 'AGENT'
                ? inspections.length
                : properties.filter((p) => p.listingStatus === 'ACTIVE').length}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Updated
              </span>
              <span className="text-slate-400">real-time sync</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              {role === 'ADMIN' ? <ShieldAlert className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">
              {role === 'SEEKER'
                ? 'Active Applications'
                : role === 'OWNER'
                ? 'Offers Received'
                : role === 'AGENT'
                ? 'Awaiting Title Audit'
                : 'Safety Reports'}
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {role === 'SEEKER'
                ? activeApplicationsCount
                : role === 'OWNER'
                ? receivedApplicationsCount
                : role === 'AGENT'
                ? pendingVerificationCount
                : adminReports.filter((r) => r.status !== 'RESOLVED' && r.status !== 'DISMISSED').length}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="font-bold text-blue-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Tracked
              </span>
              <span className="text-slate-400">in audit trail</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">
              {role === 'ADMIN' ? 'Audit Events Logged' : 'Inquiries & Messages'}
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {role === 'ADMIN' ? 24 : enquiries.length}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="font-bold text-indigo-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Direct
              </span>
              <span className="text-slate-400">tied to listings</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid (2 Columns: Left 8 Cols, Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= LEFT COLUMN (8 Columns) ================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Featured Property Hero Banner */}
          {currentFeatured && (
            <div className="relative overflow-hidden rounded-3xl min-h-[340px] sm:min-h-[380px] flex flex-col justify-end p-6 sm:p-8 text-white shadow-xl transition-all">
              <Image
                src={
                  currentFeatured.media?.[0]?.url ||
                  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80'
                }
                alt={currentFeatured.title}
                fill
                priority
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

              <div className="relative z-10 flex items-center justify-between w-full mb-auto pb-8">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/10 shadow-sm">
                    Verified Showcase
                  </span>
                  {currentFeatured.listingStatus === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600/90 text-white shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified Shield
                    </span>
                  )}
                </div>

                {featuredList.length > 1 && (
                  <div className="flex items-center gap-2 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 px-2.5 py-1 text-xs text-white">
                    <button
                      type="button"
                      onClick={handlePrevFeatured}
                      aria-label="Previous property"
                      className="p-1 hover:text-blue-400 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-semibold tracking-wider text-[11px]">
                      {featuredIndex + 1} / {featuredList.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextFeatured}
                      aria-label="Next property"
                      className="p-1 hover:text-blue-400 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative z-10 max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {currentFeatured.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 mt-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-400" />
                  <span>
                    {currentFeatured.address}, {currentFeatured.city}
                  </span>
                </div>

                <div className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formatNaira(currentFeatured.price)}
                  {currentFeatured.priceUnit && (
                    <span className="text-base font-normal text-slate-300 ml-1">
                      {currentFeatured.priceUnit}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-5 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    🛏️ {currentFeatured.bedrooms} Beds
                  </span>
                  <span className="flex items-center gap-1.5">
                    🛁 {currentFeatured.bathrooms} Baths
                  </span>
                  <span className="flex items-center gap-1.5">
                    📐 {currentFeatured.sqft?.toLocaleString() || '350'} sqm
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <Link
                    href={`/property/${currentFeatured.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-all hover:gap-3"
                  >
                    <span>View Verified Details</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC ROLE SECTION 1: Pending Action Items */}
          {/* For OWNER / AGENT: Incoming Inspections to confirm */}
          {(role === 'OWNER' || role === 'AGENT') && pendingHostInspections.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-amber-950 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      Pending Inspection Requests ({pendingHostInspections.length})
                    </CardTitle>
                    <CardDescription className="text-xs text-amber-800">
                      Seekers requested on-site inspection slots. Confirm or cancel to lock the schedule.
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm" className="text-xs bg-white">
                    <Link href="/profile?tab=inspections">Manage All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {pendingHostInspections.slice(0, 3).map((insp) => (
                  <div
                    key={insp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-amber-200 shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-900">{insp.propertyTitle}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                        <span>
                          Applicant: <strong>{insp.seekerName}</strong> ({insp.seekerPhone})
                        </span>
                        <span>
                          Slot: <strong>{insp.preferredDate}</strong> ({insp.preferredTimeSlot})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1"
                        disabled={actionLoadingId === insp.id}
                        onClick={() => handleHostConfirmInspection(insp.id)}
                      >
                        <Check className="h-3.5 w-3.5" /> Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs gap-1"
                        disabled={actionLoadingId === insp.id}
                        onClick={() => handleHostCancelInspection(insp.id)}
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* For OWNER: Applications / Offers received */}
          {role === 'OWNER' && applications.filter((a) => a.status === 'SUBMITTED').length > 0 && (
            <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Pending Offers & Applications
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600">
                      Expressions of interest received on your listings.
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm" className="text-xs bg-white">
                    <Link href="/profile?tab=applications">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {applications
                  .filter((a) => a.status === 'SUBMITTED')
                  .slice(0, 3)
                  .map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-900">{app.propertyTitle}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {app.type === 'RENTAL' ? 'Rental Application' : 'Purchase Offer'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                          <span>
                            From: <strong>{app.applicantName}</strong>
                          </span>
                          {app.offerAmount && (
                            <span className="font-bold text-slate-900">
                              Offer: {formatNaira(app.offerAmount)}
                            </span>
                          )}
                          {app.financingStatus && <span>Financing: {app.financingStatus}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          disabled={actionLoadingId === app.id}
                          onClick={() => handleHostApproveApplication(app.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
                          disabled={actionLoadingId === app.id}
                          onClick={() => handleHostDeclineApplication(app.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* For SEEKER: Upcoming Scheduled Inspections */}
          {role === 'SEEKER' && inspections.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Your Scheduled Inspections ({inspections.length})
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Physical and video property walkthroughs arranged with hosts.
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link href="/profile?tab=inspections">Inspection History</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {inspections.slice(0, 3).map((insp) => (
                  <div
                    key={insp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/60 border border-slate-200"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/property/${insp.propertyId}`}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600"
                        >
                          {insp.propertyTitle}
                        </Link>
                        <Badge
                          className={
                            insp.status === 'COMPLETED'
                              ? 'bg-emerald-600 text-white text-[10px]'
                              : insp.status === 'SCHEDULED' || insp.status === 'ACCEPTED'
                              ? 'bg-blue-600 text-white text-[10px]'
                              : 'bg-amber-500 text-white text-[10px]'
                          }
                        >
                          {insp.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                        <span>
                          Date: <strong>{insp.preferredDate}</strong> ({insp.preferredTimeSlot})
                        </span>
                        <span>Type: {insp.type === 'IN_PERSON' ? 'On-site Physical' : 'Guided Video'}</span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="text-xs">
                      <Link href={`/property/${insp.propertyId}`}>
                        View Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* DYNAMIC ROLE SECTION 2: Properties Feed */}
          {/* For OWNER / AGENT: Their Listed Properties */}
          {(role === 'OWNER' || role === 'AGENT') ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {role === 'OWNER' ? 'Your Property Portfolio' : 'Managed Agency Listings'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track verification status, title audits, and listing availability.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    <Link href="/landlord/add-property">
                      <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Listing
                    </Link>
                  </Button>
                </div>
              </div>

              {userProperties.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <Building className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">No properties listed yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                    Submit your first property with title documentation to get verified and attract verified seekers.
                  </p>
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/landlord/add-property">Create Listing</Link>
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {userProperties.slice(0, 6).map((prop) => (
                    <div key={prop.id} className="relative group">
                      <PropertyCard property={prop} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : role === 'ADMIN' ? (
            /* For ADMIN: Verification Queue List */
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Verification Audit Queue</h3>
                  <p className="text-xs text-slate-500">
                    Properties awaiting officer review and 6-point verification signoff.
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                >
                  <span>Open Full Queue</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {adminQueue.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">Verification queue is up to date</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No properties currently pending initial compliance checks.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {adminQueue.slice(0, 4).map((q) => (
                    <div
                      key={q.propertyId}
                      className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-blue-300 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{q.title}</span>
                          <Badge
                            className={
                              (q.verification?.overallStatus || 'PENDING') === 'PASSED'
                                ? 'bg-emerald-600 text-white text-[10px]'
                                : (q.verification?.overallStatus || 'PENDING') === 'CHANGES_REQUIRED'
                                ? 'bg-amber-500 text-white text-[10px]'
                                : 'bg-blue-600 text-white text-[10px]'
                            }
                          >
                            {q.verification?.overallStatus || 'PENDING'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>Audit: 6 parameters</span>
                        </div>
                      </div>
                      <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs">
                        <Link href="/admin">Audit Listing</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* For SEEKER: Recommended Verified Properties */
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recommended Verified Homes</h3>
                  <p className="text-xs text-slate-500">
                    Properties with checked titles and verified physical inspections.
                  </p>
                </div>
                <Link
                  href="/marketplace?verifiedOnly=true"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                >
                  <span>View All Verified</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {properties
                  .filter((p) => p.listingStatus === 'ACTIVE')
                  .slice(0, 4)
                  .map((prop) => (
                    <PropertyCard key={prop.id} property={prop} />
                  ))}
              </div>
            </div>
          )}

          {/* Bottom Grid: Market Overview & Explore by Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Market Overview */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              {/* Header & Controls */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Market Overview</h4>

                <div className="flex items-center gap-2">
                  {/* City Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <span>{selectedCity}</span>
                        <ChevronDown className="h-3 w-3 text-slate-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => setSelectedCity('Lagos')}>Lagos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedCity('Abuja')}>Abuja</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedCity('Port Harcourt')}>
                        Port Harcourt
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Timeframe Toggles */}
                  <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold text-slate-600">
                    {(['1M', '3M', '6M', '1Y'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setActiveTimeframe(tf)}
                        className={`rounded-md px-2 py-0.5 transition ${
                          activeTimeframe === tf
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'hover:text-slate-900'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Value and Trend */}
              <div className="mt-4">
                <span className="text-xs font-medium text-slate-500">Average Property Prices</span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    ₦ 125,000,000
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                    <ArrowUpRight className="h-3 w-3" />
                    12.5%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">vs. last year</span>
              </div>

              {/* Chart */}
              <div className="mt-4 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      domain={[0, 200]}
                      ticks={[0, 100, 150, 200]}
                      tickFormatter={(val) => (val === 0 ? '0' : `${val}M`)}
                    />
                    <Tooltip
                      formatter={(value: any) => [`₦ ${value}M`, 'Avg. Price']}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#priceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card: Explore by Location */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900">Explore by Location</h4>
                <Link
                  href="/marketplace?view=map"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Stylized Lagos Map Preview */}
              <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-slate-50 to-blue-100 border border-slate-200/70 p-3 flex items-center justify-center">
                <svg
                  viewBox="0 0 320 180"
                  className="absolute inset-0 h-full w-full object-cover"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0,110 C80,95 140,120 220,95 C270,80 320,105 320,110 L320,180 L0,180 Z"
                    fill="#bfdbfe"
                    opacity="0.45"
                  />
                  <path
                    d="M40,50 C90,40 130,70 190,55 C240,40 280,60 320,45"
                    stroke="#93c5fd"
                    strokeWidth="4"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  <path d="M10,20 Q80,25 150,15 T310,20" stroke="#cbd5e1" strokeWidth="1.5" />
                </svg>

                {/* Region Markers */}
                <Link
                  href="/marketplace?search=Ikeja"
                  className="absolute top-8 left-16 group flex items-center gap-1 z-10"
                >
                  <span className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-200/80 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition">
                    Ikeja
                  </span>
                </Link>

                <Link
                  href="/marketplace?search=Victoria%20Island"
                  className="absolute bottom-12 left-28 group flex items-center gap-1 z-10"
                >
                  <span className="h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-200/80" />
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition">
                    Lagos
                  </span>
                </Link>

                <Link
                  href="/marketplace?search=Lekki"
                  className="absolute bottom-10 right-10 z-20 flex flex-col items-center group"
                >
                  <div className="rounded-xl bg-[#0b132b] px-3.5 py-1.5 text-center text-white shadow-xl border border-slate-700 hover:scale-105 transition-transform">
                    <span className="text-xs font-bold block leading-tight">Lekki</span>
                    <span className="text-[10px] text-slate-300 leading-tight">Verified Zone</span>
                  </div>
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-300 mt-1 shadow-md" />
                </Link>
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center justify-center gap-6 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Verified Safe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span>Title Checked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <span>Inspected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (4 Columns) ================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card 1: Market Intelligence (Dark Card) */}
          <div className="rounded-3xl bg-[#0b132b] border border-slate-800 p-6 text-white shadow-xl relative overflow-hidden">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Market Intelligence</h3>
              <p className="text-xs text-slate-400 mt-0.5">Lagos & Abuja Property Metrics</p>
            </div>

            <div className="mt-4">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-xs font-bold border border-emerald-500/30">
                + 12.5%
              </span>
              <p className="text-xs text-slate-400 mt-1">Avg. price growth (YoY)</p>
            </div>

            <div className="my-4 h-12 w-full">
              <svg viewBox="0 0 240 40" className="h-full w-full" fill="none">
                <path
                  d="M0,32 Q30,35 60,25 T120,20 T180,10 T240,6"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="240" cy="6" r="4" fill="#38bdf8" />
              </svg>
            </div>

            <div className="space-y-3.5 border-t border-slate-800/80 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Insights</p>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                  <Home className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  High demand for verified 3–4 bed homes in Lekki Phase 1, Ikoyi, and Maitama
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Verified listings convert 3.4x faster than unverified marketplace listings
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 mt-0.5">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Zero fraudulent transactions recorded on PropHunta verified audit chain
                </p>
              </div>
            </div>

            <Link
              href="/marketplace"
              className="mt-6 flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-700 bg-transparent py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              <span>Explore Market Inventory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card 2: Recent Activity (Live Synced) */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
              <Link
                href="/profile"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {inspections.length > 0 && (
                <Link
                  href="/profile?tab=inspections"
                  className="flex items-start gap-3 group p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                        Inspection slot updated
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">Recent</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {inspections[0].propertyTitle} &bull; {inspections[0].status}
                    </p>
                  </div>
                </Link>
              )}

              {applications.length > 0 && (
                <Link
                  href="/profile?tab=applications"
                  className="flex items-start gap-3 group p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                        Application filed
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">Active</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {applications[0].propertyTitle} ({applications[0].status})
                    </p>
                  </div>
                </Link>
              )}

              {enquiries.length > 0 && (
                <Link
                  href={`/messages/${enquiries[0].id}`}
                  className="flex items-start gap-3 group p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                        Property conversation
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">Direct</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {enquiries[0].propertyTitle} &bull; {enquiries[0].lastMessageText}
                    </p>
                  </div>
                </Link>
              )}

              <div className="flex items-start gap-3 p-1.5 -mx-1.5 rounded-xl">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">Trust protocol verified</p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">Always on</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    End-to-end verified title chain & pricing transparency active.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Actions (Role Aware) */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Action 1: Search */}
              <Link
                href="/marketplace"
                className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Search className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-blue-600 transition-colors">
                  Marketplace
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Browse verified</span>
              </Link>

              {/* Action 2: Add Listing or Admin Desk */}
              {role === 'ADMIN' ? (
                <Link
                  href="/admin"
                  className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-left"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-blue-600 transition-colors">
                    Admin Desk
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Audit Queue</span>
                </Link>
              ) : (
                <Link
                  href="/landlord/add-property"
                  className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-left"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-blue-600 transition-colors">
                    Add Property
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">List & verify</span>
                </Link>
              )}

              {/* Action 3: AI Recommendations */}
              <AiRecommendations
                open={isAiModalOpen}
                onOpenChange={setIsAiModalOpen}
                trigger={
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-indigo-50/60 hover:border-indigo-200 transition-all text-left w-full"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-indigo-600 transition-colors">
                      AI Assist
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Smart Match</span>
                  </button>
                }
              />

              {/* Action 4: Messages / Enquiries */}
              <Link
                href="/messages"
                className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-200 transition-all text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-emerald-600 transition-colors">
                  Messages
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {enquiries.length} conversation{enquiries.length === 1 ? '' : 's'}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
