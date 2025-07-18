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
import ytdl from 'ytdl-core';
import YouTube from 'youtube-sr';

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

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

const findAndConvertSongFlow = ai.defineFlow(
  {
    name: 'findAndConvertSongFlow',
    inputSchema: FindAndConvertSongInputSchema,
    outputSchema: FindAndConvertSongOutputSchema,
  },
  async (input) => {
    const searchQuery = `${input.artist} - ${input.title}`;
    console.log(`Searching YouTube for: ${searchQuery}`);

    try {
      const video = await YouTube.searchOne(searchQuery, 'video');
      if (!video) {
        throw new Error(`No video found for query: ${searchQuery}`);
      }

      console.log(`Found video: ${video.title} (${video.url})`);

      const audioStream = ytdl(video.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
      });

      console.log(`Downloading and converting audio for ${video.title}...`);
      const audioBuffer = await streamToBuffer(audioStream);
      const audioContentB64 = audioBuffer.toString('base64');

      console.log(`Successfully converted audio for ${video.title}.`);
      return { audioContentB64 };
    } catch (error) {
      console.error(
        `Failed to process song "${searchQuery}":`,
        error instanceof Error ? error.message : String(error)
      );
      // Return empty content if there's an error to avoid breaking the whole process
      return { audioContentB64: '' };
    }
  }
);
