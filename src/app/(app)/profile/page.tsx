'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  CalendarCheck2,
  FileText,
  Heart,
  BarChart3,
  Settings,
  ArrowRight,
  Briefcase,
  Award,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Upload,
  FileCheck,
  SlidersHorizontal,
  AlertCircle,
  Clock,
  Sparkles,
  Copy,
  Check,
  Lock,
  Eye,
  Download,
  RefreshCw,
  Home,
  MapPin,
  CheckCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  getPropertiesAction,
} from '@/server/actions/prophunta-actions';
import { UserRole } from '@/types/prophunta';
import { formatNaira } from '@/lib/utils';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading verified profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

interface VerificationDoc {
  id: string;
  name: string;
  type: string;
  status: 'VERIFIED' | 'UNDER_REVIEW' | 'PENDING';
  dateAdded: string;
  fileSize: string;
}

const DEFAULT_DOCUMENTS: VerificationDoc[] = [
  {
    id: 'doc-1',
    name: 'National Identity Number (NIN) Slip',
    type: 'Government Identity (NIN/BVN)',
    status: 'VERIFIED',
    dateAdded: '12 Jan 2026',
    fileSize: '1.4 MB',
  },
  {
    id: 'doc-2',
    name: 'Proof of Employment / Letter of Engagement',
    type: 'Income & Employment Verification',
    status: 'VERIFIED',
    dateAdded: '14 Jan 2026',
    fileSize: '2.1 MB',
  },
  {
    id: 'doc-3',
    name: 'Lagos State Utility Residence Bill',
    type: 'Proof of Current Residence',
    status: 'VERIFIED',
    dateAdded: '20 Jan 2026',
    fileSize: '950 KB',
  },
];

