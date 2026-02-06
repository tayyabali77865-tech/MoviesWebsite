import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Deployment Pulse: MovieBox Metadata Fetching v1

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

                // Auto-fetch TMDB ID for anime or Netflix if not provided
                if (!tmdbId && v.title && (v.type === 'anime' || v.netflixId)) {
                    try {
                        const searchTMDB = async (q: string, type: 'tv' | 'movie') => {
                            const url = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
                            const res = await fetch(url);
                            return await res.json();
                        };

                        const lookupType = (v.type === 'movie' || !v.netflixId) ? 'movie' : 'tv';

                        // Try 1: Direct title
                        let data = await searchTMDB(v.title, lookupType === 'movie' ? 'movie' : 'tv');
                        if (data.results?.length > 0) {
                            tmdbId = data.results[0].id.toString();
                        } else if (lookupType === 'tv') {
                            // Try 2: As movie if TV failed
                            data = await searchTMDB(v.title, 'movie');
                            if (data.results?.length > 0) {
                                tmdbId = data.results[0].id.toString();
                            }
                        }

                        // Special case for anime suffix if still not found
                        if (!tmdbId && v.type === 'anime') {
                            data = await searchTMDB(`${v.title} Anime`, 'tv');
                            if (data.results?.length > 0) {
                                tmdbId = data.results[0].id.toString();
                            }
                        }
                    } catch (e) {
                        console.error('TMDB Extended Lookup Error:', e);
                    }
                }

                // Netflix Enrichment logic removed as per user request (Switching to MovieBox)


                const result = await prisma.video.create({
                    data: {
                        title: v.title,
                        description: v.description || null,
                        thumbnailUrl: v.thumbnailUrl,
                        tmdbId: tmdbId,
                        malId: v.malId || null,
                        anilistId: v.anilistId || null,
                        netflixId: v.netflixId || null,
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
