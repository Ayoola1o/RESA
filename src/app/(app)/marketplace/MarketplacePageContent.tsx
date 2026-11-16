'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from "@/components/property-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListFilter, ChevronLeft, ChevronRight, LayoutGrid, Map as MapIcon, MapPin, Building, ArrowRight, RotateCcw } from "lucide-react";
import Link from 'next/link';
import GooglePropertyMap from '@/components/maps/GooglePropertyMap';
import { getValidCoordinates } from '@/lib/maps/property-coordinates';
import type { Property, UserRole } from '@/types/prophunta';

const ITEMS_PER_PAGE = 16;
type SortOption = 'newest' | 'price-asc' | 'price-desc';

interface MarketplacePageContentProps {
  initialProperties: Property[];
  role: UserRole;
  initialFilters: { search: string; listingType: string; propertyType: string };
}

const workspaceLinks = {
  SEEKER: { href: '/saved', label: 'Saved Properties' },
  OWNER: { href: '/properties', label: 'My Properties' },
  AGENT: { href: '/properties', label: 'Authorized Listings' },
  ADMIN: { href: '/admin', label: 'Admin Dashboard' },
} satisfies Record<UserRole, { href: string; label: string }>;

export default function MarketplacePageContent({ initialProperties, role, initialFilters }: MarketplacePageContentProps) {
  const searchParams = useSearchParams();
  const viewMode = searchParams.get('view') === 'map' ? 'map' : 'grid';
  const workspaceLink = workspaceLinks[role];
  const propertyTypes = [...new Set(initialProperties.map((property) => property.propertyType))].sort();

  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState(initialFilters.search);
  const [currentPage, setCurrentPage] = useState(1);
  const [listingType, setListingType] = useState(
    ['RENT', 'SALE', 'LEASE'].includes(initialFilters.listingType) ? initialFilters.listingType : 'all'
  );
  const [propertyType, setPropertyType] = useState(initialFilters.propertyType.toLowerCase());
  const [bedrooms, setBedrooms] = useState('any');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  function setViewMode(view: 'grid' | 'map') {
    const url = new URL(window.location.href);
    if (view === 'map') url.searchParams.set('view', 'map');
    else url.searchParams.delete('view');
    window.history.pushState(null, '', url);
  }

  const filteredAndSortedProperties = useMemo(() => {
    const search = locationSearch.trim().toLowerCase();
    const filtered = initialProperties.filter((p) => {
      const listingTypeMatch = listingType === 'all' || p.listingType === listingType;
      const propertyTypeMatch = propertyType === 'all' || p.propertyType.toLowerCase() === propertyType;
      const bedroomsMatch = bedrooms === 'any' || p.bedrooms >= Number(bedrooms);
      const minPriceMatch = !minPrice || p.price >= Number(minPrice);
      const maxPriceMatch = !maxPrice || p.price <= Number(maxPrice);
      const searchMatch = !search || [p.title, p.description, p.address, p.city, p.area, p.state]
        .some((value) => value?.toLowerCase().includes(search));

      return listingTypeMatch && propertyTypeMatch && bedroomsMatch && minPriceMatch && maxPriceMatch && searchMatch;
    });

    if (sortOption === 'price-asc') return filtered.sort((a, b) => a.price - b.price);
    if (sortOption === 'price-desc') return filtered.sort((a, b) => b.price - a.price);
    return filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [initialProperties, listingType, propertyType, bedrooms, minPrice, maxPrice, sortOption, locationSearch]);

  const totalPages = Math.ceil(filteredAndSortedProperties.length / ITEMS_PER_PAGE);
  const page = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProperties = filteredAndSortedProperties.slice(startIndex, endIndex);

  const mappableProperties = useMemo(
    () => filteredAndSortedProperties.filter((property) => getValidCoordinates(property) !== null),
    [filteredAndSortedProperties]
  );
  const selectedProperty = mappableProperties.find((property) => property.id === selectedMapPropertyId) ?? mappableProperties[0];

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
    setLocationSearch('');
    setMinPrice('');
    setMaxPrice('');
    setSortOption('newest');
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(Math.max(page - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(page + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages > 0) pageNumbers.push(1);
    const startPage = Math.max(2, Math.min(page - 1, totalPages - 3));
    const endPage = Math.min(totalPages - 1, startPage + 2);
    if (startPage > 2) pageNumbers.push('...');
    for (let i = startPage; i <= endPage; i++) {
        if (!pageNumbers.includes(i)) pageNumbers.push(i);
    }
    if (endPage < totalPages - 1) pageNumbers.push('...');
    if (totalPages > 1 && !pageNumbers.includes(totalPages)) pageNumbers.push(totalPages);
    return pageNumbers;
  }

  const activeFiltersCount = [listingType !== 'all', propertyType !== 'all', bedrooms !== 'any', minPrice !== '', maxPrice !== '']
    .filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0 || Boolean(locationSearch.trim()) || sortOption !== 'newest';
  const quickLocations = [...new Set(initialProperties.map((property) => property.area || property.city).filter(Boolean))]
    .sort()
    .slice(0, 6);

  return (
    <div className="container mx-auto px-1 sm:px-4">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-headline text-slate-900 tracking-tight">
            Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified listings by location, property type, and budget.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={workspaceLink.href}>{workspaceLink.label}</Link>
          </Button>
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              type="button"
              aria-pressed={viewMode === 'grid'}
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
              aria-pressed={viewMode === 'map'}
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'map'
                  ? 'bg-lime-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>Map View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Horizontal Search & Filter Bar */}
      <div className="sticky top-14 sm:top-16 z-20 mb-6 rounded-2xl border border-slate-200/80 bg-white/95 p-2.5 sm:p-3.5 shadow-xs backdrop-blur-md transition-all">
        {/* Row 0: Search input & Actions */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="relative flex-1 min-w-0">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 shrink-0 pointer-events-none" />
            <Input
              type="text"
              aria-label="Search properties"
              placeholder="Search by neighborhood, city, or property title"
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-9 pr-14 rounded-xl text-xs sm:text-sm font-medium border-slate-200 bg-slate-50/80 focus:bg-white focus:border-slate-400 transition-colors"
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

          {/* Detailed Filters Modal/Drawer Trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className={`h-10 px-3.5 rounded-xl border text-xs font-bold shrink-0 gap-1.5 transition-all ${
              activeFiltersCount > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">More Filters</span>
            <span className="sm:hidden">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="h-10 px-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>

        {/* Scrollable Quick-Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setListingType('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 ${
              listingType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {[
            { value: 'RENT', label: 'For Rent' },
            { value: 'SALE', label: 'For Sale' },
            { value: 'LEASE', label: 'For Lease' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={listingType === value}
              onClick={() => handleFilterChange(setListingType)(listingType === value ? 'all' : value)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 font-bold transition ${
                listingType === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
          {quickLocations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setLocationSearch(locationSearch === loc ? '' : loc);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 ${
                locationSearch === loc
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* Detailed Filter Panel (Expandable) */}
        {isMobileFiltersOpen && (
          <div className="pt-3 border-t border-slate-100 mt-2.5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
              <div className="grid gap-1">
                <label className="text-[11px] font-bold text-slate-700">Listing Type</label>
                <Select value={listingType} onValueChange={handleFilterChange(setListingType)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Listings</SelectItem>
                    <SelectItem value="SALE">For Sale</SelectItem>
                    <SelectItem value="RENT">For Rent</SelectItem>
                    <SelectItem value="LEASE">For Lease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <label className="text-[11px] font-bold text-slate-700">Property Type</label>
                <Select value={propertyType} onValueChange={handleFilterChange(setPropertyType)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {propertyType !== 'all' && !propertyTypes.some((type) => type.toLowerCase() === propertyType) && (
                      <SelectItem value={propertyType}>{initialFilters.propertyType}</SelectItem>
                    )}
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <label className="text-[11px] font-bold text-slate-700">Min Bedrooms</label>
                <Select value={bedrooms} onValueChange={handleFilterChange(setBedrooms)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Bedrooms</SelectItem>
                    <SelectItem value="1">1+ Bed</SelectItem>
                    <SelectItem value="2">2+ Beds</SelectItem>
                    <SelectItem value="3">3+ Beds</SelectItem>
                    <SelectItem value="4">4+ Beds</SelectItem>
                    <SelectItem value="5">5+ Beds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <label className="text-[11px] font-bold text-slate-700">Min Price (₦)</label>
                <Input
                  type="number"
                  placeholder="Min ₦"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs rounded-xl tabular-nums font-mono"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-[11px] font-bold text-slate-700">Max Price (₦)</label>
                <Input
                  type="number"
                  placeholder="Max ₦"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs rounded-xl tabular-nums font-mono"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-between items-center pt-2.5 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Showing <strong className="text-slate-900">{filteredAndSortedProperties.length}</strong> matching listings
              </span>
              <div className="flex gap-2">
                <Button onClick={handleResetFilters} variant="outline" size="sm" className="h-8 text-xs rounded-xl">
                  Reset Filters
                </Button>
                <Button onClick={() => setIsMobileFiltersOpen(false)} size="sm" className="h-8 text-xs rounded-xl bg-slate-900 text-white font-bold">
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm text-slate-600">
          {filteredAndSortedProperties.length} {filteredAndSortedProperties.length === 1 ? 'listing' : 'listings'}
        </p>
        <Select value={sortOption} onValueChange={handleSortChange}>
          <SelectTrigger aria-label="Sort listings" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* VIEW SWITCHER: Map View vs Grid View */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          {/* Google Maps Visual */}
          <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Google Maps Property Explorer</h3>
                <p className="text-xs text-slate-500">Live coordinates for verified Nigerian properties</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-lime-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-lime-600" /> For Rent
                </span>
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> For Sale / Land
                </span>
              </div>
            </div>

            <GooglePropertyMap
              properties={mappableProperties}
              selectedPropertyId={selectedProperty?.id}
              onSelectProperty={(prop) => setSelectedMapPropertyId(prop.id)}
              height="500px"
            />
          </div>

          {/* Map Selected Property Preview Panel */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-lime-700">Selected Listing</span>
              {selectedProperty ? (
                <div className="mt-3 min-w-0 w-full">
                  <PropertyCard property={selectedProperty} />
                  <div className="mt-4 flex gap-2">
                    <Button asChild className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold">
                      <Link href={`/property/${selectedProperty.id}`}>
                        <span>Full Details</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-8 text-center text-slate-400 border border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-xs">No matching listings have map coordinates.</p>
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
              <div key={property.id} className="min-w-0 w-full">
                <PropertyCard property={property} />
              </div>
            ))}
            {currentProperties.length === 0 && (
              <div className="col-span-full">
                <Card className="p-12 text-center rounded-2xl border-slate-200 bg-white shadow-xs max-w-md mx-auto">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                    <Building className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{hasActiveFilters ? 'No matching properties' : 'No published properties yet'}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                    {hasActiveFilters ? 'Try clearing your search or broadening your filters.' : 'Verified listings will appear here when they are published.'}
                  </p>
                  {hasActiveFilters && <Button
                    onClick={handleResetFilters}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset All Filters
                  </Button>}
                </Card>
              </div>
            )}
          </div>

          {currentProperties.length > 0 && (
            <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mt-8">
                <Button aria-label="Previous page" variant="outline" size="icon" onClick={handlePreviousPage} disabled={page === 1} className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((pageNumber, index) =>
                typeof pageNumber === 'number' ? (
                    <Button
                    key={pageNumber}
                    aria-current={page === pageNumber ? 'page' : undefined}
                    variant={page === pageNumber ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handlePageClick(pageNumber)}
                    >
                    {pageNumber}
                    </Button>
                ) : (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                )
                )}

                <Button aria-label="Next page" variant="outline" size="icon" onClick={handleNextPage} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
