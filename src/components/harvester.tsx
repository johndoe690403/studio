'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Archive,
  Calendar,
  Download,
  Library,
  ListMusic,
  Loader2,
  Music,
  RotateCw,
} from 'lucide-react';
import React, { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import JSZip from 'jszip';

import { processQuery } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { HarvesterResult } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z
  .object({
    artists: z.string().optional(),
    genre: z.string().optional(),
    year: z.string().optional(),
  })
  .refine((data) => !!data.artists || !!data.genre || !!data.year, {
    message: 'At least one field must be filled.',
    path: ['artists'],
  });

type AppStatus = 'idle' | 'loading' | 'success' | 'error';

const progressStages = [
  { percent: 10, text: 'Warming up the tubes... AI is initializing.' },
  { percent: 20, text: 'AI is formulating the best search strategy...' },
  { percent: 30, text: 'Searching for tracks on YouTube...' },
  { percent: 50, text: 'Converting videos to audio...' },
  { percent: 70, text: 'Processing audio files...' },
  { percent: 80, text: 'Sorting tracks by popularity...' },
  { percent: 95, text: 'Calculating total file size...' },
];

// 10 MB in bytes
const ZIP_THRESHOLD_BYTES = 10 * 1024 * 1024;

export default function Harvester() {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [results, setResults] = useState<HarvesterResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [totalSize, setTotalSize] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const yearPlaceholder = `${currentYear - 10}-${currentYear}`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      artists: '',
      genre: '',
      year: '',
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'loading') {
      setProgress(0);
      setProgressText('Kicking off the process...');
      let stageIndex = 0;
      interval = setInterval(() => {
        if (stageIndex < progressStages.length) {
          setProgress(progressStages[stageIndex].percent);
          setProgressText(progressStages[stageIndex].text);
          stageIndex++;
        } else {
          clearInterval(interval);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [status]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setStatus('loading');
    startTransition(async () => {
      try {
        const result = await processQuery(values);
        setResults(result);

        const calculatedSize = result.songs.reduce(
          (acc, song) => acc + (song.fileContent?.length || 0),
          0
        );
        // This is an approximation. Base64 is larger than binary.
        const estimatedBinarySize = calculatedSize * 0.75;
        setTotalSize(estimatedBinarySize);

        setStatus('success');
        setProgress(100);
        setProgressText('Your riffs are ready!');
      } catch (error) {
        console.error(error);
        setStatus('error');
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: 'Failed to harvest riffs. Please try again.',
        });
        reset();
      }
    });
  }

  const handleDownload = async () => {
    if (!results) return;

    const zip = new JSZip();
    results.songs.forEach((song) => {
      if (song.fileContent) {
        const fileName = `${song.artist} - ${song.title}.mp3`.replace(
          /[\\/?%*:|"<>]/g,
          '-'
        );
        zip.file(fileName, song.fileContent, { base64: true });
      }
    });

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9,
      },
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `RetroRiff-Harvester-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const reset = () => {
    setStatus('idle');
    setResults(null);
    form.reset();
    setProgress(0);
    setProgressText('');
    setTotalSize(0);
  };

  const isLoading = status === 'loading';
  const showDownload = status === 'success' && totalSize > ZIP_THRESHOLD_BYTES;
  const showListOnly = status === 'success' && totalSize <= ZIP_THRESHOLD_BYTES;

  return (
    <Card className="w-full max-w-3xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary p-3 text-primary-foreground">
            <Music className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-3xl font-headline">
              RetroRiff Harvester
            </CardTitle>
            <CardDescription>
              Enter artists, genres, or years to get a curated list of popular
              tracks.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status !== 'success' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="artists"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Music className="h-4 w-4" /> Artist(s)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Kendrick Lamar"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Library className="h-4 w-4" /> Genre(s)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Hip Hop"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Year(s)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`e.g., ${yearPlaceholder}`}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormMessage>
                {form.formState.errors.artists?.message}
              </FormMessage>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Harvesting...
                  </>
                ) : (
                  'Harvest Riffs'
                )}
              </Button>
            </form>
          </Form>
        )}

        {isLoading && (
          <div className="mt-6 space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {progressText}
            </p>
          </div>
        )}

        {status === 'success' && results && (
          <div className="animate-in fade-in-50 space-y-6">
            <div className="rounded-lg border bg-secondary/50 p-4">
              <h3 className="font-semibold">AI Search Plan:</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Source:</strong> {results.aiResult.source}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Query:</strong> "{results.aiResult.searchQuery}"
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead className="text-right">Popularity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.songs.map((song) => (
                    <TableRow key={song.id}>
                      <TableCell className="font-medium">
                        {song.title}
                      </TableCell>
                      <TableCell>{song.artist}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="w-8">{song.popularity}%</span>
                          <Progress
                            value={song.popularity}
                            className="h-2 w-24"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {showDownload && (
              <Button
                size="lg"
                className="w-full animate-pulse bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-5 w-5" />
                Download .zip ({(totalSize / 1024 / 1024).toFixed(2)} MB)
              </Button>
            )}

            {showListOnly && (
              <Alert>
                <ListMusic className="h-4 w-4" />
                <AlertTitle>Riffs Harvested</AlertTitle>
                <AlertDescription>
                  Total size is less than 10MB. A zip file is not available.
                  Enjoy the curated list!
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={reset}
                className="w-full sm:w-auto"
              >
                <RotateCw className="mr-2 h-5 w-5" />
                Start Over
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
