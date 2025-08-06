import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bath, BedDouble, CheckCircle, Home, SquareGanttChart, Star } from 'lucide-react';
import type { Property } from '@/lib/types';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card className="w-full overflow-hidden shadow-lg transition-all hover:shadow-xl flex flex-col">
      <CardHeader className="p-0 relative">
        <Link href={`/property/${property.id}`}>
          <Image
            alt={property.title}
            className="aspect-video w-full object-cover"
            height={225}
            src={property.images[0]}
            width={400}
            data-ai-hint="house exterior"
          />
        </Link>
        <Badge
          variant={property.isVerified ? 'default' : 'secondary'}
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
        >
          {property.isVerified ? <CheckCircle className="mr-1 h-3 w-3 text-primary" /> : <Home className="mr-1 h-3 w-3" />}
          {property.isVerified ? 'Verified' : 'Unverified'}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="grid gap-1">
          <CardTitle className="text-lg font-headline hover:text-primary transition-colors">
            <Link href={`/property/${property.id}`}>{property.title}</Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{property.address}</p>
          <p className="text-2xl font-bold text-primary">
            ${property.price.toLocaleString()}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-2">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-2">
                <SquareGanttChart className="h-4 w-4" />
                <span>{property.sqft.toLocaleString()} sqft</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild size="sm" className="w-full">
          <Link href={`/property/${property.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
