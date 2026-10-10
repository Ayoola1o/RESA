'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Home,
  MapPin,
  FileText,
  FileCheck2,
  CalendarCheck2,
  MessageSquare,
  Heart,
  BarChart3,
  User,
  Settings,
  ArrowRight,
  ShieldCheck,
  Building2,
  Briefcase,
  SlidersHorizontal,
  FileSignature
} from 'lucide-react';
import { useUserRole } from '@/context/UserRoleContext';
import { UserRole } from '@/types/prophunta';
import Logo from '@/components/logo';

export interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number | string;
}

export function normalizeTabName(tab: string | null | undefined): string {
  if (!tab) return '';
  const t = tab.toLowerCase().trim();
  if (t === 'inspections' || t === 'inspection') return 'inspections';
  if (t === 'applications' || t === 'application' || t === 'offers' || t === 'offer' || t === 'eoi') return 'applications';
  if (t === 'saved' || t === 'saved-listings' || t === 'favorites' || t === 'favorite') return 'saved';
  if (t === 'verification' || t === 'trust' || t === 'identity' || t === 'credentials' || t === 'kyc') return 'verification';
  if (t === 'properties' || t === 'listings' || t === 'my-properties') return 'properties';
  if (t === 'financials' || t === 'payments' || t === 'finance' || t === 'leases' || t === 'intelligence' || t === 'market-intelligence') return 'financials';
  return t;
}

export function isNavigationItemActive(
  href: string,
  pathname: string,
  searchParams: { get: (key: string) => string | null }
): boolean {
  const [targetPath, targetQueryString] = href.split('?');
  const targetParams = new URLSearchParams(targetQueryString || '');

  // 1. Pathname Matching
  if (targetPath === '/messages') {
    if (pathname !== '/messages' && !pathname.startsWith('/messages/')) {
      return false;
    }
  } else if (targetPath === '/marketplace') {
    if (pathname !== '/marketplace' && !pathname.startsWith('/property/')) {
      return false;
    }
  } else if (targetPath === '/admin') {
    if (pathname !== '/admin' && !pathname.startsWith('/admin/')) {
      return false;
    }
  } else if (targetPath === '/dashboard') {
    if (pathname !== '/dashboard') {
      return false;
    }
  } else {
    if (pathname !== targetPath) {
      return false;
    }
  }

  // 2. Query Parameter Specificity
  const targetEntries = Array.from(targetParams.entries());

  if (targetEntries.length > 0) {
    for (const [key, value] of targetEntries) {
      const currentVal = searchParams.get(key);
      if (key === 'tab') {
        const normTarget = normalizeTabName(value);
        const normCurrent = normalizeTabName(currentVal);
        if (normTarget !== normCurrent) {
          return false;
        }
      } else {
        if (currentVal !== value) {
          return false;
        }
      }
    }
    return true;
  }

  // 3. Parent / Parameter-less targets: ensure they are not active if a parameterized sibling is active
  if (targetPath === '/profile') {
    const currentTab = searchParams.get('tab');
    if (currentTab) {
      const norm = normalizeTabName(currentTab);
      // If a specific subtab is present, base /profile should NOT be active!
      if (['inspections', 'applications', 'saved', 'properties', 'financials', 'verification'].includes(norm)) {
        return false;
      }
    }
    return true;
  }

  if (targetPath === '/marketplace') {
    if (searchParams.get('view') === 'map') {
      return false;
    }
    return true;
  }

  if (targetPath === '/admin') {
    const currentTab = searchParams.get('tab');
    if (currentTab && currentTab !== 'overview') {
      return false;
    }
    return true;
  }

  return true;
}

