import { redirect } from 'next/navigation';

interface MarketplacePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;
  const urlParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (typeof val === 'string') {
        urlParams.set(key, val);
      } else if (Array.isArray(val) && val.length > 0) {
        urlParams.set(key, val[0]);
      }
    });
  }

  const query = urlParams.toString();
  redirect(query ? `/homes?${query}` : '/homes');
}
