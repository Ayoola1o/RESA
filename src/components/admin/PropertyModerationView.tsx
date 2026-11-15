'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeAlert, BedDouble, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Eye, FileText, Home, MapPin, Ruler, ShieldCheck, X, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ListingReport, Property, AdminPermission } from '@/types/prophunta';
import { formatCurrency } from '@/lib/utils';

type ReviewOutcome = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUIRED';
type ReviewTab = 'details' | 'agent' | 'documents' | 'location';

interface PropertyModerationViewProps {
  properties: Property[];
  reports: ListingReport[];
  can: (perm: AdminPermission) => boolean;
  onOpenReviewDialog: (prop: Property) => void;
  onOpenDocsDialog: (prop: Property) => void;
  onSuspendProperty: (propertyId: string) => Promise<void>;
  onRestoreProperty: (propertyId: string) => Promise<void>;
  onModerationReview: (propertyId: string, outcome: ReviewOutcome, notes: string) => Promise<void>;
  onSwitchToReports: () => void;
  submittingAction: boolean;
  searchQuery: string;
}

export function PropertyModerationView({
  properties, reports, can, onOpenReviewDialog, onOpenDocsDialog, onSuspendProperty,
  onRestoreProperty, onModerationReview, onSwitchToReports, submittingAction, searchQuery,
}: PropertyModerationViewProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewTab>('details');
  const [activeImage, setActiveImage] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('30');

  const getReportsForProperty = (id: string) => reports.filter((report) => report.propertyId === id && !['RESOLVED', 'DISMISSED'].includes(report.status));
  const pendingProperties = properties.filter((property) => ['SUBMITTED', 'UNDER_REVIEW'].includes(property.listingStatus));
  const approvedCount = properties.filter((property) => property.moderationStatus === 'APPROVED').length;
  const rejectedCount = properties.filter((property) => property.moderationStatus === 'REJECTED' || property.listingStatus === 'REJECTED').length;
  const onHoldCount = properties.filter((property) => property.listingStatus === 'CHANGES_REQUIRED').length;
  const locations = [...new Set(properties.map((property) => property.city).filter(Boolean))].sort();
  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const days = Number(dateFilter);
    const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
    return pendingProperties.filter((property) => {
      const matchesText = !query || [property.title, property.address, property.city, property.area, property.id].some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'ALL' || property.listingStatus === statusFilter;
      const matchesLocation = locationFilter === 'ALL' || property.city === locationFilter;
      const matchesDate = !cutoff || Date.parse(property.createdAt) >= cutoff;
      return matchesText && matchesStatus && matchesLocation && matchesDate;
    });
  }, [pendingProperties, searchQuery, statusFilter, locationFilter, dateFilter]);

  const openReview = (property: Property) => {
    setSelectedProperty(property);
    setActiveTab('details');
    setActiveImage(0);
    setReviewNotes('');
  };

  const submitReview = async (outcome: ReviewOutcome) => {
    if (!selectedProperty || reviewNotes.trim().length < 5) return;
    await onModerationReview(selectedProperty.id, outcome, reviewNotes.trim());
    setSelectedProperty(null);
  };

  const statusBadge = (status: string) => <Badge className={`shrink-0 ${status === 'APPROVED' || status === 'VERIFIED' || status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : status === 'REJECTED' || status === 'SUSPENDED' ? 'bg-rose-100 text-rose-700' : status === 'CHANGES_REQUIRED' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{status.replaceAll('_', ' ')}</Badge>;

  const reviewImages = selectedProperty?.media?.filter((media) => media.type === 'image' && media.url) || [];
  const tabs: { id: ReviewTab; label: string }[] = [
    { id: 'details', label: 'Property Details' }, { id: 'agent', label: 'Agent Information' },
    { id: 'documents', label: `Documents (${selectedProperty?.documents?.length || 0})` }, { id: 'location', label: 'Location' },
  ];

  return <>
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-white pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-lg font-bold text-slate-900">Listing Reviews</CardTitle><Badge className="bg-[#25D366] text-slate-950">Property Moderation</Badge></div><CardDescription className="mt-1 text-xs">Review and moderate submitted property listings.</CardDescription></div>
          <label className="flex items-center gap-2 text-xs text-slate-600"><CalendarDays className="h-4 w-4" /><select aria-label="Filter by submission date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3"><option value="30">Last 30 Days</option><option value="90">Last 90 Days</option><option value="365">Last 12 Months</option><option value="0">All Time</option></select></label>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 lg:grid-cols-4">
          <SummaryCard label="Pending" count={pendingProperties.length} icon={<Home className="h-5 w-5" />} tone="blue" />
          <SummaryCard label="Approved" count={approvedCount} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
          <SummaryCard label="Rejected" count={rejectedCount} icon={<XCircle className="h-5 w-5" />} tone="red" />
          <SummaryCard label="On Hold" count={onHoldCount} icon={<ClipboardCheck className="h-5 w-5" />} tone="purple" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Pending Listings ({filteredProperties.length})</h2><p className="mt-0.5 text-xs text-slate-500">Submitted listings requiring a moderation decision.</p></div><div className="flex flex-wrap gap-2">
          <select aria-label="Filter listing status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="ALL">All Statuses</option><option value="SUBMITTED">Pending</option><option value="UNDER_REVIEW">Under Review</option></select>
          <select aria-label="Filter listing location" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="ALL">All Locations</option>{locations.map((location) => <option key={location} value={location}>{location}</option>)}</select>
        </div></div>
        <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[760px] border-collapse text-left text-xs"><thead className="bg-slate-50 text-[11px] text-slate-600"><tr><th className="px-3 py-3 font-semibold">#</th><th className="px-3 py-3 font-semibold">Property</th><th className="px-3 py-3 font-semibold">Location</th><th className="px-3 py-3 font-semibold">Submitted</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">
          {filteredProperties.map((property, index) => {
            const firstImage = property.media?.find((media) => media.type === 'image' && media.url)?.url;
            const reportsForProperty = getReportsForProperty(property.id);
            return <tr key={property.id} className="hover:bg-slate-50/70"><td className="px-3 py-3 text-slate-500">{index + 1}</td><td className="px-3 py-3"><div className="flex items-center gap-2.5"><div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">{firstImage ? <Image src={firstImage} alt="" fill sizes="48px" className="object-cover" unoptimized /> : <Home className="absolute inset-0 m-auto h-4 w-4 text-slate-400" />}</div><div className="min-w-0"><p className="max-w-52 truncate font-semibold text-slate-900">{property.title}</p><p className="text-[10px] text-slate-500">{property.bedrooms} beds · {formatCurrency(property.price, property.listingType === 'RENT' ? 'For Rent' : 'For Sale')}</p></div></div></td><td className="px-3 py-3 text-slate-600">{[property.area, property.city].filter(Boolean).join(', ') || 'Location not provided'}</td><td className="px-3 py-3 text-slate-600">{new Date(property.createdAt).toLocaleDateString()}</td><td className="px-3 py-3">{statusBadge(property.listingStatus)}{reportsForProperty.length > 0 && <Badge variant="destructive" className="ml-1">{reportsForProperty.length} flags</Badge>}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><Button size="sm" className="h-8 bg-blue-700 text-white hover:bg-blue-800" disabled={!can('properties.moderate')} onClick={() => openReview(property)}>Review</Button><Button size="sm" variant="outline" className="h-8 border-rose-300 text-rose-700 hover:bg-rose-50" disabled={!can('properties.moderate') || submittingAction} onClick={() => void onModerationReview(property.id, 'REJECTED', 'Listing does not meet the platform moderation requirements.')}>Reject</Button></div></td></tr>;
          })}
          {!filteredProperties.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No pending listings match these filters.</td></tr>}
        </tbody></table></div>
      </CardContent>
    </Card>

    <Dialog open={Boolean(selectedProperty)} onOpenChange={(open) => !open && setSelectedProperty(null)}>
      <DialogContent className="max-h-[94dvh] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto rounded-2xl p-0 sm:w-[calc(100vw-2rem)]">
        {selectedProperty && <>
          <DialogHeader className="border-b border-slate-100 p-5 pr-12"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Home className="h-6 w-6" /></span><div><DialogTitle className="text-base font-bold">Review Property Listing</DialogTitle><DialogDescription className="mt-1 text-xs">Carefully review the property details and approve, reject, or request changes.</DialogDescription></div></div></DialogHeader>
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)]">
            <div className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">{reviewImages[activeImage]?.url ? <Image src={reviewImages[activeImage].url} alt={selectedProperty.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" unoptimized /> : <div className="grid h-full place-items-center text-sm text-slate-400"><Home className="mr-2 h-5 w-5" />No property photo uploaded</div>}{reviewImages.length > 1 && <><Button size="icon" variant="secondary" className="absolute left-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full" onClick={() => setActiveImage((index) => (index - 1 + reviewImages.length) % reviewImages.length)}><ChevronLeft className="h-4 w-4" /></Button><Button size="icon" variant="secondary" className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full" onClick={() => setActiveImage((index) => (index + 1) % reviewImages.length)}><ChevronRight className="h-4 w-4" /></Button><span className="absolute bottom-3 right-3 rounded-full bg-slate-950/75 px-2.5 py-1 text-xs text-white">{activeImage + 1} / {reviewImages.length}</span></>}</div>
              <div className="flex gap-2 overflow-x-auto">{reviewImages.map((media, index) => <button key={media.id} type="button" onClick={() => setActiveImage(index)} className={`relative h-14 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${index === activeImage ? 'border-blue-600' : 'border-transparent'}`}><Image src={media.url} alt={`Property image ${index + 1}`} fill sizes="64px" className="object-cover" unoptimized /></button>)}</div>
              <div className="flex flex-wrap gap-2">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`border-b-2 px-3 py-2 text-xs font-semibold ${activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{tab.label}</button>)}</div>
              <div className="min-h-24 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
                {activeTab === 'details' && <><h3 className="mb-2 font-bold">Property details</h3><p className="leading-relaxed">{selectedProperty.description || 'No property description was provided.'}</p><div className="mt-3 flex flex-wrap gap-4 text-slate-600"><span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" />{selectedProperty.bedrooms} bedrooms</span><span>{selectedProperty.bathrooms} bathrooms</span><span className="inline-flex items-center gap-1"><Ruler className="h-4 w-4" />{selectedProperty.sqft ? `${selectedProperty.sqft} m²` : 'Area not provided'}</span></div><p className="mt-3">{selectedProperty.features?.length ? selectedProperty.features.join(' · ') : 'No features were listed.'}</p></>}
                {activeTab === 'agent' && <><h3 className="mb-2 font-bold">Listing account</h3><p>Owner account ID: <span className="font-mono">{selectedProperty.ownerId}</span></p><p className="mt-1">{selectedProperty.authorizedAgentId ? <>Authorized agent ID: <span className="font-mono">{selectedProperty.authorizedAgentId}</span></> : 'No authorized agent is attached to this listing.'}</p><p className="mt-2 text-slate-500">Account details are shown from the listing’s assigned owner and agent records.</p></>}
                {activeTab === 'documents' && <><h3 className="mb-2 font-bold">Submitted documents</h3>{selectedProperty.documents?.length ? selectedProperty.documents.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 border-b border-slate-200 py-2"><div><p className="font-semibold">{document.fileName}</p><p className="text-[10px] text-slate-500">{document.documentType.replaceAll('_', ' ')} · {document.status}</p></div><a href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer" className="shrink-0 font-semibold text-blue-700 hover:underline">Open file</a></div>) : <p>No property documents were uploaded.</p>}</>}
                {activeTab === 'location' && <><h3 className="mb-2 font-bold">Property location</h3><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />{[selectedProperty.address, selectedProperty.area, selectedProperty.city, selectedProperty.state].filter(Boolean).join(', ') || 'Location not provided'}</p>{selectedProperty.latitude != null && selectedProperty.longitude != null && <p className="mt-2 text-[11px] text-slate-500">Coordinates: {selectedProperty.latitude}, {selectedProperty.longitude}</p>}</>}
              </div>
            </div>
            <div className="space-y-4">
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-900">{selectedProperty.title}</h2>{statusBadge(selectedProperty.listingStatus)}</div><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5" />{[selectedProperty.area, selectedProperty.city, selectedProperty.state].filter(Boolean).join(', ')}</p><p className="mt-2 text-lg font-bold text-blue-700">{formatCurrency(selectedProperty.price, selectedProperty.listingType === 'RENT' ? 'For Rent' : 'For Sale')} <span className="text-xs font-medium text-slate-500">{selectedProperty.listingType === 'RENT' ? 'For Rent' : 'For Sale'}</span></p></div>
              <div className="grid grid-cols-3 divide-x rounded-xl border border-slate-100 py-3 text-center text-xs"><div><BedDouble className="mx-auto mb-1 h-4 w-4 text-slate-500" />{selectedProperty.bedrooms} Bedrooms</div><div><Home className="mx-auto mb-1 h-4 w-4 text-slate-500" />{selectedProperty.bathrooms} Bathrooms</div><div><Ruler className="mx-auto mb-1 h-4 w-4 text-slate-500" />{selectedProperty.sqft ? `${selectedProperty.sqft} m²` : 'Area N/A'}</div></div>
              <div className="flex items-center gap-3 border-y border-slate-100 py-3 text-xs"><div className="min-w-0 flex-1"><p className="text-[10px] text-slate-500">Listing owner</p><p className="truncate font-semibold text-slate-800">{selectedProperty.ownerId}</p></div><div className="border-l border-slate-200 pl-3"><p className="text-[10px] text-slate-500">Submitted</p><p className="font-semibold text-slate-800">{new Date(selectedProperty.createdAt).toLocaleDateString()}</p></div></div>
              <div><h3 className="mb-2 text-sm font-bold text-slate-900">Your Review Decision</h3><div className="grid grid-cols-3 gap-2"><DecisionButton label="Approve" detail="Listing is compliant" tone="green" icon={<CheckCircle2 className="h-5 w-5" />} selected={false} onClick={() => void submitReview('APPROVED')} disabled={submittingAction || reviewNotes.trim().length < 5 || !can('properties.moderate')} /><DecisionButton label="Reject" detail="Listing has issues" tone="red" icon={<XCircle className="h-5 w-5" />} selected={false} onClick={() => void submitReview('REJECTED')} disabled={submittingAction || reviewNotes.trim().length < 5 || !can('properties.moderate')} /><DecisionButton label="Request Changes" detail="Ask for more information" tone="amber" icon={<ClipboardCheck className="h-5 w-5" />} selected={false} onClick={() => void submitReview('CHANGES_REQUIRED')} disabled={submittingAction || reviewNotes.trim().length < 5 || !can('properties.moderate')} /></div></div>
              <label className="block text-xs font-semibold text-slate-700">Review comments <span className="font-normal text-slate-500">(required)</span><textarea maxLength={900} value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Explain your moderation decision…" className="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-slate-200 p-3 text-xs font-normal text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" /></label><p className="-mt-3 text-right text-[10px] text-slate-400">{reviewNotes.length}/900 · minimum 5 characters</p>
              {getReportsForProperty(selectedProperty.id).length > 0 && <Button variant="outline" onClick={onSwitchToReports} className="w-full border-rose-200 text-rose-700"><BadgeAlert className="mr-2 h-4 w-4" />View {getReportsForProperty(selectedProperty.id).length} open report(s)</Button>}
              <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3"><Button asChild variant="outline" size="sm"><Link href={`/property/${selectedProperty.id}`} target="_blank"><Eye className="mr-1.5 h-4 w-4" />Public listing</Link></Button><Button variant="outline" size="sm" onClick={() => { setSelectedProperty(null); onOpenReviewDialog(selectedProperty); }}><ShieldCheck className="mr-1.5 h-4 w-4" />Verification checklist</Button><Button variant="ghost" size="sm" onClick={() => setSelectedProperty(null)}><X className="mr-1 h-4 w-4" />Close</Button></div>
            </div>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}

function SummaryCard({ label, count, icon, tone }: { label: string; count: number; icon: React.ReactNode; tone: 'blue' | 'green' | 'red' | 'purple' }) {
  const styles = { blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-rose-50 text-rose-700', purple: 'bg-purple-50 text-purple-700' };
  return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${styles[tone]}`}>{icon}</span><div><p className="text-[11px] text-slate-600">{label}</p><p className="text-xl font-bold tabular-nums text-slate-900">{count.toLocaleString()}</p></div></div>;
}

function DecisionButton({ label, detail, tone, icon, selected, onClick, disabled }: { label: string; detail: string; tone: 'green' | 'red' | 'amber'; icon: React.ReactNode; selected: boolean; onClick: () => void; disabled: boolean }) {
  const styles = { green: 'border-emerald-200 bg-emerald-50 text-emerald-800', red: 'border-rose-200 bg-rose-50 text-rose-800', amber: 'border-amber-200 bg-amber-50 text-amber-800' };
  return <button type="button" disabled={disabled} onClick={onClick} className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${styles[tone]} ${selected ? 'ring-2 ring-blue-500' : ''}`}><span>{icon}</span><span className="text-xs font-bold">{label}</span><span className="text-[9px] leading-tight">{detail}</span></button>;
}
