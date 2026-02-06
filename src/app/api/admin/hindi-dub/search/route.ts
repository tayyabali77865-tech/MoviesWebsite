import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const TMDB_API_KEY = process.env.TMDB_API_KEY || 'YOUR_TMDB_KEY';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'movie'; // movie, series

    try {
        const mediaType = type === 'series' ? 'tv' : 'movie';

        // Search Hollywood movies (English original) that are popular
        // These are likely to have Hindi dubs available on streaming platforms
        let url: string;

        if (query) {
            // Search for specific title
            url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;
        } else {
            // Discover popular Hollywood content (most likely to have Hindi dubs)
            url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_original_language=en&sort_by=popularity.desc&vote_count.gte=100`;
        }

        console.log('Fetching TMDB for Hindi dub candidates:', url);

        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
            throw new Error(`TMDB API error: ${res.status}`);
        }

        const data = await res.json();

        // Map results - these are Hollywood movies/series that typically have Hindi dubs
        const results = (data.results || []).map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            overview: item.overview || 'No description available',
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
            release_year: item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || null,
            type: type,
            hindiDubbed: true, // Mark as potentially Hindi dubbed (VidSrc will handle)
            tmdbId: item.id,
            popularity: item.popularity,
            vote_average: item.vote_average,
        }));

        // Sort by popularity to show most likely dubbed content first
        results.sort((a: any, b: any) => b.popularity - a.popularity);

        return NextResponse.json({
            results: results.slice(0, 20), // Limit to top 20 results
            source: 'TMDB Hollywood (Hindi Dub Compatible)',
        });
    } catch (error: any) {
        console.error('TMDB Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch content',
            results: []
        }, { status: 500 });
    }
}
