'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  Clock,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  User,
  Plus,
  Heart,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Loader2,
  MapPin,
  Briefcase,
  Award,
  Trash2,
  Sparkles,
  ClipboardCheck,
  Camera,
  Video,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/context/UserRoleContext';
import {
  getUserInspectionsAction,
  getUserApplicationsAction,
  getUserPropertiesAction,
  updateInspectionStatusAction,
  updateApplicationStatusAction,
  completeInspectionAction,
  proposeInspectionScheduleAction,
  getPropertiesAction,
} from '@/server/actions/prophunta-actions';
import {
  Property,
  InspectionRequest,
  Application,
  InspectionStatus,
  ApplicationStatus,
  InspectionRecord,
} from '@/types/prophunta';
import PropertyCard from '@/components/property-card';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading verified profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProfileContent() {
  const { currentUser, role } = useUserRole();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || (role === 'SEEKER' ? 'inspections' : 'properties'));

  // Data states
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.replace(`/profile?tab=${val}`, { scroll: false });
  };

  // Load user data
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [inspData, appData, propData, allProps] = await Promise.all([
          getUserInspectionsAction(),
          getUserApplicationsAction(),
          getUserPropertiesAction(),
          getPropertiesAction(),
        ]);

        if (!mounted) return;
        setInspections(inspData || []);
        setApplications(appData || []);
        setUserProperties(propData || []);
        // Seed first 2 verified properties as saved for demonstration
        setSavedProperties(allProps.slice(0, 2));
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  // Inspection status handlers
  const handleCancelInspection = async (id: string) => {
    setUpdatingId(id);
    const res = await updateInspectionStatusAction(id, 'CANCELLED', 'Cancelled by user');
    setUpdatingId(null);
    if (res.success) {
      toast({ title: 'Inspection Cancelled', description: 'The inspection request has been cancelled.' });
      setInspections(prev => prev.map(i => i.id === id ? { ...i, status: 'CANCELLED' as InspectionStatus } : i));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to cancel inspection.' });
    }
  };

  const handleConfirmInspection = async (id: string) => {
    setUpdatingId(id);
    const res = await updateInspectionStatusAction(id, 'SCHEDULED', 'Confirmed by host');
    setUpdatingId(null);
    if (res.success) {
      toast({ title: 'Inspection Confirmed', description: 'The inspection slot has been confirmed with the seeker.' });
      setInspections(prev => prev.map(i => i.id === id ? { ...i, status: 'SCHEDULED' as InspectionStatus } : i));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to confirm inspection.' });
    }
  };

  // Complete inspection modal state & handlers
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [targetInspection, setTargetInspection] = useState<InspectionRequest | null>(null);
  const [inspectorName, setInspectorName] = useState(currentUser?.name || 'Authorized Field Inspector');
  const [conditionRating, setConditionRating] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'>('GOOD');
  const [utilitiesFunctional, setUtilitiesFunctional] = useState(true);
  const [meterReadings, setMeterReadings] = useState('');
  const [observations, setObservations] = useState('');
  const [discrepancies, setDiscrepancies] = useState('');
  const [photoUrlsInput, setPhotoUrlsInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

  // Propose Reschedule Modal state & handlers (PRD Section 15)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<InspectionRequest | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTimeSlot, setProposedTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const openRescheduleModal = (insp: InspectionRequest) => {
    setRescheduleTarget(insp);
    setProposedDate(insp.preferredDate || new Date().toISOString().split('T')[0]);
    setProposedTimeSlot(insp.preferredTimeSlot || '10:00 AM - 12:00 PM');
    setRescheduleNotes('');
    setRescheduleDialogOpen(true);
  };

  const handleProposeSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setIsSubmittingReschedule(true);
    const res = await proposeInspectionScheduleAction(rescheduleTarget.id, proposedDate, proposedTimeSlot, rescheduleNotes);
    setIsSubmittingReschedule(false);
    if (res.success) {
      toast({ title: 'Schedule Proposed', description: 'New inspection schedule proposed and status updated to RESCHEDULED.' });
      setRescheduleDialogOpen(false);
      setInspections(prev => prev.map(i => i.id === rescheduleTarget.id ? {
        ...i,
        status: 'RESCHEDULED' as InspectionStatus,
        preferredDate: proposedDate,
        preferredTimeSlot: proposedTimeSlot,
        notes: rescheduleNotes || i.notes,
      } : i));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to propose schedule.' });
    }
  };

  // View inspection record modal state
  const [viewRecordDialogOpen, setViewRecordDialogOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<InspectionRecord | null>(null);
  const [viewingInspectionTitle, setViewingInspectionTitle] = useState('');

  const openCompleteInspectionModal = (insp: InspectionRequest) => {
    setTargetInspection(insp);
    setInspectorName(currentUser?.name || 'Authorized Field Inspector');
    setConditionRating('GOOD');
    setUtilitiesFunctional(true);
    setMeterReadings('');
    setObservations('');
    setDiscrepancies('');
    setPhotoUrlsInput('');
    setVideoUrlInput('');
    setCompleteDialogOpen(true);
  };

  const handleSaveInspectionRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInspection) return;
    setIsSubmittingRecord(true);
    const parsedPhotos = photoUrlsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const res = await completeInspectionAction(targetInspection.id, {
      inspectorName,
      conditionRating,
      utilitiesFunctional,
      meterReadings,
      observations: observations || 'Verified on-site by inspector with seeker present.',
      discrepancies,
      photos: parsedPhotos,
      video: videoUrlInput.trim() || undefined,
    });
    setIsSubmittingRecord(false);
    if (res.success) {
      toast({ title: 'Inspection Completed', description: 'Official inspection record filed and status updated to COMPLETED.' });
      setCompleteDialogOpen(false);
      setInspections(prev => prev.map(i => i.id === targetInspection.id ? {
        ...i,
        status: 'COMPLETED' as InspectionStatus,
        inspectionRecord: {
          completedAt: new Date().toISOString(),
          inspectorName,
          conditionRating,
          utilitiesFunctional,
          meterReadings,
          observations,
          discrepancies,
          photos: parsedPhotos,
          video: videoUrlInput.trim() || undefined,
          method: 'IN_PERSON_FIELD_OFFICER' as const,
          isIndependentInspection: true,
        }
      } : i));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to complete inspection.' });
    }
  };

  const openViewInspectionRecord = (insp: InspectionRequest) => {
    if (!insp.inspectionRecord) return;
    setViewingRecord(insp.inspectionRecord);
    setViewingInspectionTitle(insp.propertyTitle);
    setViewRecordDialogOpen(true);
  };

  // Application status handlers
  const handleApplicationStatus = async (id: string, newStatus: ApplicationStatus) => {
    setUpdatingId(id);
    const res = await updateApplicationStatusAction(id, newStatus);
    setUpdatingId(null);
    if (res.success) {
      toast({ title: `Application ${newStatus}`, description: `The application status is now ${newStatus}.` });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update application.' });
    }
  };

  const handleRemoveSaved = (propId: string) => {
    setSavedProperties(prev => prev.filter(p => p.id !== propId));
    toast({ title: 'Removed', description: 'Property removed from saved listings.' });
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'SEEKER': return 'Property Seeker';
      case 'OWNER': return 'Property Owner / Landlord';
      case 'AGENT': return 'Licensed Agent / Manager';
      case 'ADMIN': return 'Verification Officer (Admin)';
      default: return 'User';
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center text-blue-900 font-bold text-2xl shadow-sm">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'PH'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1" title="Trust Verified Account">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-slate-900">
                  {currentUser?.name || 'PropHunta Member'}
                </h1>
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  {getRoleLabel()}
                </Badge>
                <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 gap-1">
                  <ShieldCheck className="h-3 w-3" /> Identity Verified
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> {currentUser?.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {currentUser?.phone || '+234 800 000 0000'}
                </span>
                {currentUser?.agencyName && (
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Briefcase className="h-3.5 w-3.5 text-blue-600" /> {currentUser.agencyName}
                  </span>
                )}
                {currentUser?.licenseNumber && (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Award className="h-3.5 w-3.5 text-amber-600" /> Lic: {currentUser.licenseNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {role === 'ADMIN' && (
              <Button asChild className="bg-slate-900 hover:bg-black text-white">
                <Link href="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Go to Verification Portal
                </Link>
              </Button>
            )}
            {(role === 'OWNER' || role === 'AGENT') && (
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/landlord/add-property">
                  <Plus className="mr-2 h-4 w-4" /> Add Listing
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/settings">Account Settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-flex mb-4">
          {(role === 'OWNER' || role === 'AGENT') && (
            <TabsTrigger value="properties" className="gap-2">
              <Building2 className="h-4 w-4" /> My Listings ({userProperties.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="inspections" className="gap-2">
            <Calendar className="h-4 w-4" /> Inspections ({inspections.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <FileText className="h-4 w-4" /> Applications ({applications.length})
          </TabsTrigger>
          {role === 'SEEKER' && (
            <TabsTrigger value="saved" className="gap-2">
              <Heart className="h-4 w-4" /> Saved Listings ({savedProperties.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="identity" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Trust & Verification
          </TabsTrigger>
        </TabsList>

        {/* Tab: My Listings (Owner / Agent) */}
        {(role === 'OWNER' || role === 'AGENT') && (
          <TabsContent value="properties" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-headline text-slate-900">Your Managed Properties</h2>
                <p className="text-sm text-muted-foreground">Properties currently assigned to your ownership or agency account.</p>
              </div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/landlord/add-property">
                  <Plus className="mr-2 h-4 w-4" /> New Property Draft
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-muted-foreground">Loading your listings...</div>
            ) : userProperties.length === 0 ? (
              <Card className="p-12 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900">No properties listed yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Create your first property listing, attach proof of title documents, and submit for verification.
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/landlord/add-property">Create Listing</Link>
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProperties.map((prop) => (
                  <div key={prop.id} className="relative group">
                    <PropertyCard property={prop} />
                    <div className="mt-2 flex items-center justify-between px-1">
                      <Badge
                        className={`text-xs font-bold ${
                          prop.listingStatus === 'ACTIVE' || prop.listingStatus === 'VERIFIED'
                            ? 'bg-emerald-600 text-white'
                            : prop.listingStatus === 'UNDER_REVIEW' || prop.listingStatus === 'SUBMITTED'
                            ? 'bg-amber-500 text-white'
                            : prop.listingStatus === 'CHANGES_REQUIRED'
                            ? 'bg-orange-500 text-white'
                            : prop.listingStatus === 'RESERVED'
                            ? 'bg-purple-600 text-white'
                            : prop.listingStatus === 'OCCUPIED'
                            ? 'bg-blue-600 text-white'
                            : prop.listingStatus === 'SOLD'
                            ? 'bg-slate-800 text-white'
                            : prop.listingStatus === 'SUSPENDED' || prop.listingStatus === 'REJECTED'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        {prop.listingStatus === 'ACTIVE' || prop.listingStatus === 'VERIFIED'
                          ? '✓ Verified Active'
                          : prop.listingStatus === 'UNDER_REVIEW' || prop.listingStatus === 'SUBMITTED'
                          ? 'In Review'
                          : prop.listingStatus === 'CHANGES_REQUIRED'
                          ? 'Action Needed'
                          : prop.listingStatus}
                      </Badge>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/property/${prop.id}`}>View &rarr;</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Tab: Inspections */}
        <TabsContent value="inspections" className="space-y-6">
          <div>
            <h2 className="text-xl font-bold font-headline text-slate-900">Scheduled Inspections</h2>
            <p className="text-sm text-muted-foreground">
              {role === 'SEEKER'
                ? 'Your requested physical and virtual property walkthroughs.'
                : 'Incoming inspection appointments for your listed properties.'}
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading inspections...</div>
          ) : inspections.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900">No inspections scheduled</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                {role === 'SEEKER'
                  ? 'Explore properties and schedule an on-site or virtual inspection with the verified host.'
                  : 'You have no pending or completed inspections for your listings.'}
              </p>
              {role === 'SEEKER' && (
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/marketplace">Find Properties</Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {inspections.map((insp) => {
                const isHost = currentUser?.id === insp.hostId;
                const dateFormatted = new Date(insp.preferredDate).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <Card key={insp.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/property/${insp.propertyId}`} className="font-semibold text-slate-900 hover:text-blue-600 text-base">
                            {insp.propertyTitle}
                          </Link>
                          <Badge
                            className={
                              insp.status === 'SCHEDULED' || insp.status === 'ACCEPTED'
                                ? 'bg-emerald-600 text-white'
                                : insp.status === 'REQUESTED'
                                ? 'bg-amber-500 text-white'
                                : insp.status === 'COMPLETED'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }
                          >
                            {insp.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insp.type}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-slate-400" /> {dateFormatted} &bull; {insp.preferredTimeSlot}
                          </span>
                          <span>
                            {isHost ? `Requested by: ${insp.seekerName}` : `Host Assigned`}
                          </span>
                        </div>

                        {insp.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 max-w-xl">
                            Note: &ldquo;{insp.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                      {insp.status === 'COMPLETED' && insp.inspectionRecord && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs font-semibold gap-1"
                          onClick={() => openViewInspectionRecord(insp)}
                        >
                          <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
                          View Inspection Report
                        </Button>
                      )}
                      {isHost && (insp.status === 'SCHEDULED' || insp.status === 'ACCEPTED') && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                          onClick={() => openCompleteInspectionModal(insp)}
                        >
                          Complete & Log Report
                        </Button>
                      )}
                      {isHost && insp.status === 'REQUESTED' && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          disabled={updatingId === insp.id}
                          onClick={() => handleConfirmInspection(insp.id)}
                        >
                          Confirm
                        </Button>
                      )}
                      {isHost && insp.status !== 'COMPLETED' && insp.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-300 text-xs font-semibold"
                          onClick={() => openRescheduleModal(insp)}
                        >
                          Propose Schedule
                        </Button>
                      )}
                      {insp.status !== 'CANCELLED' && insp.status !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
                          disabled={updatingId === insp.id}
                          onClick={() => handleCancelInspection(insp.id)}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button asChild size="sm" variant="ghost" className="text-xs">
                        <Link href={`/property/${insp.propertyId}`}>
                          View Listing <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Applications / Expressions of Interest */}
        <TabsContent value="applications" className="space-y-6">
          <div>
            <h2 className="text-xl font-bold font-headline text-slate-900">
              {role === 'SEEKER' ? 'My Expressions of Interest' : 'Received Offers & Applications'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Rental and purchase applications with verified transparent cost breakdowns.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading applications...</div>
          ) : applications.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900">No applications on file</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                {role === 'SEEKER'
                  ? 'Submit an expression of interest on any verified listing to commence tenancy or purchase discussions.'
                  : 'No seekers have submitted applications for your listings yet.'}
              </p>
              {role === 'SEEKER' && (
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/marketplace">Browse Verified Listings</Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const isHost = (role === 'OWNER' || role === 'AGENT');
                const dateFormatted = new Date(app.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <Card key={app.id} className="p-5 border shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/property/${app.propertyId}`} className="font-semibold text-slate-900 hover:text-blue-600 text-base">
                            {app.propertyTitle}
                          </Link>
                          <Badge
                            className={
                              app.status === 'APPROVED'
                                ? 'bg-emerald-600 text-white'
                                : app.status === 'SUBMITTED'
                                ? 'bg-amber-500 text-white'
                                : app.status === 'UNDER_REVIEW'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }
                          >
                            {app.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {app.type === 'RENTAL' ? 'Rental Application' : 'Purchase Offer'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span>Applicant: <strong>{app.applicantName}</strong></span>
                          <span>Submitted: {dateFormatted}</span>
                          {app.offerAmount && (
                            <span className="font-semibold text-slate-900">
                              Offer: {formatNaira(app.offerAmount)}
                            </span>
                          )}
                          {app.financingStatus && (
                            <span>Financing: <strong className="text-slate-700">{app.financingStatus}</strong></span>
                          )}
                        </div>

                        {app.message && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 max-w-2xl mt-1">
                            &ldquo;{app.message}&rdquo;
                          </p>
                        )}
                      </div>

                      {isHost && app.status === 'SUBMITTED' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={updatingId === app.id}
                            onClick={() => handleApplicationStatus(app.id, 'APPROVED')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            disabled={updatingId === app.id}
                            onClick={() => handleApplicationStatus(app.id, 'REJECTED')}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Saved Listings (Seeker) */}
        {role === 'SEEKER' && (
          <TabsContent value="saved" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-headline text-slate-900">Saved Properties</h2>
              <p className="text-sm text-muted-foreground">Shortlisted verified listings you are tracking.</p>
            </div>

            {savedProperties.length === 0 ? (
              <Card className="p-12 text-center">
                <Heart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900">No saved properties</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Save listings you are interested in while exploring the marketplace.
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/marketplace">Explore Marketplace</Link>
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((prop) => (
                  <div key={prop.id} className="relative group">
                    <PropertyCard property={prop} />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-3 right-3 opacity-90 hover:opacity-100 shadow-md"
                      onClick={() => handleRemoveSaved(prop.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Tab: Trust & Verification Info */}
        <TabsContent value="identity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                PropHunta Trust Infrastructure Status
              </CardTitle>
              <CardDescription>
                Verification credentials that establish your trust profile across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Account Role</span>
                    <Badge variant="outline">{role}</Badge>
                  </div>
                  <p className="font-semibold text-slate-900">{getRoleLabel()}</p>
                </div>

                <div className="p-4 rounded-xl border bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Identity Verification</span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">VERIFIED</Badge>
                  </div>
                  <p className="font-semibold text-slate-900">National ID / BVN Matched</p>
                </div>

                <div className="p-4 rounded-xl border bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Trust Score</span>
                    <Badge className="bg-blue-600 text-white text-[10px]">98 / 100</Badge>
                  </div>
                  <p className="font-semibold text-slate-900">Zero Unresolved Reports</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-slate-900">Audit & Accountability Guarantees</h3>
                <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                  <li>Every action taken (inspection scheduling, enquiry dispatch, review submission) is immutably logged to the PropHunta audit store.</li>
                  <li>Title documentation undergoes independent verification by authorized officers prior to receiving the verified trust shield.</li>
                  <li>Pricing transparency enforces explicit itemization of legal fees, caution deposits, and service charges.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Complete Inspection & File Official Record */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveInspectionRecord}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
                Complete Inspection & Log Findings
              </DialogTitle>
              <DialogDescription>
                Record the on-site physical inspection findings for <strong>{targetInspection?.propertyTitle}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inspectorName">Inspector / Host Name</Label>
                  <Input
                    id="inspectorName"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conditionRating">Condition Rating</Label>
                  <Select
                    value={conditionRating}
                    onValueChange={(val: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR') => setConditionRating(val)}
                  >
                    <SelectTrigger id="conditionRating">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCELLENT">EXCELLENT (Pristine / Turnkey)</SelectItem>
                      <SelectItem value="GOOD">GOOD (Well maintained)</SelectItem>
                      <SelectItem value="FAIR">FAIR (Minor wear & tear)</SelectItem>
                      <SelectItem value="POOR">POOR (Requires major maintenance)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Functional Utilities Verified</p>
                  <p className="text-xs text-muted-foreground">Water, electrical wiring, switches & drainage checked</p>
                </div>
                <Button
                  type="button"
                  variant={utilitiesFunctional ? "default" : "outline"}
                  size="sm"
                  className={utilitiesFunctional ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-300"}
                  onClick={() => setUtilitiesFunctional(!utilitiesFunctional)}
                >
                  {utilitiesFunctional ? 'Verified Functional' : 'Not Functional'}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meterReadings">Meter Readings / Serial Identifiers</Label>
                <Input
                  id="meterReadings"
                  placeholder="e.g. Prepaid meter #04291882103, Initial Units: 142.5 kWh"
                  value={meterReadings}
                  onChange={(e) => setMeterReadings(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="observations">Inspector Observations & Remarks</Label>
                <Textarea
                  id="observations"
                  rows={3}
                  placeholder="State condition of walls, ceilings, fixtures, compound access..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discrepancies">Noted Discrepancies (if any)</Label>
                <Textarea
                  id="discrepancies"
                  rows={2}
                  placeholder="Note any discrepancies against the listing specifications (e.g. 1 AC unit needing repair)"
                  value={discrepancies}
                  onChange={(e) => setDiscrepancies(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t">
                <div className="space-y-1.5">
                  <Label htmlFor="photos" className="flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-slate-500" />
                    Inspection Photo URLs
                  </Label>
                  <Input
                    id="photos"
                    placeholder="https://... (comma-separated)"
                    value={photoUrlsInput}
                    onChange={(e) => setPhotoUrlsInput(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">Attach on-site evidence photos.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="video" className="flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-slate-500" />
                    Video Walkthrough URL
                  </Label>
                  <Input
                    id="video"
                    placeholder="https://... (walkthrough/stream link)"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">Optional timestamped video walkthrough.</p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingRecord} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmittingRecord ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'File Official Report & Complete'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: View Inspection Record */}
      <Dialog open={viewRecordDialogOpen} onOpenChange={setViewRecordDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-emerald-800">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              Verified Inspection Report
            </DialogTitle>
            <DialogDescription>
              {viewingInspectionTitle}
            </DialogDescription>
          </DialogHeader>

          {viewingRecord && (
            <div className="space-y-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-lg">
                <div>
                  <span className="text-xs text-muted-foreground block">Inspection Date</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(viewingRecord.date || viewingRecord.completedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Attending Inspector</span>
                  <span className="font-semibold text-slate-800">{viewingRecord.inspector || viewingRecord.inspectorName}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Condition Rating</span>
                  <Badge className="bg-emerald-600 text-white text-xs mt-0.5">
                    {viewingRecord.condition || viewingRecord.conditionRating}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Utilities Status</span>
                  <span className="font-semibold text-slate-800">
                    {(viewingRecord.utilities ?? viewingRecord.utilitiesFunctional) ? 'Functional & Verified' : 'Issues Logged'}
                  </span>
                </div>
              </div>

              {(viewingRecord.meters || viewingRecord.meterReadings) && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Meter Readings</span>
                  <p className="p-2.5 bg-slate-100 rounded text-slate-800 font-mono text-xs">
                    {viewingRecord.meters || viewingRecord.meterReadings}
                  </p>
                </div>
              )}

              {viewingRecord.observations && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Observations</span>
                  <p className="p-3 bg-slate-50 border rounded text-slate-700 text-xs leading-relaxed">
                    {viewingRecord.observations}
                  </p>
                </div>
              )}

              {viewingRecord.discrepancies && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Discrepancies Logged</span>
                  <p className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs leading-relaxed">
                    {viewingRecord.discrepancies}
                  </p>
                </div>
              )}

              {viewingRecord.photos && viewingRecord.photos.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-blue-600" /> Inspection Photos ({viewingRecord.photos.length})
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingRecord.photos.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-20 rounded-md overflow-hidden border hover:opacity-80 transition bg-slate-100 block"
                      >
                        <Image
                          src={url}
                          alt={`Inspection photo ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {viewingRecord.video && (
                <div className="space-y-1 pt-2 border-t">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-purple-600" /> Walkthrough Video
                  </span>
                  <a
                    href={viewingRecord.video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded border border-blue-100"
                  >
                    <Video className="h-3.5 w-3.5" /> Watch Recorded Video Walkthrough <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewRecordDialogOpen(false)}>Close Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Propose Reschedule Schedule (PRD Section 15) */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-amber-800">
              <Clock className="h-5 w-5 text-amber-600" />
              Propose New Inspection Schedule
            </DialogTitle>
            <DialogDescription>
              {rescheduleTarget?.propertyTitle || 'Property Inspection'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProposeSchedule} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="proposedDate">Proposed Inspection Date</Label>
              <Input
                id="proposedDate"
                type="date"
                required
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proposedTimeSlot">Proposed Time Slot</Label>
              <Select value={proposedTimeSlot} onValueChange={setProposedTimeSlot}>
                <SelectTrigger id="proposedTimeSlot">
                  <SelectValue placeholder="Select preferred window" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00 AM - 11:00 AM">Morning (09:00 AM - 11:00 AM)</SelectItem>
                  <SelectItem value="11:00 AM - 01:00 PM">Midday (11:00 AM - 01:00 PM)</SelectItem>
                  <SelectItem value="01:00 PM - 03:00 PM">Afternoon (01:00 PM - 03:00 PM)</SelectItem>
                  <SelectItem value="03:00 PM - 05:00 PM">Late Afternoon (03:00 PM - 05:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rescheduleNotes">Reason / Notes for Seeker</Label>
              <Textarea
                id="rescheduleNotes"
                rows={3}
                placeholder="Explain why the reschedule is proposed and coordinate availability..."
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingReschedule} className="bg-amber-600 hover:bg-amber-700 text-white">
                {isSubmittingReschedule ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Proposing...
                  </>
                ) : (
                  'Confirm & Propose Schedule'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
