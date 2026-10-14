import type { Metadata } from 'next';
import { propertyService } from '@/server/services/property-service';
import PublicHeader from '@/components/public/PublicHeader';
import HeroSearch from '@/components/public/HeroSearch';
import FeaturedProperties from '@/components/public/FeaturedProperties';
import HowItWorks from '@/components/public/HowItWorks';
import PlatformBenefits from '@/components/public/PlatformBenefits';
import RoleValueProps from '@/components/public/RoleValueProps';
import TrustSafetySection from '@/components/public/TrustSafetySection';
import PublicFooter from '@/components/public/PublicFooter';

export const metadata: Metadata = {
  title: 'PropHunta AI — Verified Nigerian Real Estate Discovery & Trust Infrastructure',
  description:
    'Discover verified Nigerian homes for rent and sale. Cross-checked with title documentation, physical walkthrough audits, and accredited agent mandates across Lagos and Abuja.',
  openGraph: {
    title: 'PropHunta AI — Find a Place to Call Home',
    description:
      'Discover properties, connect with trusted real-estate professionals, and take your next step with greater confidence.',
    type: 'website',
  },
};

export default async function HomePage() {
  const allProperties = await propertyService.getAllProperties().catch(() => []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-lime-500 selection:text-white">
      {/* Public Header */}
      <PublicHeader />

      {/* Main Public Flow */}
      <main className="flex-1">
        {/* Hero Section with Interactive Search */}
        <HeroSearch />

        {/* Featured Real Listings from Store */}
        <FeaturedProperties properties={allProperties} />

        {/* How It Works Flow */}
        <HowItWorks />

        {/* Platform Transparency & Verification Benefits */}
        <PlatformBenefits />

        {/* Three Roles Value Proposition (Seeker, Owner, Agent) */}
        <RoleValueProps />

        {/* Trust & Safety Infrastructure */}
        <TrustSafetySection />
      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
