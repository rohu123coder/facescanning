'use server';
/**
 * @fileOverview An AI flow for recognizing a staff member's face for attendance.
 *
 * - recognizeStaffFace - A function that handles the face recognition process.
 * - RecognizeStaffFaceInput - The input type for the recognizeStaffFace function.
 * - RecognizeStaffFaceOutput - The return type for the recognizeStaffFace function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecognizeStaffFaceInputSchema = z.object({
  capturedPhotoDataUri: z
    .string()
    .describe(
      "A photo of a person captured for attendance, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  staffList: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        photoUrl: z.string(),
      })
    )
    .describe('A list of registered staff members with their photos.'),
});
export type RecognizeStaffFaceInput = z.infer<typeof RecognizeStaffFaceInputSchema>;

const RecognizeStaffFaceOutputSchema = z.object({
  matchedStaffId: z
    .string()
    .nullable()
    .describe('The ID of the matched staff member, or null if no match is found.'),
  message: z.string().describe('A message indicating the result of the recognition.'),
});
export type RecognizeStaffFaceOutput = z.infer<typeof RecognizeStaffFaceOutputSchema>;

export async function recognizeStaffFace(input: RecognizeStaffFaceInput): Promise<RecognizeStaffFaceOutput> {
  return recognizeStaffFaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recognizeStaffFacePrompt',
  input: { schema: RecognizeStaffFaceInputSchema },
  output: { schema: RecognizeStaffFaceOutputSchema },
  prompt: `You are an advanced facial recognition system for an office attendance kiosk. Your task is to accurately identify an employee from a captured photo by comparing it against a database of registered staff photos.

Analyze the captured image provided below and compare it with each employee in the provided staff list.

**Captured Photo for Recognition:**
{{media url=capturedPhotoDataUri}}

**Registered Staff Database:**
{{#each staffList}}
- **Employee ID:** \`{{id}}\`
- **Name:** {{name}}
- **Registered Photo:** {{media url=photoUrl}}
---
{{/each}}

After careful comparison, determine which registered employee is in the captured photo.

**Output Instructions:**
- If you find a clear match, set the 'matchedStaffId' to the corresponding Employee ID. Set the message to "Match found."
- If the captured photo does not match any employee in the database, or if the image is unclear, set 'matchedStaffId' to null. Set the message to "No match found."
- Do not guess. Accuracy is critical.
`,
});

const recognizeStaffFaceFlow = ai.defineFlow(
  {
    name: 'recognizeStaffFaceFlow',
    inputSchema: RecognizeStaffFaceInputSchema,
    outputSchema: RecognizeStaffFaceOutputSchema,
  },
  async (input) => {
    if (input.staffList.length === 0) {
        return { matchedStaffId: null, message: 'Staff list is empty. Cannot perform recognition.' };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
