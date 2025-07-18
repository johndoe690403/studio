'use server';
/**
 * @fileOverview An AI agent that finds a song on YouTube and converts it to audio.
 *
 * - findAndConvertSong - A function that handles finding and converting a song.
 * - FindAndConvertSongInput - The input type for the findAndConvertSong function.
 * - FindAndConvertSongOutput - The return type for the findAndConvertSong function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FindAndConvertSongInputSchema = z.object({
  title: z.string().describe('The title of the song.'),
  artist: z.string().describe('The artist of the song.'),
});
export type FindAndConvertSongInput = z.infer<
  typeof FindAndConvertSongInputSchema
>;

const FindAndConvertSongOutputSchema = z.object({
  audioContentB64: z
    .string()
    .describe('The base64 encoded content of the audio file.'),
});
export type FindAndConvertSongOutput = z.infer<
  typeof FindAndConvertSongOutputSchema
>;

export async function findAndConvertSong(
  input: FindAndConvertSongInput
): Promise<FindAndConvertSongOutput> {
  return findAndConvertSongFlow(input);
}

// Mocked tool to simulate searching YouTube
const searchYouTubeTool = ai.defineTool(
  {
    name: 'searchYouTube',
    description: 'Searches YouTube for a music video and returns its ID.',
    inputSchema: z.object({
      query: z
        .string()
        .describe('The search query, e.g., "Artist - Title".'),
    }),
    outputSchema: z.object({
      videoId: z.string().describe('The YouTube video ID.'),
    }),
  },
  async (input) => {
    console.log(`Searching YouTube for: ${input.query}`);
    // In a real implementation, you would use the YouTube API here.
    // We'll return a deterministic mock ID based on the query.
    const mockId = Buffer.from(input.query).toString('hex').slice(0, 11);
    return { videoId: mockId };
  }
);

// Mocked tool to simulate converting a video to audio
const convertToAudioTool = ai.defineTool(
  {
    name: 'convertToAudio',
    description: 'Converts a YouTube video to an audio file (mock).',
    inputSchema: z.object({
      videoId: z.string().describe('The YouTube video ID to convert.'),
      title: z.string().describe('The title of the song.'),
      artist: z.string().describe('The artist of the song.'),
    }),
    outputSchema: z.object({
      audioContentB64: z
        .string()
        .describe('The base64 encoded content of the audio file.'),
    }),
  },
  async (input) => {
    console.log(`Converting video ID ${input.videoId} to audio.`);
    // In a real implementation, this would download the video and convert it.
    // We'll return mock base64 audio data.
    const textContent = `This is a mock audio file for "${input.title}" by ${input.artist}. (Video ID: ${input.videoId})`;
    const b64Content = Buffer.from(textContent).toString('base64');
    return { audioContentB64: b64Content };
  }
);

const findAndConvertSongFlow = ai.defineFlow(
  {
    name: 'findAndConvertSongFlow',
    inputSchema: FindAndConvertSongInputSchema,
    outputSchema: FindAndConvertSongOutputSchema,
  },
  async (input) => {
    const searchQuery = `${input.artist} - ${input.title}`;

    const searchResult = await searchYouTubeTool({ query: searchQuery });

    const audioResult = await convertToAudioTool({
      videoId: searchResult.videoId,
      title: input.title,
      artist: input.artist,
    });

    return audioResult;
  }
);