export function getNavItemsForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'ADMIN':
      return [
        { label: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Verification Queue', href: '/admin?tab=verification', icon: ShieldCheck, badge: 2 },
        { label: 'Property Moderation', href: '/admin?tab=properties', icon: Home },
        { label: 'Trust & Safety Reports', href: '/admin?tab=reports', icon: FileText, badge: 1 },
        { label: 'Inspections Audit', href: '/admin?tab=inspections', icon: CalendarCheck2 },
        { label: 'System Audit Logs', href: '/admin?tab=audit', icon: BarChart3 },
        { label: 'Public Marketplace', href: '/marketplace', icon: Store },
      ];

    case 'OWNER':
      return [
        { label: 'Owner Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Properties', href: '/profile?tab=properties', icon: Home },
        { label: 'Add Property', href: '/landlord/add-property', icon: Building2 },
        { label: 'Inspection Requests', href: '/profile?tab=inspections', icon: CalendarCheck2, badge: 1 },
        { label: 'Applications & Offers', href: '/profile?tab=applications', icon: FileSignature },
        { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 1 },
        { label: 'Financial Records', href: '/profile?tab=financials', icon: BarChart3 },
        { label: 'Marketplace', href: '/marketplace', icon: Store },
      ];

    case 'AGENT':
      return [
        { label: 'Agent Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Authorized Listings', href: '/profile?tab=properties', icon: Home },
        { label: 'Create Listing', href: '/landlord/add-property', icon: Building2 },
        { label: 'Client Inspections', href: '/profile?tab=inspections', icon: CalendarCheck2, badge: 1 },
        { label: 'Enquiries', href: '/messages', icon: MessageSquare, badge: 1 },
        { label: 'Expressions of Interest', href: '/profile?tab=applications', icon: FileSignature },
        { label: 'Market Insights', href: '/marketplace?view=map', icon: MapPin },
        { label: 'Marketplace', href: '/marketplace', icon: Store },
      ];

    case 'SEEKER':
    default:
      return [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Verified Marketplace', href: '/marketplace', icon: Store },
        { label: 'Map & Geo-Search', href: '/marketplace?view=map', icon: MapPin },
        { label: 'My Inspections', href: '/profile?tab=inspections', icon: CalendarCheck2, badge: 1 },
        { label: 'Applications & Offers', href: '/profile?tab=applications', icon: FileText },
        { label: 'Messages & Enquiries', href: '/messages', icon: MessageSquare, badge: 1 },
        { label: 'Saved Favorites', href: '/profile?tab=saved', icon: Heart },
        { label: 'Market Intelligence', href: '/profile?tab=financials', icon: BarChart3 },
      ];
  }
}

export const moreNavItems: NavItem[] = [
  { label: 'Profile & Credentials', href: '/profile', icon: User },
  { label: 'Trust & Verification', href: '/profile?tab=verification', icon: ShieldCheck },
  { label: 'Account Settings', href: '/settings', icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userRole, setUserRole, currentUser } = useUserRole();

  const mainNavItems = getNavItemsForRole(userRole);

  const handleRoleChange = async (nextRole: UserRole) => {
    await setUserRole(nextRole);
    if (nextRole === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0c140d] text-slate-300 lg:flex shadow-2xl border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4.5 border-b border-slate-800/70">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lime-500 to-lime-700 text-white shadow-md shadow-lime-950/30 p-1">
          <Logo className="h-8 w-8" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black tracking-tight text-white">PropHunta</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-lime-500 text-slate-950 tracking-wide uppercase font-mono">AI</span>
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-lime-400">
            Verified Trust Infrastructure
          </span>
        </div>
      </div>

      {/* Role Indicator & Quick Role Switcher */}
      <div className="px-3.5 py-2.5 bg-slate-950/60 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Active Role</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-950/80 text-lime-400 border border-lime-800/60 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
            {userRole}
          </span>
        </div>

        {/* 4-Role Selector Pills */}
        <div className="grid grid-cols-4 gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/60">
          {(['SEEKER', 'OWNER', 'AGENT', 'ADMIN'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`py-1 text-[10px] font-bold rounded transition-all text-center ${
                userRole === r
                  ? 'bg-lime-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={`Switch to ${r} role`}
            >
              {r === 'SEEKER' ? 'Seeker' : r === 'OWNER' ? 'Owner' : r === 'AGENT' ? 'Agent' : 'Admin'}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Main Navigation Items */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = isNavigationItemActive(item.href, pathname, searchParams);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-950/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-lime-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
                      isActive
                        ? 'bg-slate-950 text-lime-400'
                        : 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* More Items Section */}
        <div className="mt-5 pt-4 border-t border-slate-800/60">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Account & Security
          </span>
          <nav className="mt-1.5 space-y-1">
            {moreNavItems.map((item) => {
              const isActive = isNavigationItemActive(item.href, pathname, searchParams);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-950/40 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-lime-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Promo Intelligence Card */}
        <div className="mt-5 rounded-2xl bg-gradient-to-b from-[#132215] to-[#0c160e] border border-lime-900/40 p-3 relative overflow-hidden shadow-lg">
          <div className="relative h-18 w-full overflow-hidden rounded-xl bg-slate-900 mb-2.5">
            <Image
              src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80"
              alt="Lagos Night Skyline"
              fill
              className="object-cover opacity-85 hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c160e] via-transparent to-transparent" />
          </div>

          <h4 className="text-xs font-bold text-white leading-snug">
            Verified Property.
            <br />
            Smarter Decisions.
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            PropHunta AI delivers documented title reviews, cadaster tracking, and physical inspection records for Nigeria&apos;s property ecosystem.
          </p>

          <Link
            href="/marketplace?view=map"
            className="mt-2.5 flex items-center justify-center gap-1.5 w-full rounded-xl bg-lime-500 hover:bg-lime-400 py-1.5 px-3 text-xs font-bold text-slate-950 shadow-md shadow-lime-950/40 transition-all hover:gap-2"
          >
            <span>Explore Verified Map</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
