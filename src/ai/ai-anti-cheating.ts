'use server';

/**
 * @fileOverview Analyzes student behavior during quizzes to detect suspicious activity.
 *
 * - analyzeStudentBehavior - Analyzes student behavior and flags suspicious activity.
 * - AnalyzeStudentBehaviorInput - The input type for the analyzeStudentBehavior function.
 * - AnalyzeStudentBehaviorOutput - The return type for the analyzeStudentBehavior function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStudentBehaviorInputSchema = z.object({
  studentId: z.string().describe('The ID of the student taking the quiz.'),
  quizId: z.string().describe('The ID of the quiz being taken.'),
  tabSwitchCount: z
    .number()
    .describe('The number of times the student switched tabs during the quiz.'),
  resourceAccessLog: z
    .string()
    .describe(
      'A log of resources accessed by the student during the quiz, such as URLs or file names.'
    ),
  timeTaken: z
    .number()
    .describe('The time taken by student to complete the quiz in seconds'),
});
export type AnalyzeStudentBehaviorInput = z.infer<typeof AnalyzeStudentBehaviorInputSchema>;

const AnalyzeStudentBehaviorOutputSchema = z.object({
  isSuspicious: z
    .boolean()
    .describe(
      'Whether the student behavior is considered suspicious based on the analysis.'
    ),
  suspiciousReasons: z
    .array(z.string())
    .describe(
      'A list of reasons why the student behavior is considered suspicious.'
    ),
  recommendation: z
    .string()
    .describe(
      'A recommendation for the teacher based on the analysis, such as reviewing the student attempt.'
    ),
});
export type AnalyzeStudentBehaviorOutput = z.infer<typeof AnalyzeStudentBehaviorOutputSchema>;

export async function analyzeStudentBehavior(
  input: AnalyzeStudentBehaviorInput
): Promise<AnalyzeStudentBehaviorOutput> {
  return analyzeStudentBehaviorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStudentBehaviorPrompt',
  input: {schema: AnalyzeStudentBehaviorInputSchema},
  output: {schema: AnalyzeStudentBehaviorOutputSchema},
  prompt: `You are an AI assistant that analyzes student behavior during quizzes to detect suspicious activity.

You are given the following information about a student taking a quiz:

Student ID: {{{studentId}}}
Quiz ID: {{{quizId}}}
Tab Switch Count: {{{tabSwitchCount}}}
Resource Access Log: {{{resourceAccessLog}}}
Time taken: {{{timeTaken}}} seconds

Analyze the student behavior and determine if it is suspicious. Provide a list of reasons why the behavior is suspicious and a recommendation for the teacher.

Consider the following factors when analyzing student behavior:

- A high tab switch count may indicate that the student is looking for answers online.
- Accessing unauthorized resources during the quiz is a clear indication of cheating.
- If the time taken is significantly low as compared to other students, it may indicate that the student has prior knowledge of the quiz questions or has external help.

Output the response in JSON format.
`,
});

const analyzeStudentBehaviorFlow = ai.defineFlow(
  {
    name: 'analyzeStudentBehaviorFlow',
    inputSchema: AnalyzeStudentBehaviorInputSchema,
    outputSchema: AnalyzeStudentBehaviorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
