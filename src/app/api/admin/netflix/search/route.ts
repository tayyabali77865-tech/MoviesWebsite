import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const NETFLIX_BASE_URL = 'https://netflix54.p.rapidapi.com';

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
        const url = `${NETFLIX_BASE_URL}/search/?query=${encodeURIComponent(query)}&offset=0&limit_titles=20&limit_suggestions=5&lang=en`;
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'netflix54.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Netflix API error');
        }

        const data = await res.json();

        // Map data to a consistent format
        const results = (data.titles || []).map((item: any) => ({
            id: item.jawSummary.id,
            title: item.jawSummary.title,
            overview: item.jawSummary.synopsis,
            poster_path: item.jawSummary.backgroundImage?.url || null,
            type: item.jawSummary.type, // 'movie' or 'series'
            release_year: item.jawSummary.releaseYear
        }));

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Netflix Search Error:', error);
        return NextResponse.json({ error: 'Failed to fetch titles from Netflix API' }, { status: 500 });
    }
}
