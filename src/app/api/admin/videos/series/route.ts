import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { seriesId, episodeIds, seasonNumber } = await req.json();

        if (!seriesId || !Array.isArray(episodeIds)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Update all selected videos to have the same parentId and season number
        // We'll increment the episode number based on the index
        const updates = episodeIds.map((id, index) =>
            prisma.video.update({
                where: { id },
                data: {
                    parentId: seriesId,
                    seasonNumber: seasonNumber || 1,
                    episodeNumber: index + 1
                } as any
            })
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Series Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get episodes for a series
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get('seriesId');

    if (!seriesId) {
        return NextResponse.json({ error: 'Series ID required' }, { status: 400 });
    }

    try {
        const episodes = await (prisma.video as any).findMany({
            where: { parentId: seriesId },
            orderBy: [
                { seasonNumber: 'asc' },
                { episodeNumber: 'asc' }
            ]
        });

        return NextResponse.json({ episodes });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Remove episode from series
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const episodeId = searchParams.get('episodeId');

    if (!episodeId) {
        return NextResponse.json({ error: 'Episode ID required' }, { status: 400 });
    }

    try {
        await (prisma.video as any).update({
            where: { id: episodeId },
            data: {
                parentId: null,
                episodeNumber: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
