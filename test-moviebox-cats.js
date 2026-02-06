const https = require('https');

const API_KEY = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const HOST = 'moviebox-api.p.rapidapi.com';

const CATEGORIES = ['movie', 'tv', 'anime', 'manga', 'music', 'trailer', 'documentary'];
const QUERY = 'avengers'; // For movies
const QUERY_GENERIC = 'love'; // detailed search

function checkCategory(cat) {
    const path = `/movie-or-tv/list?keyword=${encodeURIComponent(QUERY_GENERIC)}&category=${cat}`;
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
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                const count = json.data?.items?.length || 0;
                console.log(`Category [${cat}]: Found ${count} items. Status: ${res.statusCode}`);
                if (count > 0) {
                    console.log(`  > First Item: ${json.data.items[0].title} (Type: ${json.data.items[0].category || 'N/A'})`);
                }
            } catch (e) {
                console.log(`Category [${cat}]: Error parsing JSON (${res.statusCode})`);
            }
        });
    });
    req.end();
}

console.log('Checking categories...');
CATEGORIES.forEach((c, i) => setTimeout(() => checkCategory(c), i * 1000));
