// 'use server';
/**
 * @fileOverview An AI agent that prioritizes the best sources for music files based on user input.
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
  searchQuery: z.string().describe('The best search query to use for finding music files.'),
  source: z.string().describe('The prioritized music source to use for finding music files.'),
});
export type PrioritizeSourcesOutput = z.infer<typeof PrioritizeSourcesOutputSchema>;

export async function prioritizeSources(input: PrioritizeSourcesInput): Promise<PrioritizeSourcesOutput> {
  return prioritizeSourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeSourcesPrompt',
  input: {schema: PrioritizeSourcesInputSchema},
  output: {schema: PrioritizeSourcesOutputSchema},
  prompt: `You are an AI expert in identifying the best sources for music files.

  Given the following user input, determine the best search query and music source to use to maximize the chances of finding high-quality and readily downloadable songs.

  Artist(s): {{{artists}}}
  Genre: {{{genre}}}
  Year(s): {{{year}}}

  Consider factors such as the availability of music files, the quality of the files, and the ease of downloading the files.

  Return the search query and source in the following JSON format:
  {
    "searchQuery": "<the best search query to use>",
    "source": "<the prioritized music source to use>"
  }`,
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
