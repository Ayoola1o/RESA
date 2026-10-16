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
import GooglePropertyMap from '@/components/maps/GooglePropertyMap';

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
    return (
      filteredAndSortedProperties.find(p => p.id === selectedMapPropertyId) ||
      filteredAndSortedProperties[0] ||
      null
    );
  }, [filteredAndSortedProperties, selectedMapPropertyId]);

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
                ? 'bg-lime-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>Map View</span>
          </button>
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
              placeholder="Search verified properties by neighborhood, city, or title (e.g. Lekki, Ikoyi)..."
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
          <button
            type="button"
            onClick={() => {
              setVerifiedOnly(!verifiedOnly);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 flex items-center gap-1.5 ${
              verifiedOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            RESA Verified Only
          </button>
          <button
            type="button"
            onClick={() => {
              setListingType(listingType === 'rent' ? 'all' : 'rent');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 ${
              listingType === 'rent'
                ? 'bg-slate-900 text-white shadow-xs'
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
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            For Sale
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
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <label className="text-[11px] font-bold text-slate-700">Property Type</label>
                <Select value={propertyType} onValueChange={handleFilterChange(setPropertyType)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                    <SelectItem value="terrace">Terrace</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
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
              properties={filteredAndSortedProperties}
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
                  <p className="text-xs">Select a pin on the map to preview listing details.</p>
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
                  <h3 className="font-bold text-slate-900 text-lg">No matching properties found</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                    We couldn&apos;t find verified listings matching your specific criteria. Try broadening your price range or clearing neighborhood filters.
                  </p>
                  <Button
                    onClick={handleResetFilters}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset All Filters
                  </Button>
                </Card>
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