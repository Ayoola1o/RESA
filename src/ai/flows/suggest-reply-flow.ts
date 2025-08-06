'use server';
/**
 * @fileOverview An AI agent for suggesting replies in a conversation.
 *
 * - suggestReply - A function that suggests a reply based on conversation history.
 * - SuggestReplyInput - The input type for the suggestReply function.
 * - SuggestReplyOutput - The return type for the suggestReply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SuggestReplyInputSchema = z.object({
  conversationHistory: z.string().describe('The full history of the conversation, with each message on a new line.'),
  userName: z.string().describe('The name of the user for whom to generate a reply.'),
});
export type SuggestReplyInput = z.infer<typeof SuggestReplyInputSchema>;

export const SuggestReplyOutputSchema = z.object({
  suggestedReply: z.string().describe('The suggested reply message.'),
});
export type SuggestReplyOutput = z.infer<typeof SuggestReplyOutputSchema>;

export async function suggestReply(input: SuggestReplyInput): Promise<SuggestReplyOutput> {
  return suggestReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReplyPrompt',
  input: {schema: SuggestReplyInputSchema},
  output: {schema: SuggestReplyOutputSchema},
  prompt: `You are a helpful assistant for a user named {{{userName}}}. Your task is to suggest a concise and appropriate reply based on the following conversation history. The reply should be from the perspective of {{{userName}}}.

Conversation History:
---
{{{conversationHistory}}}
---

Based on the history, provide a suggested reply for {{{userName}}}.`,
});

const suggestReplyFlow = ai.defineFlow(
  {
    name: 'suggestReplyFlow',
    inputSchema: SuggestReplyInputSchema,
    outputSchema: SuggestReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
