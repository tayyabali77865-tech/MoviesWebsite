import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const HINDI_DUB_API_BASE = 'https://hindi-dub-api.vercel.app';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'movie'; // movie, series

    try {
        // Try the Hindi Dub API
        const url = `${HINDI_DUB_API_BASE}/api/${type}s${query ? `?search=${encodeURIComponent(query)}` : ''}`;

        console.log('Fetching Hindi Dub API:', url);

        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            // Fallback to TMDB with Hindi filter
            console.log('Hindi Dub API failed, falling back to TMDB with Hindi filter');
            return await fetchTMDBHindi(query, type);
        }

        const data = await res.json();

        // Map the response to our format
        const results = Array.isArray(data) ? data : (data.results || data.data || []);

        const mapped = results.map((item: any) => ({
            id: item.id || item.imdb_id || item.tmdb_id,
            title: item.title || item.name,
            overview: item.description || item.overview || 'No description available',
            poster_path: item.poster || item.image || item.thumbnail || null,
            release_year: item.year || item.release_date?.split('-')[0] || null,
            type: type,
            hindiDubbed: true, // Mark as Hindi dubbed
            streamUrl: item.url || item.stream_url || null,
        }));

        return NextResponse.json({ results: mapped });
    } catch (error: any) {
        console.error('Hindi Dub API Error:', error);

        // Fallback to TMDB
        return await fetchTMDBHindi(query, type);
    }
}

// Fallback function to fetch from TMDB with Hindi filter
async function fetchTMDBHindi(query: string, type: string) {
    try {
        const TMDB_API_KEY = process.env.TMDB_API_KEY || '15b79664b4msh8369588949b24b9p11bdb7jsn05a9fd41d672';
        const mediaType = type === 'series' ? 'tv' : 'movie';

        let url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_original_language=hi&sort_by=popularity.desc`;

        if (query) {
            url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=hi`;
        }

        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();

        const results = (data.results || []).map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            overview: item.overview || 'No description available',
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
            release_year: item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || null,
            type: type,
            hindiDubbed: false, // TMDB fallback
            tmdbId: item.id,
        }));

        return NextResponse.json({
            results,
            fallback: true,
            message: 'Using TMDB fallback with Hindi filter'
        });
    } catch (error: any) {
        console.error('TMDB Fallback Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch Hindi dubbed content',
            results: []
        }, { status: 500 });
    }
}
