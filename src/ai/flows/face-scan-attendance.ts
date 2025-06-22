'use server';

/**
 * @fileOverview AI agent for face scan attendance for any person (staff/student).
 *
 * - faceScanAttendance - A function that handles the face scan attendance process.
 * - FaceScanAttendanceInput - The input type for the faceScanAttendance function.
 * - FaceScanAttendanceOutput - The return type for the faceScanAttendance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FaceScanAttendanceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  referencePhotoUrl: z
    .string()
    .describe("A URL to a reference photo of the person."),
  personId: z.string().describe('The unique identifier of the person (staff or student).'),
});
export type FaceScanAttendanceInput = z.infer<typeof FaceScanAttendanceInputSchema>;

const FaceScanAttendanceOutputSchema = z.object({
  isRecognized: z.boolean().describe('Whether the face is recognized or not.'),
  message: z.string().describe('A message indicating the result of the attendance logging.'),
});
export type FaceScanAttendanceOutput = z.infer<typeof FaceScanAttendanceOutputSchema>;

export async function faceScanAttendance(input: FaceScanAttendanceInput): Promise<FaceScanAttendanceOutput> {
  return faceScanAttendanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'faceScanAttendancePrompt',
  input: {schema: FaceScanAttendanceInputSchema},
  output: {schema: FaceScanAttendanceOutputSchema},
  prompt: `You are an AI facial recognition system. Your task is to determine if the person in the live photo is the same person as in the reference photo for person with ID {{{personId}}}.

Compare the two images.

- If they are the same person, set isRecognized to true and for the message, say "Welcome!".
- If they are not the same person, set isRecognized to false and for the message, say "Face not recognized.".

Live Photo: {{media url=photoDataUri}}
Reference Photo: {{media url=referencePhotoUrl}}`,
});

const faceScanAttendanceFlow = ai.defineFlow(
  {
    name: 'faceScanAttendanceFlow',
    inputSchema: FaceScanAttendanceInputSchema,
    outputSchema: FaceScanAttendanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
