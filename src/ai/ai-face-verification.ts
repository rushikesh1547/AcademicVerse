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
  referencePhotoUrl: z
    .string()
    .describe(
      "A URL to the student's reference profile photo."
    ),
});
export type FaceVerificationInput = z.infer<typeof FaceVerificationInputSchema>;

const FaceVerificationOutputSchema = z.object({
  isVerified: z
    .boolean()
    .describe('Whether the two faces are determined to be the same person.'),
  confidence: z
    .number()
    .describe(
      'A confidence score between 0 and 1, where 1 is a perfect match.'
    ),
    reason: z
    .string()
    .describe('The reasoning behind the verification decision.'),
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
  prompt: `You are an expert AI face verification system. Your task is to determine if two images are of the same person with a very high degree of certainty.

Analyze the two images provided: a live captured photo and a reference photo.

- Captured Photo: {{media url=capturedPhotoDataUri}}
- Reference Photo: {{media url=referencePhotoUrl}}

**Your analysis must be strict.** Only determine the faces are a match if you are very confident. Carefully compare facial features, structure, and any unique identifiers like moles or scars. Pay close attention to the shape of the eyes, nose, and jawline.

Based on your strict analysis, determine if the person in the captured photo is the same as the person in the reference photo.

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
