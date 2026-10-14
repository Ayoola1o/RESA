'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Property } from '@/types/prophunta';
import PropertyCard from '@/components/property-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  Map as MapIcon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Check,
  ArrowUpDown,
  Home,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const ITEMS_PER_PAGE = 12;

const PROPERTY_TYPES = [
  'All Types',
  'Apartment',
  'House',
  'Duplex',
  'Semi-Detached Duplex',
  'Fully Detached Duplex',
  'Terrace',
  'Maisonette',
  'Mini Flat',
  'Commercial',
  'Office Space',
  'Land',
];

const POPULAR_LOCATIONS = ['All', 'Lekki', 'Ikoyi', 'Victoria Island', 'Ikeja', 'Abuja'];

interface HomesSearchClientProps {
  initialProperties: Property[];
}

export default function HomesSearchClient({ initialProperties }: HomesSearchClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse and validate state from URL params
  const rawCity = searchParams.get('city') || searchParams.get('search') || '';
  const cityParam = typeof rawCity === 'string' ? rawCity.slice(0, 100) : '';

  const rawPurpose = searchParams.get('listingType') || searchParams.get('purpose') || 'all';
  const normPurpose = rawPurpose.toUpperCase();
  const listingTypeParam = ['RENT', 'SALE', 'LEASE'].includes(normPurpose) ? normPurpose : 'ALL';

  const rawPropertyType = searchParams.get('propertyType') || 'All Types';
  const propertyTypeParam = PROPERTY_TYPES.includes(rawPropertyType) ? rawPropertyType : 'All Types';

  const rawMinPrice = searchParams.get('minPrice') || '';
  const validMinPrice = !isNaN(Number(rawMinPrice)) && Number(rawMinPrice) >= 0 && rawMinPrice !== '' ? rawMinPrice : '';

  const rawMaxPrice = searchParams.get('maxPrice') || '';
  const validMaxPrice = !isNaN(Number(rawMaxPrice)) && Number(rawMaxPrice) >= 0 && rawMaxPrice !== '' ? rawMaxPrice : '';

  const rawBedrooms = searchParams.get('bedrooms') || 'any';
  const bedroomsParam = ['1', '2', '3', '4', '5'].includes(rawBedrooms) ? rawBedrooms : 'any';

  const rawBathrooms = searchParams.get('bathrooms') || 'any';
  const bathroomsParam = ['1', '2', '3'].includes(rawBathrooms) ? rawBathrooms : 'any';

  const verifiedOnlyParam = searchParams.get('verifiedOnly') === 'true';

  const rawSort = searchParams.get('sort') || 'newest';
  const sortParam: 'newest' | 'price-asc' | 'price-desc' = ['newest', 'price-asc', 'price-desc'].includes(rawSort as any)
    ? (rawSort as any)
    : 'newest';

  const rawView = searchParams.get('view') || 'grid';
  const viewParam: 'grid' | 'map' = rawView === 'map' ? 'map' : 'grid';

  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const pageParam = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  // Local filter states
  const [searchTerm, setSearchTerm] = useState(cityParam);
  const [listingType, setListingType] = useState(listingTypeParam);
  const [propertyType, setPropertyType] = useState(propertyTypeParam);
  const [minPrice, setMinPrice] = useState(validMinPrice);
  const [maxPrice, setMaxPrice] = useState(validMaxPrice);
  const [bedrooms, setBedrooms] = useState(bedroomsParam);
  const [bathrooms, setBathrooms] = useState(bathroomsParam);
  const [verifiedOnly, setVerifiedOnly] = useState(verifiedOnlyParam);
  const [sortOption, setSortOption] = useState<'newest' | 'price-asc' | 'price-desc'>(sortParam);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(viewParam);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(
    initialProperties[0]?.id || null
  );

  // Sync state when URL params change externally (back/forward navigation)
  useEffect(() => {
    setSearchTerm(cityParam);
    setListingType(listingTypeParam);
    setPropertyType(propertyTypeParam);
    setMinPrice(validMinPrice);
    setMaxPrice(validMaxPrice);
    setBedrooms(bedroomsParam);
    setBathrooms(bathroomsParam);
    setVerifiedOnly(verifiedOnlyParam);
    setSortOption(sortParam);
    setViewMode(viewParam);
    setCurrentPage(pageParam);
  }, [
    cityParam,
    listingTypeParam,
    propertyTypeParam,
    validMinPrice,
    validMaxPrice,
    bedroomsParam,
    bathroomsParam,
    verifiedOnlyParam,
    sortParam,
    viewParam,
    pageParam,
  ]);

  // Synchronize state back into URL query string
  const updateUrl = useCallback(
    (newParams: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, val]) => {
        if (!val || val === 'all' || val === 'All Types' || val === 'any' || val === 'false') {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      });

      // Reset to page 1 unless page itself was specified
      if (!('page' in newParams)) {
        current.delete('page');
      }

      router.push(`${pathname}?${current.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Search input handler with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== cityParam) {
        updateUrl({ city: searchTerm.trim() || null });
        setCurrentPage(1);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [searchTerm, cityParam, updateUrl]);

  // Filter application
  const filteredProperties = useMemo(() => {
    let result = initialProperties.filter((p) => {
      // Listing status rule: Only show public active/verified/reserved listings
      const isPublic =
        p.listingStatus === 'ACTIVE' ||
        p.listingStatus === 'VERIFIED' ||
        p.listingStatus === 'RESERVED' ||
        p.listingStatus === 'OCCUPIED' ||
        p.listingStatus === 'SOLD';
      if (!isPublic && p.listingStatus) return false;

      // Purpose / listingType
      if (listingType !== 'ALL') {
        const typeMatch =
          (listingType === 'RENT' && (p.listingType === 'RENT' || p.priceUnit?.includes('year'))) ||
          (listingType === 'SALE' && p.listingType === 'SALE') ||
          (listingType === 'LEASE' && p.listingType === 'LEASE');
        if (!typeMatch) return false;
      }

      // Property type
      if (propertyType !== 'All Types' && propertyType !== 'all') {
        const normProp = (p.propertyType || '').toLowerCase();
        const normFilter = propertyType.toLowerCase();
        if (normProp !== normFilter) return false;
      }

      // Min & Max Price with safe numeric validation
      const numMin = minPrice !== '' && !isNaN(Number(minPrice)) ? Number(minPrice) : null;
      const numMax = maxPrice !== '' && !isNaN(Number(maxPrice)) ? Number(maxPrice) : null;
      if (numMin !== null && p.price < numMin) return false;
      if (numMax !== null && p.price > numMax) return false;

      // Bedrooms
      if (bedrooms !== 'any') {
        const bedNum = parseInt(bedrooms, 10);
        if (p.bedrooms === undefined || p.bedrooms < bedNum) return false;
      }

      // Bathrooms
      if (bathrooms !== 'any') {
        const bathNum = parseInt(bathrooms, 10);
        if (p.bathrooms === undefined || p.bathrooms < bathNum) return false;
      }

      // Strict Verification
      if (verifiedOnly) {
        const isVerified =
          p.listingStatus === 'VERIFIED' || p.verification?.overallStatus === 'PASSED';
        if (!isVerified) return false;
      }

      // Search keyword / location
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesCity = p.city?.toLowerCase().includes(q);
        const matchesArea = p.area?.toLowerCase().includes(q);
        const matchesAddress = p.address?.toLowerCase().includes(q);
        const matchesState = p.state?.toLowerCase().includes(q);
        const matchesFeatures = p.features?.some((f) => f.toLowerCase().includes(q));

        if (
          !matchesTitle &&
          !matchesCity &&
          !matchesArea &&
          !matchesAddress &&
          !matchesState &&
          !matchesFeatures
        ) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        result.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
    }

    return result;
  }, [
    initialProperties,
    listingType,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    verifiedOnly,
    searchTerm,
    sortOption,
  ]);

  // Pagination calculation
  const totalItems = filteredProperties.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrl({ page: newPage > 1 ? newPage.toString() : null });
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setListingType('ALL');
    setPropertyType('All Types');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('any');
    setBathrooms('any');
    setVerifiedOnly(false);
    setSortOption('newest');
    setCurrentPage(1);
    router.push(pathname);
  };

  // Active filter count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (listingType !== 'ALL') count++;
    if (propertyType !== 'All Types' && propertyType !== 'all') count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (bedrooms !== 'any') count++;
    if (bathrooms !== 'any') count++;
    if (verifiedOnly) count++;
    if (searchTerm.trim()) count++;
    return count;
  }, [listingType, propertyType, minPrice, maxPrice, bedrooms, bathrooms, verifiedOnly, searchTerm]);

  const selectedMapProperty = useMemo(() => {
    return initialProperties.find((p) => p.id === selectedMapPropertyId) || initialProperties[0];
  }, [initialProperties, selectedMapPropertyId]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Banner / Heading */}
      <div className="border-b border-slate-200/90 bg-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-lime-700 bg-lime-50 border border-lime-200/60 px-2.5 py-0.5 rounded-md mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-lime-600" />
                Verified Nigerian Listings
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-headline text-slate-900 tracking-tight">
                Explore Homes & Properties
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {totalItems === 0
                  ? 'No properties match the selected criteria'
                  : `Showing ${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of ${totalItems} verified listings`}
              </p>
            </div>

            {/* View Mode Toggle (Grid vs Map) */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('grid');
                    updateUrl({ view: null });
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('map');
                    updateUrl({ view: 'map' });
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'map'
                      ? 'bg-lime-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  <span>Map View</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter Control Surface */}
      <div className="sticky top-16 sm:top-[72px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Location Input & Quick Pills */}
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search city, neighborhood, or address..."
                  className="pl-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm font-medium bg-slate-50/70 focus-visible:ring-lime-600"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Purpose Pill Group */}
              <div className="hidden sm:flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setListingType('ALL');
                    updateUrl({ listingType: null });
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    listingType === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setListingType('RENT');
                    updateUrl({ listingType: 'RENT' });
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    listingType === 'RENT'
                      ? 'bg-lime-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rent
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setListingType('SALE');
                    updateUrl({ listingType: 'SALE' });
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    listingType === 'SALE'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Buy
                </button>
              </div>
            </div>

            {/* Desktop Filters Dropdowns */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Property Type Dropdown */}
              <Select
                value={propertyType}
                onValueChange={(val) => {
                  setPropertyType(val);
                  updateUrl({ propertyType: val === 'All Types' ? null : val });
                }}
              >
                <SelectTrigger className="w-[160px] h-10 text-xs font-semibold rounded-xl border-slate-200">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Bedrooms Dropdown */}
              <Select
                value={bedrooms}
                onValueChange={(val) => {
                  setBedrooms(val);
                  updateUrl({ bedrooms: val === 'any' ? null : val });
                }}
              >
                <SelectTrigger className="w-[120px] h-10 text-xs font-semibold rounded-xl border-slate-200">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any" className="text-xs">Any Beds</SelectItem>
                  <SelectItem value="1" className="text-xs">1+ Beds</SelectItem>
                  <SelectItem value="2" className="text-xs">2+ Beds</SelectItem>
                  <SelectItem value="3" className="text-xs">3+ Beds</SelectItem>
                  <SelectItem value="4" className="text-xs">4+ Beds</SelectItem>
                  <SelectItem value="5" className="text-xs">5+ Beds</SelectItem>
                </SelectContent>
              </Select>

              {/* Verified Only Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !verifiedOnly;
                  setVerifiedOnly(next);
                  updateUrl({ verifiedOnly: next ? 'true' : null });
                }}
                className={`flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-bold border transition-all ${
                  verifiedOnly
                    ? 'bg-lime-900 text-lime-300 border-lime-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className={`h-4 w-4 ${verifiedOnly ? 'text-lime-300' : 'text-slate-400'}`} />
                <span>Verified Only</span>
              </button>

              {/* Sort Dropdown */}
              <Select
                value={sortOption}
                onValueChange={(val: any) => {
                  setSortOption(val);
                  updateUrl({ sort: val === 'newest' ? null : val });
                }}
              >
                <SelectTrigger className="w-[150px] h-10 text-xs font-semibold rounded-xl border-slate-200">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">Newest Added</SelectItem>
                  <SelectItem value="price-asc" className="text-xs">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc" className="text-xs">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Filter Drawer Button */}
            <div className="flex lg:hidden items-center justify-between gap-2 pt-1 border-t border-slate-100 sm:border-0 sm:pt-0">
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 text-xs font-bold rounded-xl border-slate-200 flex items-center justify-center gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-lime-600" />
                    <span>Filter Options</span>
                    {activeFiltersCount > 0 && (
                      <span className="h-5 w-5 rounded-full bg-lime-600 text-white text-[10px] font-black flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-6">
                  <SheetHeader className="text-left mb-4">
                    <SheetTitle className="text-lg font-black font-headline">Filter Properties</SheetTitle>
                    <SheetDescription className="text-xs text-slate-500">
                      Customize search filters across verified Nigerian listings.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-4 py-2">
                    {/* Listing Type / Purpose */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Listing Purpose</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['ALL', 'RENT', 'SALE'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setListingType(type)}
                            className={`py-2 text-xs font-bold rounded-xl border ${
                              listingType === type
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {type === 'ALL' ? 'All' : type === 'RENT' ? 'Rent' : 'Buy'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Property Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Property Type</label>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                      >
                        {PROPERTY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Min Price (₦)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="h-10 text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Max Price (₦)</label>
                        <Input
                          type="number"
                          placeholder="No max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="h-10 text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Bedrooms & Bathrooms */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Bedrooms</label>
                        <select
                          value={bedrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                        >
                          <option value="any">Any Beds</option>
                          <option value="1">1+ Beds</option>
                          <option value="2">2+ Beds</option>
                          <option value="3">3+ Beds</option>
                          <option value="4">4+ Beds</option>
                          <option value="5">5+ Beds</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Bathrooms</label>
                        <select
                          value={bathrooms}
                          onChange={(e) => setBathrooms(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                        >
                          <option value="any">Any Baths</option>
                          <option value="1">1+ Baths</option>
                          <option value="2">2+ Baths</option>
                          <option value="3">3+ Baths</option>
                        </select>
                      </div>
                    </div>

                    {/* Strict Verified Toggle */}
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="rounded text-lime-600 focus:ring-lime-500 h-4 w-4"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">Verified Trust Only</div>
                        <div className="text-slate-500 text-[11px]">Show only properties with verified title & physical audit</div>
                      </div>
                    </label>
                  </div>

                  <SheetFooter className="mt-6 flex flex-row gap-2 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleResetFilters();
                        setMobileFilterOpen(false);
                      }}
                      className="flex-1 rounded-xl text-xs font-bold"
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        updateUrl({
                          listingType: listingType === 'ALL' ? null : listingType,
                          propertyType: propertyType === 'All Types' ? null : propertyType,
                          minPrice: minPrice || null,
                          maxPrice: maxPrice || null,
                          bedrooms: bedrooms === 'any' ? null : bedrooms,
                          bathrooms: bathrooms === 'any' ? null : bathrooms,
                          verifiedOnly: verifiedOnly ? 'true' : null,
                        });
                        setMobileFilterOpen(false);
                      }}
                      className="flex-1 bg-lime-600 hover:bg-lime-500 text-white rounded-xl text-xs font-bold"
                    >
                      Apply Filters
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              {/* Sort on Mobile */}
              <Select
                value={sortOption}
                onValueChange={(val: any) => {
                  setSortOption(val);
                  updateUrl({ sort: val === 'newest' ? null : val });
                }}
              >
                <SelectTrigger className="w-[140px] h-10 text-xs font-semibold rounded-xl border-slate-200">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">Newest</SelectItem>
                  <SelectItem value="price-asc" className="text-xs">Price: Low-High</SelectItem>
                  <SelectItem value="price-desc" className="text-xs">Price: High-Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Active Filters:
              </span>
              {listingType !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                  Purpose: {listingType === 'RENT' ? 'For Rent' : 'For Sale'}
                  <button type="button" onClick={() => { setListingType('ALL'); updateUrl({ listingType: null }); }}>
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
              {propertyType !== 'All Types' && propertyType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                  Type: {propertyType}
                  <button type="button" onClick={() => { setPropertyType('All Types'); updateUrl({ propertyType: null }); }}>
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
              {bedrooms !== 'any' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                  Beds: {bedrooms}+
                  <button type="button" onClick={() => { setBedrooms('any'); updateUrl({ bedrooms: null }); }}>
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
              {verifiedOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-lime-100 text-lime-900 font-semibold text-[11px]">
                  Verified Trust Only
                  <button type="button" onClick={() => { setVerifiedOnly(false); updateUrl({ verifiedOnly: null }); }}>
                    <X className="h-3 w-3 text-lime-700 hover:text-lime-900" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                  Search: "{searchTerm}"
                  <button type="button" onClick={() => { setSearchTerm(''); updateUrl({ city: null }); }}>
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-lime-700 hover:text-lime-800 ml-auto flex items-center gap-1 underline underline-offset-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Results Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW: Map Mode */}
        {viewMode === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
            {/* Interactive Vector Topography Map */}
            <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">Interactive Property Map</h3>
                  <p className="text-xs text-slate-500">Click on pins to explore verified Nigerian locations</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-lime-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-lime-600" /> Rent
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> Sale
                  </span>
                </div>
              </div>

              <div className="relative h-[480px] w-full rounded-2xl bg-gradient-to-br from-lime-50/50 via-slate-50 to-emerald-50/40 border border-slate-200/80 overflow-hidden">
                <svg viewBox="0 0 800 480" className="absolute inset-0 h-full w-full object-cover" fill="none">
                  <path d="M0,280 C200,240 360,310 560,260 C680,230 760,280 800,290 L800,480 L0,480 Z" fill="#d9f99d" opacity="0.3" />
                  <path d="M120,140 C240,110 360,180 500,140 C620,110 720,160 800,130" stroke="#bef264" strokeWidth="4" strokeDasharray="6 6" opacity="0.6" />
                  <path d="M40,60 Q200,80 380,50 T760,70" stroke="#cbd5e1" strokeWidth="2" />
                </svg>

                {/* Interactive Map Pins */}
                {filteredProperties.slice(0, 10).map((prop, idx) => {
                  const positions = [
                    { top: '38%', left: '68%' },
                    { top: '22%', left: '32%' },
                    { top: '48%', left: '52%' },
                    { top: '28%', left: '46%' },
                    { top: '44%', left: '60%' },
                    { top: '65%', left: '42%' },
                    { top: '34%', left: '56%' },
                    { top: '52%', left: '72%' },
                    { top: '58%', left: '62%' },
                    { top: '30%', left: '38%' },
                  ];
                  const pos = positions[idx] || { top: '50%', left: '50%' };
                  const isSelected = selectedMapPropertyId === prop.id;

                  return (
                    <button
                      key={prop.id}
                      type="button"
                      onClick={() => setSelectedMapPropertyId(prop.id)}
                      style={{ top: pos.top, left: pos.left }}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 flex flex-col items-center transition-all ${
                        isSelected ? 'scale-110 z-30' : 'hover:scale-105'
                      }`}
                    >
                      <div
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-lg border transition-all ${
                          isSelected
                            ? 'bg-lime-600 text-white border-lime-400 ring-4 ring-lime-300/60'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {formatCurrency(prop.price, prop.listingType === 'RENT' ? 'For Rent' : 'For Sale', prop.priceUnit)}
                      </div>
                      <div
                        className={`h-3 w-3 rounded-full mt-1 shadow-md transition-colors ${
                          isSelected ? 'bg-lime-600 ring-4 ring-lime-200' : 'bg-slate-700 group-hover:bg-lime-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Card Preview on Map */}
            <div className="lg:col-span-4 flex flex-col">
              {selectedMapProperty ? (
                <div className="sticky top-40 space-y-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Selected Location Detail
                  </div>
                  <PropertyCard property={selectedMapProperty} />
                  <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11">
                    <Link href={`/property/${selectedMapProperty.id}`}>
                      View Complete Verification File
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-3xl bg-white">
                  Select a pin on the map to preview details.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VIEW: Grid Mode */
          <div>
            {paginatedProperties.length === 0 ? (
              /* Empty Search State */
              <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs max-w-2xl mx-auto my-8">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold font-headline text-slate-900">
                  No verified properties match your filters
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  Try adjusting your price range, property type, or clearing location keywords to see available listings.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button
                    type="button"
                    onClick={handleResetFilters}
                    className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-xs h-10 px-5"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Responsive Listings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
                    <div className="text-xs text-slate-500">
                      Page <span className="font-bold text-slate-800">{validPage}</span> of{' '}
                      <span className="font-bold text-slate-800">{totalPages}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={validPage <= 1}
                        onClick={() => handlePageChange(validPage - 1)}
                        className="rounded-xl h-9 text-xs font-bold"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => handlePageChange(pNum)}
                          className={`h-9 w-9 rounded-xl text-xs font-bold transition-all ${
                            validPage === pNum
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pNum}
                        </button>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={validPage >= totalPages}
                        onClick={() => handlePageChange(validPage + 1)}
                        className="rounded-xl h-9 text-xs font-bold"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
