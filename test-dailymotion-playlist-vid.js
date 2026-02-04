const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function test() {
    // Valid looking playlist ID (randomly chosen pattern or from google)
    // trying 'x6n23y'
    const id = 'x6n23y';
    const endpoints = [
        `/api/v1/playlists/${id}/videos`,
        `/playlists/${id}/videos`,
        `/api/v1/playlist/${id}/videos`
    ];

    for (const ep of endpoints) {
        const url = `${BASE_URL}${ep}`;
        console.log(`Testing: ${url}`);
        try {
            const res = await fetch(url, {
                headers: {
                    'x-rapidapi-host': 'dailymotion-scraper.p.rapidapi.com',
                    'x-rapidapi-key': RAPIDAPI_KEY
                }
            });
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const data = await res.json();
                console.log('SUCCESS!');
                console.log(JSON.stringify(data, null, 2).substring(0, 300));
                break;
            }
        } catch (e) {
            console.error(e.message);
        }
    }
}

test();
