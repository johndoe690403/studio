'use server';

import {
  findAndConvertSong,
  type FindAndConvertSongInput,
} from '@/ai/flows/song-harvester';
import {
  prioritizeSources,
  type PrioritizeSourcesInput,
} from '@/ai/flows/source-prioritization';
import type { HarvesterResult, Song } from '@/lib/types';
import { z } from 'zod';

const formSchema = z.object({
  artists: z.string().optional(),
  genre: z.string().optional(),
  year: z.string().optional(),
});

const DUMMY_SONGS_META: Omit<Song, 'fileContent'>[] = [
  { id: 1, title: 'Bohemian Rhapsody', artist: 'Queen', popularity: 95 },
  { id: 2, title: 'Like a Rolling Stone', artist: 'Bob Dylan', popularity: 92 },
  { id: 3, title: 'Stairway to Heaven', artist: 'Led Zeppelin', popularity: 98 },
  { id: 4, title: 'Smells Like Teen Spirit', artist: 'Nirvana', popularity: 90 },
  { id: 5, title: 'Hotel California', artist: 'Eagles', popularity: 88 },
  {
    id: 6,
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    popularity: 85,
  },
  { id: 7, title: 'Imagine', artist: 'John Lennon', popularity: 89 },
  { id: 8, title: 'Billie Jean', artist: 'Michael Jackson', popularity: 93 },
];

export async function processQuery(
  values: z.infer<typeof formSchema>
): Promise<HarvesterResult> {
  const sourceInput: PrioritizeSourcesInput = {
    artists: values.artists || '',
    genre: values.genre || '',
    year: values.year || '',
  };

  const aiResult = await prioritizeSources(sourceInput);

  // Simulate initial delay for source prioritization
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const songPromises = DUMMY_SONGS_META.map(async (songMeta) => {
    const artist = values.artists || songMeta.artist;
    const songInput: FindAndConvertSongInput = {
      title: songMeta.title,
      artist: artist,
    };
    const { audioContentB64 } = await findAndConvertSong(songInput);
    // Simulate processing delay for each song
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      ...songMeta,
      artist: artist,
      fileContent: audioContentB64,
    };
  });

  const songs = (await Promise.all(songPromises)).sort(
    (a, b) => b.popularity - a.popularity
  );

  return {
    aiResult,
    songs,
  };
}
