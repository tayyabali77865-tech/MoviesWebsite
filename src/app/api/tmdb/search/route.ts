import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    // Ensure only admins can use this proxy
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'multi'; // movie, tv, or multi

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    if (!TMDB_API_KEY) {
        console.error('TMDB_API_KEY is missing');
        return NextResponse.json({ error: 'TMDB API Key not configured' }, { status: 500 });
    }

    console.log(`Searching TMDB (${type}) for:`, query);

    try {
        const url = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
        const res = await fetch(url);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.status_message || 'TMDB API error');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('TMDB Search Error:', error);
        return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
    }
}
