import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id },
    include: { subtitles: true, audioTracks: true },
  });
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(video);
}
