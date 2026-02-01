const https = require('https');
const query = 'Naruto';

const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data.slice(0, 500)}`);
    });
}).on('error', (e) => {
    console.error(`Error: ${e.message}`);
});
