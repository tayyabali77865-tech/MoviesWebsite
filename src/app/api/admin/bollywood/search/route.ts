import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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

    if (!TMDB_API_KEY) {
        return NextResponse.json({ error: 'TMDB API Key not configured' }, { status: 500 });
    }

    try {
        // Search TMDB with Hindi language filter and Indian region
        const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=hi-IN&region=IN&with_original_language=hi&page=1`;
        const res = await fetch(url);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.status_message || 'TMDB API error');
        }

        const data = await res.json();

        // Return original data but highlight Bollywood specific filter was used
        return NextResponse.json({
            ...data,
            source: 'tmdb-bollywood'
        });
    } catch (error) {
        console.error('Bollywood Search Error:', error);
        return NextResponse.json({ error: 'Failed to fetch Bollywood movies from TMDB' }, { status: 500 });
    }
}
