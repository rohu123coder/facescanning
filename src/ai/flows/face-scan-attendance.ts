
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
  prompt: `You are a highly accurate AI facial recognition system. Your ONLY task is to determine if the person in the 'Captured Photo' is one of the people in the 'Registered People' list.

**Captured Photo:**
{{media url=capturedPhotoDataUri}}

**Registered People ({{personType}}):**
This is the complete list of registered {{personType}}s you must check against.
{{#each personList}}
---
**Person ID:** \`{{id}}\`
**Name:** {{name}}
**Reference Photo:** {{media url=photoUrl}}
---
{{/each}}

**CRITICAL INSTRUCTIONS:**
1.  **Examine the 'Captured Photo' meticulously.**
2.  **Compare the face in the 'Captured Photo' against EACH 'Reference Photo' from the list.**
3.  **If you find a clear, confident match, you MUST return their 'Person ID' in the \`matchedPersonId\` field.** The message should be "Match found for [Person's Name]."
4.  **If there is NO clear match, or if you have ANY doubt, you MUST return \`null\` for the \`matchedPersonId\` field.** The message should be "No match found in the database."
5.  **Do not invent people or match against anyone not in the provided 'Registered People' list.** Your scope is limited to this list only.
6.  Accuracy is the highest priority. It is better to fail a match than to make an incorrect one.
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
