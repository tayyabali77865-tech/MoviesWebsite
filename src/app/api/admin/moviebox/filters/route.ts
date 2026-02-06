import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const MOVIEBOX_BASE_URL = 'https://moviebox-api.p.rapidapi.com';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'movie';

    try {
        const url = `${MOVIEBOX_BASE_URL}/movie-or-tv/filter-items?category=${encodeURIComponent(category)}`;

        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'moviebox-api.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY as string
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`MovieBox Filters API error: ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('MovieBox Filters Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch filters' }, { status: 500 });
    }
}
