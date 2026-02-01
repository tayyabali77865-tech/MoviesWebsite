import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_SLIDES = 10;

export async function GET() {
  const slides = await prisma.carouselSlide.findMany({
    orderBy: { order: 'asc' },
    take: MAX_SLIDES,
  });
  return NextResponse.json(slides);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const count = await prisma.carouselSlide.count();
  if (count >= MAX_SLIDES) {
    return NextResponse.json({ error: 'Maximum 10 carousel images' }, { status: 400 });
  }
  const body = await req.json();
  const { imageUrl, title } = body;
  if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
  const slide = await prisma.carouselSlide.create({
    data: { imageUrl, title: title || null, order: count },
  });
  return NextResponse.json(slide);
}
