'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
  { label: 'Account Settings', href: '/settings', icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0b132b] text-slate-300 lg:flex shadow-2xl border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/60">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-900/30 p-1">
          <Logo className="h-9 w-9" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black tracking-tight text-white">PropHunta</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-600/80 text-blue-100 tracking-wide uppercase">AI</span>
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-blue-400">
            Verified Trust Infrastructure
          </span>
        </div>
      </div>

      {/* Role Indicator & Quick Role Switcher */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">Active Role</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {userRole}
          </span>
        </div>

        {/* 4-Role Selector Pills */}
        <div className="grid grid-cols-4 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800/60">
          {(['SEEKER', 'OWNER', 'AGENT', 'ADMIN'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`py-1 text-[10px] font-bold rounded transition-all text-center ${
                userRole === r
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
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
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Main Navigation Items */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              item.href === '/dashboard' || item.href === '/admin'
                ? pathname === item.href
                : pathname.startsWith(item.href.split('?')[0]);

            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-bold px-1.5 ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
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
        <div className="mt-6 pt-5 border-t border-slate-800/60">
          <span className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Account & Security
          </span>
          <nav className="mt-2 space-y-1">
            {moreNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Promo Intelligence Card */}
        <div className="mt-6 rounded-2xl bg-gradient-to-b from-[#111e42] to-[#0e1733] border border-blue-900/40 p-3.5 relative overflow-hidden shadow-lg">
          <div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-900 mb-3">
            <Image
              src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80"
              alt="Lagos Night Skyline"
              fill
              className="object-cover opacity-85 hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1733] via-transparent to-transparent" />
          </div>

          <h4 className="text-xs font-bold text-white leading-snug">
            Verified Property.
            <br />
            Smarter Decisions.
          </h4>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            PropHunta AI delivers documented title reviews, cadaster tracking, and physical inspection records for Nigeria&apos;s property ecosystem.
          </p>

          <Link
            href="/marketplace?view=map"
            className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 px-3 text-xs font-semibold text-white shadow-md shadow-blue-900/40 transition-all hover:gap-2"
          >
            <span>Explore Verified Map</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
