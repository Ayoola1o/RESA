'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Bookmark,
  FileText,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Search,
  PlusCircle,
  Sparkles,
  Compass,
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { properties } from '@/lib/mock-data';
import PropertyCard from '@/components/property-card';
import AiRecommendations from '@/components/ai-recommendations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/context/UserRoleContext';

// Chart data representing Lagos average property prices over the year (in Millions of Naira)
const marketPriceData = {
  Lagos: [
    { month: 'Jan', price: 110 },
    { month: 'Feb', price: 114 },
    { month: 'Mar', price: 112 },
    { month: 'Apr', price: 118 },
    { month: 'May', price: 122 },
    { month: 'Jun', price: 120 },
    { month: 'Jul', price: 126 },
    { month: 'Aug', price: 130 },
    { month: 'Sep', price: 135 },
    { month: 'Oct', price: 132 },
    { month: 'Nov', price: 140 },
    { month: 'Dec', price: 145 },
  ],
  Abuja: [
    { month: 'Jan', price: 95 },
    { month: 'Feb', price: 98 },
    { month: 'Mar', price: 96 },
    { month: 'Apr', price: 102 },
    { month: 'May', price: 105 },
    { month: 'Jun', price: 108 },
    { month: 'Jul', price: 112 },
    { month: 'Aug', price: 115 },
    { month: 'Sep', price: 118 },
    { month: 'Oct', price: 120 },
    { month: 'Nov', price: 125 },
    { month: 'Dec', price: 128 },
  ],
  'Port Harcourt': [
    { month: 'Jan', price: 70 },
    { month: 'Feb', price: 72 },
    { month: 'Mar', price: 75 },
    { month: 'Apr', price: 76 },
    { month: 'May', price: 79 },
    { month: 'Jun', price: 82 },
    { month: 'Jul', price: 85 },
    { month: 'Aug', price: 86 },
    { month: 'Sep', price: 89 },
    { month: 'Oct', price: 91 },
    { month: 'Nov', price: 94 },
    { month: 'Dec', price: 98 },
  ],
};

const featuredProperties = properties.slice(0, 4);

