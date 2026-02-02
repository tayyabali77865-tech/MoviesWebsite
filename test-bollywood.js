const https = require('https');

const API_KEY = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const HOST = 'tbmdb-bollywood-movies-v1.p.rapidapi.com';

const endpoints = [
    '/v1/search?query=Pathaan',
    '/v1/movie/search?query=Pathaan',
    '/v1/movies/search?query=Pathaan',
    '/v1/movie/list',
    '/v1/popular',
    '/v1/movie/1', // Test if 1 is a valid ID
];

async function testEndpoint(endpoint) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    const options = {
        hostname: HOST,
        path: endpoint,
        method: 'GET',
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': HOST
        },
        timeout: 5000 // 5 seconds timeout
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        console.log('Response (first 500 chars):', JSON.stringify(json).slice(0, 500));
                    } catch (e) {
                        console.log('Response (not JSON):', data.slice(0, 200));
                    }
                } else {
                    console.log('Response:', data.slice(0, 200));
                }
                resolve(true);
            });
        });

        req.on('error', (e) => {
            console.error(`Error: ${e.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.error('Request timed out');
            req.destroy();
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
