const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function testDailymotion() {
    console.log('Testing Dailymotion API...');

    // Test 1: Channel Detail (from user request)
    console.log('\n--- Testing Channel Detail ---');
    const channelUrl = `${BASE_URL}/api/v1/channels/detail?channel_name=kicker-de`;
    try {
        const res = await fetch(channelUrl, {
            headers: {
                'x-rapidapi-host': 'dailymotion-scraper.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });
        if (!res.ok) {
            console.error('Channel Detail Failed:', res.status, await res.text());
        } else {
            console.log('Channel Detail Success:', JSON.stringify(await res.json(), null, 2).slice(0, 200));
        }
    } catch (e) { console.error(e); }

    // Test 2: Search (Guessing endpoint, common for scrapers)
    // Common endpoints: /search/video, /videos/search, etc.
    // Based on "dailymotion-scraper" docs (simulated), let's try a generic search if likely exists, 
    // or we might need to rely on the user's specific endpoint.
    // For now, let's just test the one they gave to see if the key works.
}

testDailymotion();
