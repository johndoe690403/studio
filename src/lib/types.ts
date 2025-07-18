import type { PrioritizeSourcesOutput } from "@/ai/flows/source-prioritization";

export type Song = {
  id: number;
  title: string;
  artist: string;
  popularity: number;
};

export type HarvesterResult = {
  aiResult: PrioritizeSourcesOutput;
  songs: Song[];
};
