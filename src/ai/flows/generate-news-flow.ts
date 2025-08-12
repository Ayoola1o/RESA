
'use server';
/**
 * @fileOverview An AI agent for generating real estate news articles.
 *
 * - generateNews - A function that handles the news generation.
 * - GenerateNewsInput - The input type for the generateNews function.
 * - GenerateNewsOutput - The return type for the generateNews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewsInputSchema = z.object({
  topic: z.string().describe('The topic for the news articles, e.g., "US real estate market trends".'),
});
export type GenerateNewsInput = z.infer<typeof GenerateNewsInputSchema>;

const ArticleSchema = z.object({
    category: z.string().describe("The category of the news, e.g., 'Market Trends', 'Finance', 'Technology'."),
    title: z.string().describe('A compelling, headline-style title for the news article.'),
    summary: z.string().describe('A concise, one-to-two-sentence summary of the article.'),
    imageUrl: z.string().url().describe("A placeholder image URL from 'https://placehold.co' for the article."),
    imageHint: z.string().describe('One or two keywords for the image, e.g., "housing market" or "interest rates".'),
});

const GenerateNewsOutputSchema = z.object({
  articles: z.array(ArticleSchema).describe('A list of 3 generated news articles.'),
});
export type GenerateNewsOutput = z.infer<typeof GenerateNewsOutputSchema>;


export async function generateNews(input: GenerateNewsInput): Promise<GenerateNewsOutput> {
  return generateNewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewsPrompt',
  input: {schema: GenerateNewsInputSchema},
  output: {schema: GenerateNewsOutputSchema},
  prompt: `You are a real estate news editor. Generate 3 brief, engaging news articles about the requested topic.
For each article, provide a category, a title, a short summary, a placeholder image URL from 'https://placehold.co/120x90.png', and a one or two word hint for the image.

Topic: {{{topic}}}`,
});

const generateNewsFlow = ai.defineFlow(
  {
    name: 'generateNewsFlow',
    inputSchema: GenerateNewsInputSchema,
    outputSchema: GenerateNewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
