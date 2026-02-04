'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VideoCard } from './VideoCard';
import { Loader2 } from 'lucide-react';

const PAGE_SIZE = 50;

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  section: string;
  type: string;
  category?: string | null; // For legacy support/display
}

export function VideoSection({
  title,
  section,
  type,
  initialVideos,
}: {
  title: string;
  section: string;
  type: string;
  initialVideos: Video[];
}) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialVideos.length >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  // Reset state if inputs change (e.g. switching tabs)
  useEffect(() => {
    setVideos(initialVideos);
    setPage(0);
    setHasMore(initialVideos.length >= PAGE_SIZE);
  }, [initialVideos, section, type]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/videos?section=${section}&type=${type}&page=${page + 1}`);
      if (!res.ok) {
        throw new Error('Failed to load videos');
      }
      const data = await res.json();
      setVideos((prev) => [...prev, ...(data.videos || [])]);
      setHasMore(data.hasMore ?? false);
      setPage((p) => p + 1);
    } catch (error) {
      console.error('Load more error:', error);
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-12">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xl sm:text-2xl font-bold mb-4 px-4 sm:px-6"
      >
        {title}
      </motion.h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4 sm:px-6">
        {videos.map((v, i) => (
          <VideoCard
            key={v.id}
            id={v.id}
            title={v.title}
            thumbnailUrl={v.thumbnailUrl}
            category={v.section} // Linking section as category for now
            index={i}
          />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </section>
  );
}
