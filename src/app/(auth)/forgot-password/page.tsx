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
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/logo';
import { resetPasswordAction } from '@/server/actions/prophunta-actions';
import { ShieldCheck, ArrowRight, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await resetPasswordAction(email, newPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to reset password.');
      return;
    }

    setSuccess(true);
    toast({
      title: 'Password Reset Successful',
      description: 'You can now sign in with your new password.',
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-[#080d09] via-[#0c140d] to-slate-950">
      <div className="mb-5 sm:mb-6 flex flex-col items-center text-center">
        <Link href="/" className="flex items-center gap-2 mb-2">
          <Logo />
        </Link>
        <p className="text-xs text-lime-400 font-medium">
          Verified Trust Infrastructure for Nigerian Real Estate
        </p>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="text-center pb-3 pt-5 sm:pt-6">
          <div className="h-11 w-11 rounded-xl bg-lime-50 text-lime-700 flex items-center justify-center mx-auto mb-2 border border-lime-200">
            <KeyRound className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-black font-headline text-slate-900">
            Reset Account Password
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Enter your registered PropHunta email and choose a new secure password.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-5">
          {success ? (
            <div className="text-center py-5 space-y-4">
              <div className="h-12 w-12 rounded-full bg-lime-50 text-lime-600 flex items-center justify-center mx-auto border border-lime-200">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Password Updated</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Your credentials have been securely updated in the database.
                </p>
              </div>
              <Button asChild className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold h-10 rounded-xl">
                <Link href="/login">Proceed to Sign In &rarr;</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-bold text-slate-700">Registered Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. seeker@prophunta.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-9 sm:h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="newPassword" className="text-xs font-bold text-slate-700">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-9 sm:h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-9 sm:h-10 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 sm:h-11 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl shadow-md shadow-lime-950/10 transition-colors"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Password
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="border-t bg-slate-50/70 p-3.5 sm:p-4 flex items-center justify-between text-xs text-slate-500">
          <Link href="/login" className="text-lime-700 hover:underline font-bold">
            &larr; Back to Sign In
          </Link>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-lime-600" /> End-to-end verified
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
