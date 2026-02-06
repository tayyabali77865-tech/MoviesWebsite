import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().slice(0, 100);
  if (!q) return NextResponse.json([]);

  const results = await prisma.video.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      category: true,
      description: true,
      type: true,
      createdAt: true,
      tmdbId: true,
      netflixId: true,
    },
    take: 30,
  });

  // Relevance Sorting: 
  // 1. Exact title match (case insensitive)
  // 2. Title starts with query
  // 3. Title contains query
  // 4. Description contains query
  const sorted = results.sort((a, b) => {
    const qLower = q.toLowerCase();
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    // Exact Match
    if (aTitle === qLower && bTitle !== qLower) return -1;
    if (bTitle === qLower && aTitle !== qLower) return 1;

    // Starts with
    if (aTitle.startsWith(qLower) && !bTitle.startsWith(qLower)) return -1;
    if (bTitle.startsWith(qLower) && !aTitle.startsWith(qLower)) return 1;

    // Default to created date if relevance is similar
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json(sorted);
}
