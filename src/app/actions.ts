'use server';

import { recommendProperties, type RecommendPropertiesInput } from '@/ai/flows/property-recommendation';
import { suggestReply, type SuggestReplyInput } from '@/ai/flows/suggest-reply-flow';
import { z } from 'zod';
import { properties } from '@/lib/mock-data';

const recommendationsSchema = z.object({
  preferences: z.string().min(3, 'Please describe your preferences.'),
  recentlyViewed: z.string(),
  savedProperties: z.string(),
});

export async function getRecommendations(prevState: any, formData: FormData) {
  const parsed = recommendationsSchema.safeParse({
    preferences: formData.get('preferences'),
    recentlyViewed: formData.get('recentlyViewed'),
    savedProperties: formData.get('savedProperties'),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await recommendProperties(parsed.data);
    const recommendedProperties = properties.filter(p => result.propertyIds.includes(p.id));
    return { data: recommendedProperties };
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

const suggestReplySchema = z.object({
    conversationHistory: z.string(),
    userName: z.string(),
});

export async function getSuggestedReply(input: SuggestReplyInput) {
    const parsed = suggestReplySchema.safeParse(input);

    if (!parsed.success) {
        return { error: 'Invalid input.' };
    }

    try {
        const result = await suggestReply(parsed.data);
        return { data: result };
    } catch (e) {
        console.error(e);
        return { error: 'An unexpected error occurred while generating a reply.' };
    }
}
