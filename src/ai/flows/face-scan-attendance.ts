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
  prompt: `You are an advanced facial recognition system for an attendance kiosk. Your task is to accurately identify a {{personType}} from a captured photo by comparing it against a database of registered people.

Analyze the captured image provided below and compare it with each person in the provided list.

**Captured Photo for Recognition:**
{{media url=capturedPhotoDataUri}}

**Registered {{personType}} Database:**
{{#each personList}}
- **ID:** \`{{id}}\`
- **Name:** {{name}}
- **Registered Photo:** {{media url=photoUrl}}
---
{{/each}}

After careful comparison, determine which registered {{personType}} is in the captured photo.

**Output Instructions:**
- If you find a clear match, set the 'matchedPersonId' to the corresponding ID. Set the message to "Match found."
- If the captured photo does not match any person in the database, or if the image is unclear, set 'matchedPersonId' to null. Set the message to "No match found."
- Do not guess. Accuracy is critical.
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
