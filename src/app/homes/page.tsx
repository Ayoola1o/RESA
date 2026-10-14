import { Suspense } from 'react';
import type { Metadata } from 'next';
import { propertyService } from '@/server/services/property-service';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import HomesSearchClient from '@/components/homes/HomesSearchClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Explore Verified Properties & Homes | PropHunta AI',
  description:
    'Search verified Nigerian homes for rent and sale in Lekki, Ikoyi, Victoria Island, Ikeja, and Abuja. Audited title documentation, physical video walkthroughs, and direct party mandates.',
  openGraph: {
    title: 'Explore Verified Homes | PropHunta AI',
    description:
      'Search authentic listings with transparent Nigerian Naira pricing, verified ownership, and zero advance fraud.',
    type: 'website',
  },
};

export default async function HomesPage() {
  const allProperties = await propertyService.getAllProperties().catch(() => []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-lime-500 selection:text-white">
      {/* Consistent Public Header */}
      <PublicHeader />

      {/* Main Homes Search Client */}
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-lime-600 mb-3" />
              <p className="text-sm font-semibold">Loading verified property discovery...</p>
            </div>
          }
        >
          <HomesSearchClient initialProperties={allProperties} />
        </Suspense>
      </main>

      {/* Consistent Public Footer */}
      <PublicFooter />
    </div>
  );
}
