import type { Metadata } from 'next';
import { propertyService } from '@/server/services/property-service';
import PropertyDetailClient from './PropertyDetailClient';
import { formatCurrency } from '@/lib/utils';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await propertyService.getProperty(id);

  if (!property) {
    return {
      title: 'Property Not Found | PropHunta AI',
      description: 'The requested property could not be found.',
    };
  }

  const priceFormatted = formatCurrency(property.price, property.listingType === 'RENT' ? 'For Rent' : 'For Sale', property.priceUnit);
  const title = `${property.title} - ${priceFormatted} | PropHunta AI`;
  const description = `${property.bedrooms} bed, ${property.bathrooms} bath ${property.propertyType} located at ${property.address}, ${property.city}, ${property.state}. Verified trust record.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: property.media?.length > 0 ? [{ url: property.media[0].url, width: 1200, height: 630, alt: property.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: property.media?.length > 0 ? [property.media[0].url] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await propertyService.getProperty(id);

  if (!property) {
    notFound();
  }

  return <PropertyDetailClient initialProperty={property} />;
}
