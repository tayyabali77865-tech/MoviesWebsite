'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { CustomVideoPlayer } from '@/components/CustomVideoPlayer';
import { Loader2, Clapperboard, ChevronRight, Play } from 'lucide-react';
import { clsx } from 'clsx';

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
  const [tvDetails, setTvDetails] = useState<any>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/videos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) router.replace('/');
        else {
          setVideo(data);
          // If it's a TV show, series, drama, or anime, fetch details for episode selection
          if ((data.type === 'tv' || data.type === 'series' || data.type === 'drama' || data.type === 'anime') && data.tmdbId) {
            setLoadingEpisodes(true);
            fetch(`/api/tmdb/tv/${data.tmdbId}`)
              .then(res => res.json())
              .then(tvData => setTvDetails(tvData))
              .catch(err => console.error('Failed to fetch episodes', err))
              .finally(() => setLoadingEpisodes(false));
          }
        }
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

      {/* Episode Selection UI - Always visible for series/drama/anime */}
      {(video.type === 'tv' || video.type === 'series' || video.type === 'drama' || video.type === 'anime') && video.tmdbId && (
        <div className={clsx(
          "fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-xl border-t border-white/10",
          minimized ? "pb-24" : "pb-6"
        )}>
          <div className="max-w-7xl mx-auto px-6 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Clapperboard className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-bold text-white">Episodes</h2>
              {loadingEpisodes && <Loader2 className="w-4 h-4 animate-spin text-red-500" />}
            </div>

            {loadingEpisodes ? (
              <div className="flex items-center gap-2 text-gray-400 py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading episodes...</span>
              </div>
            ) : tvDetails ? (
              <div className="space-y-4">
                {/* Season Selection */}
                <div className="flex flex-wrap gap-2">
                  {tvDetails.seasons?.filter((s: any) => s.season_number > 0).map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => router.push(`/watch/${id}?s=${s.season_number}&e=1`)}
                      className={clsx(
                        "px-4 py-1.5 rounded-lg font-bold transition-all border text-sm",
                        season === s.season_number
                          ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      S{s.season_number}
                    </button>
                  ))}
                </div>

                {/* Episode Grid - Scrollable */}
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-2 min-w-max">
                    {Array.from({ length: tvDetails.seasons?.find((s: any) => s.season_number === season)?.episode_count || 0 }).map((_, i) => {
                      const epNum = i + 1;
                      return (
                        <button
                          key={epNum}
                          onClick={() => router.push(`/watch/${id}?s=${season}&e=${epNum}`)}
                          className={clsx(
                            "w-16 h-16 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all group flex-shrink-0",
                            episode === epNum
                              ? "bg-red-600 border-red-500 text-white shadow-xl scale-105 ring-2 ring-red-500/50"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30 hover:text-white"
                          )}
                        >
                          <span className="text-[9px] uppercase tracking-tighter opacity-50 font-bold">Ep</span>
                          <span className="text-lg font-black">{epNum}</span>
                          {episode === epNum && <Play className="w-3 h-3 fill-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm py-2">No episodes found</p>
            )}
          </div>
        </div>
      )}
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
