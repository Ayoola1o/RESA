'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  User,
  ShieldCheck,
  Building,
  Heart,
  FileText,
} from 'lucide-react';
import { useUserRole } from '@/context/UserRoleContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { role, userRole } = useUserRole();
  const activeRole = role || userRole || 'SEEKER';

  // Role-specific bottom navigation tabs
  const getNavTabs = () => {
    switch (activeRole) {
      case 'ADMIN':
        return [
          { label: 'Admin', href: '/admin', icon: ShieldCheck },
          { label: 'Queue', href: '/admin?tab=verification', icon: FileText },
          { label: 'Market', href: '/marketplace', icon: Search },
          { label: 'Audit', href: '/admin?tab=audit', icon: Home },
          { label: 'Profile', href: '/profile', icon: User },
        ];
      case 'OWNER':
        return [
          { label: 'Dashboard', href: '/dashboard', icon: Home },
          { label: 'Listings', href: '/profile?tab=properties', icon: Building },
          { label: 'Add Property', href: '/landlord/add-property', icon: PlusCircle, isPrimaryAction: true },
          { label: 'Messages', href: '/messages', icon: MessageSquare },
          { label: 'Profile', href: '/profile', icon: User },
        ];
      case 'AGENT':
        return [
          { label: 'Dashboard', href: '/dashboard', icon: Home },
          { label: 'Listings', href: '/profile?tab=properties', icon: Building },
          { label: 'Add Client', href: '/landlord/add-property', icon: PlusCircle, isPrimaryAction: true },
          { label: 'Leads', href: '/messages', icon: MessageSquare },
          { label: 'Profile', href: '/profile', icon: User },
        ];
      case 'SEEKER':
      default:
        return [
          { label: 'Home', href: '/dashboard', icon: Home },
          { label: 'Search', href: '/marketplace', icon: Search },
          { label: 'Saved', href: '/profile?tab=saved', icon: Heart },
          { label: 'Messages', href: '/messages', icon: MessageSquare },
          { label: 'Profile', href: '/profile', icon: User },
        ];
    }
  };

  const tabs = getNavTabs();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg lg:hidden safe-bottom"
    >
      <div className="grid grid-cols-5 h-16 items-center max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href === '/marketplace' && pathname.startsWith('/property/')) ||
            (tab.href === '/messages' && pathname.startsWith('/messages/'));

          if (tab.isPrimaryAction) {
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-4 group focus:outline-hidden"
              >
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 flex items-center justify-center transition-transform active:scale-95 group-hover:scale-105 border-2 border-white">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 mt-1">{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-600" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
