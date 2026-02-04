import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
        return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    try {
        // Use Dailymotion oEmbed API
        const oembedUrl = `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(videoUrl)}`;
        const res = await fetch(oembedUrl);

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch video details. Invalid URL?' }, { status: 404 });
        }

        const data = await res.json();

        // Extract ID from URL (e.g. https://www.dailymotion.com/video/x7xtx84)
        // or finding it in the html field of oembed?
        // Dailymotion oembed doesn't always return ID directly, but we can parse it from URL.

        let id = '';
        const match = videoUrl.match(/video\/([a-zA-Z0-9]+)/);
        if (match) {
            id = match[1];
        } else {
            // Fallback: search in iframe src if available?
            // <iframe src="https://www.dailymotion.com/embed/video/x7xtx84" ...
            const iframeSrc = data.html?.match(/video\/([a-zA-Z0-9]+)/);
            if (iframeSrc) id = iframeSrc[1];
        }

        if (!id) {
            return NextResponse.json({ error: 'Could not extract Video ID' }, { status: 400 });
        }

        const video = {
            id: id,
            title: data.title,
            thumbnail: data.thumbnail_url,
            author: data.author_name,
            duration: data.duration, // oEmbed might return duration? standard says yes/no? Dailymotion usually does.
            // If duration missing, frontend can handle it.
        };

        return NextResponse.json({ video });

    } catch (error) {
        console.error('Dailymotion Video Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
