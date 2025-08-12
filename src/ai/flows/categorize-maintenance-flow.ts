'use server';
/**
 * @fileOverview An AI agent for categorizing and prioritizing maintenance requests.
 *
 * - categorizeMaintenanceRequest - A function that handles the maintenance request analysis.
 * - CategorizeMaintenanceInput - The input type for the categorizeMaintenanceRequest function.
 * - CategorizeMaintenanceOutput - The return type for the categorizeMaintenanceRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeMaintenanceInputSchema = z.object({
  requestText: z.string().describe('The full, raw text of the maintenance request submitted by a tenant.'),
});
export type CategorizeMaintenanceInput = z.infer<typeof CategorizeMaintenanceInputSchema>;

const CategorizeMaintenanceOutputSchema = z.object({
  category: z.enum(['Plumbing', 'Electrical', 'Appliance', 'HVAC', 'Structural', 'General'])
    .describe('The general category of the maintenance issue.'),
  priority: z.enum(['Low', 'Medium', 'High', 'Emergency'])
    .describe('The suggested priority level for the request.'),
  summary: z.string().describe('A concise, one-sentence summary of the maintenance issue.'),
  suggestedAction: z.string().describe('A brief recommendation for the next step, e.g., "Contact a licensed plumber."'),
});
export type CategorizeMaintenanceOutput = z.infer<typeof CategorizeMaintenanceOutputSchema>;

export async function categorizeMaintenanceRequest(input: CategorizeMaintenanceInput): Promise<CategorizeMaintenanceOutput> {
  return categorizeMaintenanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeMaintenancePrompt',
  input: {schema: CategorizeMaintenanceInputSchema},
  output: {schema: CategorizeMaintenanceOutputSchema},
  prompt: `You are an expert property manager responsible for handling maintenance requests. A tenant has submitted the following request. Analyze it and respond in JSON format.

Determine the most appropriate category for the issue.
Determine the priority level. A water leak or no heat in winter is an Emergency. A broken appliance is High. A cosmetic issue is Low.
Provide a one-sentence summary of the problem.
Suggest a brief, actionable next step for the landlord.

Tenant's Request:
---
{{{requestText}}}
---`,
});

const categorizeMaintenanceFlow = ai.defineFlow(
  {
    name: 'categorizeMaintenanceFlow',
    inputSchema: CategorizeMaintenanceInputSchema,
    outputSchema: CategorizeMaintenanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
