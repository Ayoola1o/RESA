'use server';
/**
 * @fileOverview An AI agent for generating compelling property descriptions.
 *
 * - generateDescription - A function that handles the description generation.
 * - GenerateDescriptionInput - The input type for the generateDescription function.
 * - GenerateDescriptionOutput - The return type for the generateDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDescriptionInputSchema = z.object({
  propertyType: z.string().describe('The type of property (e.g., House, Apartment, Condo).'),
  city: z.string().describe('The city where the property is located.'),
  state: z.string().describe('The state where the property is located.'),
  bedrooms: z.string().describe('The number of bedrooms.'),
  bathrooms: z.string().describe('The number of bathrooms.'),
  sqft: z.string().describe('The total square footage.'),
  features: z.array(z.string()).describe('A list of key features or amenities.'),
  title: z.string().describe('The title of the property listing.'),
});
export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

const GenerateDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated property description, written in a compelling and professional tone.'),
});
export type GenerateDescriptionOutput = z.infer<typeof GenerateDescriptionOutputSchema>;

export async function generateDescription(input: GenerateDescriptionInput): Promise<GenerateDescriptionOutput> {
  return generateDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: {schema: GenerateDescriptionInputSchema},
  output: {schema: GenerateDescriptionOutputSchema},
  prompt: `You are an expert real estate copywriter. Your task is to generate a compelling, professional, and engaging property description based on the provided details. The description should be a single, well-written paragraph. Highlight the key selling points without using a list format.

Property Details:
- Listing Title: {{{title}}}
- Type: {{{propertyType}}}
- Location: {{{city}}}, {{{state}}}
- Bedrooms: {{{bedrooms}}}
- Bathrooms: {{{bathrooms}}}
- Square Feet: {{{sqft}}}
- Key Features: {{#each features}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Generate one paragraph for the property description.`,
});

const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: GenerateDescriptionInputSchema,
    outputSchema: GenerateDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
