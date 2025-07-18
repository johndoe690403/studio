'use server';

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

const DUMMY_SONGS: Song[] = [
  {
    id: 1,
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    popularity: 95,
    fileContent: 'This is a dummy file for Bohemian Rhapsody.',
  },
  {
    id: 2,
    title: 'Like a Rolling Stone',
    artist: 'Bob Dylan',
    popularity: 92,
    fileContent: 'This is a dummy file for Like a Rolling Stone.',
  },
  {
    id: 3,
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    popularity: 98,
    fileContent: 'This is a dummy file for Stairway to Heaven.',
  },
  {
    id: 4,
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    popularity: 90,
    fileContent: 'This is a dummy file for Smells Like Teen Spirit.',
  },
  {
    id: 5,
    title: 'Hotel California',
    artist: 'Eagles',
    popularity: 88,
    fileContent: 'This is a dummy file for Hotel California.',
  },
  {
    id: 6,
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    popularity: 85,
    fileContent: "This is a dummy file for Sweet Child O' Mine.",
  },
  {
    id: 7,
    title: 'Imagine',
    artist: 'John Lennon',
    popularity: 89,
    fileContent: 'This is a dummy file for Imagine.',
  },
  {
    id: 8,
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    popularity: 93,
    fileContent: 'This is a dummy file for Billie Jean.',
  },
];

export async function processQuery(
  values: z.infer<typeof formSchema>
): Promise<HarvesterResult> {
  const input: PrioritizeSourcesInput = {
    artists: values.artists || '',
    genre: values.genre || '',
    year: values.year || '',
  };

  const aiResult = await prioritizeSources(input);

  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 8000));
  
  const songs = DUMMY_SONGS.map(song => ({
    ...song,
    artist: values.artists || song.artist,
  })).sort((a, b) => b.popularity - a.popularity);

  return {
    aiResult,
    songs,
  };
}
