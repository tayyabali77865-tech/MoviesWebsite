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

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const items = json.data?.items || [];
            if (items.length > 0) {
                console.log('Item Keys:', Object.keys(items[0]));
                console.log('Item Sample:', JSON.stringify(items[0], null, 2));
            } else {
                console.log('No items found');
            }
        } catch (e) { console.log('Error', e); }
    });
});
req.end();
