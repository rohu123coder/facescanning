'use server';
/**
 * @fileOverview An AI flow for suggesting the best staff member for a task.
 *
 * - suggestAssigneeForTask - A function that suggests a staff member for a task.
 * - SuggestAssigneeInput - The input type for the suggestAssigneeForTask function.
 * - SuggestAssigneeOutput - The return type for the suggestAssigneeForTask function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { type Staff } from '@/lib/data';

const SuggestAssigneeInputSchema = z.object({
  taskDescription: z.string().describe('A detailed description of the task to be assigned.'),
  staffList: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        role: z.string(),
        department: z.string(),
      })
    )
    .describe('A list of available staff members with their roles and departments.'),
});
export type SuggestAssigneeInput = z.infer<typeof SuggestAssigneeInputSchema>;

const SuggestAssigneeOutputSchema = z.object({
  suggestedStaffId: z
    .string()
    .nullable()
    .describe('The ID of the most suitable staff member for the task, or null if no suitable candidate is found.'),
  reasoning: z.string().describe('A brief explanation for why this staff member was suggested.'),
});
export type SuggestAssigneeOutput = z.infer<typeof SuggestAssigneeOutputSchema>;

export async function suggestAssigneeForTask(input: SuggestAssigneeInput): Promise<SuggestAssigneeOutput> {
  return suggestAssigneeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAssigneePrompt',
  input: { schema: SuggestAssigneeInputSchema },
  output: { schema: SuggestAssigneeOutputSchema },
  prompt: `You are an expert project manager. Your job is to assign tasks to the most appropriate team member based on their role and department.

Analyze the task description and the list of available staff members.

**Task Description:**
"{{taskDescription}}"

**Available Staff:**
{{#each staffList}}
- **ID:** {{id}}
- **Name:** {{name}}
- **Role:** {{role}}
- **Department:** {{department}}
---
{{/each}}

**Instructions:**
1.  Read the task description carefully to understand the required skills.
2.  Review the list of staff members and their roles.
3.  Choose the staff member whose role and department best match the requirements of the task.
4.  Provide the ID of the suggested staff member in the 'suggestedStaffId' field.
5.  In the 'reasoning' field, provide a short, clear reason for your choice. For example, "Rohan is a Senior Developer in the Engineering team, making him a good fit for a technical task."
6.  If no one is a good fit, return null for the ID and explain why in the reasoning.
`,
});

const suggestAssigneeFlow = ai.defineFlow(
  {
    name: 'suggestAssigneeFlow',
    inputSchema: SuggestAssigneeInputSchema,
    outputSchema: SuggestAssigneeOutputSchema,
  },
  async (input) => {
    if (input.staffList.length === 0) {
      return { suggestedStaffId: null, reasoning: 'The staff list is empty. Cannot make a suggestion.' };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
