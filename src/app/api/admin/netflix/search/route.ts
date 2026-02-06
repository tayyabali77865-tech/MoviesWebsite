import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const MOVIEBOX_BASE_URL = 'https://moviebox-api.p.rapidapi.com';

if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY is not defined in environment variables');
}

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
        // Updated to use MovieBox API
        const url = `${MOVIEBOX_BASE_URL}/movie-or-tv/list?keyword=${encodeURIComponent(query)}&category=movie`;

        console.log('Fetching MovieBox:', url);

        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'moviebox-api.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY as string
            }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('MovieBox API Error Status:', res.status, errorData);
            if (res.status === 429) {
                return NextResponse.json({ error: 'MovieBox API Quota Exceeded. Please upgrade your RapidAPI plan.' }, { status: 429 });
            }
            throw new Error(errorData.message || `MovieBox API error: ${res.status}`);
        }

        const data = await res.json();

        // MovieBox structure: { data: { items: [...] } }
        const items = data.data?.items || [];

        // Map data to consistent format
        const results = items.map((item: any) => ({
            id: item.subjectId,
            title: item.title,
            overview: item.description || item.postTitle || 'No description available',
            poster_path: item.cover?.url || null,
            type: 'movie', // forcing movie since we queried category=movie
            release_year: item.releaseDate ? item.releaseDate.split('-')[0] : null
        }));

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('MovieBox Search Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch titles from MovieBox API' }, { status: 500 });
    }
}
