import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = params;
  const body = await req.json();
  const slide = await prisma.carouselSlide.update({
    where: { id },
    data: { imageUrl: body.imageUrl, title: body.title },
  });
  return NextResponse.json(slide);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = params;
  await prisma.carouselSlide.delete({ where: { id } });
  const slides = await prisma.carouselSlide.findMany({ orderBy: { order: 'asc' } });
  await Promise.all(
    slides.map((s, i) => prisma.carouselSlide.update({ where: { id: s.id }, data: { order: i } }))
  );
  return NextResponse.json({ success: true });
}
