import { config } from 'dotenv';
config();

import '@/ai/flows/property-recommendation.ts';
import '@/ai/flows/suggest-reply-flow.ts';
import '@/ai/flows/categorize-maintenance-flow.ts';
import '@/ai/flows/generate-description-flow.ts';
import '@/ai/flows/generate-news-flow.ts';
