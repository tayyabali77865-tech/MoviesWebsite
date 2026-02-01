const https = require('https');

const RAPIDAPI_KEY = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const query = 'Naruto';

const host = 'anime-api-v2.p.rapidapi.com';
const endpoints = ['/all', '/search', '/anime'];

async function testEndpoint(endpoint) {
    console.log(`Testing endpoint: ${endpoint}`);
    const options = {
        hostname: host,
        port: 443,
        path: `${endpoint}?q=${encodeURIComponent(query)}`,
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': host
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response Snippet: ${data.slice(0, 200)}`);
                resolve(res.statusCode === 200);
            });
        });

        req.on('error', (e) => {
            console.error(`Error with ${host}: ${e.message}`);
            resolve(false);
        });
        req.end();
    });
}

(async () => {
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
    }
})();
