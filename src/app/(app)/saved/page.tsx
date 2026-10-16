'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Heart, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  getPropertiesAction,
  getSavedPropertiesAction,
  toggleSavedPropertyAction,
} from '@/server/actions/prophunta-actions';
import { Property } from '@/types/prophunta';
import PropertyCard from '@/components/property-card';

export default function SavedPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading saved listings...</div>}>
      <SavedContent />
    </Suspense>
  );
}

function SavedContent() {
  const { toast } = useToast();
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadSaved() {
      try {
        // Query server saved properties first
        const res = await getSavedPropertiesAction().catch(() => ({ success: false, properties: [] }));
        if (mounted && res?.success && res.properties && res.properties.length > 0) {
          setSavedProperties(res.properties);
          setLoading(false);
          return;
        }

        // Secondary check against localStorage if client-side session or guest
        let savedIds: string[] = [];
        try {
          const raw = localStorage.getItem('prophunta_saved_properties');
          if (raw) savedIds = JSON.parse(raw);
        } catch {}

        if (savedIds.length > 0) {
          const allProps = await getPropertiesAction().catch(() => []);
          if (mounted) {
            setSavedProperties(allProps.filter((p) => savedIds.includes(p.id)));
          }
        } else if (mounted) {
          // Honest empty state: 0 items, never fake sample listings
          setSavedProperties([]);
        }
      } catch (err) {
        console.error('Failed to load saved properties', err);
        if (mounted) setSavedProperties([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSaved();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRemoveSaved = async (propId: string) => {
    setSavedProperties((prev) => prev.filter((p) => p.id !== propId));

    try {
      // Sync with server action
      await toggleSavedPropertyAction(propId).catch(() => null);

      // Sync local storage
      const raw = localStorage.getItem('prophunta_saved_properties');
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        localStorage.setItem(
          'prophunta_saved_properties',
          JSON.stringify(ids.filter((id) => id !== propId))
        );
      }
    } catch {}

    toast({
      title: 'Listing Removed',
      description: 'Property removed from your saved shortlist.',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Standalone Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="h-7 w-7 text-rose-500 fill-rose-500/20" />
            Saved Favorites
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Verified properties you have shortlisted and are actively monitoring.
          </p>
        </div>
        <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs">
          <Link href="/homes">Explore Homes</Link>
        </Button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading your saved favorites...
        </div>
      ) : savedProperties.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-slate-200/80 bg-white">
          <Heart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-lg">No saved properties yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Click the heart icon on any property in the listings grid to save it here for easy reference.
          </p>
          <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-xs">
            <Link href="/homes">Browse Verified Homes</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {savedProperties.map((prop) => (
            <div key={prop.id} className="relative group min-w-0 w-full flex flex-col">
              <PropertyCard property={prop} />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-3 right-3 opacity-90 hover:opacity-100 shadow-md rounded-xl text-xs"
                onClick={() => handleRemoveSaved(prop.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
