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

        return NextResponse.json({
            id: id,
            seasons: seasons,
            source: 'netflix'
        });
    } catch (error) {
        console.error('Netflix Details Error:', error);
        return NextResponse.json({ error: 'Failed to fetch Netflix details' }, { status: 500 });
    }
}
