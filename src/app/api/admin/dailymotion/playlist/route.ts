import { NextResponse } from 'next/server';
import { load } from 'cheerio';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const playlistUrl = searchParams.get('url');

    if (!playlistUrl) {
        return NextResponse.json({ error: 'Playlist URL is required' }, { status: 400 });
    }

    try {
        // 1. Fetch Playlist Page HTML
        const res = await fetch(playlistUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to access playlist page' }, { status: 404 });
        }

        const html = await res.text();

        // 2. Regex for Video IDs (Pattern: /video/x12345)
        const videoIdPattern = /\/video\/([a-zA-Z0-9]+)/g;
        const ids = new Set<string>();

        let match;
        while ((match = videoIdPattern.exec(html)) !== null) {
            // Filter out short garbage matches if any
            if (match[1].length > 3) {
                ids.add(match[1]);
            }
        }

        if (ids.size === 0) {
            // Try locating standard JSON blobs if regex fails
            return NextResponse.json({ error: 'No videos found in playlist link' }, { status: 404 });
        }

        const uniqueIds = Array.from(ids).slice(0, 50); // Limit to 50 for performance

        // 3. Fetch Details for each ID via oEmbed (Parallel)
        const videos = await Promise.all(uniqueIds.map(async (id) => {
            try {
                const oembedUrl = `https://www.dailymotion.com/services/oembed?url=https://www.dailymotion.com/video/${id}`;
                const r = await fetch(oembedUrl);
                if (!r.ok) return null;
                const d = await r.json();
                return {
                    id: id,
                    title: d.title,
                    thumbnail: d.thumbnail_url,
                    author: d.author_name,
                    duration: d.duration || 0, // Fallback
                };
            } catch (err) {
                return null;
            }
        }));

        const validVideos = videos.filter(v => v !== null);

        return NextResponse.json({
            videos: validVideos,
            total: validVideos.length
        });

    } catch (error) {
        console.error('Playlist Import Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
