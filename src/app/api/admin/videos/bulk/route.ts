import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Deployment Pulse: Netflix Metadata Fetching v3

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

                // Auto-fetch Netflix Details (Audio Tracks)
                if (v.netflixId) {
                    try {
                        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
                        const detailsUrl = `https://netflix54.p.rapidapi.com/title/details/?ids=${v.netflixId}&lang=en`;
                        const detailsRes = await fetch(detailsUrl, {
                            headers: {
                                'x-rapidapi-host': 'netflix54.p.rapidapi.com',
                                'x-rapidapi-key': RAPIDAPI_KEY as string
                            }
                        });
                        if (detailsRes.ok) {
                            const detailsData = await detailsRes.json();
                            const detail = detailsData[0];
                            if (detail?.details) {
                                // Netflix API can return audio in multiple formats
                                const rawAudio = detail.details.audio || detail.details.audioTracks || [];
                                const netflixAudio = rawAudio.map((a: any) => ({
                                    language: a.language || a.name || a.text || 'Unknown',
                                    url: '#' // Placeholder indicating mirror-side internal audio
                                }));

                                // Merge with existing tracks, avoiding duplicates by language
                                const existingLangs = new Set((v.audioTracks || []).map((t: any) => t.language.toLowerCase()));
                                const newTracks = netflixAudio.filter((t: any) => t.language && !existingLangs.has(t.language.toLowerCase()));
                                v.audioTracks = [...(v.audioTracks || []), ...newTracks];

                                console.log(`Enriched "${v.title}" with ${newTracks.length} Netflix audio tracks`);
                            }
                        }
                    } catch (e) {
                        console.error('Netflix Extended Detail Error:', e);
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
