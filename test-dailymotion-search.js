const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function testSearch(endpoint, queryParams) {
    const url = `${BASE_URL}${endpoint}?${new URLSearchParams(queryParams)}`;
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
    // Try common Dailymotion search endpoints
    // Note: The official API is /videos?search=...
    await testSearch('/api/v1/videos/search', { query: 'drama', limit: 5 });
    await testSearch('/api/v1/search/videos', { query: 'drama', limit: 5 });
    await testSearch('/api/v1/videos', { search: 'drama', limit: 5 });
    await testSearch('/api/v1/search', { q: 'drama', limit: 5 });
}

run();
