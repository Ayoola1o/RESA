'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/logo';
import { loginAction } from '@/server/actions/prophunta-actions';
import { ShieldCheck, ArrowRight, Loader2, KeyRound, Sparkles, User, Shield, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/context/UserRoleContext';

const DEMO_STAFF_ACCOUNTS = [
  { role: 'Super Admin', email: 'admin@prophunta.ai', desc: 'Full authority & emergency overrides', color: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' },
  { role: 'Verification Officer', email: 'verification@prophunta.ai', desc: 'Title authentication & review queue', color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
  { role: 'Property Moderator', email: 'moderator@prophunta.ai', desc: 'Listing moderation & suspension', color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
  { role: 'Trust & Safety', email: 'trust@prophunta.ai', desc: 'Fraud investigations & disputes', color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100' },
  { role: 'Inspection Coord', email: 'inspections@prophunta.ai', desc: 'Field & video inspection audits', color: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100' },
  { role: 'User Support', email: 'support@prophunta.ai', desc: 'Account support & KYC onboarding', color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' },
  { role: 'Compliance Auditor', email: 'compliance@prophunta.ai', desc: 'Read-only immutable audit trail', color: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100' },
  { role: 'Staff Manager', email: 'staffmanager@prophunta.ai', desc: 'Delegated staff provisioning', color: 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100' },
];

const DEMO_USER_ACCOUNTS = [
  { role: 'Seeker (Tenant/Buyer)', email: 'seeker@prophunta.ai', desc: 'Verified property discovery' },
  { role: 'Property Owner', email: 'owner@prophunta.ai', desc: 'Verified landlord with listings' },
  { role: 'Licensed Agent', email: 'agent@prophunta.ai', desc: 'LASRERA accredited agency' },
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshUser } = useUserRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'admin' | 'public'>('admin');

  const fillCredentials = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('Password123!');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await loginAction(formData);

    if (!res.success || !res.user) {
      setError(res.error || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    await refreshUser();

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('prophunta_user_role', res.user.role);
      } catch {}
    }

    toast({
      title: 'Welcome to PropHunta AI',
      description: `Signed in as ${res.user.name} (${res.user.role})`,
    });

    if (res.user.role === 'ADMIN') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 grid md:grid-cols-2 gap-8 sm:gap-10 items-center">
      {/* Brand & Trust Mission Column */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-600 to-lime-800 text-white shadow-xl shadow-lime-950/20 p-2">
            <Logo className="h-9 w-9" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight">PropHunta</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-lime-600 text-white">AI</span>
            </div>
            <p className="text-xs font-semibold text-lime-700">Verified Trust Infrastructure for Property</p>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Verified Property.
            <br />
            <span className="text-lime-700">Smarter Decisions.</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md">
            Eliminating real estate fraud, double-allocation, and unverified representation across Nigeria through cryptographic title audits, cadastral verification, and documented physical inspections.
          </p>
        </div>

        {/* 2 Value Pillars */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <ShieldCheck className="h-5 w-5 text-lime-700 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Documented Title Reviews</h4>
              <p className="text-[11px] text-slate-500">
                Land registry checks, Governor&apos;s Consent confirmation, and verified survey coordinates.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <KeyRound className="h-5 w-5 text-lime-700 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Physical & Video Inspections</h4>
              <p className="text-[11px] text-slate-500">
                On-site meter readings, condition scorecards, and discrepancy logs before commitments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Card */}
      <Card className="mx-auto w-full max-w-md rounded-2xl shadow-xl border-slate-200/80 bg-white">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-black text-slate-900 text-center">
            Sign In to PropHunta AI
          </CardTitle>
          <CardDescription className="text-center text-xs text-slate-500">
            Enter your email and password to access your verified account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
                <Link href="/forgot-password" className="text-[11px] text-lime-700 font-bold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-lime-600 hover:bg-lime-500 text-white font-bold text-sm shadow-md shadow-lime-950/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying credentials...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-lime-600" />
                Quick Fill Demo Accounts
              </span>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className={`px-2 py-0.5 rounded-md transition-all ${activeTab === 'admin' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Admin ({DEMO_STAFF_ACCOUNTS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('public')}
                  className={`px-2 py-0.5 rounded-md transition-all ${activeTab === 'public' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Public ({DEMO_USER_ACCOUNTS.length})
                </button>
              </div>
            </div>

            {activeTab === 'admin' ? (
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                {DEMO_STAFF_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillCredentials(acc.email)}
                    className={`flex flex-col items-start p-2 rounded-xl text-left border transition-all ${acc.color}`}
                  >
                    <span className="text-[10.5px] font-black leading-tight truncate w-full">{acc.role}</span>
                    <span className="text-[9px] opacity-80 truncate w-full font-mono mt-0.5">{acc.email}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5">
                {DEMO_USER_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillCredentials(acc.email)}
                    className="flex items-center justify-between p-2 rounded-xl text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-slate-800"
                  >
                    <div>
                      <span className="text-[11px] font-bold block">{acc.role}</span>
                      <span className="text-[10px] text-slate-500">{acc.desc}</span>
                    </div>
                    <span className="text-[9.5px] font-mono text-lime-700 bg-lime-50 px-2 py-0.5 rounded-md border border-lime-200">
                      {acc.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400 text-center mt-2">Default Password: <span className="font-mono font-bold text-slate-600">Password123!</span></p>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-lime-700 font-bold hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
