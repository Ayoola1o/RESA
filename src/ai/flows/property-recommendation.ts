// This is a server-side file!
'use server';

/**
 * @fileOverview A property recommendation AI agent.
 *
 * - recommendProperties - A function that handles the property recommendation process.
 * - RecommendPropertiesInput - The input type for the recommendProperties function.
 * - RecommendPropertiesOutput - The return type for the recommendProperties function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendPropertiesInputSchema = z.object({
  preferences: z
    .string()
    .describe('The preferences of the user, as a comma separated list.'),
  recentlyViewed: z
    .string()
    .describe('The recently viewed properties, as a comma separated list of property IDs.'),
  savedProperties: z
    .string()
    .describe('The saved properties, as a comma separated list of property IDs.'),
});
export type RecommendPropertiesInput = z.infer<typeof RecommendPropertiesInputSchema>;

const RecommendPropertiesOutputSchema = z.object({
  propertyIds: z
    .array(z.string())
    .describe('An array of property IDs that match the users preferences.'),
});
export type RecommendPropertiesOutput = z.infer<typeof RecommendPropertiesOutputSchema>;

export async function recommendProperties(input: RecommendPropertiesInput): Promise<RecommendPropertiesOutput> {
  return recommendPropertiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendPropertiesPrompt',
  input: {schema: RecommendPropertiesInputSchema},
  output: {schema: RecommendPropertiesOutputSchema},
  prompt: `You are an expert real estate agent specializing in property recommendations.

You will use the user's preferences, recently viewed properties, and saved properties to recommend similar properties.

Preferences: {{{preferences}}}
Recently Viewed Properties: {{{recentlyViewed}}}
Saved Properties: {{{savedProperties}}}

Return an array of property IDs that match the users preferences.

Respond in JSON format.`,
});

const recommendPropertiesFlow = ai.defineFlow(
  {
    name: 'recommendPropertiesFlow',
    inputSchema: RecommendPropertiesInputSchema,
    outputSchema: RecommendPropertiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
