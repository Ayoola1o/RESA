'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Bookmark,
  Heart,
  Search,
  Clock,
  Calendar,
  FileText,
  MessageSquare,
  Sparkles,
  MapPin,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  ExternalLink,
  Building,
  Filter,
  Check,
  X,
  AlertCircle,
  HelpCircle,
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
import PropertyCard from '@/components/property-card';
import AiRecommendations from '@/components/ai-recommendations';
import { formatNaira, formatCurrency } from '@/lib/utils';
import {
  Property,
  InspectionRequest,
  Application,
  PropertyEnquiry,
  InspectionRecord,
} from '@/types/prophunta';
import { updateInspectionStatusAction } from '@/server/actions/prophunta-actions';
import { useToast } from '@/hooks/use-toast';

interface SeekerDashboardProps {
  properties: Property[];
  inspections: InspectionRequest[];
  applications: Application[];
  enquiries: PropertyEnquiry[];
  userName: string;
}

const DEFAULT_RECENT_SEARCHES = [
  '3 Bed Flat in Lekki Phase 1',
  'Serviced 2-Bed Ikeja GRA',
  'Maitama Abuja 4 Bed Detached',
  'Commercial Office Victoria Island',
  'Affordable Flat in Yaba',
];

export default function SeekerDashboard({
  properties,
  inspections: initialInspections,
  applications,
  enquiries,
  userName,
}: SeekerDashboardProps) {
  const { toast } = useToast();
  const [inspections, setInspections] = useState<InspectionRequest[]>(initialInspections);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_RECENT_SEARCHES);
  const [newSearchQuery, setNewSearchQuery] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeInspectionRecord, setActiveInspectionRecord] = useState<{
    propertyTitle: string;
    record: InspectionRecord;
  } | null>(null);
  const [cancellingInspectionId, setCancellingInspectionId] = useState<string | null>(null);

  // Initialize saved properties & recent searches from localStorage
  useEffect(() => {
    try {
      const storedSaved = localStorage.getItem('prophunta_saved_properties');
      if (storedSaved) {
        setSavedPropertyIds(JSON.parse(storedSaved));
      } else {
        // Default to first 3 verified properties for great initial experience
        const defaultSaved = properties.slice(0, 3).map((p) => p.id);
        setSavedPropertyIds(defaultSaved);
      }

      const storedSearches = localStorage.getItem('prophunta_recent_searches');
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
    } catch (e) {
      // Fallback gracefully
    }
  }, [properties]);

  const handleRemoveSaved = (id: string) => {
    const next = savedPropertyIds.filter((item) => item !== id);
    setSavedPropertyIds(next);
    try {
      localStorage.setItem('prophunta_saved_properties', JSON.stringify(next));
    } catch (e) {}
    toast({ title: 'Removed from Saved', description: 'Property removed from your saved list.' });
  };

  const handleAddSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSearchQuery.trim()) return;
    const updated = [newSearchQuery.trim(), ...recentSearches.filter((s) => s !== newSearchQuery.trim())].slice(0, 8);
    setRecentSearches(updated);
    setNewSearchQuery('');
    try {
      localStorage.setItem('prophunta_recent_searches', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleClearSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('prophunta_recent_searches');
    } catch (e) {}
    toast({ title: 'Searches Cleared', description: 'Recent search history has been cleared.' });
  };

  const handleCancelInspection = async (id: string) => {
    setCancellingInspectionId(id);
    const res = await updateInspectionStatusAction(id, 'CANCELLED', 'Cancelled by seeker');
    setCancellingInspectionId(null);
    if (res.success) {
      setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'CANCELLED' } : i)));
      toast({ title: 'Inspection Cancelled', description: 'Your inspection request has been marked cancelled.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to cancel.' });
    }
  };

  const savedPropertiesList = properties.filter((p) => savedPropertyIds.includes(p.id));
  const recommendedPropertiesList = properties
    .filter((p) => p.listingStatus === 'ACTIVE' || p.listingStatus === 'VERIFIED')
    .slice(0, 4);
  const recentlyViewedList = properties.slice(0, 4);

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white border border-blue-900/60 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              Verified Seeker Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome to your Seeker Portal, {userName}
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Track your saved properties, monitor active inspection requests, review rental applications, and discover AI-matched verified properties across Lagos and Abuja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsAiModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-950/50 gap-2 h-10 px-4"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI Matchmaker
            </Button>
            <Button asChild variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs h-10 px-4">
              <Link href="/marketplace">
                <Search className="h-4 w-4 mr-1.5" />
                Browse Marketplace
              </Link>
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Bookmark className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Saved</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{savedPropertiesList.length}</div>
            <span className="text-xs text-slate-500 font-medium">Bookmarked Listings</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Inspections</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {inspections.filter((i) => i.status !== 'CANCELLED').length}
            </div>
            <span className="text-xs text-slate-500 font-medium">Scheduled & Requested</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Applications</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{applications.length}</div>
            <span className="text-xs text-slate-500 font-medium">Offers & Expressions</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Enquiries</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{enquiries.length}</div>
            <span className="text-xs text-slate-500 font-medium">Host Conversations</span>
          </div>
        </div>
      </div>

      {/* 3. Recent Searches Section */}
      <Card className="border border-slate-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                Recent Searches & Discovery Hotspots
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Click any saved search query to immediately pull verified properties matching your filters.
              </CardDescription>
            </div>
            {recentSearches.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearches}
                className="text-xs text-slate-500 hover:text-red-600 self-start sm:self-auto h-8 px-2"
              >
                Clear History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {recentSearches.map((query, idx) => (
              <Link
                key={idx}
                href={`/marketplace?search=${encodeURIComponent(query)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-blue-700 transition group shadow-2xs"
              >
                <Search className="h-3 w-3 text-slate-400 group-hover:text-blue-600" />
                <span>{query}</span>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-blue-600 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          <form onSubmit={handleAddSearch} className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              placeholder="Save a new search term (e.g. 4 Bed in Ikoyi)..."
              value={newSearchQuery}
              onChange={(e) => setNewSearchQuery(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
            <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 4. Active Applications & Expressions of Interest */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Your Applications & Expressions of Interest ({applications.length})
            </h2>
            <p className="text-xs text-slate-500">
              Track review status and feedback from verified property owners and managers.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/profile?tab=applications">View All History</Link>
          </Button>
        </div>

        {applications.length === 0 ? (
          <Card className="border-dashed p-8 text-center bg-slate-50/50">
            <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-800">No active expressions of interest</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              When you find a verified home on the marketplace, submit an Expression of Interest to begin landlord review.
            </p>
            <Button asChild size="sm" className="mt-4 bg-blue-600 text-white text-xs">
              <Link href="/marketplace">Find Properties to Apply</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {applications.map((app) => (
              <Card key={app.id} className="border border-slate-200/90 shadow-2xs hover:border-blue-300 transition">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge
                        variant="outline"
                        className={
                          app.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : app.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border-red-300'
                            : app.status === 'UNDER_REVIEW'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }
                      >
                        {app.status}
                      </Badge>
                      <CardTitle className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                        {app.propertyTitle}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {app.type === 'RENTAL' ? 'Rental App' : 'Purchase Offer'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs text-slate-600">
                  {app.offerAmount && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Offer Amount:</span>
                      <span className="font-bold text-slate-900">{formatNaira(app.offerAmount)}</span>
                    </div>
                  )}
                  {app.moveInDate && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Target Move-in:</span>
                      <span className="font-semibold text-slate-800">{app.moveInDate}</span>
                    </div>
                  )}
                  {app.financingStatus && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Financing:</span>
                      <span className="font-semibold text-slate-800">{app.financingStatus}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg line-clamp-2">
                    &ldquo;{app.message}&rdquo;
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Submitted: {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-blue-600 px-2">
                      <Link href={`/property/${app.propertyId}`}>View Listing &rarr;</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 5. Inspections & Property Enquiries Row (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inspections Box */}
        <Card className="border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Your Inspections ({inspections.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  On-site and guided video walkthrough appointments with hosts.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs h-8">
                <Link href="/profile?tab=inspections">Manage All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 flex-1">
            {inspections.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No inspections requested yet. Schedule physical visits directly from listing detail pages.
              </div>
            ) : (
              inspections.slice(0, 4).map((insp) => (
                <div
                  key={insp.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/property/${insp.propertyId}`}
                        className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                      >
                        {insp.propertyTitle}
                      </Link>
                      <Badge
                        className={
                          insp.status === 'COMPLETED'
                            ? 'bg-emerald-600 text-white text-[10px]'
                            : insp.status === 'SCHEDULED' || insp.status === 'ACCEPTED'
                            ? 'bg-blue-600 text-white text-[10px]'
                            : insp.status === 'CANCELLED'
                            ? 'bg-slate-400 text-white text-[10px]'
                            : 'bg-amber-500 text-white text-[10px]'
                        }
                      >
                        {insp.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 mt-1">
                      <span>
                        Slot: <strong>{insp.preferredDate}</strong> ({insp.preferredTimeSlot})
                      </span>
                      <span>Type: {insp.type === 'IN_PERSON' ? 'On-site Physical' : 'Guided Video'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {insp.inspectionRecord && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs bg-white text-emerald-700 border-emerald-300"
                        onClick={() =>
                          setActiveInspectionRecord({
                            propertyTitle: insp.propertyTitle,
                            record: insp.inspectionRecord!,
                          })
                        }
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View Report
                      </Button>
                    )}
                    {insp.status !== 'CANCELLED' && insp.status !== 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={cancellingInspectionId === insp.id}
                        onClick={() => handleCancelInspection(insp.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Enquiries Box */}
        <Card className="border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  Property Enquiries ({enquiries.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Direct messages tied to specific listings.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs h-8">
                <Link href="/messages">Open Inbox</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 flex-1">
            {enquiries.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active conversations. Enquire directly on any property page to speak with the owner or authorized agent.
              </div>
            ) : (
              enquiries.slice(0, 4).map((enq) => (
                <Link
                  key={enq.id}
                  href={`/messages/${enq.id}`}
                  className="block p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition group text-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 line-clamp-1">
                      {enq.propertyTitle}
                    </p>
                    {enq.unreadCountForSeeker > 0 && (
                      <Badge className="bg-blue-600 text-white text-[10px]">
                        {enq.unreadCountForSeeker} new
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-500 mt-1 line-clamp-1">{enq.lastMessageText}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Host: {enq.hostName}</span>
                    <span>{new Date(enq.lastMessageAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. Saved Properties Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-blue-600" />
              Saved Properties ({savedPropertiesList.length})
            </h2>
            <p className="text-xs text-slate-500">
              Homes bookmarked for quick comparison and inspection scheduling.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/marketplace">Explore More</Link>
          </Button>
        </div>

        {savedPropertiesList.length === 0 ? (
          <Card className="border-dashed p-8 text-center bg-slate-50/50">
            <Bookmark className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-800">No saved properties yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Save your favorite apartments, duplexes, or commercial listings to revisit them anytime.
            </p>
            <Button asChild size="sm" className="mt-4 bg-blue-600 text-white text-xs">
              <Link href="/marketplace">Browse Verified Marketplace</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {savedPropertiesList.map((prop) => (
              <div key={prop.id} className="relative group">
                <PropertyCard property={prop} />
                <button
                  type="button"
                  title="Remove from saved"
                  onClick={() => handleRemoveSaved(prop.id)}
                  className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-white/90 hover:bg-red-50 text-slate-600 hover:text-red-600 shadow-md flex items-center justify-center transition border border-slate-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Recommended Verified Properties */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Recommended Verified Properties
            </h2>
            <p className="text-xs text-slate-500">
              Ranked with PropHunta 6-point title verification and physical inspection passes.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedPropertiesList.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      </div>

      {/* 8. Recently Viewed Properties */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-600" />
              Recently Viewed Properties
            </h2>
            <p className="text-xs text-slate-500">
              Continue your review where you left off.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentlyViewedList.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      </div>

      {/* Completed Inspection Modal */}
      {activeInspectionRecord && (
        <Dialog open={!!activeInspectionRecord} onOpenChange={() => setActiveInspectionRecord(null)}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Verified Inspection Findings
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {activeInspectionRecord.propertyTitle}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-xs text-slate-700 py-2">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Inspector:</span>
                <span className="font-semibold">{activeInspectionRecord.record.inspectorName || 'PropHunta Field Officer'}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Condition Rating:</span>
                <Badge className="bg-emerald-600 text-white">
                  {activeInspectionRecord.record.conditionRating}
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Utilities Functional:</span>
                <span className="font-semibold">{activeInspectionRecord.record.utilitiesFunctional ? 'Yes (Water & Power verified)' : 'Partial / Under maintenance'}</span>
              </div>
              {activeInspectionRecord.record.meterReadings && (
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-slate-500">Meter Readings:</span>
                  <span className="font-semibold">{activeInspectionRecord.record.meterReadings}</span>
                </div>
              )}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Field Observations:</p>
                <p className="text-slate-600">{activeInspectionRecord.record.observations}</p>
              </div>
              {activeInspectionRecord.record.discrepancies && (
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Noted Discrepancies:
                  </p>
                  <p>{activeInspectionRecord.record.discrepancies}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Recommendations Dialog */}
      <AiRecommendations open={isAiModalOpen} onOpenChange={setIsAiModalOpen} />
    </div>
  );
}
