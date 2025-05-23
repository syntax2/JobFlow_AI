'use server';

/**
 * @fileOverview A cover letter generation AI agent.
 *
 * - generateTailoredCoverLetter - A function that generates a tailored cover letter.
 * - GenerateTailoredCoverLetterInput - The input type for the generateTailoredCoverLetter function.
 * - GenerateTailoredCoverLetterOutput - The return type for the generateTailoredCoverLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTailoredCoverLetterInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description for the position being applied for.'),
  selectedResume: z.string().describe('The content of the selected resume.'),
});
export type GenerateTailoredCoverLetterInput = z.infer<
  typeof GenerateTailoredCoverLetterInputSchema
>;

const GenerateTailoredCoverLetterOutputSchema = z.object({
  coverLetter: z.string().describe('The generated cover letter.'),
});
export type GenerateTailoredCoverLetterOutput = z.infer<
  typeof GenerateTailoredCoverLetterOutputSchema
>;

export async function generateTailoredCoverLetter(
  input: GenerateTailoredCoverLetterInput
): Promise<GenerateTailoredCoverLetterOutput> {
  return generateTailoredCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTailoredCoverLetterPrompt',
  input: {schema: GenerateTailoredCoverLetterInputSchema},
  output: {schema: GenerateTailoredCoverLetterOutputSchema},
  prompt: `You are a professional cover letter writer. You will generate a tailored cover letter based on the job description and the selected resume.

Job Description: {{{jobDescription}}}

Selected Resume: {{{selectedResume}}}

Cover Letter:`, // outputSchema description is passed to prompt to request output in a specific format.
});

const generateTailoredCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateTailoredCoverLetterFlow',
    inputSchema: GenerateTailoredCoverLetterInputSchema,
    outputSchema: GenerateTailoredCoverLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
