const https = require('https');

const API_KEY = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const HOST = 'moviebox-api.p.rapidapi.com';

const PATHS = [
    '/movie/search?keyword=avengers',
    '/search?keyword=avengers',
    '/search/movie?keyword=avengers',
    '/movies/search?keyword=avengers',
    '/movie/list',
    '/movies/list'
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

console.log('Probing endpoints...');
PATHS.forEach((p, i) => setTimeout(() => testPath(p), i * 500));
