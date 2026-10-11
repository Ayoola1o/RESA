'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Building2, Plus, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/context/UserRoleContext';
import { getUserPropertiesAction } from '@/server/actions/prophunta-actions';
import { Property, UserRole } from '@/types/prophunta';
import PropertyCard from '@/components/property-card';

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading properties...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}

function PropertiesContent() {
  const { currentUser, role } = useUserRole();
  const activeRole: UserRole = currentUser?.role || role || 'SEEKER';

  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadProperties() {
      try {
        const data = await getUserPropertiesAction().catch(() => []);
        if (mounted) setUserProperties(data || []);
      } catch (err) {
        console.error('Failed to load user properties', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProperties();
    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Standalone Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-lime-600" />
            {activeRole === 'SEEKER' ? 'My Properties' : 'My Managed Listings'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeRole === 'SEEKER'
              ? 'Properties you have submitted or managed on PropHunta AI.'
              : 'Properties currently assigned to your ownership or agency portfolio.'}
          </p>
        </div>
        <Button asChild className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs">
          <Link href="/landlord/add-property">
            <Plus className="mr-2 h-4 w-4" /> Create Listing
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-lime-600" />
          Loading your property listings...
        </div>
      ) : userProperties.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-slate-200">
          <Home className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-lg">No properties listed yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Create your first property listing to begin receiving inspection requests and applications.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl shadow-xs">
              <Link href="/landlord/add-property">Create Listing</Link>
            </Button>
            {activeRole === 'SEEKER' && (
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/marketplace">Explore Marketplace</Link>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {userProperties.map((prop) => (
            <div key={prop.id} className="relative group min-w-0 w-full flex flex-col">
              <PropertyCard property={prop} />
              <div className="mt-2 flex items-center justify-between px-1 gap-2">
                <Badge
                  className={`text-xs font-bold shrink-0 truncate max-w-[70%] ${
                    prop.listingStatus === 'ACTIVE' || prop.listingStatus === 'VERIFIED'
                      ? 'bg-lime-600 text-white'
                      : prop.listingStatus === 'UNDER_REVIEW' || prop.listingStatus === 'SUBMITTED'
                      ? 'bg-amber-500 text-white'
                      : prop.listingStatus === 'CHANGES_REQUIRED'
                      ? 'bg-orange-500 text-white'
                      : prop.listingStatus === 'RESERVED'
                      ? 'bg-purple-600 text-white'
                      : prop.listingStatus === 'OCCUPIED'
                      ? 'bg-slate-700 text-white'
                      : prop.listingStatus === 'SOLD'
                      ? 'bg-slate-800 text-white'
                      : prop.listingStatus === 'SUSPENDED' || prop.listingStatus === 'REJECTED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-600 text-white'
                  }`}
                >
                  {prop.listingStatus === 'ACTIVE' || prop.listingStatus === 'VERIFIED'
                    ? '✓ Verified Active'
                    : prop.listingStatus === 'UNDER_REVIEW' || prop.listingStatus === 'SUBMITTED'
                    ? 'In Review'
                    : prop.listingStatus === 'CHANGES_REQUIRED'
                    ? 'Action Needed'
                    : prop.listingStatus}
                </Badge>
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <Link href={`/property/${prop.id}`}>View &rarr;</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
