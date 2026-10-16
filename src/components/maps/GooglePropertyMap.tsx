'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Property } from '@/types/prophunta';
import {
  loadGoogleMapsScript,
  getGoogleMapsApiKey,
  onGoogleMapsAuthFailure,
  GoogleMapsStatus,
} from '@/lib/maps/google-maps-loader';
import { formatCurrency } from '@/lib/utils';
import {
  MapPin,
  AlertCircle,
  Key,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface GooglePropertyMapProps {
  properties: Property[];
  selectedPropertyId?: string | null;
  onSelectProperty?: (property: Property) => void;
  className?: string;
  defaultZoom?: number;
  center?: { lat: number; lng: number };
  singlePropertyMode?: boolean;
  height?: string;
}

// Clean light-mode Google Maps style matching PropHunta's slate/lime branding
const MAP_STYLES = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e0f2fe' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f8fafc' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#f1f5f9' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#f1f5f9' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#ecfccb' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5e1' }, { weight: 1 }],
  },
];

// Helper to validate actual numeric coordinates
export function getValidCoordinates(property: Property): { lat: number; lng: number } | null {
  const lat = property.coordinates?.lat ?? property.latitude;
  const lng = property.coordinates?.lng ?? property.longitude;

  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    return { lat, lng };
  }
  return null;
}

