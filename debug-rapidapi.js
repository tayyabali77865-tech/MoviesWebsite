const https = require('https');

const API_KEY = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const HOST = 'moviesdatabase.p.rapidapi.com';
const QUERY = 'Avengers'; // Test query

const options = {
    hostname: HOST,
    path: `/titles/search/title/${encodeURIComponent(QUERY)}?exact=false&info=base_info&limit=5`,
    method: 'GET',
    headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': HOST
    }
};

console.log('Fetching:', `https://${HOST}${options.path}`);

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Response Status:', res.statusCode);
            // Log deep structure
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw Data:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.end();
