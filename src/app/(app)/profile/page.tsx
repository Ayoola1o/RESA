'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  CalendarCheck2,
  FileText,
  Heart,
  Settings,
  ArrowRight,
  BadgeCheck,
  Upload,
  FileCheck,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Copy,
  Check,
  Eye,
  Download,
  RefreshCw,
  MapPin,
  CheckCircle,
  Trash2,
  AlertCircle,
  FileX,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUserRole } from '@/context/UserRoleContext';
import { useToast } from '@/hooks/use-toast';
import {
  getUserInspectionsAction,
  getUserApplicationsAction,
  getUserPropertiesAction,
  getUserDocumentsAction,
  uploadUserDocumentAction,
  deleteUserDocumentAction,
  getSavedPropertyIdsAction,
  getSeekerPreferencesAction,
  saveSeekerPreferencesAction,
  getUserVerificationOverviewAction,
} from '@/server/actions/prophunta-actions';
import {
  UserRole,
  UserDocument,
  UserDocumentType,
  SeekerHousingPreferences,
} from '@/types/prophunta';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading verified profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

const POPULAR_LOCATIONS = [
  'Lekki Phase 1, Lagos',
  'Ikoyi, Lagos',
  'Victoria Island, Lagos',
  'Ikeja GRA, Lagos',
  'Maitama, Abuja',
  'Wuse 2, Abuja',
  'Yaba / Surulere',
];

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(isoString?: string): string {
  if (!isoString) return 'Recent';
  try {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

function ProfileContent() {
  const { currentUser, role } = useUserRole();
  const activeRole: UserRole = currentUser?.role || role || 'SEEKER';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('verification');
  const [copiedId, setCopiedId] = useState(false);

  // Tab sync with query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return;
    const t = tabParam.toLowerCase().trim();

    if (t === 'verification' || t === 'trust' || t === 'identity' || t === 'credentials' || t === 'kyc') {
      setActiveTab('verification');
    } else if (t === 'preferences' || t === 'search-criteria' || t === 'filters') {
      setActiveTab('preferences');
    } else if (t === 'activity' || t === 'records') {
      setActiveTab('activity');
    } else if (t === 'overview' || t === 'profile') {
      setActiveTab('overview');
    } else if (t === 'inspections' || t === 'inspection') {
      router.replace('/inspections');
    } else if (t === 'applications' || t === 'application' || t === 'offers') {
      router.replace('/applications');
    } else if (t === 'saved' || t === 'favorites') {
      router.replace('/saved');
    } else if (t === 'properties' || t === 'listings') {
      router.replace('/properties');
    }
  }, [searchParams, router]);

  // Genuine Data States
  const [inspectionCount, setInspectionCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Document management states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDocType, setNewDocType] = useState<UserDocumentType>('GOVERNMENT_ID');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seeker housing preferences states
  const [targetLocations, setTargetLocations] = useState<string[]>([
    'Lekki Phase 1, Lagos',
    'Victoria Island, Lagos',
  ]);
  const [minBudget, setMinBudget] = useState('3000000');
  const [maxBudget, setMaxBudget] = useState('9000000');
  const [propertyTypePref, setPropertyTypePref] = useState('Apartment');
  const [bedroomsPref, setBedroomsPref] = useState('2-3 Bedrooms');
  const [moveInTimeline, setMoveInTimeline] = useState('Within 30 Days');
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Load verified summary stats, documents, and preferences
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const overviewRes = await getUserVerificationOverviewAction().catch(() => null);

        if (mounted && overviewRes?.success && overviewRes.data) {
          setInspectionCount(overviewRes.data.inspectionCount);
          setApplicationCount(overviewRes.data.applicationCount);
          setPropertyCount(overviewRes.data.propertyCount);
          setSavedCount(overviewRes.data.savedCount);
          setDocuments(overviewRes.data.documents || []);
        } else {
          // Fallback individual queries
          const [inspData, appData, propData, docsRes, savedRes] = await Promise.all([
            getUserInspectionsAction().catch(() => []),
            getUserApplicationsAction().catch(() => []),
            getUserPropertiesAction().catch(() => []),
            getUserDocumentsAction().catch(() => ({ success: false, documents: [] })),
            getSavedPropertyIdsAction().catch(() => ({ success: false, propertyIds: [] })),
          ]);

          if (mounted) {
            setInspectionCount(inspData?.length || 0);
            setApplicationCount(appData?.length || 0);
            setPropertyCount(propData?.length || 0);
            setSavedCount(savedRes?.propertyIds?.length || 0);
            setDocuments(docsRes?.documents || []);
          }
        }

        // Load persisted seeker preferences
        const prefRes = await getSeekerPreferencesAction().catch(() => null);
        if (mounted && prefRes?.success && prefRes.preferences) {
          const p = prefRes.preferences;
          if (p.targetLocations) setTargetLocations(p.targetLocations);
          if (p.minBudget) setMinBudget(p.minBudget);
          if (p.maxBudget) setMaxBudget(p.maxBudget);
          if (p.propertyType) setPropertyTypePref(p.propertyType);
          if (p.bedrooms) setBedroomsPref(p.bedrooms);
          if (p.timeline) setMoveInTimeline(p.timeline);
        }
      } catch (err) {
        console.error('Failed to load profile details', err);
      } finally {
        if (mounted) setLoadingOverview(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  const handleCopyId = () => {
    const idToCopy = currentUser?.id;
    if (!idToCopy) {
      toast({
        title: 'ID Unavailable',
        description: 'Unable to locate your platform account ID.',
        variant: 'destructive',
      });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      toast({
        title: 'Seeker ID Copied',
        description: `${idToCopy} copied to clipboard for verified property applications.`,
      });
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPreferences(true);

    try {
      const payload = {
        targetLocations,
        minBudget,
        maxBudget,
        propertyType: propertyTypePref,
        bedrooms: bedroomsPref,
        timeline: moveInTimeline,
      };

      const res = await saveSeekerPreferencesAction(payload);
      if (res.success) {
        toast({
          title: 'Housing Preferences Saved',
          description: 'Your verified seeker criteria have been saved and persisted to your profile.',
        });
      } else {
        throw new Error(res.error || 'Failed to save preferences');
      }
    } catch (err: any) {
      toast({
        title: 'Error Saving Preferences',
        description: err.message || 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  const toggleLocationPref = (loc: string) => {
    if (targetLocations.includes(loc)) {
      setTargetLocations(targetLocations.filter((l) => l !== loc));
    } else {
      setTargetLocations([...targetLocations, loc]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Maximum allowable file size is 10MB.',
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      if (!newDocTitle) {
        setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      toast({
        title: 'Please choose a file',
        description: 'Select a valid PDF or JPG/PNG image credential to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', newDocType);
      formData.append('title', newDocTitle || selectedFile.name);

      const res = await uploadUserDocumentAction(formData);

      if (res.success && res.document) {
        setDocuments((prev) => [res.document!, ...prev]);
        setIsUploadOpen(false);
        setSelectedFile(null);
        setNewDocTitle('');
        if (fileInputRef.current) fileInputRef.current.value = '';

        toast({
          title: 'Document Submitted for Review',
          description: `${res.document.title} has been encrypted and vaulted. Status is PENDING verification by compliance officers.`,
        });
      } else {
        throw new Error(res.error || 'Failed to upload document');
      }
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message || 'Could not vault document. Please verify the file and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!confirm(`Are you sure you want to remove "${docTitle}" from your credential vault?`)) {
      return;
    }

    try {
      const res = await deleteUserDocumentAction(docId);
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        toast({
          title: 'Document Removed',
          description: `"${docTitle}" has been securely purged from your vault.`,
        });
      } else {
        throw new Error(res.error || 'Failed to delete');
      }
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Could not delete document.',
        variant: 'destructive',
      });
    }
  };

  const getRoleLabel = () => {
    switch (activeRole) {
      case 'SEEKER': return 'Property Seeker';
      case 'OWNER': return 'Property Owner';
      case 'AGENT': return 'Licensed Real Estate Agent';
      case 'ADMIN': return 'Compliance & Verification Officer';
      default: return 'Member';
    }
  };

  // Honest verification flags
  const isVerified = currentUser?.verificationStatus === 'VERIFIED' && currentUser?.kycStatus === 'VERIFIED';
  const isPending =
    currentUser?.verificationStatus === 'PENDING' ||
    currentUser?.kycStatus === 'PENDING' ||
    currentUser?.kycStatus === 'IN_REVIEW';

  const memberSinceDisplay = currentUser?.createdAt
    ? `Member since ${new Date(currentUser.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
    : 'Member';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Header Hero Card */}
      <Card className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="h-20 bg-gradient-to-r from-slate-950 via-[#0e1710] to-lime-950 relative">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-500/20 border border-lime-400/40 px-3 py-1 text-xs font-bold text-lime-300 backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5 text-lime-400" />
                Verified Trust Account
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Verification In Progress
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/20 border border-slate-400/40 px-3 py-1 text-xs font-bold text-slate-300 backdrop-blur-md">
                <AlertCircle className="h-3.5 w-3.5 text-slate-300" />
                Verification Required
              </span>
            )}
          </div>
        </div>

        <CardContent className="px-5 sm:px-8 pb-6 pt-0 -mt-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div
                  className={`h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white p-1 shadow-lg border-2 ${
                    isVerified ? 'border-lime-500' : isPending ? 'border-amber-500' : 'border-slate-300'
                  }`}
                >
                  <div className="h-full w-full rounded-xl bg-gradient-to-br from-lime-700 to-emerald-800 flex items-center justify-center text-white font-black text-2xl sm:text-3xl tracking-tight">
                    {currentUser?.name
                      ? currentUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'PS'}
                  </div>
                </div>
                {isVerified && (
                  <div
                    className="absolute -bottom-1 -right-1 bg-lime-500 text-slate-950 rounded-full p-1.5 shadow-md border-2 border-white"
                    title="PropHunta Verified Trust Badge"
                  >
                    <ShieldCheck className="h-4 w-4 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black font-headline text-slate-900 tracking-tight">
                    {currentUser?.name || 'Property Seeker'}
                  </h1>
                  <Badge className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs gap-1 py-1">
                    <ShieldCheck className="h-3 w-3" /> {getRoleLabel()}
                  </Badge>
                  {isVerified ? (
                    <Badge variant="outline" className="border-lime-500/80 text-lime-800 bg-lime-50 gap-1 text-xs py-1">
                      <BadgeCheck className="h-3.5 w-3.5 text-lime-600" /> Tier 1 Verified
                    </Badge>
                  ) : isPending ? (
                    <Badge variant="outline" className="border-amber-500/80 text-amber-800 bg-amber-50 gap-1 text-xs py-1">
                      <Clock className="h-3.5 w-3.5 text-amber-600" /> Review In Progress
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-300 text-slate-600 bg-slate-50 gap-1 text-xs py-1">
                      <AlertCircle className="h-3.5 w-3.5 text-slate-400" /> Unverified
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {currentUser?.email || 'seeker@prophunta.ng'}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {currentUser?.phone || 'Not provided'}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-lime-700 shrink-0" /> Nigeria
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {memberSinceDisplay}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyId}
                disabled={!currentUser?.id}
                className="rounded-xl text-xs font-semibold gap-1.5 h-9"
              >
                {copiedId ? <Check className="h-3.5 w-3.5 text-lime-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId ? 'Copied ID' : 'Copy Seeker ID'}
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-9">
                <Link href="/settings">
                  <Settings className="h-3.5 w-3.5" /> Account Settings
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Trust & Activity KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Trust Status</span>
            <span
              className={`h-2 w-2 rounded-full ${
                isVerified ? 'bg-lime-500' : isPending ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-headline text-slate-900 flex items-center gap-1.5">
              <ShieldCheck
                className={`h-5 w-5 ${
                  isVerified ? 'text-lime-600' : isPending ? 'text-amber-600' : 'text-slate-400'
                }`}
              />
              {isVerified ? 'Tier 1' : isPending ? 'Pending' : 'Unverified'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isVerified
                ? 'Government ID cleared'
                : isPending
                ? 'Credentials in review'
                : 'Upload ID to activate'}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Tenancy Protection</span>
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-headline text-slate-900">
              Protected
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Standard tenancy terms</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Active Applications</span>
            <FileText className="h-4 w-4 text-lime-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-headline text-slate-900">
              {applicationCount} Active
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">In review or escrow stage</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Inspections Booked</span>
            <CalendarCheck2 className="h-4 w-4 text-lime-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-headline text-slate-900">
              {inspectionCount} Walkthroughs
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Verified agent scheduled</p>
          </div>
        </Card>
      </div>

      {/* Main Tabbed Profile Hub */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto gap-1 border border-slate-200">
          <TabsTrigger
            value="verification"
            className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-lime-800 data-[state=active]:shadow-xs"
          >
            <ShieldCheck className="h-4 w-4 text-lime-600" />
            <span>Trust & Verification</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isVerified ? 'bg-lime-500' : isPending ? 'bg-amber-500' : 'bg-slate-400'
              }`}
            />
          </TabsTrigger>

          <TabsTrigger
            value="preferences"
            className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <span>Housing Preferences</span>
          </TabsTrigger>

          <TabsTrigger
            value="activity"
            className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <CalendarCheck2 className="h-4 w-4 text-slate-500" />
            <span>Activity & Records</span>
          </TabsTrigger>

          <TabsTrigger
            value="overview"
            className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <UserIcon className="h-4 w-4 text-slate-500" />
            <span>Account Details</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TRUST & VERIFICATION */}
        <TabsContent value="verification" className="space-y-6 outline-none">
          {/* Trust Infrastructure Overview Banner */}
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-gradient-to-br from-slate-900 via-[#0d160e] to-slate-950 text-white p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-lime-500/20 px-3 py-1 text-xs font-semibold text-lime-400 border border-lime-500/30">
                  <ShieldCheck className="h-3.5 w-3.5 text-lime-400" />
                  PropHunta Verified Trust Ecosystem
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-headline text-white tracking-tight">
                  Your Account Trust & Verification Passport
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Verified Seekers gain priority review from property owners and licensed agents. Vault your identity credentials securely to unlock fast-track inspection bookings and rental offer processing.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-xl text-xs gap-2 shadow-sm">
                      <Upload className="h-4 w-4" /> Upload Credential Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-headline text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-lime-600" /> Add Verification Credential
                      </DialogTitle>
                      <DialogDescription>
                        Upload genuine government-issued identification or tenancy eligibility documents for encrypted vaulting and compliance review.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="doc-type" className="text-xs font-bold text-slate-700">Document Type</Label>
                        <select
                          id="doc-type"
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value as UserDocumentType)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                        >
                          <option value="GOVERNMENT_ID">Government Identity (NIN / Passport / Voter Card)</option>
                          <option value="PROOF_OF_INCOME">Proof of Employment / Income (Work ID / Pay Slip)</option>
                          <option value="PROOF_OF_ADDRESS">Proof of Current Residence (Utility / Tenancy Receipt)</option>
                          <option value="EMPLOYMENT_LETTER">Employer Reference / Guarantor Letter</option>
                          <option value="OTHER">Other Supporting Credential</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="doc-name" className="text-xs font-bold text-slate-700">Document Title or Description</Label>
                        <Input
                          id="doc-name"
                          placeholder="e.g. Nigerian National ID Card / Work ID"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          className="rounded-xl text-xs"
                        />
                      </div>

                      {/* Interactive File Upload Area */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-6 text-center space-y-2 cursor-pointer transition-colors"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Upload className="mx-auto h-8 w-8 text-slate-400" />
                        <div className="text-xs text-slate-700 font-medium">
                          {selectedFile ? (
                            <span className="font-bold text-lime-700 block truncate max-w-xs mx-auto">
                              {selectedFile.name} ({formatBytes(selectedFile.size)})
                            </span>
                          ) : (
                            <>
                              <span className="font-bold text-lime-700">Click to select document file</span>
                            </>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">PDF, PNG, JPG up to 10MB</p>
                      </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="rounded-xl text-xs">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUploadDocument}
                        disabled={isUploading || !selectedFile}
                        className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-xs gap-1.5"
                      >
                        {isUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5" />}
                        {isUploading ? 'Encrypting & Vaulting...' : 'Submit to Vault'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>

          {/* Three Foundational Trust Verification Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-lime-800 uppercase tracking-wider bg-lime-50 px-2 py-0.5 rounded border border-lime-200">
                  Identity Anchor
                </span>
                {isVerified ? (
                  <Badge className="bg-lime-600 text-white text-[10px] font-bold">VERIFIED</Badge>
                ) : isPending ? (
                  <Badge className="bg-amber-600 text-white text-[10px] font-bold">IN REVIEW</Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-500 border-slate-300 text-[10px] font-bold">UNVERIFIED</Badge>
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Official Identity Credential</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Government-issued photo identification verified against user registration details by compliance officers.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Status: {isVerified ? 'Validated' : isPending ? 'Audit In Progress' : 'Action Required'}</span>
                <span className="font-medium text-slate-700">
                  {isVerified ? 'Verified by Officer' : isPending ? 'Under Review' : 'No Credential On File'}
                </span>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Tenancy Standards
                </span>
                <Badge className="bg-lime-600 text-white text-[10px] font-bold">ACTIVE</Badge>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Regulatory Tenancy Code</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Standard Lagos State Tenancy Law standards applied to protect tenants against unauthorized charges.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Standing: Good Standing</span>
                <span className="font-medium text-slate-700">Tenancy Law Standard</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Escrow Protection
                </span>
                <Badge className="bg-lime-600 text-white text-[10px] font-bold">ENABLED</Badge>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Direct Caution Deposit Shield</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Rent and caution deposits are held in segregated accounts until key handover and physical inspection completion.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Protection: Protected Escrow</span>
                <span className="font-medium text-slate-700">Segregated Custody</span>
              </div>
            </Card>
          </div>

          {/* Verified Credential Documents Vault */}
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-lime-600" />
                  Encrypted Credential Documents Vault
                </CardTitle>
                <CardDescription>
                  Confidential files verifying your identity, income, and tenancy eligibility stored in private storage.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs border-lime-500 text-lime-800 bg-lime-50 self-start sm:self-auto">
                {documents.length} {documents.length === 1 ? 'Credential' : 'Credentials'} on File
              </Badge>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-xl bg-slate-50/50 space-y-3">
                  <FileX className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">No credential documents vaulted yet</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                      Upload your national ID card, passport, or utility receipt to build your verified trust score.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-lime-600 hover:bg-lime-500 text-white text-xs font-bold rounded-xl"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Document Now
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-slate-900">{doc.title || doc.fileName}</p>
                            <Badge
                              className={`text-[10px] font-bold text-white ${
                                doc.status === 'VERIFIED'
                                  ? 'bg-lime-600'
                                  : doc.status === 'UNDER_REVIEW' || doc.status === 'PENDING'
                                  ? 'bg-amber-600'
                                  : 'bg-rose-600'
                              }`}
                            >
                              {doc.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {doc.documentType.replace(/_/g, ' ')} • {doc.fileName}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                            <span>•</span>
                            <span>{formatBytes(doc.fileSize)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/documents/${doc.id}`, '_blank')}
                          className="h-8 text-xs font-semibold rounded-lg text-slate-700 hover:text-slate-900"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/documents/${doc.id}?download=1`, '_blank')}
                          className="h-8 text-xs font-semibold rounded-lg text-slate-700 hover:text-slate-900"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" /> Download
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id, doc.title || doc.fileName)}
                          className="h-8 text-xs font-semibold rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Timeline & Accountability Guarantees */}
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
            <CardHeader>
              <CardTitle className="font-headline text-base flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-lime-600" />
                Verified Seeker Protections & Inspection Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Zero Unregistered Agent Directives</p>
                    <p className="text-muted-foreground mt-0.5">All agents conducting inspections are licensed and bound by platform anti-fraud standards.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">No Illicit Caution Fee Extortion</p>
                    <p className="text-muted-foreground mt-0.5">Caution fee clauses must be itemized and protected under escrow release guidelines.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Audit Logged Communication</p>
                    <p className="text-muted-foreground mt-0.5">All inspection booking schedules and message inquiries are recorded to the tamper-evident audit log.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Direct Physical Walkthrough Guarantee</p>
                    <p className="text-muted-foreground mt-0.5">No rental agreements may be finalized until a physical or verified field audit walkthrough is completed.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: HOUSING SEARCH PREFERENCES */}
        <TabsContent value="preferences" className="space-y-6 outline-none">
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-lime-600" />
                Seeker Housing & Rental Search Preferences
              </CardTitle>
              <CardDescription>
                Customize your ideal home specifications. We use these criteria to match verified Nigerian property listings and dispatch instant updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-6">
                {/* Target Locations */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-800">Target Neighborhoods & Cities</Label>
                  <p className="text-xs text-muted-foreground">Select popular locations or tap to customize your search radius.</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {POPULAR_LOCATIONS.map((loc) => {
                      const isSelected = targetLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleLocationPref(loc)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-lime-600 text-white border-lime-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="inline-block mr-1 h-3 w-3" />}
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Target Budget Range */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-800">Target Annual Budget (Nigerian Naira ₦)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Minimum Rent (₦/yr)</span>
                      <Input
                        type="number"
                        value={minBudget}
                        onChange={(e) => setMinBudget(e.target.value)}
                        placeholder="2,000,000"
                        className="rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Maximum Rent (₦/yr)</span>
                      <Input
                        type="number"
                        value={maxBudget}
                        onChange={(e) => setMaxBudget(e.target.value)}
                        placeholder="10,000,000"
                        className="rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => { setMinBudget('2000000'); setMaxBudget('5000000'); }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px]"
                    >
                      ₦2M - ₦5M
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMinBudget('5000000'); setMaxBudget('12000000'); }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px]"
                    >
                      ₦5M - ₦12M
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMinBudget('15000000'); setMaxBudget('35000000'); }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px]"
                    >
                      ₦15M - ₦35M+
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Property Type and Bedrooms */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">Property Type</Label>
                    <select
                      value={propertyTypePref}
                      onChange={(e) => setPropertyTypePref(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option>Apartment / Flat</option>
                      <option>Semi-Detached Duplex</option>
                      <option>Fully Detached House</option>
                      <option>Terrace Duplex</option>
                      <option>Penthouse</option>
                      <option>Self-Contain / Studio</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">Bedrooms Count</Label>
                    <select
                      value={bedroomsPref}
                      onChange={(e) => setBedroomsPref(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option>1 Bedroom</option>
                      <option>2 Bedrooms</option>
                      <option>2-3 Bedrooms</option>
                      <option>3-4 Bedrooms</option>
                      <option>5+ Bedrooms</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">Move-in Horizon</Label>
                    <select
                      value={moveInTimeline}
                      onChange={(e) => setMoveInTimeline(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      <option>Immediate (Within 7 Days)</option>
                      <option>Within 30 Days</option>
                      <option>1 - 3 Months</option>
                      <option>Just Exploring / Flexible</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingPreferences}
                    className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-xs gap-2"
                  >
                    {savingPreferences ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {savingPreferences ? 'Saving...' : 'Save Housing Preferences'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ACTIVITY & RECORDS */}
        <TabsContent value="activity" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/inspections"
              className="group p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-lime-500 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarCheck2 className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-xs font-bold border-lime-500 text-lime-800">
                  {inspectionCount} scheduled
                </Badge>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-lime-700 flex items-center gap-1.5 transition-colors">
                  My Inspections <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Physical walkthrough bookings, scheduled calendar slots, and verified field audit reports.
                </p>
              </div>
            </Link>

            <Link
              href="/applications"
              className="group p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-lime-500 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-xs font-bold border-lime-500 text-lime-800">
                  {applicationCount} active
                </Badge>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-lime-700 flex items-center gap-1.5 transition-colors">
                  Applications & Offers <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tenancy offers, landlord review stages, lease signatures, and escrow caution deposit holds.
                </p>
              </div>
            </Link>

            <Link
              href="/saved"
              className="group p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-lime-500 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Heart className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-xs font-bold border-lime-500 text-lime-800">
                  {savedCount} saved
                </Badge>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-lime-700 flex items-center gap-1.5 transition-colors">
                  Saved Favorites <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your bookmarked properties across Lekki, Ikoyi, Victoria Island, and Abuja.
                </p>
              </div>
            </Link>
          </div>
        </TabsContent>

        {/* TAB 4: ACCOUNT DETAILS */}
        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-lime-600" />
                  Personal Information & Credentials
                </CardTitle>
                <CardDescription>
                  Identity credentials tied to your PropHunta account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border bg-slate-50/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Full Legal Name</span>
                    <p className="font-bold text-slate-900 truncate">{currentUser?.name || 'Property Seeker'}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Platform Role</span>
                    <p className="font-bold text-slate-900 truncate">{getRoleLabel()}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Registered Email</span>
                    <p className="font-bold text-slate-900 truncate">{currentUser?.email || 'seeker@prophunta.ng'}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Registered Phone</span>
                    <p className="font-bold text-slate-900 truncate">{currentUser?.phone || 'Not provided'}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Account Status:{' '}
                    <strong className={isVerified ? 'text-lime-700' : isPending ? 'text-amber-700' : 'text-slate-700'}>
                      {isVerified ? 'Verified & In Good Standing' : isPending ? 'Verification Under Review' : 'Unverified Account'}
                    </strong>
                  </span>
                  <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
                    <Link href="/settings">Edit in Settings</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-lime-600" />
                  Trust Badges & Security Standing
                </CardTitle>
                <CardDescription>
                  Active verification seals attached to your tenancy offers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Identity Credential Audit</p>
                    <p className="text-[11px] text-muted-foreground">Officer review of government photo identification</p>
                  </div>
                  {isVerified ? (
                    <Badge className="bg-lime-600 text-white text-[11px] font-bold">VERIFIED</Badge>
                  ) : isPending ? (
                    <Badge className="bg-amber-600 text-white text-[11px] font-bold">IN REVIEW</Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 border-slate-300 text-[11px] font-bold">UNVERIFIED</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Tenancy Compliance Standard</p>
                    <p className="text-[11px] text-muted-foreground">Lagos State Tenancy Law protection standards</p>
                  </div>
                  <Badge className="bg-lime-600 text-white text-[11px] font-bold">ACTIVE</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Escrow Security Standing</p>
                    <p className="text-[11px] text-muted-foreground">Segregated deposit custody and cautionary protection</p>
                  </div>
                  <Badge className="bg-lime-600 text-white text-[11px] font-bold">TIER 1</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