export default function GooglePropertyMap({
  properties,
  selectedPropertyId,
  onSelectProperty,
  className = '',
  defaultZoom = 13,
  center = { lat: 6.4549, lng: 3.4246 }, // Default Lagos center
  singlePropertyMode = false,
  height = '480px',
}: GooglePropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);

  const [status, setStatus] = useState<GoogleMapsStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter only properties with valid geographic coordinates
  const mappableProperties = useMemo(() => {
    return properties.filter((p) => getValidCoordinates(p) !== null);
  }, [properties]);

  const unmappableCount = properties.length - mappableProperties.length;

  // Initialize or re-load the Google Maps API
  const initMapScript = useCallback(async () => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      setStatus('missing-key');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      await loadGoogleMapsScript(apiKey);
      setStatus('ready');
    } catch (err: any) {
      if (err.message === 'MISSING_API_KEY') {
        setStatus('missing-key');
      } else {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to load Google Maps JavaScript API');
      }
    }
  }, []);

  // Listen for authentication failures (invalid key, unlinked billing, referrer rejection)
  useEffect(() => {
    const unsubscribe = onGoogleMapsAuthFailure(() => {
      setStatus('auth-failure');
    });
    return () => unsubscribe();
  }, []);

  // Initial load
  useEffect(() => {
    initMapScript();
  }, [initMapScript]);

  // Build Marker HTML info window content
  const createInfoWindowContent = useCallback((property: Property): string => {
    const coords = getValidCoordinates(property);
    const latStr = coords ? `${coords.lat.toFixed(4)}° N` : '';
    const lngStr = coords ? `${coords.lng.toFixed(4)}° E` : '';
    const priceStr = formatCurrency(
      property.price,
      property.listingType === 'RENT' ? 'For Rent' : 'For Sale',
      property.priceUnit
    );

    const imageHtml = property.media?.[0]?.url
      ? `<div style="width: 100%; height: 110px; overflow: hidden; border-radius: 8px; margin-bottom: 8px; background-color: #f1f5f9;">
          <img src="${property.media[0].url}" alt="${property.title}" style="width: 100%; height: 100%; object-fit: cover;" />
         </div>`
      : '';

    return `
      <div style="font-family: inherit; max-width: 260px; padding: 4px; color: #0f172a;">
        ${imageHtml}
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${
            property.listingType === 'RENT' ? '#4d7c0f' : '#0f172a'
          }; background-color: ${
      property.listingType === 'RENT' ? '#ecfccb' : '#f1f5f9'
    }; padding: 2px 6px; border-radius: 4px;">
            ${property.listingType === 'RENT' ? 'For Rent' : 'For Sale'}
          </span>
          <span style="font-size: 10px; color: #64748b; font-family: monospace;">
            ${latStr}, ${lngStr}
          </span>
        </div>
        <h4 style="font-size: 13px; font-weight: 700; line-height: 1.3; margin: 0 0 4px 0; color: #0f172a;">
          ${property.title}
        </h4>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">
          ${property.area ? `${property.area}, ` : ''}${property.city}, ${property.state}
        </p>
        <div style="font-size: 14px; font-weight: 800; color: #15803d; margin-bottom: 8px;">
          ${priceStr}
        </div>
        <a href="/property/${property.id}" style="display: block; text-align: center; background-color: #65a30d; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 6px;">
          View Verified Property →
        </a>
      </div>
    `;
  }, []);

  // Initialize the Map instance once status is 'ready'
  useEffect(() => {
    if (status !== 'ready' || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      const initialCenter = mappableProperties[0]
        ? getValidCoordinates(mappableProperties[0]) || center
        : center;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: singlePropertyMode ? 15 : defaultZoom,
        styles: MAP_STYLES,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
      mapInstanceRef.current = map;

      // Close info window on background click
      map.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
      });
    }
  }, [status, center, defaultZoom, singlePropertyMode, mappableProperties]);

  // Synchronize Markers with mappableProperties
  useEffect(() => {
    if (status !== 'ready' || !mapInstanceRef.current || !window.google?.maps) return;

    const map = mapInstanceRef.current;
    const currentMarkers = markersRef.current;
    const activePropertyIds = new Set(mappableProperties.map((p) => p.id));

    // Remove markers that are no longer in the filtered list
    currentMarkers.forEach((marker, id) => {
      if (!activePropertyIds.has(id)) {
        marker.setMap(null);
        currentMarkers.delete(id);
      }
    });

    const bounds = new window.google.maps.LatLngBounds();

    mappableProperties.forEach((property) => {
      const coords = getValidCoordinates(property);
      if (!coords) return;

      const latLng = new window.google.maps.LatLng(coords.lat, coords.lng);
      bounds.extend(latLng);

      const isSelected = selectedPropertyId === property.id;
      const isRent = property.listingType === 'RENT';

      // SVG Pin with distinctive colors for rent/sale and selection
      const pinFill = isSelected ? '#65a30d' : isRent ? '#4d7c0f' : '#0f172a';
      const pinScale = isSelected ? 1.25 : 1.0;

      const pinSvg = {
        path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 7 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
        fillColor: pinFill,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.4 * pinScale,
        anchor: new window.google.maps.Point(12, 21),
      };

      if (currentMarkers.has(property.id)) {
        // Update existing marker
        const marker = currentMarkers.get(property.id);
        marker.setPosition(latLng);
        marker.setIcon(pinSvg);
        marker.setZIndex(isSelected ? 999 : 1);
      } else {
        // Create new marker
        const marker = new window.google.maps.Marker({
          position: latLng,
          map,
          title: `${property.title} — ${formatCurrency(property.price, undefined, property.priceUnit)}`,
          icon: pinSvg,
          zIndex: isSelected ? 999 : 1,
        });

        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(createInfoWindowContent(property));
            infoWindowRef.current.open(map, marker);
          }
          if (onSelectProperty) {
            onSelectProperty(property);
          }
        });

        currentMarkers.set(property.id, marker);
      }
    });

    // Auto-fit bounds if we have mappable properties
    if (mappableProperties.length > 1 && !singlePropertyMode) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } else if (mappableProperties.length === 1) {
      const coords = getValidCoordinates(mappableProperties[0]);
      if (coords) {
        map.setCenter({ lat: coords.lat, lng: coords.lng });
        map.setZoom(singlePropertyMode ? 16 : 14);
      }
    }
  }, [
    status,
    mappableProperties,
    selectedPropertyId,
    singlePropertyMode,
    createInfoWindowContent,
    onSelectProperty,
  ]);

  // Center on selected property if changed externally
  useEffect(() => {
    if (!selectedPropertyId || !mapInstanceRef.current || status !== 'ready') return;
    const selectedProp = mappableProperties.find((p) => p.id === selectedPropertyId);
    if (!selectedProp) return;

    const coords = getValidCoordinates(selectedProp);
    if (coords) {
      mapInstanceRef.current.panTo({ lat: coords.lat, lng: coords.lng });
      if (markersRef.current.has(selectedProp.id) && infoWindowRef.current) {
        const marker = markersRef.current.get(selectedProp.id);
        infoWindowRef.current.setContent(createInfoWindowContent(selectedProp));
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      }
    }
  }, [selectedPropertyId, mappableProperties, status, createInfoWindowContent]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  // -------------------------------------------------------------
  // RENDER FALLBACK: Missing Google Maps API Key
  // -------------------------------------------------------------
  if (status === 'missing-key') {
    return (
      <div
        style={{ minHeight: height }}
        className={`w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-lime-50/30 p-6 flex flex-col justify-between ${className}`}
      >
        <div>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center shrink-0">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 mb-1">
                <AlertCircle className="h-3 w-3" />
                Google Maps API Key Required
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Google Maps Platform Integration Ready
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                PropHunta AI is configured to render real property coordinates using Google Maps
                Platform. To activate the interactive map in this environment, add your browser API
                key to your environment settings:
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-900 rounded-xl font-mono text-xs text-lime-400 overflow-x-auto shadow-inner">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=&quot;YOUR_GOOGLE_MAPS_BROWSER_KEY&quot;
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">1. Enable Maps JavaScript API</span>
              In Google Cloud Console, enable <strong>Maps JavaScript API</strong> for your project.
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">2. Set HTTP Referrer Restrictions</span>
              Restrict key to your domains (e.g. <code>localhost:9002/*</code>, <code>*.vercel.app/*</code>).
            </div>
          </div>
        </div>

        {/* Fallback Property Inventory Preview */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">
              Mappable Listings Ready ({mappableProperties.length} with verified GPS)
            </span>
            {unmappableCount > 0 && (
              <span className="text-[11px] text-amber-700">
                {unmappableCount} listing(s) pending surveyor coordinates
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {mappableProperties.slice(0, 3).map((prop) => {
              const coords = getValidCoordinates(prop);
              return (
                <div
                  key={prop.id}
                  onClick={() => onSelectProperty?.(prop)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedPropertyId === prop.id
                      ? 'border-lime-500 bg-lime-50/60 ring-2 ring-lime-200'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900 truncate">{prop.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {prop.area}, {prop.city}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-lime-700">
                      {formatCurrency(prop.price, undefined, prop.priceUnit)}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {coords ? `${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER FALLBACK: Google Maps Auth Failure (Referrer/Billing)
  // -------------------------------------------------------------
  if (status === 'auth-failure') {
    return (
      <div
        style={{ minHeight: height }}
        className={`w-full rounded-2xl border border-rose-200 bg-rose-50/40 p-6 flex flex-col justify-center items-center text-center ${className}`}
      >
        <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">Google Maps Authorization Failed</h3>
        <p className="text-xs text-slate-600 mt-1.5 max-w-md leading-relaxed">
          Google Maps reported an authentication error (<code>gm_authFailure</code>). This usually
          occurs when the API key has HTTP referrer restrictions that do not match the current domain,
          or billing is unlinked on Google Cloud Platform.
        </p>
        <div className="mt-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={initMapScript}
            className="text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER FALLBACK: Network or Script Loading Error
  // -------------------------------------------------------------
  if (status === 'error') {
    return (
      <div
        style={{ minHeight: height }}
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-center items-center text-center ${className}`}
      >
        <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
        <h3 className="font-bold text-slate-900 text-sm">Unable to Initialize Google Maps</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          {errorMessage || 'A network error occurred while loading the Google Maps JavaScript API.'}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={initMapScript}
          className="mt-4 text-xs font-bold"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EMPTY STATE: Zero Mappable Listings
  // -------------------------------------------------------------
  if (status === 'ready' && mappableProperties.length === 0) {
    return (
      <div
        style={{ minHeight: height }}
        className={`w-full rounded-2xl border border-dashed border-slate-200 bg-white p-8 flex flex-col justify-center items-center text-center ${className}`}
      >
        <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <MapPin className="h-6 w-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">No Mappable Listings Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          {properties.length === 0
            ? 'No properties match your current search filters. Clear your filters to explore listings across Nigeria.'
            : `None of the ${properties.length} filtered properties currently have verified GPS coordinates recorded.`}
        </p>
        {properties.length > 0 && (
          <p className="text-[11px] text-lime-700 font-semibold mt-2">
            Switch to Grid mode above to view the complete listing inventory.
          </p>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE GOOGLE MAP CANVAS
  // -------------------------------------------------------------
  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm ${className}`}>
      {/* Loading Skeleton */}
      {status === 'loading' && (
        <div
          style={{ height }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs animate-pulse"
        >
          <div className="h-8 w-8 rounded-full border-2 border-lime-600 border-t-transparent animate-spin mb-3" />
          <span className="text-xs font-bold text-slate-600">Loading Google Maps Platform...</span>
        </div>
      )}

      {/* Top Banner Status Info */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md text-[11px] font-bold text-slate-800 flex items-center gap-2 pointer-events-auto">
          <span className="h-2 w-2 rounded-full bg-lime-600 animate-pulse" />
          <span>
            {mappableProperties.length}{' '}
            {mappableProperties.length === 1 ? 'Property Mapped' : 'Properties Mapped'}
          </span>
          {unmappableCount > 0 && (
            <span className="text-[10px] text-slate-400 font-normal">
              ({unmappableCount} without GPS)
            </span>
          )}
        </div>
      </div>

      {/* Actual Map DOM Node */}
      <div
        ref={mapContainerRef}
        style={{ height }}
        className="w-full bg-slate-100"
      />
    </div>
  );
}
