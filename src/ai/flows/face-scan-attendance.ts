'use server';

/**
 * @fileOverview AI agent for face scan attendance.
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
      "A photo of the staff member's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  staffId: z.string().describe('The unique identifier of the staff member.'),
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
  prompt: `You are an AI attendance system that logs staff attendance based on facial recognition.

You will use the provided photo to verify the identity of the staff member and log their attendance.

Determine if the face in the photo matches the staff member with ID {{{staffId}}}. If the face is recognized, set isRecognized to true and provide a success message. Otherwise, set isRecognized to false and provide a message indicating that the face was not recognized.

Photo: {{media url=photoDataUri}}`,
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
