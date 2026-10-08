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
import { loginAction, switchDemoRoleAction } from '@/server/actions/prophunta-actions';
import { UserRole } from '@/types/prophunta';
import { ShieldCheck, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await loginAction(formData);

    if (!res.success) {
      setError(res.error || 'Invalid credentials');
      setLoading(false);
      return;
    }

    toast({
      title: 'Welcome to PropHunta AI',
      description: `Signed in as ${res.user?.name} (${res.user?.role})`,
    });

    if (res.user?.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    const res = await switchDemoRoleAction(role);
    if (res.success && res.user) {
      toast({
        title: `Switched to ${role}`,
        description: `Logged in as ${res.user.name}`,
      });
      if (role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError('Could not switch demo session.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 grid md:grid-cols-2 gap-10 items-center">
      {/* Brand & Trust Mission Column */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl shadow-blue-900/20 p-2">
            <Logo className="h-9 w-9" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight">PropHunta</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">AI</span>
            </div>
            <p className="text-xs font-semibold text-blue-600">Verified Trust Infrastructure for Property</p>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Verified Property.
            <br />
            <span className="text-blue-600">Smarter Decisions.</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md">
            Eliminating real estate fraud, double-allocation, and unverified representation across Nigeria through cryptographic title audits, cadastral verification, and documented physical inspections.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Documented Title Reviews</h4>
              <p className="text-[11px] text-slate-500">
                Land registry checks, Governor&apos;s Consent confirmation, and verified survey coordinates.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <KeyRound className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
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
            Enter your credentials to access your verified account
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
                placeholder="seeker@prophunta.ai"
                defaultValue="seeker@prophunta.ai"
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
                <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue="Password123!"
                required
                className="h-10 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying session...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* 1-Click Role Demonstrator Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
              Instant 1-Click Role Login (MVP Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemoLogin('SEEKER')}
                disabled={loading}
                className="text-xs font-semibold rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
              >
                Seeker (Buyer/Tenant)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemoLogin('OWNER')}
                disabled={loading}
                className="text-xs font-semibold rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
              >
                Property Owner
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemoLogin('AGENT')}
                disabled={loading}
                className="text-xs font-semibold rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
              >
                Verified Agent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemoLogin('ADMIN')}
                disabled={loading}
                className="text-xs font-semibold rounded-xl border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800"
              >
                Admin (Verification Officer)
              </Button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 font-bold hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
