'use client';

import Link from 'next/link';
import { Property } from '@/types/prophunta';
import PropertyCard from '@/components/property-card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface FeaturedPropertiesProps {
  properties: Property[];
}

export default function FeaturedProperties({ properties }: FeaturedPropertiesProps) {
  // Only show active or verified properties
  const displayProperties = properties
    .filter(
      (p) =>
        p.listingStatus === 'VERIFIED' ||
        p.listingStatus === 'ACTIVE' ||
        p.listingStatus === 'RESERVED'
    )
    .slice(0, 6);

  if (displayProperties.length === 0) {
    return (
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 rounded-2xl bg-white border border-slate-200 max-w-lg mx-auto">
            <ShieldCheck className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No properties currently available</h3>
            <p className="text-xs text-slate-500 mt-1">
              New verified property submissions are undergoing review.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24 bg-[#f8fafc] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-xs font-extrabold mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-lime-700" />
              Verified Inventory
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-headline tracking-tight text-slate-900">
              Featured Nigerian Discoveries
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
              Authentic residential listings cross-referenced against title documentation and physical inspection records.
            </p>
          </div>

          <Button
            asChild
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl h-11 px-5 shadow-sm shrink-0"
          >
            <Link href="/homes" className="flex items-center gap-2">
              Explore All Homes
              <ArrowRight className="h-4 w-4 text-lime-400" />
            </Link>
          </Button>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-500">
            Displaying authentic property records currently published on PropHunta AI.
          </p>
        </div>
      </div>
    </section>
  );
}
