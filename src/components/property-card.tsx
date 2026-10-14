'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bath, BedDouble, Heart, Maximize2, ShieldCheck, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PropertyCardProps {
  property: any;
  className?: string;
}

export default function PropertyCard({ property, className = '' }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('prophunta_saved_properties');
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        if (ids.includes(property.id)) {
          setIsFavorite(true);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [property.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved = localStorage.getItem('prophunta_saved_properties');
      let ids: string[] = saved ? JSON.parse(saved) : [];
      if (isFavorite) {
        ids = ids.filter((id) => id !== property.id);
        setIsFavorite(false);
      } else {
        if (!ids.includes(property.id)) ids.push(property.id);
        setIsFavorite(true);
      }
      localStorage.setItem('prophunta_saved_properties', JSON.stringify(ids));
    } catch {
      setIsFavorite(!isFavorite);
    }
  };

  const isRent =
    property.listingType === 'RENT' ||
    property.status === 'For Rent' ||
    property.status === 'Rented';

  // Strict verification: Do not display a generic "Verified" badge unless the verification model supports it
  const isVerified =
    property.listingStatus === 'VERIFIED' ||
    property.verification?.overallStatus === 'PASSED';

  const availabilityStatus = property.availabilityStatus || 'AVAILABLE';

  const statusLabel =
    property.status ||
    (property.listingType === 'RENT' ? 'For Rent' : property.listingType === 'SALE' ? 'For Sale' : 'Available');

  const sqft = property.sqft;
  const areaDisplay = sqft ? `${sqft.toLocaleString()} sqm` : null;

  const imageUrl =
    (property.media && property.media[0]?.url) ||
    (property.images && property.images[0]) ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      className={`group relative flex flex-col min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      {/* Image container with compact 16:10 aspect ratio */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100">
        <Link href={`/property/${property.id}`} className="block h-full w-full">
          <Image
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            height={240}
            src={imageUrl}
            width={380}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>

        {/* Badges on Top-Left */}
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-10 max-w-[80%]">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs shrink-0 ${
              isRent ? 'bg-lime-700' : 'bg-slate-900'
            }`}
          >
            {statusLabel}
          </span>
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/85 backdrop-blur-xs text-lime-400 shadow-xs border border-lime-500/30 shrink-0">
              <ShieldCheck className="h-3 w-3 text-lime-400 shrink-0" />
              Verified Trust
            </span>
          )}
          {property.listingStatus &&
            property.listingStatus !== 'ACTIVE' &&
            property.listingStatus !== 'VERIFIED' && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white shadow-xs shrink-0 ${
                  property.listingStatus === 'RESERVED'
                    ? 'bg-purple-600'
                    : property.listingStatus === 'OCCUPIED'
                    ? 'bg-slate-800'
                    : property.listingStatus === 'SOLD'
                    ? 'bg-slate-900'
                    : property.listingStatus === 'SUSPENDED'
                    ? 'bg-rose-600'
                    : property.listingStatus === 'UNDER_REVIEW' ||
                      property.listingStatus === 'SUBMITTED'
                    ? 'bg-amber-600'
                    : property.listingStatus === 'CHANGES_REQUIRED'
                    ? 'bg-orange-600'
                    : 'bg-slate-600'
                }`}
              >
                {property.listingStatus.replace('_', ' ')}
              </span>
            )}
          {availabilityStatus !== 'AVAILABLE' &&
            property.listingStatus === 'ACTIVE' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-600 text-white shadow-xs shrink-0">
                {availabilityStatus.replace('_', ' ')}
              </span>
            )}
        </div>

        {/* Favorite Button on Top-Right */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-xs backdrop-blur-xs transition-colors hover:bg-white shrink-0"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600 hover:text-red-500'
            }`}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-1.5 sm:p-2 min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-lime-800 mb-0.5">
          <span className="bg-lime-50 px-1.5 py-0.5 rounded border border-lime-200/60 truncate">
            {property.propertyType || property.type || 'Residential'}
          </span>
          {property.city && (
            <span className="text-slate-400 font-normal flex items-center gap-0.5 truncate">
              <MapPin className="h-2.5 w-2.5" />
              {property.city}
            </span>
          )}
        </div>

        <Link href={`/property/${property.id}`} className="group-hover:text-lime-700 transition-colors min-w-0">
          <h3 className="text-sm font-bold text-slate-900 truncate" title={property.title}>
            {property.title}
          </h3>
        </Link>
        <p
          className="text-[11px] text-slate-500 mt-0.5 truncate"
          title={`${property.address}, ${property.area ? `${property.area}, ` : ''}${property.city}`}
        >
          {property.address}, {property.area ? `${property.area}, ` : ''}{property.city}
        </p>

        {/* Key Features */}
        {property.features && property.features.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {property.features.slice(0, 2).map((feat: string) => (
              <span
                key={feat}
                className="inline-flex items-center text-[9px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded truncate max-w-[120px]"
                title={feat}
              >
                {feat}
              </span>
            ))}
            {property.features.length > 2 && (
              <span className="text-[9px] text-slate-400 font-medium self-center">
                +{property.features.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-1.5 text-sm sm:text-[15px] font-black text-slate-950 tracking-tight truncate tabular-nums">
          {formatCurrency(property.price, statusLabel, property.priceUnit)}
        </div>

        {/* Specs */}
        <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600 border-t border-slate-100 pt-2 gap-1 overflow-hidden">
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-1 shrink-0">
              <BedDouble className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{property.bedrooms} Beds</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-1 shrink-0">
              <Bath className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{property.bathrooms} Baths</span>
            </div>
          )}
          {areaDisplay && (
            <div className="flex items-center gap-1 shrink-0 min-w-0">
              <Maximize2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{areaDisplay}</span>
            </div>
          )}
        </div>

        {/* Real Rating if present */}
        {property.rating && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500">
            <span className="font-semibold text-slate-700">{property.rating}</span>
            {property.reviewsCount && <span>({property.reviewsCount} reviews)</span>}
          </div>
        )}
      </div>
    </div>
  );
}