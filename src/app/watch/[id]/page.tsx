'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { CustomVideoPlayer } from '@/components/CustomVideoPlayer';
import { Loader2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  url360: string | null;
  url480: string | null;
  url720: string | null;
  url1080: string | null;
  hlsUrl: string | null;
  defaultSpeed: number;
  autoplay: boolean;
  subtitles: { id: string; language: string; url: string }[];
  audioTracks: { id: string; language: string; url: string }[];
  tmdbId: string | null;
  malId: string | null;
  anilistId: string | null;
  type: string;
}

import { Suspense } from 'react';

function WatchContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const season = parseInt(searchParams.get('s') || '1');
  const episode = parseInt(searchParams.get('e') || '1');

  const [video, setVideo] = useState<Video | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/videos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) router.replace('/');
        else setVideo(data);
      })
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="min-h-screen pt-24 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-500" />
        </main>
      </>
    );
  }

  if (!video) return null;

  const sources = {
    360: video.url360 || undefined,
    480: video.url480 || undefined,
    720: video.url720 || undefined,
    1080: video.url1080 || undefined,
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <CustomVideoPlayer
        videoId={video.id}
        title={video.title}
        sources={sources}
        hlsUrl={video.hlsUrl}
        subtitles={video.subtitles}
        audioTracks={video.audioTracks}
        defaultSpeed={video.defaultSpeed}
        autoplay={video.autoplay}
        onClose={() => router.push('/')}
        minimized={minimized}
        onMinimize={() => setMinimized(!minimized)}
        tmdbId={video.tmdbId || undefined}
        malId={video.malId || undefined}
        anilistId={video.anilistId || undefined}
        season={season}
        episode={episode}
        type={video.type}
      />
    </>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