const POPULAR_LOCATIONS = [
  'Lekki Phase 1, Lagos',
  'Ikoyi, Lagos',
  'Victoria Island, Lagos',
  'Ikeja GRA, Lagos',
  'Maitama, Abuja',
  'Wuse 2, Abuja',
  'Yaba / Surulere',
];

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

  // Data states for summary stats
  const [inspectionCount, setInspectionCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [savedCount, setSavedCount] = useState(2);

  // Document management states
  const [documents, setDocuments] = useState<VerificationDoc[]>(DEFAULT_DOCUMENTS);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDocType, setNewDocType] = useState('Government Identity (Passport / Voter Card)');
  const [newDocFile, setNewDocFile] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

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

  // Load summary stats and preferences
  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const [inspData, appData, propData, allProps] = await Promise.all([
          getUserInspectionsAction().catch(() => []),
          getUserApplicationsAction().catch(() => []),
          getUserPropertiesAction().catch(() => []),
          getPropertiesAction().catch(() => []),
        ]);
        if (mounted) {
          setInspectionCount(inspData?.length || 0);
          setApplicationCount(appData?.length || 0);
          setPropertyCount(propData?.length || 0);

          try {
            const savedFromStorage = localStorage.getItem('prophunta_saved_properties');
            if (savedFromStorage) {
              const parsed = JSON.parse(savedFromStorage);
              setSavedCount(Array.isArray(parsed) ? parsed.length : 2);
            } else {
              setSavedCount(Math.min(2, allProps?.length || 0));
            }
          } catch {
            setSavedCount(2);
          }
        }
      } catch (err) {
        console.error('Failed to load profile summary stats', err);
      }
    }
    loadStats();

    // Load saved preferences if available
    try {
      const storedPref = localStorage.getItem('prophunta_seeker_preferences');
      if (storedPref) {
        const parsed = JSON.parse(storedPref);
        if (parsed.locations) setTargetLocations(parsed.locations);
        if (parsed.minBudget) setMinBudget(parsed.minBudget);
        if (parsed.maxBudget) setMaxBudget(parsed.maxBudget);
        if (parsed.propertyType) setPropertyTypePref(parsed.propertyType);
        if (parsed.bedrooms) setBedroomsPref(parsed.bedrooms);
        if (parsed.timeline) setMoveInTimeline(parsed.timeline);
      }
    } catch {
      // Keep default
    }

    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  const handleCopyId = () => {
    const idToCopy = currentUser?.id || 'PH-SK-948210';
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

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      locations: targetLocations,
      minBudget,
      maxBudget,
      propertyType: propertyTypePref,
      bedrooms: bedroomsPref,
      timeline: moveInTimeline,
    };
    try {
      localStorage.setItem('prophunta_seeker_preferences', JSON.stringify(payload));
    } catch {
      // Ignored
    }
    toast({
      title: 'Housing Preferences Updated',
      description: 'Your verified seeker criteria have been saved. Matching verified properties will be prioritized.',
    });
  };

  const toggleLocationPref = (loc: string) => {
    if (targetLocations.includes(loc)) {
      setTargetLocations(targetLocations.filter((l) => l !== loc));
    } else {
      setTargetLocations([...targetLocations, loc]);
    }
  };

  const handleUploadDocument = () => {
    if (!newDocFile) {
      toast({
        title: 'Please choose a file',
        description: 'Select a valid PDF or JPG/PNG image credential to upload.',
        variant: 'destructive',
      });
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      const newDoc: VerificationDoc = {
        id: `doc-${Date.now()}`,
        name: newDocFile,
        type: newDocType,
        status: 'VERIFIED',
        dateAdded: 'Today',
        fileSize: '1.8 MB',
      };
      setDocuments([newDoc, ...documents]);
      setIsUploading(false);
      setIsUploadOpen(false);
      setNewDocFile('');
      toast({
        title: 'Document Verified & Vaulted',
        description: `${newDocType} has been successfully verified and added to your trust profile.`,
      });
    }, 1200);
  };

  const getRoleLabel = () => {
    switch (activeRole) {
      case 'SEEKER': return 'Verified Property Seeker';
      case 'OWNER': return 'Verified Property Owner';
      case 'AGENT': return 'Licensed Real Estate Agent';
      case 'ADMIN': return 'Compliance & Verification Officer';
      default: return 'Member';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Header Hero Card */}
      <Card className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="h-20 bg-gradient-to-r from-slate-950 via-[#0e1710] to-lime-950 relative">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-500/20 border border-lime-400/40 px-3 py-1 text-xs font-bold text-lime-300 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-lime-400" />
              LASRERA Compliant Account
            </span>
          </div>
        </div>

        <CardContent className="px-5 sm:px-8 pb-6 pt-0 -mt-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white p-1 shadow-lg border-2 border-lime-500">
                  <div className="h-full w-full rounded-xl bg-gradient-to-br from-lime-600 to-emerald-700 flex items-center justify-center text-white font-black text-2xl sm:text-3xl tracking-tight">
                    {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'PS'}
                  </div>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 bg-lime-500 text-slate-950 rounded-full p-1.5 shadow-md border-2 border-white"
                  title="PropHunta Tier-1 Verified Trust Badge"
                >
                  <ShieldCheck className="h-4 w-4 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black font-headline text-slate-900 tracking-tight">
                    {currentUser?.name || 'Ayoola Seeker'}
                  </h1>
                  <Badge className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs gap-1 py-1">
                    <ShieldCheck className="h-3 w-3" /> {getRoleLabel()}
                  </Badge>
                  <Badge variant="outline" className="border-lime-500/80 text-lime-800 bg-lime-50 gap-1 text-xs py-1">
                    <BadgeCheck className="h-3.5 w-3.5 text-lime-600" /> Tier 1 Verified
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {currentUser?.email || 'seeker@prophunta.ng'}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {currentUser?.phone || '+234 802 345 6789'}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-lime-700 shrink-0" /> Lagos & Abuja, Nigeria
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Member since Jan 2026
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
            <span className="h-2 w-2 rounded-full bg-lime-500 animate-pulse" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-headline text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-lime-600" /> Tier 1
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">NIN & Phone OTP cleared</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>LASRERA Tenancy</span>
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-headline text-slate-900">
              Compliant
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Zero complaint record</p>
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
            <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
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
            <User className="h-4 w-4 text-slate-500" />
            <span>Account Details</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TRUST & VERIFICATION (Primary Hub moved into Account Profile) */}
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
                  As a Tier-1 Verified Seeker, your rental applications and inspection bookings bypass standard screening delays. Landlords and verified agents receive cryptographic assurance of your identity, employment standing, and fraud-free record.
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
                        Upload government-issued identification or tenancy standing documents for verified credential vaulting.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="doc-type" className="text-xs font-bold text-slate-700">Document Type</Label>
                        <select
                          id="doc-type"
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                        >
                          <option>Government Identity (NIN / International Passport)</option>
                          <option>Proof of Employment / Income (Work ID / Pay Slip)</option>
                          <option>Proof of Current Residence (Utility / Tenancy Receipt)</option>
                          <option>Employer Reference / Guarantor Letter</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="doc-name" className="text-xs font-bold text-slate-700">Document Title or File Name</Label>
                        <Input
                          id="doc-name"
                          placeholder="e.g. Nigerian_International_Passport_2026.pdf"
                          value={newDocFile}
                          onChange={(e) => setNewDocFile(e.target.value)}
                          className="rounded-xl text-xs"
                        />
                      </div>

                      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-2">
                        <Upload className="mx-auto h-8 w-8 text-slate-400" />
                        <div className="text-xs text-slate-600">
                          <span className="font-bold text-lime-700">Click to browse file</span> or drag & drop
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
                        disabled={isUploading}
                        className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-xs gap-1.5"
                      >
                        {isUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5" />}
                        {isUploading ? 'Validating...' : 'Submit to Vault'}
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
                <Badge className="bg-lime-600 text-white text-[10px] font-bold">VERIFIED</Badge>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">National NIN & BVN Match</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Cryptographic checksum validated against official identity registries with zero duplicate or stolen identity history.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Status: Validated</span>
                <span className="font-mono text-slate-700 font-semibold">Checksum: #NIN-OK-884</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  LASRERA Standing
                </span>
                <Badge className="bg-lime-600 text-white text-[10px] font-bold">COMPLIANT</Badge>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Regulatory Tenancy Code</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Full compliance with Lagos State Tenancy Law standards. Enforces fair tenancy contracts with zero unauthorized fee exploitation.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Standing: Good Standing</span>
                <span className="font-mono text-slate-700 font-semibold">LASRERA: 2026-VAL</span>
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
                <h3 className="font-bold text-base text-slate-900">Zero-Extortion Escrow Shield</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Rent and caution deposits are secured in segregated accounts until key handover and physical walk-in inspection sign-off.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Protection: 100% Escrow</span>
                <span className="font-mono text-slate-700 font-semibold">Segregated Tier-1</span>
              </div>
            </Card>
          </div>

          {/* Verified Credential Documents Vault */}
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-lime-600" />
                  Verified Credential Documents Vault
                </CardTitle>
                <CardDescription>
                  Encrypted files verifying your identity, income, and tenancy eligibility.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs border-lime-500 text-lime-800 bg-lime-50 self-start sm:self-auto">
                {documents.length} Verified Credentials on File
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-slate-900">{doc.name}</p>
                          <Badge className="bg-lime-600 text-white text-[10px] font-bold">
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{doc.type}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>Added {doc.dateAdded}</span>
                          <span>•</span>
                          <span>{doc.fileSize}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: 'Encrypted Credential Preview',
                            description: `Access granted for ${doc.name}. Document checksum valid.`,
                          });
                        }}
                        className="h-8 text-xs font-semibold rounded-lg text-slate-700 hover:text-slate-900"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: 'Download Initiated',
                            description: `Downloading encrypted verification copy of ${doc.name}`,
                          });
                        }}
                        className="h-8 text-xs font-semibold rounded-lg text-slate-700 hover:text-slate-900"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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

        {/* TAB 2: HOUSING SEARCH PREFERENCES (Designed for Property Seekers) */}
        <TabsContent value="preferences" className="space-y-6 outline-none">
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-lime-600" />
                Seeker Housing & Rental Search Preferences
              </CardTitle>
              <CardDescription>
                Customize your ideal home specifications. We use these criteria to match verified Nigerian property listings and dispatch instant WhatsApp alerts.
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
                  <Button type="submit" className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-xs gap-2">
                    <Sparkles className="h-4 w-4" /> Save Housing Preferences
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
                  <User className="h-5 w-5 text-lime-600" />
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
                    <p className="font-bold text-slate-900 truncate">{currentUser?.name || 'Ayoola Seeker'}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Platform Role</span>
                    <p className="font-bold text-slate-900 truncate">{getRoleLabel()}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Verified Email</span>
                    <p className="font-bold text-slate-900 truncate">{currentUser?.email || 'seeker@prophunta.ng'}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Verified Mobile Phone</span>
                    <p className="font-bold text-slate-900 truncate">{currentUser?.phone || '+234 802 345 6789'}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Account Status: <strong className="text-lime-700">Tier 1 Verified & In Good Standing</strong></span>
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
                    <p className="text-xs font-bold text-slate-800">National NIN Registry Match</p>
                    <p className="text-[11px] text-muted-foreground">Checksum validated with zero fraud flag history</p>
                  </div>
                  <Badge className="bg-lime-600 text-white text-[11px] font-bold">VERIFIED</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">LASRERA Tenancy Standing</p>
                    <p className="text-[11px] text-muted-foreground">Lagos State Real Estate Regulatory Authority standards</p>
                  </div>
                  <Badge className="bg-lime-600 text-white text-[11px] font-bold">COMPLIANT</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Escrow Security Tier</p>
                    <p className="text-[11px] text-muted-foreground">Direct bank clearing and cautionary protection enabled</p>
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
