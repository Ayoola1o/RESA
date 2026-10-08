'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from "@/components/property-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListFilter, ChevronLeft, ChevronRight, Save, LayoutGrid, Map as MapIcon, MapPin, Building, ArrowRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [listingType, setListingType] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [bedrooms, setBedrooms] = useState('any');
  const [bathrooms, setBathrooms] = useState('any');
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

        const propertyTypeMatch = propertyType === 'all' || p.type.toLowerCase().replace(' ', '-') === propertyType;
        const bedroomsMatch = bedrooms === 'any' || p.bedrooms >= Number(bedrooms);
        const bathroomsMatch = bathrooms === 'any' || p.bathrooms >= Number(bathrooms);

        const searchMatch = searchQuery ?
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.city.toLowerCase().includes(searchQuery.toLowerCase())
            : true;

        return listingTypeMatch && propertyTypeMatch && bedroomsMatch && bathroomsMatch && searchMatch;
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
             filtered.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
            break;
    }

    return filtered;

  }, [listingType, propertyType, bedrooms, bathrooms, sortOption, searchQuery]);

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

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline md:text-4xl">Find Your Dream Property</h1>
          <p className="text-muted-foreground mt-2">
              {searchQuery ? `Showing results for "${searchQuery}"` : "Explore our curated list of properties across the country."}
          </p>
        </div>

        {/* View Mode Toggle Button Group */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Grid View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="h-4 w-4" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      <Card className="mb-8 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
             <div className="grid gap-2">
              <label className="text-sm font-medium">Listing Type</label>
               <Select value={listingType} onValueChange={handleFilterChange(setListingType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Listings</SelectItem>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Property Type</label>
               <Select value={propertyType} onValueChange={handleFilterChange(setPropertyType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
             <div className="grid gap-2">
              <label className="text-sm font-medium">Beds</label>
               <Select value={bedrooms} onValueChange={handleFilterChange(setBedrooms)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2">
              <label className="text-sm font-medium">Baths</label>
               <Select value={bathrooms} onValueChange={handleFilterChange(setBathrooms)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                </SelectContent>
                </Select>
            </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex-grow w-full sm:w-auto">
                <label className="text-sm font-medium">Sort by</label>
                <Select value={sortOption} onValueChange={handleSortChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleApplyFilters} className="w-full">
                    <ListFilter className="mr-2 h-4 w-4" />
                    Apply Filters
                </Button>
                <Button onClick={handleSaveSearch} variant="outline" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Search
                </Button>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <div className="flex justify-center items-center space-x-2 mt-8">
                <Button variant="outline" size="icon" onClick={handlePreviousPage} disabled={currentPage === 1}>
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