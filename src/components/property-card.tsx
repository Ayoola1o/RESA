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

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const saved = localStorage.getItem('prophunta_saved_properties');
      let ids: string[] = saved ? JSON.parse(saved) : [];
      if (!nextState) {
        ids = ids.filter((id) => id !== property.id);
      } else {
        if (!ids.includes(property.id)) ids.push(property.id);
      }
      localStorage.setItem('prophunta_saved_properties', JSON.stringify(ids));
    } catch {
      // Ignore localStorage error
    }

    try {
      const { toggleSavedPropertyAction } = await import('@/server/actions/prophunta-actions');
      await toggleSavedPropertyAction(property.id);
    } catch {
      // User might not be authenticated, local state already set
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
      className={`group relative flex flex-col min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 ${className}`}
    >
      {/* Image Header with 4:3 Aspect Ratio and Dark Gradient Overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Link href={`/property/${property.id}`} className="block h-full w-full">
          <Image
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            height={300}
            src={imageUrl}
            width={400}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </Link>

        {/* Bottom dark gradient overlay for high-contrast price readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent pointer-events-none" />

        {/* Overlays: Top-Left Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10 max-w-[80%]">
          {isVerified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 text-white shrink-0" />
              RESA Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-white shadow-xs shrink-0">
              Pending Verification
            </span>
          )}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs shrink-0 ${
              isRent ? 'bg-slate-900/80 backdrop-blur-xs' : 'bg-slate-800/80 backdrop-blur-xs'
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Overlays: Top-Right Glassmorphic Save/Heart Button */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-xs transition-all hover:bg-white hover:scale-110 shrink-0"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-700 hover:text-rose-500'
            }`}
          />
        </button>

        {/* Overlays: Bottom-Left Bold Naira Price with tabular-nums */}
        <div className="absolute bottom-2.5 left-3 z-10 text-white pointer-events-none">
          <div className="text-base sm:text-lg font-black tracking-tight drop-shadow-md tabular-nums">
            {formatCurrency(property.price, statusLabel, property.priceUnit)}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4 min-w-0 justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-slate-500">
            <span className="text-emerald-700 font-semibold uppercase tracking-wider text-[10px] truncate">
              {property.propertyType || property.type || 'Residential'}
            </span>
            {property.city && (
              <span className="text-slate-400 flex items-center gap-0.5 truncate text-[11px]">
                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                {property.city}
              </span>
            )}
          </div>

          <Link href={`/property/${property.id}`} className="group-hover:text-emerald-700 transition-colors block min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate" title={property.title}>
              {property.title}
            </h3>
          </Link>

          <p
            className="text-xs text-slate-500 truncate"
            title={`${property.address}, ${property.area ? `${property.area}, ` : ''}${property.city}`}
          >
            {property.address}, {property.area ? `${property.area}, ` : ''}{property.city}
          </p>
        </div>

        {/* Bottom Spec Row */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-3 gap-1 overflow-hidden">
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-1.5 shrink-0">
              <BedDouble className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium">{property.bedrooms} Beds</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Bath className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium">{property.bathrooms} Baths</span>
            </div>
          )}
          {areaDisplay && (
            <div className="flex items-center gap-1.5 shrink-0 min-w-0">
              <Maximize2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium truncate">{areaDisplay}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}