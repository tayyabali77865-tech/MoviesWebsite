import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CATEGORIES = ['new', 'trending', 'upcoming', 'random'] as const;
const PAGE_SIZE = 50;

import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'movie';
  const section = searchParams.get('section');
  const page = parseInt(searchParams.get('page') || '0');
  const search = searchParams.get('search');

  const where: Prisma.VideoWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  } else {
    // If not searching, filter by type and section
    where.type = type;
    if (section) {
      where.section = section;
    }
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: { subtitles: true, audioTracks: true },
      orderBy: search ? { title: 'asc' } : { createdAt: 'desc' },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.video.count({ where }),
  ]);

  return NextResponse.json({
    videos,
    hasMore: total > (page + 1) * PAGE_SIZE,
  });
}
