import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const id = params.id;

    try {
        // Fetch the video to see if it's a parent or a child
        const video = await prisma.video.findUnique({
            where: { id },
            select: { id: true, parentId: true } as any
        }) as any;

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        const actualParentId = video.parentId || video.id;

        const episodes = await (prisma.video as any).findMany({
            where: { parentId: actualParentId },
            orderBy: [
                { seasonNumber: 'asc' },
                { episodeNumber: 'asc' }
            ],
            select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                seasonNumber: true,
                episodeNumber: true,
            }
        });

        return NextResponse.json({
            episodes,
            parentId: actualParentId
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
