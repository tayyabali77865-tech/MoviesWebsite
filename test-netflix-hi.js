const fetch = require('node-fetch');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const NETFLIX_ID = '80057281'; // Stranger Things example

async function test() {
    console.log('Testing Netflix Details for ID:', NETFLIX_ID);
    const url = `https://netflix54.p.rapidapi.com/title/details/?ids=${NETFLIX_ID}&lang=hi`; // Try Hindi lang
    const res = await fetch(url, {
        headers: {
            'x-rapidapi-host': 'netflix54.p.rapidapi.com',
            'x-rapidapi-key': RAPIDAPI_KEY
        }
    });
    const data = await res.json();
    const detail = data[0];

    if (detail?.details) {
        console.log('Title:', detail.details.title);
        console.log('Audio Tracks:', detail.details.audio?.length || 0);
        console.log('Subtitles:', detail.details.subtitles?.length || 0);

        detail.details.audio?.slice(0, 5).forEach(a => {
            console.log(`- Audio: ${a.language} (${a.name})`);
        });
    } else {
        console.log('No details found. Raw response keys:', Object.keys(data));
        console.log('Full response:', JSON.stringify(data, null, 2));
    }
}

test().catch(console.error);
