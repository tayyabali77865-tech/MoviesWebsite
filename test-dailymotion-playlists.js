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

        if (!res.ok) {
            console.log(`[FAILED] ${endpoint}: ${res.status}`);
            return;
        }

        const data = await res.json();
        console.log(`[SUCCESS] ${endpoint}`);
        // Log basic structure
        if (data.data) {
            console.log('Keys:', Object.keys(data.data));
            if (data.data.playlists) {
                console.log('Playlists found:', data.data.playlists.length);
                if (data.data.playlists.length > 0) console.log('Sample URL:', data.data.playlists[0]);
            }
            if (data.data.videos) {
                console.log('Videos found:', data.data.videos.length);
            }
        } else {
            console.log('Data:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

// User mentioned "playlist bhi us channel ki show ho" -> Show playlists of that channel
// Try to find playlists for a channel name 'kicker-de'
async function run() {
    // Guessing endpoints based on standard API patterns
    await test('/api/v1/channels/playlists?channel_name=kicker-de');
    await test('/api/v1/user/playlists?channel_name=kicker-de');
    await test('/channels/playlists?channel_name=kicker-de');

    // Also try to get videos of a playlist if we find an ID (simulated or explicit)
    // If we can't find a list, maybe we just need pagination? 
    // "ek page hi araha hai" -> implies pagination issue too.

    // Check pagination on videos
    await test('/api/v1/channels/videos?channel_name=kicker-de&page=2');
}

run();
