

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const MarketplacePageContent = dynamic(() => import('./MarketplacePageContent'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">Loading...</div>,
});

export default function MarketplacePage() {
  return <MarketplacePageContent />;
}
