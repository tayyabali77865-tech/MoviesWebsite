import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const HOST = 'tbmdb-bollywood-movies-v1.p.rapidapi.com';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (!RAPIDAPI_KEY) {
        return NextResponse.json({ error: 'RapidAPI Key not configured' }, { status: 500 });
    }

    try {
        const url = `https://${HOST}/v1/movie/${id}`;
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': HOST,
                'x-rapidapi-key': RAPIDAPI_KEY,
            },
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Bollywood API error');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Bollywood Details Error:', error);
        return NextResponse.json({ error: 'Failed to fetch details from Bollywood API' }, { status: 500 });
    }
}
