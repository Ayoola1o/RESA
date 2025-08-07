
'use client';

import { useState, useMemo } from 'react';
import { properties } from "@/lib/mock-data";
import PropertyCard from "@/components/property-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListFilter, ChevronLeft, ChevronRight, Save } from "lucide-react";

const ITEMS_PER_PAGE = 16;

type SortOption = 'newest' | 'price-asc' | 'price-desc';

export default function MarketplacePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [listingType, setListingType] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [bedrooms, setBedrooms] = useState('any');
  const [bathrooms, setBathrooms] = useState('any');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties.filter(p => {
        const listingTypeMatch = 
            listingType === 'all' || 
            (listingType === 'sale' && p.status === 'For Sale') ||
            (listingType === 'rent' && p.status === 'For Rent');

        const propertyTypeMatch = propertyType === 'all' || p.type.toLowerCase() === propertyType;
        const bedroomsMatch = bedrooms === 'any' || p.bedrooms >= Number(bedrooms);
        const bathroomsMatch = bathrooms === 'any' || p.bathrooms >= Number(bathrooms);
        
        return listingTypeMatch && propertyTypeMatch && bedroomsMatch && bathroomsMatch;
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

  }, [listingType, propertyType, bedrooms, bathrooms, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedProperties.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProperties = filteredAndSortedProperties.slice(startIndex, endIndex);
  
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

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline md:text-4xl">Find Your Dream Property</h1>
        <p className="text-muted-foreground mt-2">Explore our curated list of properties across the country.</p>
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
                <Button className="w-full">
                    <ListFilter className="mr-2 h-4 w-4" />
                    Apply Filters
                </Button>
                <Button variant="outline" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Search
                </Button>
            </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
        {currentProperties.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-16">
                <p className="text-lg">No properties match your criteria.</p>
                <p>Try adjusting your filters.</p>
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

    </div>
  );
}
