import type { Metadata } from 'next';
import { properties } from "@/lib/mock-data";
import PropertyDetailClient from "./PropertyDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = properties.find((p) => p.id === id);

  if (!property) {
    return {
      title: 'Property Not Found | RESA Real Estate',
      description: 'The requested property could not be found.',
    };
  }

  const priceFormatted = `$${property.price.toLocaleString()}${property.status === 'For Rent' ? '/mo' : ''}`;
  const title = `${property.title} - ${priceFormatted} | RESA`;
  const description = `${property.bedrooms} bed, ${property.bathrooms} bath ${property.type} located at ${property.address}, ${property.city}, ${property.state}. ${property.description.slice(0, 140)}...`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: property.images?.length > 0 ? [{ url: property.images[0], width: 1200, height: 630, alt: property.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: property.images?.length > 0 ? [property.images[0]] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PropertyDetailClient id={id} />;
}
