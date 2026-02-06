import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Fallback to new key, and also override if the environment is providing the old/expired key
let RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '15b79664b4msh8369588949b24b9p11bdb7jsn05a9fd41d672';
if (RAPIDAPI_KEY.startsWith('a30165b')) {
    RAPIDAPI_KEY = '15b79664b4msh8369588949b24b9p11bdb7jsn05a9fd41d672';
}

const MOVIEBOX_BASE_URL = 'https://moviebox-api.p.rapidapi.com';

if (process.env.RAPIDAPI_KEY?.startsWith('a30165b')) {
    console.warn('RAPIDAPI_KEY environment variable is still using the OLD key. Using fallback MovieBox key instead.');
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'movie'; // movie, tv, anime, manga, documentry
    const genre = searchParams.get('genre');

    try {
        // Updated: If no query, we just list the latest items for that category (Discovery Mode)
        let url = `${MOVIEBOX_BASE_URL}/movie-or-tv/list?category=${encodeURIComponent(type)}`;
        if (query.trim()) {
            url += `&keyword=${encodeURIComponent(query)}`;
        }
        if (genre) {
            url += `&genre=${encodeURIComponent(genre)}`;
        }

        console.log('Fetching MovieBox:', url);

        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'moviebox-api.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY as string
            },
            cache: 'no-store' // IMPORTANT: Prevent Next.js from caching 429 errors
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('MovieBox API Error:', res.status, errorData);

            if (res.status === 429) {
                return NextResponse.json({
                    error: `MovieBox API Quota Exceeded (Key: ${RAPIDAPI_KEY?.substring(0, 5)}...). Please check your RapidAPI dashboard or upgrade plan.`,
                    debug: { status: 429, keyPrefix: RAPIDAPI_KEY?.substring(0, 5) }
                }, { status: 429 });
            }
            throw new Error(errorData.message || `MovieBox API error: ${res.status}`);
        }

        const data = await res.json();

        // MovieBox structure: { data: { items: [...] } }
        const items = data.data?.items || [];

        // Map data to consistent format
        let results = items.map((item: any) => ({
            id: item.subjectId,
            title: item.title,
            overview: item.description || item.postTitle || 'No description available',
            poster_path: item.cover?.url || null,
            type: type === 'tv' ? 'series' : type, // Normalize 'tv' to 'series'
            release_year: item.releaseDate ? item.releaseDate.split('-')[0] : null
        }));

        // --- IMPROVED ACCURACY ALGORITHM ---
        if (query.trim()) {
            const q = query.toLowerCase().trim();
            results = results.map((res: any) => {
                let score = 0;
                const title = (res.title || "").toLowerCase();

                if (title === q) score += 100;
                else if (title && title.startsWith(q)) score += 50;
                else if (title && title.includes(q)) score += 20;

                // Also check description for hidden matches
                const overview = res.overview.toLowerCase();
                if (overview.includes(q)) score += 5;

                return { ...res, score };
            }).filter((res: any) => res.score > 0) // Remove totally irrelevant items
                .sort((a: any, b: any) => b.score - a.score); // Sort by highest relevance
        }
        // ------------------------------------

        return NextResponse.json({ results: results.map(({ score, ...rest }: any) => rest) });
    } catch (error: any) {
        console.error('MovieBox Search Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch titles from MovieBox API' }, { status: 500 });
    }
}
