const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function test() {
    // Test page 1 and look for cursor/pagination data
    const url = `${BASE_URL}/api/v1/channels/videos?channel_name=kicker-de&page=1`;
    console.log(`Testing: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'dailymotion-scraper.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        const data = await res.json();
        console.log('Top Level Keys:', Object.keys(data));
        if (data.data) {
            console.log('Data Keys:', Object.keys(data.data));
            if (data.data.channel) {
                console.log('Channel Keys:', Object.keys(data.data.channel));
                // Check for generic pagination fields often found in these scrapers
                console.log('Cursor/Page info:', {
                    has_next: data.data.channel.has_next,
                    next_cursor: data.data.channel.next_cursor,
                    page: data.data.channel.page,
                    total: data.data.channel.total,
                    videos_total: data.data.channel.videos_total
                });
            }
        }
    } catch (e) {
        console.error(e);
    }
}

test();
