'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function MarketplaceError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();

  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <h1 className="text-xl font-bold">Marketplace</h1>
      <p role="alert" className="mb-4 mt-2 text-sm text-slate-600">Listings could not be loaded. Please try again.</p>
      <Button disabled={retrying} onClick={() => startTransition(() => {
        router.refresh();
        reset();
      })}>{retrying ? 'Retrying…' : 'Retry'}</Button>
    </Card>
  );
}
