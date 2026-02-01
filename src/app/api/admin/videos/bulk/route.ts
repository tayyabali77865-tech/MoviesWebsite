import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videos } = await req.json();

    if (!Array.isArray(videos) || videos.length === 0) {
        return NextResponse.json({ error: 'Videos array required' }, { status: 400 });
    }

    try {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;

        const results = [];
        for (const v of videos) {
            try {
                let tmdbId = v.tmdbId || null;

                // Auto-fetch TMDB ID for anime if not provided
                if (!tmdbId && v.type === 'anime' && v.title) {
                    try {
                        const searchTMDB = async (q: string, type: 'tv' | 'movie') => {
                            const url = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
                            const res = await fetch(url);
                            return await res.json();
                        };

                        // Try 1: Direct title as TV
                        let data = await searchTMDB(v.title, 'tv');
                        if (data.results?.length > 0) {
                            tmdbId = data.results[0].id.toString();
                        } else {
                            // Try 2: Direct title as Movie
                            data = await searchTMDB(v.title, 'movie');
                            if (data.results?.length > 0) {
                                tmdbId = data.results[0].id.toString();
                            } else {
                                // Try 3: Title + " Anime" as TV
                                data = await searchTMDB(`${v.title} Anime`, 'tv');
                                if (data.results?.length > 0) {
                                    tmdbId = data.results[0].id.toString();
                                }
                            }
                        }
                    } catch (e) {
                        console.error('TMDB Extended Lookup Error:', e);
                    }
                }

                const result = await prisma.video.create({
                    data: {
                        title: v.title,
                        description: v.description || null,
                        thumbnailUrl: v.thumbnailUrl,
                        tmdbId: tmdbId,
                        malId: v.malId || null,
                        anilistId: v.anilistId || null,
                        type: v.type || 'movie',
                        section: v.section || 'new',
                        category: 'deprecated',
                        url720: v.url720 || null,
                        hlsUrl: v.hlsUrl || null,
                        subtitles: v.subtitles?.length
                            ? { create: v.subtitles }
                            : undefined,
                        audioTracks: v.audioTracks?.length
                            ? { create: v.audioTracks }
                            : undefined,
                    },
                });
                results.push(result);
            } catch (err: any) {
                console.error(`Error importing video "${v.title}":`, err.message);
                // Continue with others or throw? Let's throw for now so we see the error.
                throw err;
            }
        }

        return NextResponse.json({ success: true, count: results.length });
    } catch (error: any) {
        console.error('Bulk Import Critical Error:', error);
        return NextResponse.json({ error: `Failed to bulk import videos: ${error.message}` }, { status: 500 });
    }
}
