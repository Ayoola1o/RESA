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
  FileSignature,
  MessageSquare,
  Wrench,
  Heart,
  BarChart3,
  User,
  Settings,
  ArrowRight,
  Sparkles,
  Repeat
} from 'lucide-react';
import { useUserRole } from '@/context/UserRoleContext';

export interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number | string;
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Marketplace', href: '/marketplace', icon: Store },
  { label: 'Properties', href: '/marketplace?tab=properties', icon: Home },
  { label: 'Map & Insights', href: '/marketplace?view=map', icon: MapPin },
  { label: 'Applications', href: '/profile?tab=applications', icon: FileText },
  { label: 'Leases', href: '/profile?tab=lease', icon: FileSignature },
  { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 3 },
  { label: 'Maintenance', href: '/profile?tab=maintenance', icon: Wrench },
  { label: 'Favorites', href: '/profile?tab=saved', icon: Heart },
  { label: 'Reports', href: '/profile?tab=financials', icon: BarChart3 },
];

export const moreNavItems: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, setUserRole } = useUserRole();

  const handleRoleToggle = () => {
    const nextRole = userRole === 'tenant' ? 'landlord' : 'tenant';
    setUserRole(nextRole);
    if (nextRole === 'landlord') {
      router.push('/landlord/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0b132b] text-slate-300 lg:flex shadow-2xl border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-900/30">
          <span className="text-xl font-black tracking-tighter">R</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-wider text-white">RESA</span>
          <span className="text-[10px] font-medium tracking-tight text-slate-400">
            Real Estate Intelligence
          </span>
        </div>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Main Navigation Items */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname === '/'
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
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                      isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* MORE Section */}
        <div className="mt-6 pt-4 border-t border-slate-800/60">
          <p className="px-3.5 mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            More
          </p>
          <nav className="space-y-1">
            {moreNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Quick role toggle */}
            <button
              onClick={handleRoleToggle}
              type="button"
              className="w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 transition-all"
            >
              <div className="flex items-center gap-3">
                <Repeat className="h-4 w-4 text-slate-400 group-hover:text-blue-400" />
                <span>Switch to {userRole === 'tenant' ? 'Landlord' : 'Buyer'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {userRole === 'tenant' ? 'Buyer' : 'Landlord'}
              </span>
            </button>
          </nav>
        </div>

        {/* Promo Intelligence Card matching screenshot bottom */}
        <div className="mt-6 rounded-2xl bg-gradient-to-b from-[#111e42] to-[#0e1733] border border-blue-900/40 p-3.5 relative overflow-hidden shadow-lg">
          {/* Night Skyline graphic / image */}
          <div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-900 mb-3">
            <Image
              src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80"
              alt="Lagos Night Skyline"
              fill
              className="object-cover opacity-85 hover:scale-105 transition-transform duration-500"
              data-ai-hint="city skyline night"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1733] via-transparent to-transparent" />
          </div>

          <h4 className="text-xs font-bold text-white leading-snug">
            Smarter Decisions.
            <br />
            Better Properties.
          </h4>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            RESA gives you the insights, verification and intelligence you need to make confident real
            estate decisions in Nigeria.
          </p>

          <Link
            href="/marketplace?view=map"
            className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 px-3 text-xs font-semibold text-white shadow-md shadow-blue-900/40 transition-all hover:gap-2"
          >
            <span>Explore Insights</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
