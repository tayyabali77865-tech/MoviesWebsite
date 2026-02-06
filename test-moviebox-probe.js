const https = require('https');

const API_KEY = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const HOST = 'moviebox-api.p.rapidapi.com';

// Trying a 'search' endpoint assumption, or stick to what user yielded if it works.
// Let's first inspect the PREVIOUS user endpoint response more closely (filter-items)
// But I suspect 'search' is the right one.
const PATHS = [
    '/movie-or-tv/search?keyword=avengers',
    '/movie-or-tv/filter-items?category=movie&keyword=avengers'
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

    console.log('Fetching:', `https://${HOST}${path}`);

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log(`--- Response for ${path} ---`);
            console.log('Status:', res.statusCode);
            try {
                const json = JSON.parse(data);
                if (json.data && json.data.list) {
                    console.log('Found list!', json.data.list.length, 'items');
                    console.log(JSON.stringify(json.data.list[0], null, 2));
                } else if (json.data && json.data.filters) {
                    console.log('Found filters (Metadata?)');
                    // Check if there are items alongside filters
                    console.log('Top keys:', Object.keys(json.data));
                } else {
                    console.log('Keys:', Object.keys(json));
                    if (json.message) console.log('Message:', json.message);
                }
            } catch (e) {
                console.log('Invalid JSON');
            }
        });
    });
    req.end();
}

testPath(PATHS[0]);
setTimeout(() => testPath(PATHS[1]), 2000);
