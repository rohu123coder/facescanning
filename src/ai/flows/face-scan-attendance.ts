
'use server';
/**
 * @fileOverview An AI flow for recognizing a person's face for attendance.
 *
 * - recognizeFace - A function that handles the face recognition process.
 * - RecognizeFaceInput - The input type for the recognizeFace function.
 * - RecognizeFaceOutput - The return type for the recognizeFace function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecognizeFaceInputSchema = z.object({
  personType: z.enum(['Staff', 'Student']).describe('The type of person to recognize.'),
  capturedPhotoDataUri: z
    .string()
    .describe(
      "A photo of a person captured for attendance, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  personList: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        photoUrl: z.string(),
      })
    )
    .describe('A list of registered people with their photos.'),
});
export type RecognizeFaceInput = z.infer<typeof RecognizeFaceInputSchema>;

const RecognizeFaceOutputSchema = z.object({
  matchedPersonId: z
    .string()
    .nullable()
    .describe('The ID of the matched person, or null if no match is found.'),
  message: z.string().describe('A message indicating the result of the recognition.'),
});
export type RecognizeFaceOutput = z.infer<typeof RecognizeFaceOutputSchema>;

export async function recognizeFace(input: RecognizeFaceInput): Promise<RecognizeFaceOutput> {
  return recognizeFaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recognizeFacePrompt',
  input: { schema: RecognizeFaceInputSchema },
  output: { schema: RecognizeFaceOutputSchema },
  prompt: `You are an expert AI facial recognition system. Your only task is to determine if the person in the 'Live Photo' is present in the 'Reference List'.

**Live Photo to Identify:**
{{media url=capturedPhotoDataUri}}

**Reference List of Registered People:**
You must compare the 'Live Photo' against every person in this list.
{{#each personList}}
---
**Person ID:** \`{{id}}\`
**Name:** {{name}}
**Reference Photo:** {{media url=photoUrl}}
---
{{/each}}

**CRITICAL INSTRUCTIONS:**
1.  Carefully examine the 'Live Photo'.
2.  Compare it against EACH 'Reference Photo' in the list.
3.  If you find a definitive match based on facial features, you MUST return their exact 'Person ID' in the \`matchedPersonId\` field. The \`message\` field should be "Match Found."
4.  If there is NO clear match, or if you have ANY doubt whatsoever, you MUST return \`null\` for the \`matchedPersonId\` field. The \`message\` field should be "No match found."
5.  Your decision must be based exclusively on facial similarity. Do not use names or any other information.
6.  Prioritize accuracy above all else. A false negative (no match) is better than a false positive (incorrect match).
`,
});

const recognizeFaceFlow = ai.defineFlow(
  {
    name: 'recognizeFaceFlow',
    inputSchema: RecognizeFaceInputSchema,
    outputSchema: RecognizeFaceOutputSchema,
  },
  async (input) => {
    if (input.personList.length === 0) {
        return { matchedPersonId: null, message: 'Person list is empty. Cannot perform recognition.' };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
