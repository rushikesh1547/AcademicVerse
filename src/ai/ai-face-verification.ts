'use server';

/**
 * @fileOverview A face verification AI agent.
 *
 * - verifyStudentFace - A function that handles the face verification process.
 * - FaceVerificationInput - The input type for the verifyStudentFace function.
 * - FaceVerificationOutput - The return type for the verifyStudentFace function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FaceVerificationInputSchema = z.object({
  capturedPhotoDataUri: z
    .string()
    .describe(
      "A photo of a student captured from a webcam, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  referencePhotoUrls: z
    .array(z.string())
    .describe(
      "An array of URLs to the student's reference profile photos from different angles."
    ),
});
export type FaceVerificationInput = z.infer<typeof FaceVerificationInputSchema>;

const FaceVerificationOutputSchema = z.object({
  faceCount: z
    .number()
    .describe('The number of faces detected in the captured photo.'),
  isVerified: z
    .boolean()
    .describe('Whether the two faces are determined to be the same person. This should be false if faceCount is not 1.'),
  confidence: z
    .number()
    .describe(
      'A confidence score between 0 and 1, where 1 is a perfect match.'
    ),
    reason: z
    .string()
    .describe('The reasoning behind the verification decision. If more than one face is detected, state that as the reason.'),
});
export type FaceVerificationOutput = z.infer<typeof FaceVerificationOutputSchema>;

export async function verifyStudentFace(
  input: FaceVerificationInput
): Promise<FaceVerificationOutput> {
  return faceVerificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'faceVerificationPrompt',
  input: {schema: FaceVerificationInputSchema},
  output: {schema: FaceVerificationOutputSchema},
  prompt: `You are an expert AI face verification system. Your task is to determine if a live captured image is of the same person represented by a set of reference photos.

**Step 1: Analyze the captured photo and count the number of faces.**
- Captured Photo: {{media url=capturedPhotoDataUri}}
- Count the number of human faces present in this image and set the 'faceCount' field.

**Step 2: If and only if faceCount is exactly 1, proceed with verification.**
- If faceCount is not 1 (0 or more than 1), you MUST set 'isVerified' to false, 'confidence' to 0, and provide a 'reason' explaining that the verification cannot proceed because the photo does not contain exactly one face. Do not proceed to Step 3.

**Step 3: If faceCount is 1, perform strict face verification.**
- First, analyze the following reference photos to build a comprehensive and robust understanding of the person's face from different angles (front, left, right).
{{#each referencePhotoUrls}}
- Reference Image: {{media url=this}}
{{/each}}

- Now, compare the model you have built from the reference images against the single face in the live captured photo.

**Your analysis must be strict.** Only determine the faces are a match if you are very confident. Carefully compare facial features, structure, and any unique identifiers. Pay close attention to the shape of the eyes, nose, and jawline across all provided images.

Based on your strict analysis, determine if the person in the captured photo is the same as the person in the reference photos.

Set 'isVerified' to true ONLY if you are highly certain they are the same person. Otherwise, set it to false.
Provide a 'confidence' score from 0.0 to 1.0 representing your certainty. A score of 1.0 means a perfect, undeniable match. A score below 0.8 should be treated with suspicion.
Provide a brief 'reason' for your decision, highlighting the key factors you considered in your strict comparison.

Output the response in JSON format.
`,
});

const faceVerificationFlow = ai.defineFlow(
  {
    name: 'faceVerificationFlow',
    inputSchema: FaceVerificationInputSchema,
    outputSchema: FaceVerificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
