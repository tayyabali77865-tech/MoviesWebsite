import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'MAL ID required' }, { status: 400 });
    }

    try {
        // Jikan API (MAL) - Fetch anime details to get total episodes
        const url = `https://api.jikan.moe/v4/anime/${id}`;
        const res = await fetch(url);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Jikan API error');
        }

        const { data } = await res.json();

        // Map to a structure consistent with what the frontend expects
        // The watch page expects tvDetails.seasons or similar
        // For anime from MAL, we usually only have one "season" list of episodes in this API

        const episodesCount = data.episodes || 12; // Fallback to 12 if unknown

        return NextResponse.json({
            id: id,
            title: data.title,
            seasons: [
                {
                    id: `mal-${id}-s1`,
                    season_number: 1,
                    name: 'Season 1',
                    episode_count: episodesCount
                }
            ],
            source: 'mal'
        });
    } catch (error) {
        console.error('Anime Episodes Error:', error);
        return NextResponse.json({ error: 'Failed to fetch from Jikan' }, { status: 500 });
    }
}
