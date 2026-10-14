'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { getCurrentUserAction } from '@/server/actions/prophunta-actions';
import { User } from '@/types/prophunta';
import {
  Menu,
  X,
  ShieldCheck,
  Building,
  ArrowRight,
  User as UserIcon,
  Search,
  Sparkles,
} from 'lucide-react';

export default function PublicHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUserAction();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (err) {
        console.warn('Could not determine current session', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const getDashboardUrl = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 sm:h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-600 to-lime-800 text-white shadow-md shadow-lime-900/20 transition-transform group-hover:scale-105">
            <Logo className="h-7 w-7" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 font-headline">
                PropHunta
              </span>
              <span className="rounded-md bg-lime-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                AI
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-tight text-slate-500 hidden sm:block">
              Verified Real Estate Discovery
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700">
          <Link
            href="/homes"
            className="flex items-center gap-1.5 transition-colors hover:text-lime-700 text-slate-900 font-bold"
          >
            <Search className="h-4 w-4 text-lime-600" />
            Explore Homes
          </Link>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-lime-700"
          >
            How It Works
          </a>
          <a
            href="#for-owners"
            className="transition-colors hover:text-lime-700"
          >
            For Owners
          </a>
          <a
            href="#for-agents"
            className="transition-colors hover:text-lime-700"
          >
            For Agents
          </a>
          <a
            href="#trust-safety"
            className="flex items-center gap-1 transition-colors hover:text-lime-700 text-slate-600"
          >
            <ShieldCheck className="h-4 w-4 text-lime-600" />
            Trust & Safety
          </a>
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href={getDashboardUrl()}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-colors"
              >
                <UserIcon className="h-3.5 w-3.5 text-lime-600" />
                <span className="max-w-[120px] truncate">{user.name}</span>
                <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                  {user.role}
                </span>
              </Link>
              <Button
                asChild
                className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs shadow-md shadow-lime-900/15 rounded-xl h-9 px-4"
              >
                <Link href={getDashboardUrl()}>
                  Workspace
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs h-9 px-3.5 rounded-xl"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs shadow-md shadow-lime-900/15 rounded-xl h-9 px-4"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <Button
              asChild
              size="sm"
              className="bg-lime-600 text-white text-xs font-bold h-8 px-2.5 rounded-lg"
            >
              <Link href={getDashboardUrl()}>Dashboard</Link>
            </Button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-3 font-semibold text-slate-800 text-sm">
            <Link
              href="/homes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 px-3 rounded-lg bg-lime-50 text-lime-800 font-bold"
            >
              <Search className="h-4 w-4 text-lime-700" />
              Explore Verified Homes
            </Link>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              How It Works
            </a>
            <a
              href="#for-owners"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              For Property Owners
            </a>
            <a
              href="#for-agents"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              For Real Estate Agents
            </a>
            <a
              href="#trust-safety"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <ShieldCheck className="h-4 w-4 text-lime-600" />
              Trust & Safety Infrastructure
            </a>

            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs">
                    <span className="font-semibold text-slate-800 truncate">{user.name}</span>
                    <span className="font-bold text-lime-700">{user.role}</span>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl"
                  >
                    <Link href={getDashboardUrl()} onClick={() => setMobileMenuOpen(false)}>
                      Open Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-xl font-bold text-xs"
                  >
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-xs"
                  >
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
