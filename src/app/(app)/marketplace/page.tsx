
'use client';

import { useState } from 'react';
import { properties } from "@/lib/mock-data";
import PropertyCard from "@/components/property-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListFilter, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 16;

export default function MarketplacePage() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProperties = properties.slice(startIndex, endIndex);

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
    // Always show first page
    if (totalPages > 0) pageNumbers.push(1);

    // Ellipsis for start
    if (currentPage > 3) pageNumbers.push('...');

    // Middle pages
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        if (i > 1 && i < totalPages) {
            pageNumbers.push(i);
        }
    }
    
    // Ellipsis for end
    if (currentPage < totalPages - 2) pageNumbers.push('...');

    // Always show last page
    if (totalPages > 1) pageNumbers.push(totalPages);
    
    return pageNumbers;
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline md:text-4xl">Find Your Dream Property</h1>
        <p className="text-muted-foreground mt-2">Explore our curated list of properties across the country.</p>
      </div>

      <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Location</label>
              <Input placeholder="City, State, or Zip" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Property Type</label>
               <Select>
                <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Price Range</label>
               <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Any Price" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="<500k">&lt; $500,000</SelectItem>
                    <SelectItem value="500k-1m">$500,000 - $1M</SelectItem>
                    <SelectItem value=">1m">&gt; $1M</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Beds & Baths</label>
               <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1+">1+ Beds</SelectItem>
                    <SelectItem value="2+">2+ Beds</SelectItem>
                    <SelectItem value="3+">3+ Beds</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <Button className="w-full lg:w-auto">
                <ListFilter className="mr-2 h-4 w-4" />
                Filter
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

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

    </div>
  );
}
