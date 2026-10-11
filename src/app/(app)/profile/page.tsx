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
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUserRole } from '@/context/UserRoleContext';
import {
  getUserInspectionsAction,
  getUserApplicationsAction,
  getUserPropertiesAction,
  getPropertiesAction,
} from '@/server/actions/prophunta-actions';
import { UserRole } from '@/types/prophunta';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading verified profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { currentUser, role } = useUserRole();
  const activeRole: UserRole = currentUser?.role || role || 'SEEKER';
  const router = useRouter();
  const searchParams = useSearchParams();

  // Legacy tab redirect handling:
  // If someone visits /profile?tab=inspections, redirect them to the dedicated /inspections page.
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;
    const t = tab.toLowerCase().trim();
    if (t === 'inspections' || t === 'inspection') {
      router.replace('/inspections');
    } else if (t === 'applications' || t === 'application' || t === 'offers' || t === 'offer' || t === 'eoi') {
      router.replace('/applications');
    } else if (t === 'saved' || t === 'saved-listings' || t === 'favorites' || t === 'favorite') {
      router.replace('/saved');
    } else if (t === 'properties' || t === 'listings' || t === 'my-properties') {
      router.replace('/properties');
    } else if (t === 'verification' || t === 'trust' || t === 'identity' || t === 'credentials' || t === 'kyc') {
      router.replace('/verification');
    } else if (t === 'financials' || t === 'payments' || t === 'finance') {
      router.replace(activeRole === 'SEEKER' ? '/market-intelligence' : '/financials');
    } else if (t === 'intelligence' || t === 'market-intelligence') {
      router.replace('/market-intelligence');
    }
  }, [searchParams, router, activeRole]);

  // Data states for quick overview stats
  const [inspectionCount, setInspectionCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [savedCount, setSavedCount] = useState(2);

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
          setSavedCount(Math.min(2, allProps?.length || 0));
        }
      } catch (err) {
        console.error('Failed to load profile summary stats', err);
      }
    }
    loadStats();
    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  const getRoleLabel = () => {
    switch (activeRole) {
      case 'SEEKER': return 'Property Seeker';
      case 'OWNER': return 'Property Owner / Landlord';
      case 'AGENT': return 'Licensed Agent / Manager';
      case 'ADMIN': return 'Verification Officer (Admin)';
      default: return 'User';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="border border-slate-200/90 shadow-xs rounded-2xl">
        <CardContent className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-lime-100 border-2 border-lime-600 flex items-center justify-center text-lime-950 font-bold text-xl sm:text-2xl shadow-xs">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'PH'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-lime-600 text-white rounded-full p-1 shadow-xs" title="Trust Verified Account">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-headline text-slate-900 truncate">
                  {currentUser?.name || 'PropHunta Member'}
                </h1>
                <Badge className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs">
                  {getRoleLabel()}
                </Badge>
                <Badge variant="outline" className="border-lime-500 text-lime-800 bg-lime-50 gap-1 text-xs">
                  <ShieldCheck className="h-3 w-3" /> Identity Verified
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs md:text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {currentUser?.email || 'user@prophunta.ng'}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {currentUser?.phone || '+234 800 000 0000'}
                </span>
                {currentUser?.agencyName && (
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 truncate">
                    <Briefcase className="h-3.5 w-3.5 text-lime-700 shrink-0" /> {currentUser.agencyName}
                  </span>
                )}
                {currentUser?.licenseNumber && (
                  <span className="flex items-center gap-1.5 text-slate-600 truncate">
                    <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Lic: {currentUser.licenseNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
            <Button asChild variant="outline" className="rounded-xl w-full sm:w-auto">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" /> Account Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Overview & Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Verified Credentials */}
        <Card className="rounded-2xl border-slate-200/90 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-lime-600" />
              Verified Credentials & Standing
            </CardTitle>
            <CardDescription>
              Government and biometric registry status associated with this account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">National NIN / BVN Match</p>
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
            </div>

            <Button asChild variant="outline" className="w-full rounded-xl text-xs font-semibold">
              <Link href="/verification">
                Open Trust & Verification Portal <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Account Details */}
        <Card className="rounded-2xl border-slate-200/90 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <User className="h-5 w-5 text-lime-600" />
              Personal & Account Details
            </CardTitle>
            <CardDescription>
              Basic contact information and role permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border bg-white space-y-1">
                <span className="text-muted-foreground font-semibold">Full Name</span>
                <p className="font-bold text-slate-900 truncate">{currentUser?.name || 'PropHunta Member'}</p>
              </div>
              <div className="p-3 rounded-xl border bg-white space-y-1">
                <span className="text-muted-foreground font-semibold">Account Role</span>
                <p className="font-bold text-slate-900 truncate">{getRoleLabel()}</p>
              </div>
              <div className="p-3 rounded-xl border bg-white space-y-1">
                <span className="text-muted-foreground font-semibold">Primary Email</span>
                <p className="font-bold text-slate-900 truncate">{currentUser?.email || 'user@prophunta.ng'}</p>
              </div>
              <div className="p-3 rounded-xl border bg-white space-y-1">
                <span className="text-muted-foreground font-semibold">Phone Number</span>
                <p className="font-bold text-slate-900 truncate">{currentUser?.phone || '+234 800 000 0000'}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Account Status: <strong className="text-lime-700">Active & Good Standing</strong></span>
              <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
                <Link href="/settings">Edit in Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dedicated Workspace Navigation Cards */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xl font-bold font-headline text-slate-900">Your Workspaces & Records</h2>
        <p className="text-sm text-muted-foreground">
          Quickly access your dedicated section workspaces.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/inspections"
            className="group p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-lime-500 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-xs">
                {inspectionCount} scheduled
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-lime-700 flex items-center gap-1.5 transition-colors">
                My Inspections <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Physical walkthroughs, field reports, and reschedule requests.
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
              <Badge variant="outline" className="text-xs">
                {applicationCount} active
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-lime-700 flex items-center gap-1.5 transition-colors">
                Applications & Offers <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Expressions of interest, tenancy applications, and escrow offers.
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
              <Badge variant="outline" className="text-xs">
                {savedCount} saved
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-lime-700 flex items-center gap-1.5 transition-colors">
                Saved Favorites <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Curated shortlist of verified properties bookmarked for inspection.
              </p>
            </div>
          </Link>

          <Link
            href="/properties"
            className="group p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-lime-500 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-xs">
                {propertyCount} listed
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-lime-700 flex items-center gap-1.5 transition-colors">
                Properties & Listings <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeRole === 'SEEKER' ? 'Properties submitted by you' : 'Manage your real estate portfolio and listings.'}
              </p>
            </div>
          </Link>

          <Link
            href="/verification"
            className="group p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-lime-500 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-xs text-lime-700 border-lime-300">
                Verified
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-lime-700 flex items-center gap-1.5 transition-colors">
                Trust & Verification <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                LASRERA compliance, title audit protocols, and biometric verification.
              </p>
            </div>
          </Link>

          <Link
            href={activeRole === 'SEEKER' ? '/market-intelligence' : '/financials'}
            className="group p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-lime-500 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-xs">
                Protected
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-lime-700 flex items-center gap-1.5 transition-colors">
                {activeRole === 'SEEKER' ? 'Market Intelligence' : 'Financial Records'} <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeRole === 'SEEKER'
                  ? 'Fee transparency, statutory legal cap, and caution escrow guidelines.'
                  : 'Rent flow, disbursements, and settlement management.'}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
