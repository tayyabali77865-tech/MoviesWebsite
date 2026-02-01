import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().slice(0, 100);
  if (!q) return NextResponse.json([]);
  const videos = await prisma.video.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
      ],
    },
    select: { id: true, title: true, thumbnailUrl: true, category: true },
    take: 15,
  });
  return NextResponse.json(videos);
}
