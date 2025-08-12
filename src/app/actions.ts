
'use server';

import { recommendProperties, type RecommendPropertiesInput } from '@/ai/flows/property-recommendation';
import { suggestReply, type SuggestReplyInput } from '@/ai/flows/suggest-reply-flow';
import { categorizeMaintenanceRequest, type CategorizeMaintenanceInput } from '@/ai/flows/categorize-maintenance-flow';
import { generateDescription, type GenerateDescriptionInput } from '@/ai/flows/generate-description-flow';
import { generateNews, type GenerateNewsInput } from '@/ai/flows/generate-news-flow';
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

const categorizeMaintenanceSchema = z.object({
    requestText: z.string().min(10, 'Please describe your maintenance issue in more detail.'),
});

export async function getCategorizedMaintenance(prevState: any, formData: FormData) {
    const parsed = categorizeMaintenanceSchema.safeParse({
        requestText: formData.get('requestText'),
    });

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    try {
        const result = await categorizeMaintenanceRequest(parsed.data);
        return { data: result };
    } catch (e) {
        console.error(e);
        return { error: 'An unexpected error occurred. Please try again.' };
    }
}

const generateDescriptionSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    propertyType: z.string().min(1, 'Property type is required.'),
    city: z.string().min(1, 'City is required.'),
    state: z.string().min(1, 'State is required.'),
    bedrooms: z.string().min(1, 'Bedrooms are required.'),
    bathrooms: z.string().min(1, 'Bathrooms are required.'),
    sqft: z.string().min(1, 'Square footage is required.'),
    features: z.array(z.string()),
});

export async function getGeneratedDescription(input: GenerateDescriptionInput) {
    const parsed = generateDescriptionSchema.safeParse(input);

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    try {
        const result = await generateDescription(parsed.data);
        return { data: result };
    } catch (e) {
        console.error(e);
        return { error: 'An unexpected error occurred while generating the description.' };
    }
}


const generateNewsSchema = z.object({
  topic: z.string(),
});

export async function getNews(input: GenerateNewsInput) {
  const parsed = generateNewsSchema.safeParse(input);

  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const result = await generateNews(parsed.data);
    return { data: result };
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred while generating news.' };
  }
}
