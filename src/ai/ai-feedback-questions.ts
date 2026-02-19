'use server';
/**
 * @fileOverview Generates feedback questions for a given academic subject.
 *
 * - generateFeedbackQuestions - A function that creates feedback questions based on a subject.
 * - GenerateFeedbackQuestionsInput - The input type for the function.
 * - GenerateFeedbackQuestionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFeedbackQuestionsInputSchema = z.object({
  subjectName: z.string().describe('The name of the academic subject.'),
});
export type GenerateFeedbackQuestionsInput = z.infer<typeof GenerateFeedbackQuestionsInputSchema>;

const GenerateFeedbackQuestionsOutputSchema = z.object({
  questions: z
    .array(z.string())
    .describe('An array of 5-7 questions to ask the student for feedback.'),
});
export type GenerateFeedbackQuestionsOutput = z.infer<typeof GenerateFeedbackQuestionsOutputSchema>;

export async function generateFeedbackQuestions(
  input: GenerateFeedbackQuestionsInput
): Promise<GenerateFeedbackQuestionsOutput> {
  return generateFeedbackQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFeedbackQuestionsPrompt',
  input: {schema: GenerateFeedbackQuestionsInputSchema},
  output: {schema: GenerateFeedbackQuestionsOutputSchema},
  prompt: `You are an academic advisor AI. Your task is to generate a list of 5 to 7 insightful feedback questions for a student to answer about a specific university-level subject. The questions should be based on standard course outcomes and pedagogical best practices.

The subject is: {{{subjectName}}}

Generate questions that cover the following areas:
1.  Clarity and organization of the course content.
2.  Effectiveness of the teaching methods and instruction.
3.  Relevance and quality of learning materials (lectures, readings, assignments).
4.  Fairness and usefulness of assessments (quizzes, exams, projects).
5.  The student's personal engagement and learning experience.

The questions should be neutral and encourage constructive feedback.

Example questions for "Introduction to Psychology":
- "How would you rate the clarity of the lecture materials?"
- "Did the assignments and readings help you understand the key concepts?"
- "Was the pace of the course appropriate for your learning?"

Do not ask for answers, only generate the list of questions.
`,
});

const generateFeedbackQuestionsFlow = ai.defineFlow(
  {
    name: 'generateFeedbackQuestionsFlow',
    inputSchema: GenerateFeedbackQuestionsInputSchema,
    outputSchema: GenerateFeedbackQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
