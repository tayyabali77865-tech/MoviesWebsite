import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'animeapi.p.rapidapi.com';

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
        console.log('Fetching anime from RapidAPI:', query);
        const url = `https://animeapi.p.rapidapi.com/all?search=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY || '',
                'X-RapidAPI-Host': RAPIDAPI_HOST,
            },
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`RapidAPI error (${res.status}): ${errText.slice(0, 100)}`);
        }

        const data = await res.json();

        // RapidAPI Anime API usually returns an array directly or inside a results/data property
        const rawResults = Array.isArray(data) ? data : (data.results || data.data || []);

        const results = rawResults.map((item: any) => ({
            id: (item.id || item.mal_id || Math.random().toString(36).substr(2, 9)).toString(),
            malId: (item.mal_id || item.id || '').toString(),
            name: item.title || item.name || 'Unknown Title',
            image: item.thumbnail || item.image || item.image_url || '/placeholder.png',
            description: item.body || item.description || item.synopsis || '',
            type: 'anime'
        }));

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Anime Search Error:', error);
        return NextResponse.json({ error: `Search failed: ${error.message}` }, { status: 500 });
    }
}
