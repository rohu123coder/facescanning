'use server';

/**
 * @fileOverview An AI agent for generating professional replies to customer reviews.
 * 
 * - generateReviewReply - A function that suggests a reply for a customer review.
 * - GenerateReviewReplyInput - The input type for the generateReviewReply function.
 * - GenerateReviewReplyOutput - The return type for the generateReviewReply function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define Zod schema for the flow's input
const GenerateReviewReplyInputSchema = z.object({
  businessName: z.string().describe("The name of the business."),
  reviewText: z.string().describe("The full text of the customer's review."),
  starRating: z.number().min(1).max(5).describe("The star rating given by the customer (1-5)."),
});
export type GenerateReviewReplyInput = z.infer<typeof GenerateReviewReplyInputSchema>;

// Define Zod schema for the flow's output
const GenerateReviewReplyOutputSchema = z.object({
  replyText: z.string().describe("A professionally written, context-aware reply to the customer's review."),
});
export type GenerateReviewReplyOutput = z.infer<typeof GenerateReviewReplyOutputSchema>;

export async function generateReviewReply(input: GenerateReviewReplyInput): Promise<GenerateReviewReplyOutput> {
  return generateReviewReplyFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateReviewReplyPrompt',
    input: { schema: GenerateReviewReplyInputSchema },
    output: { schema: GenerateReviewReplyOutputSchema },
    prompt: `You are an expert Reputation Manager AI for a business named '{{{businessName}}}'. Your task is to write a polite, professional, and helpful reply to a customer review.

    **Review Details:**
    - **Star Rating:** {{{starRating}}}/5
    - **Review Text:** "{{{reviewText}}}"

    **Your Instructions:**

    1.  **Analyze the Tone:** Carefully consider the star rating and the text to understand the customer's sentiment.
    2.  **Positive Reviews (4-5 stars):**
        - Thank the customer by name if possible (assume you don't have it unless it's in the text).
        - Express delight and appreciation for their positive feedback.
        - Briefly acknowledge a specific positive point they mentioned, if any.
        - Invite them back.
    3.  **Negative Reviews (1-2 stars):**
        - Apologize sincerely for their negative experience. Do not make excuses.
        - Show empathy and acknowledge their frustration.
        - Address the specific issues they raised, if any.
        - **Crucially, offer to take the conversation offline to resolve the issue.** For example: "We'd like to learn more and make things right. Please contact us at [email/phone]." Do not ask for their contact details in the reply.
        - Reassure them that you take feedback seriously.
    4.  **Mixed/Neutral Reviews (3 stars):**
        - Thank them for their feedback.
        - Acknowledge both the positive and negative aspects they mentioned.
        - Reassure them you are always working to improve.
    
    **Goal:** Your reply should be concise, professional, and reflect well on '{{{businessName}}}'. Write only the reply text.`,
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
