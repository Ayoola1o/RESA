'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bath, BedDouble, CheckCircle2, Heart, Maximize2, Star, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PropertyCardProps {
  property: any;
  className?: string;
}

export default function PropertyCard({ property, className = '' }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const isRent =
    property.listingType === 'RENT' ||
    property.status === 'For Rent' ||
    property.status === 'Rented';

  const isVerified =
    property.listingStatus === 'VERIFIED' ||
    property.listingStatus === 'ACTIVE' ||
    property.isVerified === true;

  const availabilityStatus = property.availabilityStatus || 'AVAILABLE';

  const statusLabel =
    property.status ||
    (property.listingType === 'RENT' ? 'For Rent' : property.listingType === 'SALE' ? 'For Sale' : 'Available');

  const rating =
    property.rating ||
    (4.3 + (parseInt(property.id.replace(/\D/g, '') || '1', 10) % 7) * 0.1).toFixed(1);

  const reviewsCount =
    property.reviewsCount ||
    8 + (parseInt(property.id.replace(/\D/g, '') || '1', 10) % 20);

  const sqft = property.sqft || 350;
  const areaDisplay = `${sqft.toLocaleString()} sqm`;

  const imageUrl =
    (property.media && property.media[0]?.url) ||
    (property.images && property.images[0]) ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      {/* Image container */}
      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-xl bg-slate-100">
        <Link href={`/property/${property.id}`} className="block h-full w-full">
          <Image
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            height={260}
            src={imageUrl}
            width={400}
            data-ai-hint="house exterior"
          />
        </Link>

        {/* Badges on Top-Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold text-white shadow-sm ${
              isRent ? 'bg-blue-600' : 'bg-emerald-600'
            }`}
          >
            {statusLabel}
          </span>
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-900/85 backdrop-blur-sm text-emerald-400 shadow-sm border border-emerald-500/30">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Verified Trust
            </span>
          )}
          {availabilityStatus !== 'AVAILABLE' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500 text-white shadow-sm">
              {availabilityStatus.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Favorite Button on Top-Right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600 hover:text-red-500'
            }`}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 mb-0.5">
          <span>{property.propertyType || property.type || 'Residential'}</span>
        </div>
        <Link href={`/property/${property.id}`} className="group-hover:text-blue-600 transition-colors">
          <h3 className="text-[15px] font-bold text-slate-900 line-clamp-1">{property.title}</h3>
        </Link>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
          {property.address}, {property.area ? `${property.area}, ` : ''}{property.city}
        </p>

        {/* Price */}
        <div className="mt-2 text-base font-extrabold text-slate-900 tracking-tight">
          {formatCurrency(property.price, statusLabel, property.priceUnit)}
        </div>

        {/* Specs */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5 text-slate-400" />
            <span>{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5 text-slate-400" />
            <span>{property.bathrooms} Baths</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
            <span>{areaDisplay}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-500">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-slate-700">{rating}</span>
          <span>({reviewsCount} reviews)</span>
        </div>
      </div>
    </div>
  );
}