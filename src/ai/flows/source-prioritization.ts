// 'use server';
/**
 * @fileOverview An AI agent that creates an optimal search query for finding music.
 *
 * - prioritizeSources - A function that handles the source prioritization process.
 * - PrioritizeSourcesInput - The input type for the prioritizeSources function.
 * - PrioritizeSourcesOutput - The return type for the prioritizeSources function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeSourcesInputSchema = z.object({
  artists: z.string().describe('The name of the artist(s).'),
  genre: z.string().describe('The music genre.'),
  year: z.string().describe('The year(s) of the music.'),
});
export type PrioritizeSourcesInput = z.infer<typeof PrioritizeSourcesInputSchema>;

const PrioritizeSourcesOutputSchema = z.object({
  searchQuery: z.string().describe('The best search query to use for finding music files on a search engine like Google.'),
  source: z.string().describe('The best online platform or type of site to search within (e.g., YouTube, SoundCloud, Bandcamp).'),
});
export type PrioritizeSourcesOutput = z.infer<typeof PrioritizeSourcesOutputSchema>;

export async function prioritizeSources(input: PrioritizeSourcesInput): Promise<PrioritizeSourcesOutput> {
  return prioritizeSourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeSourcesPrompt',
  input: {schema: PrioritizeSourcesInputSchema},
  output: {schema: PrioritizeSourcesOutputSchema},
  prompt: `You are an AI expert in finding music online. Your goal is to construct the best possible search query for a search engine to find downloadable, high-quality songs based on user input.

  User Input:
  - Artist(s): {{{artists}}}
  - Genre: {{{genre}}}
  - Year(s): {{{year}}}

  Based on the input, determine the most effective search query and the best platform (like YouTube, SoundCloud, etc.) to find the music. The search query should be optimized for finding lists of popular songs or full albums.

  Return the result in JSON format.`,
});

const prioritizeSourcesFlow = ai.defineFlow(
  {
    name: 'prioritizeSourcesFlow',
    inputSchema: PrioritizeSourcesInputSchema,
    outputSchema: PrioritizeSourcesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
