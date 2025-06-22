'use server';

/**
 * @fileOverview An AI agent for automatically assigning tasks to employees.
 * 
 * - autoAssignTask - A function that suggests the best employee for a task.
 * - AutoAssignTaskInput - The input type for the autoAssignTask function.
 * - AutoAssignTaskOutput - The return type for the autoAssignTask function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define Zod schema for a single staff member
const StaffSchema = z.object({
    id: z.string(),
    name: z.string(),
    skills: z.array(z.string()).describe("A list of the staff member's skills."),
    attendanceRecords: z.array(z.any()).optional().describe("A list of their attendance records to determine availability."),
}).describe("Represents a single staff member.");
export type Staff = z.infer<typeof StaffSchema>;

// Define Zod schema for the task details
const TaskDetailsSchema = z.object({
    title: z.string().describe("The title of the task."),
    description: z.string().describe("A detailed description of the task."),
    priority: z.enum(['High', 'Medium', 'Low']).describe("The priority of the task."),
    requiredSkills: z.array(z.string()).optional().describe("A list of skills recommended for this task."),
});

// Define Zod schema for the flow's input
const AutoAssignTaskInputSchema = z.object({
  task: TaskDetailsSchema,
  staffList: z.array(StaffSchema).describe("The list of all available staff members."),
});
export type AutoAssignTaskInput = z.infer<typeof AutoAssignTaskInputSchema>;

// Define Zod schema for the flow's output
const AutoAssignTaskOutputSchema = z.object({
  assignedStaffIds: z.array(z.string()).describe('An array of IDs of the most suitable staff members for the task.'),
  reasoning: z.string().describe("A brief explanation for why the specific staff members were chosen."),
});
export type AutoAssignTaskOutput = z.infer<typeof AutoAssignTaskOutputSchema>;


export async function autoAssignTask(input: AutoAssignTaskInput): Promise<AutoAssignTaskOutput> {
  return autoAssignTaskFlow(input);
}

const prompt = ai.definePrompt({
    name: 'autoAssignTaskPrompt',
    input: { schema: AutoAssignTaskInputSchema },
    output: { schema: AutoAssignTaskOutputSchema },
    prompt: `You are an expert Task Assignment Bot for an enterprise. Your goal is to intelligently assign tasks to the most suitable employee based on multiple factors.

    **Task to Assign:**
    - **Title:** {{{task.title}}}
    - **Description:** {{{task.description}}}
    - **Priority:** {{{task.priority}}}
    {{#if task.requiredSkills}}
    - **Recommended Skills:** {{#each task.requiredSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    {{/if}}

    **Available Staff:**
    {{#each staffList}}
    - **ID:** {{{this.id}}}, **Name:** {{{this.name}}}
      - **Skills:** {{#if this.skills}}{{#each this.skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{else}}No skills listed{{/each}}{{/if}}
      - **Current Workload:** (Consider that a staff member with fewer attendance records might be less available, but this is a secondary factor to skills).
    {{/each}}

    **Your Instructions:**
    1.  **Analyze the Task:** Understand the requirements from the title, description, and recommended skills.
    2.  **Evaluate Staff:** Review each staff member's skills and current workload.
    3.  **Match Skills:** Give the highest preference to staff whose skills perfectly match the task's recommended skills.
    4.  **Consider Workload:** Among skilled staff, prefer those with a lighter workload. For simplicity, you can assume all staff listed are available, but a long list of attendance might imply they are more consistently working.
    5.  **Handle Priority:** For 'High' priority tasks, skill match is paramount. For 'Low' priority, workload can be a more significant factor.
    6.  **Decision:** Select one or more most suitable employees. It's better to assign to one highly suitable person than multiple less suitable ones, unless the task clearly requires collaboration.
    7.  **Provide Reasoning:** Briefly explain your choice. For example: "Aarav Sharma was chosen due to his expertise in 'React' and 'Next.js', which are crucial for this high-priority frontend task."

    Return the IDs of the chosen staff members and your reasoning.`,
});

const autoAssignTaskFlow = ai.defineFlow(
  {
    name: 'autoAssignTaskFlow',
    inputSchema: AutoAssignTaskInputSchema,
    outputSchema: AutoAssignTaskOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
