const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const BASE_URL = 'https://dailymotion-scraper.p.rapidapi.com';

async function test() {
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
        if (data.data?.channel?.cursor) {
            console.log('Cursor Object:', JSON.stringify(data.data.channel.cursor, null, 2));
        } else {
            console.log('No cursor object found');
            console.log('Channel Keys:', Object.keys(data.data?.channel || {}));
        }
    } catch (e) {
        console.error(e);
    }
}

test();
