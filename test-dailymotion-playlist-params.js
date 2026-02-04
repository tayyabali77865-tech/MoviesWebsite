const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function test(param) {
    // using a possibly valid playlist id 'x6n23y'
    const id = 'x6n23y';
    const url = `${BASE_URL}/api/v1/videos?${param}=${id}`;
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
            console.log('SUCCESS');
            console.log(JSON.stringify(data).substring(0, 200));
        }
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    await test('playlist_id');
    await test('playlist');
    await test('list');
}

run();
