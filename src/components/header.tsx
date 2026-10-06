'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Repeat,
  Sparkles,
  Command,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/context/UserRoleContext';
import { mainNavItems, moreNavItems } from './app-sidebar';
import AiRecommendations from './ai-recommendations';

export default function Header() {
  const router = useRouter();
  const { userRole, setUserRole } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnread, setHasUnread] = useState(true);

  const handleRoleToggle = () => {
    const nextRole = userRole === 'tenant' ? 'landlord' : 'tenant';
    setUserRole(nextRole);
    if (nextRole === 'landlord') {
      router.push('/landlord/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/marketplace');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-8 backdrop-blur-md transition-all">
      {/* Mobile Drawer Trigger & Brand for small screens */}
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-700">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-[#0b132b] p-0 text-slate-300 border-slate-800">
            {/* Mobile Brand Header */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-black text-xl">
                R
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-wider text-white">RESA</span>
                <span className="text-[10px] font-medium text-slate-400">Real Estate Intelligence</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-5rem)]">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-slate-800 pt-2">
                <p className="px-3.5 mb-1 text-[11px] font-bold text-slate-500 uppercase">More</p>
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm">
            R
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-base">RESA</span>
        </Link>
      </div>

      {/* Modern Search Bar */}
      <div className="flex-1 max-w-xl pr-4">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties, locations, or anything..."
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-16 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm pointer-events-none">
            <span className="text-xs">⌘</span>
            <span>K</span>
          </div>
        </form>
      </div>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={() => setHasUnread(false)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {hasUnread && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuLabel className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Notifications</span>
              <span className="text-[11px] font-normal text-blue-600 cursor-pointer">Mark all as read</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-1">
              <div className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                <p className="text-xs font-semibold text-slate-900">Application Approved 🎉</p>
                <p className="text-[11px] text-slate-500">Your application for Luxury 4 Bedroom Duplex was approved.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
              </div>
              <div className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                <p className="text-xs font-semibold text-slate-900">New Agent Message</p>
                <p className="text-[11px] text-slate-500">Ayoola Properties replied to your inquiry.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">5 hours ago</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Pill matching screenshot */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 rounded-full border border-slate-200/90 bg-white py-1 pl-1 pr-3 shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none"
            >
              <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-blue-500/20">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Ayoola O."
                  fill
                  className="object-cover"
                  data-ai-hint="person portrait"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">Ayoola O.</span>
                <span className="text-[11px] font-medium text-slate-500 leading-none">
                  {userRole === 'tenant' ? 'Buyer' : 'Landlord'}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-200">
            <div className="px-3 py-2">
              <p className="text-xs font-bold text-slate-900">Ayoola O.</p>
              <p className="text-[11px] text-slate-500">ayoola.o@resa-intelligence.ng</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium">
                <User className="h-4 w-4 text-slate-500" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium">
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleRoleToggle}
              className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Repeat className="h-4 w-4 text-blue-600" />
              <span>Switch to {userRole === 'tenant' ? 'Landlord' : 'Buyer'} View</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile?tab=applications" className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium">
                <HelpCircle className="h-4 w-4 text-slate-500" />
                <span>Support & Help</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4 text-red-600" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
