import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let video = await prisma.video.findUnique({
    where: { id },
    include: { subtitles: true, audioTracks: true },
  });

  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // JIT TMDB Discovery: If no tmdbId but has netflixId, try to find it
  if (!video.tmdbId && video.netflixId) {
    try {
      const TMDB_API_KEY = process.env.TMDB_API_KEY;
      if (TMDB_API_KEY) {
        const type = video.type === 'movie' ? 'movie' : 'tv';
        const url = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(video.title)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.results?.length > 0) {
          const newTmdbId = data.results[0].id.toString();
          // Update database on the fly
          video = await prisma.video.update({
            where: { id },
            data: { tmdbId: newTmdbId },
            include: { subtitles: true, audioTracks: true },
          });
          console.log(`JIT TMDB Discovery success for "${video.title}": ${newTmdbId}`);
        }
      }
    } catch (err) {
      console.error('JIT TMDB Discovery Error:', err);
    }
  }

  return NextResponse.json(video);
}
