import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'moviesdatabase.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    // Keep the same admin check as TMDB route
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    if (!RAPIDAPI_KEY) {
        return NextResponse.json({ error: 'RAPIDAPI_KEY not configured' }, { status: 500 });
    }

    try {
        // Using titles/search/title/{title} endpoint
        // Adding info=base_info to get plot and other details if supported, otherwise just getting the list
        const url = `${BASE_URL}/titles/search/title/${encodeURIComponent(query)}?exact=false&info=base_info&limit=10`;

        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            let errorMessage = `RapidAPI error: ${res.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                // Keep default message if not JSON
            }
            console.error('RapidAPI Error:', errorText);
            return NextResponse.json({ error: errorMessage }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('RapidAPI Search Error:', error);
        return NextResponse.json({ error: 'Internal Server Error fetching from RapidAPI' }, { status: 500 });
    }
}
