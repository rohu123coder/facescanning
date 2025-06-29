
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
  prompt: `You are an AI assistant performing facial recognition. I will provide you with a 'Captured Photo' and a list of 'Registered People'. Your task is to compare the face in the 'Captured Photo' with the faces in each of the 'Registered People' photos.

You must identify the single best match from the list.

**Captured Photo:**
{{media url=capturedPhotoDataUri}}

**Registered People ({{personType}}):**
{{#each personList}}
---
**Person ID:** \`{{id}}\`
**Name:** {{name}}
**Reference Photo:** {{media url=photoUrl}}
---
{{/each}}

**Instructions for Output:**
1. Examine the 'Captured Photo' and all 'Reference Photos'.
2. If the person in the 'Captured Photo' is a clear match for one of the people in the list, you MUST return their 'Person ID' in the \`matchedPersonId\` field. Set the message to "Match found for [Person's Name]."
3. If there is no clear match, you MUST return \`null\` for the \`matchedPersonId\` field. Set the message to "No clear match found in the database."
4. Accuracy is paramount. If you are not certain of a match, it is better to return \`null\`.
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
