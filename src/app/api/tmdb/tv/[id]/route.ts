import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!TMDB_API_KEY) {
        return NextResponse.json({ error: 'TMDB API Key not configured' }, { status: 500 });
    }

    try {
        const url = `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
        const res = await fetch(url);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.status_message || 'TMDB API error');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('TMDB TV Error:', error);
        return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
    }
}
