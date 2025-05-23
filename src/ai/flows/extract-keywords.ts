// src/ai/flows/extract-keywords.ts
'use server';

/**
 * @fileOverview Extracts key skills, technologies, and responsibilities from a job description using AI.
 *
 * - extractKeywords - A function that handles the extraction process.
 * - ExtractKeywordsInput - The input type for the extractKeywords function.
 * - ExtractKeywordsOutput - The return type for the extractKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeywordsInputSchema = z.object({
  jobDescription: z.string().describe('The job description to extract keywords from.'),
});
export type ExtractKeywordsInput = z.infer<typeof ExtractKeywordsInputSchema>;

const ExtractKeywordsOutputSchema = z.object({
  skills: z.array(z.string()).describe('Key skills extracted from the job description.'),
  technologies: z
    .array(z.string())
    .describe('Technologies mentioned in the job description.'),
  responsibilities: z
    .array(z.string())
    .describe('Responsibilities listed in the job description.'),
});
export type ExtractKeywordsOutput = z.infer<typeof ExtractKeywordsOutputSchema>;

export async function extractKeywords(input: ExtractKeywordsInput): Promise<ExtractKeywordsOutput> {
  return extractKeywordsFlow(input);
}

const extractKeywordsPrompt = ai.definePrompt({
  name: 'extractKeywordsPrompt',
  input: {schema: ExtractKeywordsInputSchema},
  output: {schema: ExtractKeywordsOutputSchema},
  prompt: `You are an AI assistant tasked with extracting key information from job descriptions.

  Analyze the following job description and identify the key skills, technologies, and responsibilities.

  Job Description:
  {{jobDescription}}

  Return the extracted information in a structured JSON format.
  `, // Changed to a more direct and structured prompt
});

const extractKeywordsFlow = ai.defineFlow(
  {
    name: 'extractKeywordsFlow',
    inputSchema: ExtractKeywordsInputSchema,
    outputSchema: ExtractKeywordsOutputSchema,
  },
  async input => {
    const {output} = await extractKeywordsPrompt(input);
    return output!;
  }
);
