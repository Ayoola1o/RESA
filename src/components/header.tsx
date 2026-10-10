'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
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
  ShieldCheck,
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
import { UserRole, AppNotification } from '@/types/prophunta';
import { getNavItemsForRole } from './app-sidebar';
import AiRecommendations from './ai-recommendations';
import Logo from './logo';
import {
  logoutAction,
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/server/actions/prophunta-actions';

export default function Header() {
  const router = useRouter();
  const { userRole, setUserRole, currentUser } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    getUserNotificationsAction().then((items) => {
      if (items) setNotifications(items);
    }).catch(() => {});
  }, [currentUser?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const mainNavItems = getNavItemsForRole(userRole);

  const handleRoleToggle = async (nextRole: UserRole) => {
    await setUserRole(nextRole);
    if (nextRole === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
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
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white p-1">
                <Logo className="h-8 w-8" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-wider text-white">PropHunta</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white">AI</span>
                </div>
                <span className="text-[10px] font-medium text-blue-400">Verified Trust Infrastructure</span>
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
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm p-1">
            <Logo className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-base hidden min-[400px]:inline">PropHunta</span>
        </Link>
      </div>

      {/* Global Search with ⌘ K shortcut */}
      <div className="flex flex-1 max-w-xl mx-2 sm:mx-4 lg:mx-0 min-w-0">
        <form onSubmit={handleSearch} className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified homes..."
            className="w-full h-10 sm:h-11 pl-9 sm:pl-10 pr-4 sm:pr-16 rounded-xl border border-slate-200/90 bg-slate-50/70 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:bg-white transition-all shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </form>
      </div>

      {/* Header Actions & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Verification Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Active Trust Node: Lagos / Abuja</span>
        </div>

        {/* AI Assistant Quick Modal */}
        <AiRecommendations
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-1.5 h-10 px-3.5 rounded-xl border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 text-xs font-semibold shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>AI Insights</span>
            </Button>
          }
        />

        {/* Notifications Popover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 text-[9px] font-bold text-white items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-xl border-slate-200">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Activity & Alerts ({notifications.length})
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    await markAllNotificationsAsReadAction();
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                  }}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="py-1 divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={async () => {
                      if (!n.read) {
                        await markNotificationAsReadAction(n.id);
                        setNotifications((prev) =>
                          prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                        );
                      }
                      if (n.link) router.push(n.link);
                    }}
                    className={cn(
                      'px-3 py-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors',
                      !n.read && 'bg-blue-50/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          n.type === 'INSPECTION'
                            ? 'bg-emerald-500'
                            : n.type === 'ENQUIRY'
                            ? 'bg-blue-500'
                            : n.type === 'REPORT'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        )}
                      />
                      <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                      {!n.read && (
                        <span className="ml-auto text-[9px] font-bold text-blue-600 bg-blue-100 px-1 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Pill Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full sm:rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all focus:outline-none">
              <div className="relative h-9 w-9 rounded-full overflow-hidden bg-blue-100 border border-blue-200 shrink-0">
                <Image
                  src={
                    currentUser?.profilePhoto ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
                  }
                  alt={currentUser?.name || 'User Profile'}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.name || 'Chidi Okonkwo'}
                </span>
                <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                  <span>{userRole}</span>
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl border-slate-200">
            <DropdownMenuLabel className="font-normal px-3 py-2">
              <p className="text-xs font-bold text-slate-900">{currentUser?.name || 'Chidi Okonkwo'}</p>
              <p className="text-[11px] text-slate-500">{currentUser?.email || 'seeker@prophunta.ai'}</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified {userRole} Account</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Role switch in dropdown */}
            <div className="px-3 py-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Switch Active Role</span>
              <div className="grid grid-cols-2 gap-1 mt-1.5">
                {(['SEEKER', 'OWNER', 'AGENT', 'ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleToggle(r)}
                    className={`py-1 px-2 text-[11px] font-bold rounded-lg border text-left transition-all ${
                      userRole === r
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-xs">Profile & Credentials</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                <span className="text-xs">Account Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-xl cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="text-xs font-semibold">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
