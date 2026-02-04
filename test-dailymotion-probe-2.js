const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function test(endpoint) {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`Testing: ${endpoint}`);
    try {
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'dailymotion-scraper.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });
        if (res.ok) {
            console.log(`[SUCCESS] ${endpoint}`);
            const data = await res.json();
            console.log(JSON.stringify(data, null, 2).slice(0, 300));
        } else {
            console.log(`[FAILED] ${endpoint}: ${res.status}`);
        }
    } catch (e) { console.error(e.message); }
}

async function run() {
    // Try to list videos from the channel 'kicker-de' which we know exists
    await test('/api/v1/channels/videos?channel_name=kicker-de');
    await test('/api/v1/channel/videos?channel_name=kicker-de');
    await test('/api/v1/channels/kicker-de/videos');

    // Try generic trending/list
    await test('/api/v1/trending');
    await test('/api/v1/videos/trending');
}

run();
