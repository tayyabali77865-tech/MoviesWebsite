const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function test(path) {
    const url = `${BASE_URL}${path}`;
    console.log(`Testing: ${url}`);
    try {
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'dailymotion-scraper.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        if (!res.ok) {
            console.log(`[FAILED] ${res.status}`);
            return;
        }

        const data = await res.json();
        console.log(`[SUCCESS]`);
        console.log(JSON.stringify(data, null, 2).substring(0, 500));
    } catch (e) {
        console.error(e.message);
    }
}

async function run() {
    // Try to find a playlist ID via search first?
    // Or just try a likely ID or user/channel playlists again
    await test('/api/v1/channels/playlists?channel_name=kicker-de');
    await test('/api/v1/user/playlists?username=kicker-de');

    // Test generic search to see if it returns playlists?
    await test('/api/v1/search/playlists?query=football');

    // If I had an ID (e.g. from web), I would test:
    // await test('/api/v1/playlists/x5n2k/videos'); 
}

run();