export default function DashboardPage() {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedCity, setSelectedCity] = useState<'Lagos' | 'Abuja' | 'Port Harcourt'>('Lagos');
  const [activeTimeframe, setActiveTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('1Y');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const currentFeatured = featuredProperties[featuredIndex] || featuredProperties[0];

  const handleNextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1) % featuredProperties.length);
  };

  const handlePrevFeatured = () => {
    setFeaturedIndex((prev) => (prev - 1 + featuredProperties.length) % featuredProperties.length);
  };

  const chartData = marketPriceData[selectedCity] || marketPriceData.Lagos;

  const { currentUser, role } = useUserRole();
  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Member';

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Greeting & Context Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {userName} 👋
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {role === 'SEEKER' ? 'Property Seeker' : role === 'OWNER' ? 'Property Owner' : role === 'AGENT' ? 'Agent / Manager' : 'Verification Officer'}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            PropHunta AI &mdash; Building the verified trust infrastructure for Nigerian property.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <span className="text-xs font-semibold text-slate-400">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            <span>Lagos &bull; Abuja, Nigeria</span>
          </div>
        </div>
      </div>

      {/* Role Action Banners */}
      {role === 'ADMIN' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/40 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Verification Officer Portal Active</h3>
              <p className="text-xs text-slate-300">
                Audit pending property titles (C of O, Governor&apos;s Consent), manage trust reports, and enforce listing compliance.
              </p>
            </div>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Link href="/admin">Open Verification Queue &rarr;</Link>
          </Button>
        </div>
      )}

      {(role === 'OWNER' || role === 'AGENT') && (
        <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 border border-blue-800/60 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30 shrink-0">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">List Your Property with Verified Trust Status</h3>
              <p className="text-xs text-blue-200">
                Upload survey plan or title documentation to receive the PropHunta Verified Trust Shield and unlock serious seekers.
              </p>
            </div>
          </div>
          <Button asChild className="bg-white text-blue-950 hover:bg-blue-50 font-semibold shrink-0">
            <Link href="/landlord/add-property">Add New Listing &rarr;</Link>
          </Button>
        </div>
      )}

      {/* 2. Top Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Properties Viewed */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Home className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Total Properties Viewed</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">12</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                33%
              </span>
              <span className="text-slate-400">vs. last 7 days</span>
            </div>
          </div>
        </div>

        {/* Card 2: Saved Properties */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Bookmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Saved Properties</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">8</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                100%
              </span>
              <span className="text-slate-400">vs. last 7 days</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Applications */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Active Applications</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">2</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                50%
              </span>
              <span className="text-slate-400">vs. last 7 days</span>
            </div>
          </div>
        </div>

        {/* Card 4: Unread Messages */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Unread Messages</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">3</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="font-bold text-red-500 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                200%
              </span>
              <span className="text-slate-400">vs. last 7 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid (2 Columns: Left 8 Cols, Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= LEFT COLUMN (8 Columns) ================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Featured Property Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl min-h-[340px] sm:min-h-[380px] flex flex-col justify-end p-6 sm:p-8 text-white shadow-xl transition-all">
            {/* Background Image */}
            <Image
              src={currentFeatured.images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80'}
              alt={currentFeatured.title}
              fill
              priority
              className="object-cover transition-transform duration-700 hover:scale-105"
              data-ai-hint="luxury duplex villa"
            />
            {/* Ambient Dark Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

            {/* Banner Top Badge & Controls */}
            <div className="relative z-10 flex items-center justify-between w-full mb-auto pb-8">
              <span className="inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/10 shadow-sm">
                Featured Property
              </span>

              {/* Carousel controls matching screenshot `< 1/4 >` */}
              <div className="flex items-center gap-2 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 px-2.5 py-1 text-xs text-white">
                <button
                  type="button"
                  onClick={handlePrevFeatured}
                  aria-label="Previous property"
                  className="p-1 hover:text-blue-400 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold tracking-wider text-[11px]">
                  {featuredIndex + 1} / {featuredProperties.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextFeatured}
                  aria-label="Next property"
                  className="p-1 hover:text-blue-400 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Property Information */}
            <div className="relative z-10 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {currentFeatured.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 mt-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span>{currentFeatured.address}, {currentFeatured.city}</span>
              </div>

              <div className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight">
                ₦ {currentFeatured.price.toLocaleString()}
                {currentFeatured.priceUnit && (
                  <span className="text-base font-normal text-slate-300">
                    {currentFeatured.priceUnit}
                  </span>
                )}
              </div>

              {/* Specs */}
              <div className="mt-2.5 flex items-center gap-5 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  🛏️ {currentFeatured.bedrooms} Beds
                </span>
                <span className="flex items-center gap-1.5">
                  🛁 {currentFeatured.bathrooms} Baths
                </span>
                <span className="flex items-center gap-1.5">
                  📐 {currentFeatured.sqft.toLocaleString()} sqft
                </span>
              </div>

              {/* View Details Button */}
              <div className="mt-5">
                <Link
                  href={`/property/${currentFeatured.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-all hover:gap-3"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* "Your Properties" Row */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your Properties</h3>
                <p className="text-xs text-slate-500">
                  Properties you&apos;ve viewed, saved or are interested in.
                </p>
              </div>
              <Link
                href="/profile?tab=saved"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {properties.slice(0, 4).map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          </div>

          {/* Bottom Grid: Market Overview & Explore by Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Market Overview */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              {/* Header & Controls */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Market Overview</h4>

                <div className="flex items-center gap-2">
                  {/* City Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <span>{selectedCity}</span>
                        <ChevronDown className="h-3 w-3 text-slate-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => setSelectedCity('Lagos')}>Lagos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedCity('Abuja')}>Abuja</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedCity('Port Harcourt')}>Port Harcourt</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Timeframe Toggles */}
                  <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold text-slate-600">
                    {(['1M', '3M', '6M', '1Y'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setActiveTimeframe(tf)}
                        className={`rounded-md px-2 py-0.5 transition ${
                          activeTimeframe === tf
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'hover:text-slate-900'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Value and Trend */}
              <div className="mt-4">
                <span className="text-xs font-medium text-slate-500">Average Property Prices</span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    ₦ 125,000,000
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                    <ArrowUpRight className="h-3 w-3" />
                    12.5%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">vs. last year</span>
              </div>

              {/* Chart */}
              <div className="mt-4 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      domain={[0, 200]}
                      ticks={[0, 100, 150, 200]}
                      tickFormatter={(val) => (val === 0 ? '0' : `${val}M`)}
                    />
                    <Tooltip
                      formatter={(value: any) => [`₦ ${value}M`, 'Avg. Price']}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#priceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card: Explore by Location */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900">Explore by Location</h4>
                <Link
                  href="/marketplace?view=map"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Stylized Lagos Map Preview */}
              <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-slate-50 to-blue-100 border border-slate-200/70 p-3 flex items-center justify-center">
                {/* Visual coastal and island lines */}
                <svg
                  viewBox="0 0 320 180"
                  className="absolute inset-0 h-full w-full object-cover"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Water bodies */}
                  <path
                    d="M0,110 C80,95 140,120 220,95 C270,80 320,105 320,110 L320,180 L0,180 Z"
                    fill="#bfdbfe"
                    opacity="0.45"
                  />
                  <path
                    d="M40,50 C90,40 130,70 190,55 C240,40 280,60 320,45"
                    stroke="#93c5fd"
                    strokeWidth="4"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  {/* Land contours */}
                  <path
                    d="M10,20 Q80,25 150,15 T310,20"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Region Markers */}
                {/* Ikeja Pin */}
                <Link
                  href="/marketplace?search=Ikeja"
                  className="absolute top-8 left-16 group flex items-center gap-1 z-10"
                >
                  <span className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-200/80 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition">
                    Ikeja
                  </span>
                </Link>

                {/* Lagos Island / VI Pin */}
                <Link
                  href="/marketplace?search=Victoria%20Island"
                  className="absolute bottom-12 left-28 group flex items-center gap-1 z-10"
                >
                  <span className="h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-200/80" />
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition">
                    Lagos
                  </span>
                </Link>

                {/* Lekki Callout Card matching screenshot */}
                <Link
                  href="/marketplace?search=Lekki"
                  className="absolute bottom-10 right-10 z-20 flex flex-col items-center group"
                >
                  <div className="rounded-xl bg-[#0b132b] px-3.5 py-1.5 text-center text-white shadow-xl border border-slate-700 hover:scale-105 transition-transform">
                    <span className="text-xs font-bold block leading-tight">Lekki</span>
                    <span className="text-[10px] text-slate-300 leading-tight">12 properties</span>
                  </div>
                  {/* Pin dot */}
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-300 mt-1 shadow-md" />
                </Link>
              </div>

              {/* Legend matching screenshot */}
              <div className="mt-3 flex items-center justify-center gap-6 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span>For Sale</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span>For Rent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Land</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (4 Columns) ================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card 1: Market Intelligence (Dark Card) */}
          <div className="rounded-3xl bg-[#0b132b] border border-slate-800 p-6 text-white shadow-xl relative overflow-hidden">
            {/* Header */}
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Market Intelligence</h3>
              <p className="text-xs text-slate-400 mt-0.5">Lagos Property Market</p>
            </div>

            {/* Growth Metric */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-xs font-bold border border-emerald-500/30">
                + 12.5%
              </span>
              <p className="text-xs text-slate-400 mt-1">Avg. price growth (YoY)</p>
            </div>

            {/* Sparkline Graphic */}
            <div className="my-4 h-12 w-full">
              <svg viewBox="0 0 240 40" className="h-full w-full" fill="none">
                <path
                  d="M0,32 Q30,35 60,25 T120,20 T180,10 T240,6"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="240" cy="6" r="4" fill="#38bdf8" />
              </svg>
            </div>

            {/* Key Insights */}
            <div className="space-y-3.5 border-t border-slate-800/80 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Insights
              </p>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                  <Home className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  High demand for 3–4 bedroom homes in Lekki and Ikoyi
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Rental yields remain strong at 7–10% in prime areas
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 mt-0.5">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Property values expected to grow by 8–15% in 2025
                </p>
              </div>
            </div>

            {/* View Full Report Button */}
            <Link
              href="/marketplace?view=map"
              className="mt-6 flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-700 bg-transparent py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              <span>View Full Report</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card 2: Recent Activity */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
              <Link
                href="/profile?tab=applications"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {/* Activity 1 */}
              <Link
                href="/messages"
                className="flex items-start gap-3 group p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                      New message from Estate Agent
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">2h ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Hello! I have a property that matches your criteria...
                  </p>
                </div>
              </Link>

              {/* Activity 2 */}
              <Link
                href="/profile?tab=applications"
                className="flex items-start gap-3 group p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                      Application status update
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">4h ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Your application for 3 Bedroom Condo was approved
                  </p>
                </div>
              </Link>

              {/* Activity 3 */}
              <Link
                href="/profile?tab=saved"
                className="flex items-start gap-3 group p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Bookmark className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                      Property saved
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">5h ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    You saved Luxury 4 Bedroom Duplex
                  </p>
                </div>
              </Link>

              {/* Activity 4 */}
              <Link
                href="/profile?tab=maintenance"
                className="flex items-start gap-3 group p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Building className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                      Maintenance request
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">1d ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Your request #MNT-0042 has been updated
                  </p>
                </div>
              </Link>

              {/* Activity 5 */}
              <div className="flex items-start gap-3 p-1.5 -mx-1.5 rounded-xl">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      New market insight
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">1d ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Lagos property prices increased by 12.5%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Actions */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Action 1: Search Properties */}
              <Link
                href="/marketplace"
                className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Search className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-blue-600 transition-colors">
                  Search Properties
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Find your next home</span>
              </Link>

              {/* Action 2: Add Property */}
              <Link
                href="/landlord/dashboard"
                className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-blue-600 transition-colors">
                  Add Property
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">List your property</span>
              </Link>

              {/* Action 3: AI Recommendations */}
              <AiRecommendations
                open={isAiModalOpen}
                onOpenChange={setIsAiModalOpen}
                trigger={
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-indigo-50/60 hover:border-indigo-200 transition-all text-left w-full"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-indigo-600 transition-colors">
                      AI Recommendations
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Get personalized matches</span>
                  </button>
                }
              />

              {/* Action 4: View on Map */}
              <Link
                href="/marketplace?view=map"
                className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-200 transition-all text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Compass className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-emerald-600 transition-colors">
                  View on Map
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Explore by location</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
