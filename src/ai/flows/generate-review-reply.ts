
'use server';
/**
 * @fileOverview An AI flow for generating replies to customer reviews.
 *
 * - generateReviewReply - A function that creates a reply for a customer review.
 * - GenerateReviewReplyInput - The input type for the generateReviewReply function.
 * - GenerateReviewReplyOutput - The return type for the generateReviewReply function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateReviewReplyInputSchema = z.object({
  reviewText: z.string().describe('The full text of the customer review.'),
  rating: z.number().min(1).max(5).describe('The star rating given by the customer (1-5).'),
});
export type GenerateReviewReplyInput = z.infer<typeof GenerateReviewReplyInputSchema>;

const GenerateReviewReplyOutputSchema = z.object({
  reply: z.string().describe('The generated polite and professional reply to the customer.'),
});
export type GenerateReviewReplyOutput = z.infer<typeof GenerateReviewReplyOutputSchema>;

export async function generateReviewReply(input: GenerateReviewReplyInput): Promise<GenerateReviewReplyOutput> {
  return generateReviewReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReviewReplyPrompt',
  input: { schema: GenerateReviewReplyInputSchema },
  output: { schema: GenerateReviewReplyOutputSchema },
  prompt: `You are a helpful assistant for a business owner. Your task is to generate a polite, professional, and empathetic reply to a customer review.

The customer gave a rating of {{rating}} out of 5 stars.
The customer's review is: "{{reviewText}}"

Instructions:
- If the review is positive (4-5 stars), thank the customer warmly for their feedback and express happiness that they had a good experience.
- If the review is neutral (3 stars), thank them for the feedback and acknowledge their comments in a balanced way.
- If the review is negative (1-2 stars), apologize sincerely for their poor experience. Do not make excuses. Show a willingness to understand more and resolve the issue. For example, invite them to contact you directly.
- Keep the reply concise and to the point.
- Address the customer as "Valued Customer" or similar, do not use their name.
- Do NOT include placeholders like "[Your Name]" or "[Your Business Name]". The reply should be ready to post.
`,
});

const generateReviewReplyFlow = ai.defineFlow(
  {
    name: 'generateReviewReplyFlow',
    inputSchema: GenerateReviewReplyInputSchema,
    outputSchema: GenerateReviewReplyOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
