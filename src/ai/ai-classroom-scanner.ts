'use server';
/**
 * @fileOverview An AI agent for scanning a classroom and identifying students.
 *
 * - scanClassroom - A function that identifies students in a photo.
 * - ClassroomScanInput - The input type for the scanClassroom function.
 * - ClassroomScanOutput - The return type for the scanClassroom function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const studentSchema = z.object({
    id: z.string().describe("The unique ID of the student."),
    displayName: z.string().describe("The name of the student."),
    faceProfileImageUrls: z.array(z.string()).describe("Array of reference photos for the student."),
});

const ClassroomScanInputSchema = z.object({
  classroomPhotoDataUri: z
    .string()
    .describe(
      "A photo of the classroom, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  students: z.array(studentSchema).describe("A list of all students eligible for attendance."),
});
export type ClassroomScanInput = z.infer<typeof ClassroomScanInputSchema>;

const ClassroomScanOutputSchema = z.object({
  identifiedStudentIds: z
    .array(z.string())
    .describe('An array of student IDs for each student positively identified in the classroom photo.'),
});
export type ClassroomScanOutput = z.infer<typeof ClassroomScanOutputSchema>;

export async function scanClassroom(
  input: ClassroomScanInput
): Promise<ClassroomScanOutput> {
  return classroomScannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classroomScannerPrompt',
  input: {schema: ClassroomScanInputSchema},
  output: {schema: ClassroomScanOutputSchema},
  prompt: `You are an advanced AI attendance system. Your critical task is to identify which students from a provided class roster are present in a single classroom photograph.

**Primary Input:**
- Classroom Photograph: {{media url=classroomPhotoDataUri}}

**Class Roster & Reference Photos:**
You will be given a list of all students. For each student, you will receive their ID, name, and a set of reference photos.
{{#each students}}
---
Student ID: {{this.id}}
Student Name: {{this.displayName}}
{{#each this.faceProfileImageUrls}}
- Reference Photo: {{media url=this}}
{{/each}}
{{/each}}
---

**Your Task & Instructions:**
1.  Scrutinize the main Classroom Photograph to locate every individual person.
2.  For each person you locate in the classroom photo, you must perform a rigorous comparison against the reference photos of **EVERY** student in the provided roster.
3.  A student should only be considered "identified" if their face in the classroom photo is a high-confidence match to their set of reference photos. Consider different angles and lighting.
4.  Your final output must be a JSON object containing a single key, "identifiedStudentIds". This key should hold an array of strings, where each string is the unique ID of a student you have successfully and confidently identified as being present.
5.  If you cannot identify anyone, return an empty array. Do not guess. Accuracy is paramount.
`,
});

const classroomScannerFlow = ai.defineFlow(
  {
    name: 'classroomScannerFlow',
    inputSchema: ClassroomScanInputSchema,
    outputSchema: ClassroomScanOutputSchema,
  },
  async input => {
    // Return empty list if no students are provided to scan against
    if (input.students.length === 0) {
        return { identifiedStudentIds: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
