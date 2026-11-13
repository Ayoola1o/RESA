import type { Property } from '@/types/prophunta';

export function isCoordinatePair(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90
    && typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function getValidCoordinates(
  property: Pick<Property, 'latitude' | 'longitude' | 'coordinates'>,
): { lat: number; lng: number } | null {
  const { latitude, longitude, coordinates } = property;
  if (typeof latitude === 'number' && typeof longitude === 'number' && isCoordinatePair(latitude, longitude)) {
    return { lat: latitude, lng: longitude };
  }
  if (coordinates && isCoordinatePair(coordinates.lat, coordinates.lng)) {
    return { lat: coordinates.lat, lng: coordinates.lng };
  }
  return null;
}
