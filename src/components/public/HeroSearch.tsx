'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Home,
  Tag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const POPULAR_LOCATIONS = [
  'Lekki Phase 1',
  'Ikoyi',
  'Victoria Island',
  'Ikeja GRA',
  'Maitama, Abuja',
  'Wuse 2, Abuja',
];

const PROPERTY_TYPES = [
  { value: 'all', label: 'All Property Types' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'House', label: 'House' },
  { value: 'Duplex', label: 'Duplex' },
  { value: 'Semi-Detached Duplex', label: 'Semi-Detached Duplex' },
  { value: 'Terrace', label: 'Terrace' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Office Space', label: 'Office Space' },
  { value: 'Land', label: 'Land' },
];

const PRICE_TIERS_RENT = [
  { label: 'Any Min', value: '' },
  { label: '₦ 2,000,000', value: '2000000' },
  { label: '₦ 5,000,000', value: '5000000' },
  { label: '₦ 10,000,000', value: '10000000' },
  { label: '₦ 20,000,000', value: '20000000' },
  { label: '₦ 35,000,000', value: '35000000' },
];

const PRICE_TIERS_SALE = [
  { label: 'Any Min', value: '' },
  { label: '₦ 50,000,000', value: '50000000' },
  { label: '₦ 100,000,000', value: '100000000' },
  { label: '₦ 250,000,000', value: '250000000' },
  { label: '₦ 500,000,000', value: '500000000' },
  { label: '₦ 1,000,000,000', value: '1000000000' },
];

export default function HeroSearch() {
  const router = useRouter();
  const [purpose, setPurpose] = useState<'RENT' | 'SALE'>('RENT');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (location.trim()) {
      params.set('city', location.trim());
    }
    if (purpose) {
      params.set('listingType', purpose);
    }
    if (propertyType && propertyType !== 'all') {
      params.set('propertyType', propertyType);
    }
    if (minPrice) {
      params.set('minPrice', minPrice);
    }
    if (maxPrice) {
      params.set('maxPrice', maxPrice);
    }

    router.push(`/homes?${params.toString()}`);
  };

  const setQuickLocation = (loc: string) => {
    setLocation(loc);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-[#0e160f] to-[#080d09] text-white pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-lime-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Trust Eyebrow */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-500/30 bg-lime-950/40 px-3.5 py-1.5 text-xs font-semibold text-lime-400 backdrop-blur-md shadow-inner">
            <ShieldCheck className="h-4 w-4 text-lime-400" />
            <span>Verified Nigerian Real Estate Discovery</span>
            <span className="hidden sm:inline-block text-slate-500">•</span>
            <span className="hidden sm:inline-block text-slate-300">Title Authentication & Inspection Audits</span>
          </div>
        </div>

        {/* Main Headings */}
        <div className="mx-auto max-w-4xl text-center mb-10 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-headline tracking-tight text-white leading-[1.1] sm:leading-[1.15]">
            Find a Place to Call{' '}
            <span className="bg-gradient-to-r from-lime-400 via-emerald-300 to-lime-200 bg-clip-text text-transparent">
              Home.
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Discover properties, connect with trusted real-estate professionals, and take your next step with greater confidence.
          </p>
        </div>

        {/* Hero Interactive Search Module */}
        <div className="mx-auto max-w-4xl rounded-2xl sm:rounded-3xl border border-white/10 bg-white/95 p-4 sm:p-6 shadow-2xl backdrop-blur-xl text-slate-900">
          {/* Rent / Sale Toggle Tabs */}
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200/80 pb-3">
            <button
              type="button"
              onClick={() => {
                setPurpose('RENT');
                setMinPrice('');
                setMaxPrice('');
              }}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                purpose === 'RENT'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rent a Home
            </button>
            <button
              type="button"
              onClick={() => {
                setPurpose('SALE');
                setMinPrice('');
                setMaxPrice('');
              }}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                purpose === 'SALE'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Buy a Home
            </button>
            <span className="ml-auto text-[11px] font-bold text-slate-400 hidden sm:inline-block">
              Nigerian Naira (₦)
            </span>
          </div>

          {/* Search Inputs Grid */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
              {/* Location Input */}
              <div className="md:col-span-5 relative">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Location / City / Area
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lekki, Ikoyi, Ikeja, Maitama..."
                    className="pl-9 h-11 rounded-xl border-slate-200 bg-slate-50/70 text-slate-900 text-sm focus-visible:ring-lime-600 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Property Type Dropdown */}
              <div className="md:col-span-4 relative">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Property Type
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full pl-9 pr-8 h-11 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-lime-600 appearance-none cursor-pointer"
                  >
                    {PROPERTY_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div className="md:col-span-3 pt-0 md:pt-5">
                <Button
                  type="submit"
                  className="w-full h-11 bg-lime-600 hover:bg-lime-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-lime-900/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <Search className="h-4 w-4" />
                  Search Homes
                </Button>
              </div>
            </div>

            {/* Price Filter Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Min Price (₦)
                </label>
                <select
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2.5 h-9 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-600"
                >
                  {(purpose === 'RENT' ? PRICE_TIERS_RENT : PRICE_TIERS_SALE).map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Max Price (₦)
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 h-9 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-600"
                >
                  <option value="">Any Max</option>
                  {purpose === 'RENT' ? (
                    <>
                      <option value="5000000">₦ 5,000,000</option>
                      <option value="15000000">₦ 15,000,000</option>
                      <option value="30000000">₦ 30,000,000</option>
                      <option value="50000000">₦ 50,000,000</option>
                    </>
                  ) : (
                    <>
                      <option value="150000000">₦ 150,000,000</option>
                      <option value="300000000">₦ 300,000,000</option>
                      <option value="600000000">₦ 600,000,000</option>
                      <option value="1200000000">₦ 1,200,000,000</option>
                    </>
                  )}
                </select>
              </div>

              {/* Quick Location Pills */}
              <div className="col-span-2 flex flex-col justify-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Popular Hubs
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_LOCATIONS.slice(0, 3).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setQuickLocation(loc)}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-lime-100 hover:text-lime-800 text-slate-700 transition-colors"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Large Residential Imagery Showcase */}
        <div className="mt-12 sm:mt-16 mx-auto max-w-5xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative aspect-[16/9] sm:aspect-[21/9]">
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85"
            alt="Contemporary Nigerian Luxury Residence"
            fill
            priority
            className="object-cover"
            sizes="(max-w-7xl) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          
          {/* Floating Trust Callout on Hero Banner */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-4 sm:right-auto flex flex-wrap items-center gap-3 bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 max-w-md">
            <div className="h-10 w-10 rounded-xl bg-lime-600/30 border border-lime-500/40 flex items-center justify-center text-lime-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs sm:text-sm font-extrabold text-white">
                Title Authenticity & Physical Inspection Audit
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Every verified listing is cross-checked against land registry documentation and physical video walkthroughs.
              </div>
            </div>
          </div>
        </div>

        {/* Platform Pillars Counter */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center max-w-4xl mx-auto">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="text-2xl font-black text-lime-400 font-headline">100%</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Real Listed Records</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="text-2xl font-black text-lime-400 font-headline">Multi-Tier</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Agent Credential Audit</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="text-2xl font-black text-lime-400 font-headline">Zero</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Hidden Agreement Markups</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="text-2xl font-black text-lime-400 font-headline">Cadastral</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Location & Flood Scoring</div>
          </div>
        </div>
      </div>
    </section>
  );
}
