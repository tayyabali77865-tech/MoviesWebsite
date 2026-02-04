import { NextResponse } from 'next/server';
import { load } from 'cheerio';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const playlistUrl = searchParams.get('url');

    if (!playlistUrl) {
        return NextResponse.json({ error: 'Playlist URL is required' }, { status: 400 });
    }

    try {
        // 1. Extract Playlist ID from URL
        // Pattern: .../playlist/x12345 or .../playlist/x12345_slug
        const playlistIdMatch = playlistUrl.match(/\/playlist\/([a-zA-Z0-9]+)/);
        const playlistId = playlistIdMatch ? playlistIdMatch[1] : null;

        if (!playlistId) {
            return NextResponse.json({ error: 'Invalid Playlist URL. Could not find ID.' }, { status: 400 });
        }

        // 2. Fetch Videos from Dailymotion Public API
        // Using fields: id, title, thumbnail_url, duration, owner.screenname
        const apiUrl = `https://api.dailymotion.com/playlist/${playlistId}/videos?fields=id,title,thumbnail_url,duration,owner.screenname&limit=50`;

        const res = await fetch(apiUrl);

        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json({
                error: errorData.error?.message || 'Failed to fetch playlist data from Dailymotion API'
            }, { status: res.status });
        }

        const data = await res.json();

        if (!data.list || data.list.length === 0) {
            return NextResponse.json({ error: 'No videos found in this playlist' }, { status: 404 });
        }

        // 3. Map to internal format
        const videos = data.list.map((v: any) => ({
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail_url,
            author: v.owner?.screenname || 'Unknown',
            duration: v.duration || 0,
        }));

        return NextResponse.json({
            videos: videos,
            total: videos.length
        });

    } catch (error) {
        console.error('Playlist Import Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
