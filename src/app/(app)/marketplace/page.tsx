import { redirect } from 'next/navigation';
import { getCurrentUserAction, getPropertiesAction } from '@/server/actions/prophunta-actions';
import MarketplacePageContent from './MarketplacePageContent';

type MarketplacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const [user, params] = await Promise.all([getCurrentUserAction(), searchParams]);
  const query = new URLSearchParams();

  for (const [name, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(name, value);
    else if (value?.length) query.set(name, value[0]);
  }

  if (!user) redirect(query.size ? `/homes?${query}` : '/homes');

  const properties = await getPropertiesAction();

  return (
    <MarketplacePageContent
      key={query.toString()}
      initialProperties={properties}
      role={user.role}
      initialFilters={{
        search: query.get('search') ?? '',
        listingType: query.get('listingType')?.toUpperCase() ?? 'ALL',
        propertyType: query.get('propertyType') ?? 'all',
      }}
    />
  );
}
