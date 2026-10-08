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
import { registerAction } from '@/server/actions/prophunta-actions';
import { UserRole } from '@/types/prophunta';
import { ShieldCheck, UserCheck, Building2, Briefcase, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>('SEEKER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('role', selectedRole);

    const res = await registerAction(formData);

    if (!res.success) {
      setError(res.error || 'Registration failed');
      setLoading(false);
      return;
    }

    toast({
      title: 'Account Created',
      description: `Welcome to PropHunta AI, ${res.user?.name}!`,
    });

    router.push('/dashboard');
  };

  return (
    <div className="w-full max-w-xl mx-auto py-8 px-4">
      <Card className="rounded-2xl shadow-xl border-slate-200/80 bg-white">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg p-2">
              <Logo className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">
            Create your PropHunta AI Account
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Join Nigeria&apos;s verified property trust network
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Role Selection */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-2">
                Select Your Role
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('SEEKER')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    selectedRole === 'SEEKER'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-2 ring-blue-600/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-xs leading-tight">Property Seeker</span>
                  <span className="text-[10px] text-slate-400 font-normal">Buyer / Tenant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('OWNER')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    selectedRole === 'OWNER'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-2 ring-blue-600/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="text-xs leading-tight">Property Owner</span>
                  <span className="text-[10px] text-slate-400 font-normal">Title Holder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('AGENT')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    selectedRole === 'AGENT'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-2 ring-blue-600/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <span className="text-xs leading-tight">Verified Agent</span>
                  <span className="text-[10px] text-slate-400 font-normal">Manager / Broker</span>
                </button>
              </div>
            </div>

            {/* Profile Inputs */}
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-slate-700">Full Name</Label>
                <Input id="name" name="name" placeholder="e.g. Babatunde Williams" required className="h-10 rounded-xl" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="babatunde@example.com" required className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-700">Phone Number</Label>
                  <Input id="phone" name="phone" placeholder="+234 803 000 0000" required className="h-10 rounded-xl" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Min. 6 characters" required className="h-10 rounded-xl" />
              </div>

              {/* Agent / Professional details */}
              {selectedRole === 'AGENT' && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>Agent Professional Credentials</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="agencyName" className="text-[11px] font-semibold text-slate-600">Agency / Brokerage Name</Label>
                      <Input id="agencyName" name="agencyName" placeholder="e.g. Lagos Prime Properties" className="h-9 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="licenseNumber" className="text-[11px] font-semibold text-slate-600">LASRERA / License No.</Label>
                      <Input id="licenseNumber" name="licenseNumber" placeholder="e.g. LASRERA-2026-0412" className="h-9 rounded-lg" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating verified account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
