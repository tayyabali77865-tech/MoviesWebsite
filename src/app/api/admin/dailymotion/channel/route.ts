import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY is not defined in environment variables');
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channel');

    if (!channelId) {
        return NextResponse.json({ error: 'Channel name required (e.g. kicker-de)' }, { status: 400 });
    }

    try {
        const url = `${BASE_URL}/api/v1/channels/videos?channel_name=${encodeURIComponent(channelId)}`;
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'dailymotion-scraper.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY as string
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Dailymotion API Error:', res.status, errorText);
            throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        // Map to consistent format
        // API ensures data.data.channel.videos exists based on probe
        const videos = (data.data?.channel?.videos || []).map((v: any) => ({
            id: v.xid, // Dailymotion ID
            title: v.title,
            thumbnail: v.thumbnail_url || null, // Assuming thumbnail field exists or is similar, probe showed minimal fields so we might miss this
            created_time: v.created_time,
            duration: v.duration
        }));

        return NextResponse.json({
            channel: data.data?.channel?.name || channelId,
            videos
        });

    } catch (error) {
        console.error('Dailymotion Channel Error:', error);
        return NextResponse.json({ error: 'Failed to fetch videos from Dailymotion' }, { status: 500 });
    }
}
