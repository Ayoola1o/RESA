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
  FileSignature,
  PanelLeftClose,
} from 'lucide-react';
import { useUserRole } from '@/context/UserRoleContext';
import { useAppSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
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
  } else if (targetPath === '/inspections') {
    if (pathname !== '/inspections' && !pathname.startsWith('/inspections/')) {
      return false;
    }
  } else if (targetPath === '/applications') {
    if (pathname !== '/applications' && !pathname.startsWith('/applications/')) {
      return false;
    }
  } else if (targetPath === '/saved') {
    if (pathname !== '/saved' && !pathname.startsWith('/saved/')) {
      return false;
    }
  } else if (targetPath === '/properties') {
    if (pathname !== '/properties' && !pathname.startsWith('/properties/')) {
      return false;
    }
  } else if (targetPath === '/verification') {
    if (pathname !== '/verification' && !pathname.startsWith('/verification/')) {
      return false;
    }
  } else if (targetPath === '/financials') {
    if (pathname !== '/financials' && !pathname.startsWith('/financials/')) {
      return false;
    }
  } else if (targetPath === '/market-intelligence') {
    if (pathname !== '/market-intelligence' && !pathname.startsWith('/market-intelligence/')) {
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
      // If a specific subtab is present, base /profile should NOT be active
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
        { label: 'User Management', href: '/admin?tab=users', icon: User },
        { label: 'Staff & Governance', href: '/admin?tab=staff', icon: Briefcase },
        { label: 'Four-Eyes Approvals', href: '/admin?tab=approvals', icon: FileCheck2 },
        { label: 'System Audit Trail', href: '/admin?tab=audit', icon: BarChart3 },
        { label: 'Public Marketplace', href: '/marketplace', icon: Store },
      ];

    case 'OWNER':
      return [
        { label: 'Owner Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Properties', href: '/properties', icon: Home },
        { label: 'Add Property', href: '/landlord/add-property', icon: Building2 },
        { label: 'Inspection Requests', href: '/inspections', icon: CalendarCheck2, badge: 1 },
        { label: 'Applications & Offers', href: '/applications', icon: FileSignature },
        { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 1 },
        { label: 'Financial Records', href: '/financials', icon: BarChart3 },
        { label: 'Marketplace', href: '/marketplace', icon: Store },
      ];

    case 'AGENT':
      return [
        { label: 'Agent Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Authorized Listings', href: '/properties', icon: Home },
        { label: 'Create Listing', href: '/landlord/add-property', icon: Building2 },
        { label: 'Client Inspections', href: '/inspections', icon: CalendarCheck2, badge: 1 },
        { label: 'Enquiries', href: '/messages', icon: MessageSquare, badge: 1 },
        { label: 'Expressions of Interest', href: '/applications', icon: FileSignature },
        { label: 'Market Insights', href: '/marketplace?view=map', icon: MapPin },
        { label: 'Marketplace', href: '/marketplace', icon: Store },
      ];

    case 'SEEKER':
    default:
      return [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Verified Marketplace', href: '/marketplace', icon: Store },
        { label: 'Map & Geo-Search', href: '/marketplace?view=map', icon: MapPin },
        { label: 'My Inspections', href: '/inspections', icon: CalendarCheck2, badge: 1 },
        { label: 'Applications & Offers', href: '/applications', icon: FileText },
        { label: 'Messages & Enquiries', href: '/messages', icon: MessageSquare, badge: 1 },
        { label: 'Saved Favorites', href: '/saved', icon: Heart },
        { label: 'Market Intelligence', href: '/market-intelligence', icon: BarChart3 },
      ];
  }
}

export const moreNavItems: NavItem[] = [
  { label: 'Profile & Credentials', href: '/profile', icon: User },
  { label: 'Trust & Verification', href: '/verification', icon: ShieldCheck },
  { label: 'Account Settings', href: '/settings', icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userRole, setUserRole, currentUser } = useUserRole();
  const { isDesktopOpen, closeDesktopSidebar } = useAppSidebar();

  // Determine role strictly from the authenticated account
  const activeRole: UserRole = currentUser?.role || userRole || 'SEEKER';
  const allNavItems = getNavItemsForRole(activeRole);

  // Group items into clean operational sections
  const discoveryHrefs = ['/marketplace', '/saved', '/marketplace?view=map'];
  const portalHrefs = ['/admin', '/landlord/add-property', '/market-intelligence'];

  const discoveryItems = allNavItems.filter((item) =>
    discoveryHrefs.some((h) => item.href === h || item.href.startsWith(h))
  );
  const portalItems = allNavItems.filter((item) =>
    portalHrefs.some((h) => item.href === h || item.href.startsWith(h))
  );
  const operationsItems = allNavItems.filter(
    (item) => !discoveryItems.includes(item) && !portalItems.includes(item)
  );

  const renderNavGroup = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block pt-2.5 pb-1">
          {title}
        </span>
        {items.map((item) => {
          const isActive = isNavigationItemActive(item.href, pathname, searchParams);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span className="truncate" title={item.label}>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold px-1.5 ml-2 ${
                    isActive
                      ? 'bg-slate-950 text-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-950 text-slate-300 lg:flex shadow-2xl border-r border-slate-800/80 transition-transform duration-300 ease-in-out",
        isDesktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full pointer-events-none"
      )}
      aria-hidden={!isDesktopOpen}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-md p-1">
            <Logo className="h-8 w-8" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white">PropHunta</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-600 text-white tracking-wide uppercase font-mono">AI</span>
            </div>
            <span className="text-[10px] font-semibold tracking-tight text-emerald-400">
              Verified Trust Infrastructure
            </span>
          </div>
        </div>

        {/* Desktop Close Sidebar Button */}
        <button
          type="button"
          onClick={closeDesktopSidebar}
          title="Close sidebar (Ctrl+B)"
          aria-label="Close sidebar"
          className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ml-auto shrink-0"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Sleek Active Role Badge & Switcher */}
      <div className="px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800/70">
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0 pr-2">
            <span
              className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 truncate"
              title={currentUser?.name || 'Verified Member'}
            >
              {currentUser?.name || 'Verified Member'}
            </span>
            <span className="text-xs font-bold text-slate-200 truncate">
              {activeRole === 'SEEKER'
                ? 'Property Seeker'
                : activeRole === 'OWNER'
                ? 'Property Owner'
                : activeRole === 'AGENT'
                ? 'Licensed Agent'
                : 'Compliance Admin'}
            </span>
          </div>
          <span className="shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-800/60 flex items-center gap-1.5 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {activeRole}
          </span>
        </div>
      </div>

      {/* Navigation Scrollable Body (scrollbar hidden cleanly) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar space-y-3">
        {renderNavGroup('Discovery', discoveryItems)}
        {renderNavGroup('Tenancy & Operations', operationsItems)}
        {renderNavGroup('Role Portals', portalItems)}

        {/* Account & Security Section */}
        <div className="pt-2 border-t border-slate-800/60">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block pt-1 pb-1">
            Account & Security
          </span>
          <nav className="mt-0.5 space-y-1">
            {moreNavItems.map((item) => {
              const isActive = isNavigationItemActive(item.href, pathname, searchParams);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  />
                  <span className="truncate" title={item.label}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Promo Intelligence Card */}
        <div className="mt-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 p-3 relative overflow-hidden shadow-lg">
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
