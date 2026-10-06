
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

// Fallback news articles when AI service is unavailable or key is not configured
const fallbackArticles = [
  {
    category: 'Market Trends',
    title: 'Mortgage Rates Stabilize as Spring Home Buying Momentum Builds',
    summary: 'Housing inventory is seeing a steady uptick as competitive buyers take advantage of stabilizing interest rates across major metropolitan areas.',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80',
    imageHint: 'housing market',
  },
  {
    category: 'Technology',
    title: 'Smart Home Automation Drives Record Value Growth in Modern Properties',
    summary: 'Properties equipped with eco-conscious smart thermostats, keyless access, and energy monitors are demanding a 7-12% premium in recent sales.',
    imageUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=300&q=80',
    imageHint: 'smart home',
  },
  {
    category: 'Urban Living',
    title: 'Downtown Rental Demand Rises with Flexible Hybrid Work Schedules',
    summary: 'Tenants are prioritizing walkable neighborhoods, high-speed fiber internet amenities, and community workspaces in luxury high-rises.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
    imageHint: 'city apartment',
  },
];

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
    const recommendedProperties = properties.filter(p => result?.propertyIds?.includes(p.id));
    if (recommendedProperties.length > 0) {
      return { data: recommendedProperties };
    }
  } catch (e) {
    console.warn('AI recommendation service unavailable, using smart preference matching fallback.');
  }

  // Graceful fallback matching
  const prefLower = (parsed.data.preferences || '').toLowerCase();
  const matched = properties.filter(p => {
    return (
      prefLower.includes(p.type.toLowerCase()) ||
      prefLower.includes(p.city.toLowerCase()) ||
      p.features.some(f => prefLower.includes(f.toLowerCase())) ||
      (prefLower.includes('pool') && p.features.some(f => f.toLowerCase().includes('pool'))) ||
      (prefLower.includes('luxury') && p.price > 1000000)
    );
  });

  return {
    data: matched.length > 0 ? matched.slice(0, 4) : properties.slice(0, 3),
  };
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
    if (result) return { data: result };
  } catch (e) {
    console.warn('AI reply suggestion unavailable, using fallback suggestion.');
  }

  return {
    data: {
      reply: `Hi ${input.userName}, thank you for your message! I would be delighted to assist you with this property. Would you like to schedule a viewing or discuss the lease terms?`,
    },
  };
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
    if (result) return { data: result };
  } catch (e) {
    console.warn('AI maintenance categorization unavailable, using keyword fallback.');
  }

  const text = parsed.data.requestText.toLowerCase();
  let category = 'General Maintenance';
  let priority = 'Low';
  let estimatedCost = '$100 - $250';

  if (text.includes('leak') || text.includes('water') || text.includes('pipe') || text.includes('toilet') || text.includes('faucet')) {
    category = 'Plumbing';
    priority = text.includes('flood') || text.includes('burst') ? 'Urgent' : 'High';
    estimatedCost = '$150 - $400';
  } else if (text.includes('spark') || text.includes('power') || text.includes('wire') || text.includes('breaker') || text.includes('outlet')) {
    category = 'Electrical';
    priority = 'Urgent';
    estimatedCost = '$200 - $500';
  } else if (text.includes('heat') || text.includes('ac') || text.includes('cold') || text.includes('thermostat') || text.includes('air')) {
    category = 'HVAC';
    priority = 'Medium';
    estimatedCost = '$150 - $350';
  } else if (text.includes('fridge') || text.includes('refrigerator') || text.includes('stove') || text.includes('oven') || text.includes('washer')) {
    category = 'Appliance Repair';
    priority = 'Medium';
    estimatedCost = '$120 - $300';
  }

  return {
    data: {
      category,
      priority,
      estimatedCost,
      recommendedAction: `Schedule a certified ${category.toLowerCase()} technician to inspect the reported issue.`,
    },
  };
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
    if (result) return { data: result };
  } catch (e) {
    console.warn('AI description generation unavailable, using template fallback.');
  }

  const featuresText = input.features && input.features.length > 0
    ? `Highlights include premium appointments such as ${input.features.join(', ')}.`
    : 'Features modern finishes and sun-filled open living spaces.';

  return {
    data: {
      description: `Welcome to ${input.title}, a remarkable ${input.propertyType.toLowerCase()} nestled in prime ${input.city}, ${input.state}. Offering ${input.bedrooms} bedrooms and ${input.bathrooms} bathrooms across ${Number(input.sqft).toLocaleString()} sqft of living space. ${featuresText} Conveniently located near leading dining, shopping, and transit corridors.`,
    },
  };
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
    if (result?.articles?.length) {
      return { data: result };
    }
  } catch (e) {
    console.warn('AI news service unavailable, serving curated real estate brief.');
  }

  return { data: { articles: fallbackArticles } };
}
