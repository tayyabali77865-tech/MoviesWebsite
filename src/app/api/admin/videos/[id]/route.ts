import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
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
    defaultSpeed,
    autoplay,
    subtitles,
  } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
  if (tmdbId !== undefined) data.tmdbId = tmdbId;
  if (malId !== undefined) data.malId = malId;
  if (anilistId !== undefined) data.anilistId = anilistId;
  if (type !== undefined) data.type = type;
  if (section !== undefined) data.section = section;
  if (url360 !== undefined) data.url360 = url360;
  if (url480 !== undefined) data.url480 = url480;
  if (url720 !== undefined) data.url720 = url720;
  if (url1080 !== undefined) data.url1080 = url1080;
  if (defaultSpeed !== undefined) data.defaultSpeed = defaultSpeed;
  if (autoplay !== undefined) data.autoplay = autoplay;

  if (subtitles && Array.isArray(subtitles)) {
    await prisma.subtitle.deleteMany({ where: { videoId: id } });
    if (subtitles.length) {
      data.subtitles = {
        create: subtitles.map((s: { language: string; url: string }) => ({ language: s.language, url: s.url })),
      };
    }
  }

  const video = await prisma.video.update({
    where: { id },
    data,
    include: { subtitles: true },
  });
  return NextResponse.json(video);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
