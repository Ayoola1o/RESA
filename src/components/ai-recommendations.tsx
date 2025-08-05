'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { getRecommendations } from '@/app/actions';
import { properties } from '@/lib/mock-data';
import PropertyCard from './property-card';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const recentlyViewedIds = properties.slice(0, 2).map(p => p.id).join(', ');
const savedPropertiesIds = properties.slice(2, 3).map(p => p.id).join(', ');

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
      Get Recommendations
    </Button>
  );
}

export default function AiRecommendations() {
  const { toast } = useToast();
  const [state, formAction] = useFormState(getRecommendations, null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.error) {
       const errorMessage = typeof state.error === 'string' ? state.error : 'An error occurred';
       toast({
         variant: 'destructive',
         title: 'Error',
         description: errorMessage,
       });
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Recommendations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-2xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">AI Property Recommendations</DialogTitle>
          <DialogDescription>
            Tell us what you&apos;re looking for, and our AI will suggest properties tailored to you.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="recentlyViewed" value={recentlyViewedIds} />
          <input type="hidden" name="savedProperties" value={savedPropertiesIds} />
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-2">
              <Label htmlFor="preferences">Your Preferences</Label>
              <Textarea
                id="preferences"
                name="preferences"
                placeholder="e.g., 'a 3-bedroom house with a large backyard, modern kitchen, and near a good school'"
              />
               {state?.error?.preferences && <p className="text-sm text-destructive">{state.error.preferences[0]}</p>}
            </div>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>

        {state?.data && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 font-headline">Here are your recommendations:</h3>
            {state.data.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {state.data.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            ) : (
                <p>No matching properties found. Try refining your preferences.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
