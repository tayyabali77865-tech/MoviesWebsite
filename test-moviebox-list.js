const https = require('https');

const RAPIDAPI_KEY = '15b79664b4msh8369588949b24b9p11bdb7jsn05a9fd41d672';
const HOST = 'moviebox-api.p.rapidapi.com';

async function testEndpoint(path) {
    console.log(`\nTesting: ${path}`);
    return new Promise((resolve) => {
        const options = {
            hostname: HOST,
            path: path,
            method: 'GET',
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': HOST
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.data && parsed.data.items) {
                        console.log('Items Count:', parsed.data.items.length);
                        console.log('First Item:', JSON.stringify(parsed.data.items[0], null, 2));
                    } else if (parsed.data && parsed.data.typeList) {
                        console.log('Got Filter Metadata (Genres, etc.)');
                    } else {
                        console.log('Response Snippet:', data.substring(0, 500));
                    }
                } catch (e) {
                    console.log('Could not parse JSON');
                    console.log('Raw:', data.substring(0, 200));
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(e);
            resolve();
        });
        req.end();
    });
}

async function run() {
    // Try to find the endpoint that returns LATEST items for a category
    await testEndpoint('/movie-or-tv/filter-list?category=movie&page=1');
    await testEndpoint('/movie-or-tv/filter-list?category=tv&page=1');
    await testEndpoint('/movie-or-tv/filter-list?category=anime&page=1');
}

run();
