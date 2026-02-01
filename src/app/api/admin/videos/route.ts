import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const {
    title,
    description,
    thumbnailUrl,
    tmdbId,
    malId,
    anilistId,
    type,
    section,
    url360,
    url480,
    url720,
    url1080,
    hlsUrl,
    defaultSpeed,
    autoplay,
    subtitles,
    audioTracks,
  } = body;
  if (!title || !thumbnailUrl) {
    return NextResponse.json({ error: 'title and thumbnailUrl required' }, { status: 400 });
  }
  const video = await prisma.video.create({
    data: {
      title,
      description: description || null,
      thumbnailUrl,
      tmdbId,
      malId,
      anilistId,
      type: type || 'movie',
      section: section || 'new',
      category: 'deprecated', // Filling required field with placeholder
      url360: url360 || null,
      url480: url480 || null,
      url720: url720 || null,
      url1080: url1080 || null,
      hlsUrl: hlsUrl || null,
      defaultSpeed: defaultSpeed ?? 1,
      autoplay: !!autoplay,
      subtitles: subtitles?.length
        ? { create: subtitles.map((s: { language: string; url: string }) => ({ language: s.language, url: s.url })) }
        : undefined,
      audioTracks: audioTracks?.length
        ? { create: audioTracks.map((a: { language: string; url: string }) => ({ language: a.language, url: a.url })) }
        : undefined,
    },
    include: { subtitles: true, audioTracks: true },
  });
  return NextResponse.json(video);
}
