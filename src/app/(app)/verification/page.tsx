'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function VerificationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile?tab=verification');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 p-8 text-center">
      <div className="h-14 w-14 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center animate-pulse">
        <ShieldCheck className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-headline text-slate-900">Trust & Verification Portal</h2>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to your unified Account Profile...
        </p>
      </div>
    </div>
  );
}
