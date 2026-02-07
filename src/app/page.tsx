export const dynamic = 'force-dynamic'
import { Carousel } from '@/components/Carousel';
import { VideoSection } from '@/components/VideoSection';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { prisma } from '@/lib/prisma';
import { Tv, Clapperboard as Series } from 'lucide-react';

const PAGE_SIZE = 50;
const SIDEBAR_CATS = ['movie', 'series', 'drama', 'anime', 'manga', 'trailer'] as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const currentType = params?.type || 'movie';

  // Helper to fetch and shuffle
  const fetchSection = async (section: string) => {
    // For Manga, Trailer, and Anime, we ignore the section tag to show "all" content in every section randomly.
    // For others (Movies), we assume strict sectioning for now.
    const isGlobalType = currentType === 'manga' || currentType === 'trailer' || currentType === 'anime';
    const where: any = {
      type: currentType,
      parentId: null // Only show parent videos, not child episodes
    };

    if (!isGlobalType) {
      where.section = section;
    }

    const videos = await (prisma.video as any).findMany({
      where,
      include: { subtitles: true },
      orderBy: { createdAt: 'desc' }, // Fetch latest first
      take: PAGE_SIZE,
    });
    // Randomize locally
    return videos.sort(() => Math.random() - 0.5);
  };

  const [carousel, newVideos, trendingVideos, upcomingVideos, randomVideos, randomAnime, randomDramas, randomWebseries] =
    await Promise.all([
      prisma.carouselSlide.findMany({ orderBy: { order: 'asc' }, take: 10 }),
      fetchSection('new'),
      fetchSection('trending'),
      fetchSection('upcoming'),
      fetchSection('random'),
      // Fetch some random anime for the global section
      (prisma.video as any).findMany({
        where: { type: 'anime', parentId: null },
        include: { subtitles: true },
        take: 10,
        }).then(v => v.sort(() => Math.random() - 0.5)),
      // Fetch random dramas
      (prisma.video as any).findMany({
        where: { type: 'drama', parentId: null },
        include: { subtitles: true },
        take: 10,
        }).then(v => v.sort(() => Math.random() - 0.5)),
      // Fetch random webseries
      (prisma.video as any).findMany({
        where: { type: 'series', parentId: null },
        include: { subtitles: true },
        take: 10,
        }).then(v => v.sort(() => Math.random() - 0.5)),
    ]);

  const typeLabel = currentType === 'anime' ? 'Anime' : currentType === 'manga' ? 'Manga' : currentType === 'trailer' ? 'Trailers' : 'Movies';

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="min-h-screen pt-16">
        <Carousel slides={carousel} />

        <div className="max-w-[1920px] mx-auto py-8">
          <>
            {/* "The text 'New Movies' must be displayed as 'NEW' only" */}
            <VideoSection title="NEW" section="new" type={currentType} initialVideos={newVideos} />
            <VideoSection title="Trending" section="trending" type={currentType} initialVideos={trendingVideos} />

            {/* Show Random Anime section for all categories except when explicitly in Anime category (to avoid duplication if wanted, but user said "in all categories") */}
            {randomAnime.length > 0 && (
              <VideoSection title="Random Anime" section="random" type="anime" initialVideos={randomAnime} />
            )}

            {randomDramas.length > 0 && (
              <VideoSection title="Featured Dramas" section="random" type="drama" initialVideos={randomDramas} />
            )}

            {randomWebseries.length > 0 && (
              <VideoSection title="Web Series" section="random" type="series" initialVideos={randomWebseries} />
            )}

            {currentType !== 'movie' && currentType !== 'trailer' && (
              <VideoSection title="Upcoming" section="upcoming" type={currentType} initialVideos={upcomingVideos} />
            )}
            <VideoSection title="Random" section="random" type={currentType} initialVideos={randomVideos} />

          </>
        </div>
      </main>
    </>
  );
}
