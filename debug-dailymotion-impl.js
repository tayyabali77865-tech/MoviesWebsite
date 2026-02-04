const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function test(channelId) {
    console.log(`Testing Channel: ${channelId}`);
    try {
        const url = `${BASE_URL}/api/v1/channels/videos?channel_name=${encodeURIComponent(channelId)}`;
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'dailymotion-scraper.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        if (!res.ok) {
            console.error('API Error:', res.status, await res.text());
            return;
        }

        const data = await res.json();
        console.log('Raw Data Access Check:', {
            hasData: !!data.data,
            hasChannel: !!data.data?.channel,
            hasVideos: !!data.data?.channel?.videos,
            videosLength: data.data?.channel?.videos?.length
        });

        if (data.data?.channel?.videos?.length > 0) {
            console.log('First Video Sample:', JSON.stringify(data.data.channel.videos[0], null, 2));
        }

        // Mimic Route Logic
        const videos = (data.data?.channel?.videos || []).map((v) => ({
            id: v.xid,
            title: v.title,
            thumbnail: v.thumbnail_url || null,
            created_time: v.created_time,
            duration: v.duration
        }));

        console.log('Mapped Videos Count:', videos.length);
        console.log('First Mapped Video:', videos[0]);

    } catch (error) {
        console.error('Script Error:', error);
    }
}

test('kicker-de');
