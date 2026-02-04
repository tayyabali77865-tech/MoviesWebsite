const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function test() {
    // Valid video ID: 'x7xtx84'
    const id = 'x7xtx84';

    // Attempt search
    const endpoints = [
        `/api/v1/search/videos?query=${id}`,
        `/search/videos?query=${id}`
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
                console.log('SUCCESS');
                console.log(JSON.stringify(data, null, 2).substring(0, 300));
                if (data.data?.videos?.hits?.length > 0) {
                    console.log('Found:', data.data.videos.hits[0].title);
                }
            }
        } catch (e) {
            console.error(e.message);
        }
    }
}

test();
