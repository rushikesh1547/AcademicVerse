'use server';

/**
 * @fileOverview An AI agent for detecting faces in an image.
 *
 * - detectFaces - A function that detects and counts faces in a photo.
 * - FaceDetectionInput - The input type for the detectFaces function.
 * - FaceDetectionOutput - The return type for the detectFaces function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FaceDetectionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FaceDetectionInput = z.infer<typeof FaceDetectionInputSchema>;

const FaceDetectionOutputSchema = z.object({
  faceCount: z
    .number()
    .describe('The number of human faces detected in the photo.'),
  reason: z
    .string()
    .describe('A brief explanation of the result, e.g., "Exactly one face detected" or "Multiple faces detected."'),
});
export type FaceDetectionOutput = z.infer<typeof FaceDetectionOutputSchema>;

export async function detectFaces(
  input: FaceDetectionInput
): Promise<FaceDetectionOutput> {
  return faceDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'faceDetectionPrompt',
  input: {schema: FaceDetectionInputSchema},
  output: {schema: FaceDetectionOutputSchema},
  prompt: `You are an AI assistant that detects and counts human faces in an image.

Analyze the following image:
- Photo: {{media url=photoDataUri}}

Count the number of distinct human faces in the image.
- If exactly one face is found, set 'faceCount' to 1.
- If no faces are found, set 'faceCount' to 0.
- If more than one face is found, set 'faceCount' to the number of faces detected.

Provide a brief 'reason' for your output. For example: "Exactly one face was detected, ready for enrollment." or "Error: Multiple faces detected in the frame. Please ensure only one person is present." or "No face detected. Please position your face in the center."

Output the response in JSON format.
`,
});

const faceDetectionFlow = ai.defineFlow(
  {
    name: 'faceDetectionFlow',
    inputSchema: FaceDetectionInputSchema,
    outputSchema: FaceDetectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
