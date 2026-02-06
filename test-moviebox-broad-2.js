const https = require('https');

const API_KEY = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const HOST = 'moviebox-api.p.rapidapi.com';

const PATHS = [
    '/movie-or-tv/list',
    '/movie-or-tv/all',
    '/movie-or-tv/items',
    '/home',
    '/index',
    '/config'
];

function testPath(path) {
    const options = {
        hostname: HOST,
        path: path,
        method: 'GET',
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': HOST
        }
    };

    const req = https.request(options, (res) => {
        console.log(`[${res.statusCode}] ${path}`);
    });
    req.on('error', e => console.log(`[ERR] ${path}: ${e.message}`));
    req.end();
}

console.log('Probing Round 2...');
PATHS.forEach((p, i) => setTimeout(() => testPath(p), i * 500));
