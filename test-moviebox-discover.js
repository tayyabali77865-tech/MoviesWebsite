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
                        if (parsed.data.items.length > 0) {
                            console.log('Sample Title:', parsed.data.items[0].title);
                        }
                    } else {
                        console.log('No items in data');
                    }
                } catch (e) {
                    console.log('JSON error');
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
    // Test if we can list items WITHOUT a keyword (Discovery mode)
    await testEndpoint('/movie-or-tv/list?category=movie');
    await testEndpoint('/movie-or-tv/list?category=tv');
    await testEndpoint('/movie-or-tv/list?category=anime');
}

run();
