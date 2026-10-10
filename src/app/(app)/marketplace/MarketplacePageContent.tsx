'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from "@/components/property-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListFilter, ChevronLeft, ChevronRight, Save, LayoutGrid, Map as MapIcon, MapPin, Building, ArrowRight, ShieldCheck, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const ITEMS_PER_PAGE = 16;
type SortOption = 'newest' | 'price-asc' | 'price-desc';

interface MarketplacePageContentProps {
  initialProperties?: any[];
}

export default function MarketplacePageContent({ initialProperties = [] }: MarketplacePageContentProps) {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const searchQuery = searchParams.get('search') || '';
  const initialView = searchParams.get('view') === 'map' ? 'map' : 'grid';

  const [viewMode, setViewMode] = useState<'grid' | 'map'>(initialView);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(initialProperties[0]?.id || null);
  const [locationSearch, setLocationSearch] = useState(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [listingType, setListingType] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [bedrooms, setBedrooms] = useState('any');
  const [bathrooms, setBathrooms] = useState('any');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availability, setAvailability] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  useEffect(() => {
    if (searchParams.get('view') === 'map') {
      setViewMode('map');
    }
  }, [searchParams]);

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = initialProperties.filter(p => {
        const listingTypeMatch =
            listingType === 'all' ||
            (listingType === 'sale' && (p.status === 'For Sale' || p.listingType === 'SALE')) ||
            (listingType === 'rent' && (p.status === 'For Rent' || p.listingType === 'RENT'));

        const propTypeValue = (p.propertyType || p.type || '').toLowerCase().replace(/\s+/g, '-');
        const propertyTypeMatch = propertyType === 'all' || propTypeValue === propertyType.toLowerCase().replace(/\s+/g, '-');
        const bedroomsMatch = bedrooms === 'any' || (p.bedrooms !== undefined && p.bedrooms >= Number(bedrooms));
        const bathroomsMatch = bathrooms === 'any' || (p.bathrooms !== undefined && p.bathrooms >= Number(bathrooms));

        const minPriceMatch = !minPrice || p.price >= Number(minPrice);
        const maxPriceMatch = !maxPrice || p.price <= Number(maxPrice);

        const propAvailability = p.availabilityStatus || 'AVAILABLE';
        const availabilityMatch = availability === 'all' || propAvailability === availability;

        // Exclude unverified drafts or compliance-restricted listings from public discovery
        const isPublicListing =
          p.listingStatus === 'ACTIVE' ||
          p.listingStatus === 'VERIFIED' ||
          p.listingStatus === 'RESERVED' ||
          p.listingStatus === 'OCCUPIED' ||
          p.listingStatus === 'SOLD';
        if (!isPublicListing && p.listingStatus) {
          return false;
        }

        // Strict verification: Do not display a generic "Verified" badge unless the verification model supports it
        const hasVerifiedProof = p.listingStatus === 'VERIFIED' || p.verification?.overallStatus === 'PASSED';
        const verifiedOnlyMatch = !verifiedOnly || hasVerifiedProof;

        const activeSearch = (locationSearch || searchQuery).trim().toLowerCase();
        const searchMatch = activeSearch ?
            (p.title && p.title.toLowerCase().includes(activeSearch)) ||
            (p.description && p.description.toLowerCase().includes(activeSearch)) ||
            (p.address && p.address.toLowerCase().includes(activeSearch)) ||
            (p.city && p.city.toLowerCase().includes(activeSearch)) ||
            (p.area && p.area.toLowerCase().includes(activeSearch)) ||
            (p.state && p.state.toLowerCase().includes(activeSearch))
            : true;

        return listingTypeMatch && propertyTypeMatch && bedroomsMatch && bathroomsMatch && minPriceMatch && maxPriceMatch && availabilityMatch && verifiedOnlyMatch && searchMatch;
    });

    switch (sortOption) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
        default:
             filtered.sort((a, b) => new Date(b.createdAt || b.postedDate || 0).getTime() - new Date(a.createdAt || a.postedDate || 0).getTime());
            break;
    }

    return filtered;

  }, [initialProperties, listingType, propertyType, bedrooms, bathrooms, minPrice, maxPrice, availability, verifiedOnly, sortOption, searchQuery, locationSearch]);

  const totalPages = Math.ceil(filteredAndSortedProperties.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProperties = filteredAndSortedProperties.slice(startIndex, endIndex);

  const selectedProperty = useMemo(() => {
    return initialProperties.find(p => p.id === selectedMapPropertyId) || initialProperties[0];
  }, [initialProperties, selectedMapPropertyId]);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  }

  const handleSortChange = (value: SortOption) => {
    setSortOption(value);
    setCurrentPage(1);
  }

  const handleResetFilters = () => {
    setListingType('all');
    setPropertyType('all');
    setBedrooms('any');
    setBathrooms('any');
    setMinPrice('');
    setMaxPrice('');
    setAvailability('all');
    setVerifiedOnly(false);
    setSortOption('newest');
    setCurrentPage(1);
    toast({
      title: "Filters reset",
      description: "Showing all available properties.",
    });
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages > 0) pageNumbers.push(1);
    if (currentPage > 3 && totalPages > 5) pageNumbers.push('...');
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    for (let i = startPage; i <= endPage; i++) {
        if (!pageNumbers.includes(i)) pageNumbers.push(i);
    }
    if (currentPage < totalPages - 2 && totalPages > 5) pageNumbers.push('...');
    if (totalPages > 1 && !pageNumbers.includes(totalPages)) pageNumbers.push(totalPages);
    return pageNumbers;
  }

  const handleApplyFilters = () => {
    toast({
      title: "Filters applied",
      description: `Showing ${filteredAndSortedProperties.length} matching properties.`,
    });
  };

  const handleSaveSearch = () => {
    toast({
      title: "Search saved",
      description: "Search criteria saved! You will receive notifications when matching listings are published.",
    });
  };

  const hasActiveFilters = listingType !== 'all' || propertyType !== 'all' || bedrooms !== 'any' || bathrooms !== 'any' || minPrice !== '' || maxPrice !== '' || availability !== 'all' || verifiedOnly;

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (listingType !== 'all') count++;
    if (propertyType !== 'all') count++;
    if (bedrooms !== 'any') count++;
    if (bathrooms !== 'any') count++;
    if (minPrice !== '') count++;
    if (maxPrice !== '') count++;
    if (availability !== 'all') count++;
    if (verifiedOnly) count++;
    return count;
  }, [listingType, propertyType, bedrooms, bathrooms, minPrice, maxPrice, availability, verifiedOnly]);

  const QUICK_LOCATION_PILLS = ['All', 'Lekki', 'Ikoyi', 'Victoria Island', 'Ikeja', 'Abuja'];

  return (
    <div className="container mx-auto px-1 sm:px-4">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-headline text-slate-900 tracking-tight">
            Find Verified Properties
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {searchQuery ? `Showing results for "${searchQuery}"` : "Audited listings with 6-point verification & zero advance fraud."}
          </p>
        </div>

        {/* View Mode Toggle Button Group */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
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
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* Mobile & Desktop Search & Filter Container */}
      <Card className="mb-6 p-3 sm:p-5 shadow-xs border-slate-200/90 rounded-2xl bg-white">
        {/* Row 0: Search input & Mobile filter trigger */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-0">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 shrink-0" />
            <Input
              type="text"
              placeholder="Area, street, or city (e.g. Lekki, Ikoyi, Ikeja)..."
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-9 pr-14 rounded-xl text-xs sm:text-sm font-medium border-slate-200 bg-slate-50/70 focus:bg-white transition-colors"
            />
            {locationSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocationSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button (visible below md) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className={`md:hidden h-10 px-3 rounded-xl border text-xs font-bold shrink-0 gap-1.5 ${
              activeFiltersCount > 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Swipeable Quick-Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setListingType('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 ${
              listingType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              setListingType(listingType === 'rent' ? 'all' : 'rent');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 ${
              listingType === 'rent'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            For Rent
          </button>
          <button
            type="button"
            onClick={() => {
              setListingType(listingType === 'sale' ? 'all' : 'sale');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 ${
              listingType === 'sale'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            For Sale
          </button>
          <button
            type="button"
            onClick={() => {
              setVerifiedOnly(!verifiedOnly);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 flex items-center gap-1 ${
              verifiedOnly
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Only
          </button>
          {QUICK_LOCATION_PILLS.slice(1).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setLocationSearch(locationSearch === loc ? '' : loc);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 ${
                locationSearch === loc
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* Full Filter Controls: Collapsible on Mobile, Expanded on Desktop */}
        <div className={`${isMobileFiltersOpen ? 'block' : 'hidden md:block'} pt-3 border-t border-slate-100 mt-2`}>
          {/* Row 1: Primary Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
            <div className="grid gap-1">
              <label className="text-[11px] font-bold text-slate-700">Listing Type</label>
              <Select value={listingType} onValueChange={handleFilterChange(setListingType)}>
                <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Listings</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-slate-700">Property Type</label>
               <Select value={propertyType} onValueChange={handleFilterChange(setPropertyType)}>
                <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="single-room">Single Room</SelectItem>
                    <SelectItem value="rp-apart">R&amp;P Apart</SelectItem>
                    <SelectItem value="self-apart">Self Apart</SelectItem>
                    <SelectItem value="office-space">Office Space</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="shop">Shop</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                </SelectContent>
                </Select>
            </div>
             <div className="grid gap-1.5">
              <label className="text-xs font-bold text-slate-700">Beds</label>
               <Select value={bedrooms} onValueChange={handleFilterChange(setBedrooms)}>
                <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any Beds</SelectItem>
                    <SelectItem value="1">1+ Bed</SelectItem>
                    <SelectItem value="2">2+ Beds</SelectItem>
                    <SelectItem value="3">3+ Beds</SelectItem>
                    <SelectItem value="4">4+ Beds</SelectItem>
                </SelectContent>
                </Select>
            </div>
             <div className="grid gap-1.5">
              <label className="text-xs font-bold text-slate-700">Baths</label>
               <Select value={bathrooms} onValueChange={handleFilterChange(setBathrooms)}>
                <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any Baths</SelectItem>
                    <SelectItem value="1">1+ Bath</SelectItem>
                    <SelectItem value="2">2+ Baths</SelectItem>
                    <SelectItem value="3">3+ Baths</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-slate-700">Availability</label>
               <Select value={availability} onValueChange={handleFilterChange(setAvailability)}>
                <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Availabilities</SelectItem>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="UNDER_OFFER">Under Offer</SelectItem>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                </SelectContent>
                </Select>
            </div>
        </div>

        {/* Row 2: Price Range & Trust Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5 items-end mt-3 pt-3 border-t border-slate-100">
          <div className="md:col-span-3 grid gap-1.5">
            <label className="text-xs font-bold text-slate-700">Min Price (₦)</label>
            <Input
              type="number"
              placeholder="e.g. 500,000"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="md:col-span-3 grid gap-1.5">
            <label className="text-xs font-bold text-slate-700">Max Price (₦)</label>
            <Input
              type="number"
              placeholder="e.g. 20,000,000"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="md:col-span-3 grid gap-1.5">
            <label className="text-xs font-bold text-slate-700">Sort by</label>
            <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 flex items-center h-9">
            <button
              type="button"
              onClick={() => {
                setVerifiedOnly(!verifiedOnly);
                setCurrentPage(1);
              }}
              className={`w-full h-9 flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition ${
                verifiedOnly
                  ? 'bg-slate-900 text-emerald-400 border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className={`h-4 w-4 ${verifiedOnly ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Verified Trust Only</span>
            </button>
          </div>
        </div>

        {/* Row 3: Actions & Active Filters Reset */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Showing <strong>{filteredAndSortedProperties.length}</strong> matching listings</span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold ml-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset filters
                  </button>
                )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleApplyFilters} className="w-full sm:w-auto h-9 text-xs rounded-xl bg-blue-600 hover:bg-blue-500">
                    <ListFilter className="mr-1.5 h-3.5 w-3.5" />
                    Apply Filters
                </Button>
                <Button onClick={handleSaveSearch} variant="outline" className="w-full sm:w-auto h-9 text-xs rounded-xl">
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Save Search
                </Button>
            </div>
        </div>
        </div>
      </Card>

      {/* VIEW SWITCHER: Map View vs Grid View */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          {/* Interactive Map Visual */}
          <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Interactive Property Map</h3>
                <p className="text-xs text-slate-500">Click on pins to explore listings across prime Nigerian locations</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> For Rent
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> For Sale / Land
                </span>
              </div>
            </div>

            <div className="relative h-[480px] w-full rounded-2xl bg-gradient-to-br from-sky-50 via-slate-50 to-blue-100 border border-slate-200/80 overflow-hidden">
              {/* Map vector topography */}
              <svg viewBox="0 0 800 480" className="absolute inset-0 h-full w-full object-cover" fill="none">
                <path d="M0,280 C200,240 360,310 560,260 C680,230 760,280 800,290 L800,480 L0,480 Z" fill="#bfdbfe" opacity="0.4" />
                <path d="M120,140 C240,110 360,180 500,140 C620,110 720,160 800,130" stroke="#93c5fd" strokeWidth="4" strokeDasharray="6 6" opacity="0.6" />
                <path d="M40,60 Q200,80 380,50 T760,70" stroke="#cbd5e1" strokeWidth="2" />
              </svg>

              {/* Interactive Region Pins */}
              {initialProperties.slice(0, 8).map((prop, idx) => {
                const positions = [
                  { top: '38%', left: '68%', name: 'Lekki Phase 1' },
                  { top: '22%', left: '32%', name: 'Gwarinpa Abuja' },
                  { top: '48%', left: '52%', name: 'Victoria Island' },
                  { top: '28%', left: '46%', name: 'Ikeja GRA' },
                  { top: '44%', left: '60%', name: 'Ikoyi Lagos' },
                  { top: '65%', left: '42%', name: 'Port Harcourt' },
                  { top: '34%', left: '56%', name: 'Surulere' },
                  { top: '52%', left: '72%', name: 'Ajah' },
                ];
                const pos = positions[idx] || { top: '50%', left: '50%', name: prop.city };
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
                          ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-300/60'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {formatCurrency(prop.price, prop.status, prop.priceUnit)}
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full mt-1 shadow-md transition-colors ${
                        isSelected ? 'bg-blue-600 ring-4 ring-blue-200' : 'bg-slate-700 group-hover:bg-blue-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Selected Property Preview Panel */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Selected Listing</span>
              {selectedProperty && (
                <div className="mt-3">
                  <PropertyCard property={selectedProperty} />
                  <div className="mt-4 flex gap-2">
                    <Button asChild className="w-full">
                      <Link href={`/property/${selectedProperty.id}`}>
                        <span>Full Details</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Map Navigation Tips</h4>
              <p className="text-xs text-slate-500 mt-1">
                Click any price pin on the map to inspect property specs, verified status, and pricing details.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
            {currentProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
            {currentProperties.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-16">
                    <p className="text-lg">No properties match your criteria.</p>
                    <p>Try adjusting your filters or clearing your search.</p>
                </div>
            )}
          </div>

          {currentProperties.length > 0 && (
            <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mt-8">
                <Button variant="outline" size="icon" onClick={handlePreviousPage} disabled={currentPage === 1} className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                    <Button
                    key={`${page}-${index}`}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handlePageClick(page)}
                    >
                    {page}
                    </Button>
                ) : (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                )
                )}

                <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          )}
        </>
      )}

    </div>
  );
}