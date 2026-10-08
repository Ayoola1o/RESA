import { Suspense } from 'react';
import { propertyService } from '@/server/services/property-service';
import MarketplacePageContent from './MarketplacePageContent';

export default async function MarketplacePage() {
  const properties = await propertyService.getAllProperties();

  return (
    <Suspense>
      <MarketplacePageContent initialProperties={properties} />
    </Suspense>
  );
}
