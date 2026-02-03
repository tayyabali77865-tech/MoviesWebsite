import { NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const NETFLIX_BASE_URL = 'https://netflix54.p.rapidapi.com';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Id required' }, { status: 400 });
    }

    try {
        // Step 1: Get seasons
        const seasonsUrl = `${NETFLIX_BASE_URL}/title/seasons/?ids=${id}&lang=en`;
        const seasonsRes = await fetch(seasonsUrl, {
            headers: {
                'x-rapidapi-host': 'netflix54.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        if (!seasonsRes.ok) throw new Error('Failed to fetch seasons');
        const seasonsData = await seasonsRes.json();
        const titleData = seasonsData[0];

        if (!titleData || !titleData.seasons) {
            return NextResponse.json({ seasons: [] });
        }

        // Map seasons to TMDB-like structure
        const seasons = titleData.seasons.map((s: any, index: number) => ({
            id: s.seasonId,
            season_number: index + 1,
            name: s.name,
            episode_count: s.length,
            season_id: s.seasonId
        }));

        // Fetch additional details for audio/subtitles if available
        // Note: The netflix54 API often includes audio/subtitle info in title details
        const detailsUrl = `${NETFLIX_BASE_URL}/title/details/?ids=${id}&lang=en`;
        const detailsRes = await fetch(detailsUrl, {
            headers: {
                'x-rapidapi-host': 'netflix54.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        let audioTracks = [];
        let subtitles = [];

        if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            const detail = detailsData[0];
            if (detail?.details) {
                // Some versions of netflix54 return audio/subtitle list in details
                audioTracks = detail.details.audio?.map((a: any) => ({
                    language: a.language || a.name,
                    url: '#' // Indicating it's internal to the player/mirror
                })) || [];
                subtitles = detail.details.subtitles?.map((s: any) => ({
                    language: s.language || s.name,
                    url: '#'
                })) || [];
            }
        }

        return NextResponse.json({
            id: id,
            seasons: seasons,
            audioTracks: audioTracks,
            subtitles: subtitles,
            source: 'netflix'
        });
    } catch (error) {
        console.error('Netflix Details Error:', error);
        return NextResponse.json({ error: 'Failed to fetch Netflix details' }, { status: 500 });
    }
}
