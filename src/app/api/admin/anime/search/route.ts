import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    try {
        console.log('Fetching anime from Jikan (MAL) API:', query);
        const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`;
        const res = await fetch(url);

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Jikan API error (${res.status}): ${errText.slice(0, 100)}`);
        }

        const data = await res.json();
        const rawResults = data.data || [];

        const results = rawResults.map((item: any) => ({
            id: item.mal_id.toString(),
            malId: item.mal_id.toString(),
            name: item.title_english || item.title || 'Unknown Title',
            image: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || '/placeholder.png',
            description: item.synopsis || '',
            type: 'anime',
            score: item.score,
            year: item.year || item.aired?.from?.split('-')[0]
        }));

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Anime Search Error:', error);
        return NextResponse.json({ error: `Search failed: ${error.message}` }, { status: 500 });
    }
}
