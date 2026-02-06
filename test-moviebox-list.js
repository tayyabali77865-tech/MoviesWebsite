const https = require('https');

const API_KEY = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const HOST = 'moviebox-api.p.rapidapi.com';

const PATH = '/movie-or-tv/list?keyword=avengers&category=movie';

const options = {
    hostname: HOST,
    path: PATH,
    method: 'GET',
    headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': HOST
    }
};

console.log('Fetching:', `https://${HOST}${PATH}`);

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Keys:', Object.keys(json));
            if (json.data && json.data.list) {
                console.log('List length:', json.data.list.length);
                console.log('First Item:', JSON.stringify(json.data.list[0], null, 2));
            } else {
                console.log('Data sample:', JSON.stringify(json, null, 2).substring(0, 500));
            }
        } catch (e) { console.log('Error', e); }
    });
});
req.end();
