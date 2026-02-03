const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const NETFLIX_ID = '81177634'; // Lookism 

async function test() {
    console.log('Testing Netflix Metadata for ID:', NETFLIX_ID);
    const url = `https://netflix54.p.rapidapi.com/title/metadata/?ids=${NETFLIX_ID}&lang=en`;
    const res = await fetch(url, {
        headers: {
            'x-rapidapi-host': 'netflix54.p.rapidapi.com',
            'x-rapidapi-key': RAPIDAPI_KEY
        }
    });
    const data = await res.json();
    const item = data[0];

    if (item) {
        console.log('Metadata found for:', item.title?.name || item.id);
        // Look for audio/subtitle in metadata
        const audio = item.audioDetails || item.languages || [];
        console.log('Possible Language fields:', Object.keys(item).filter(k => k.toLowerCase().includes('lang') || k.toLowerCase().includes('audio')));
        console.log('Full JSON Keys:', Object.keys(item));

        if (item.audio) console.log('Audio found (direct):', item.audio.length);
    } else {
        console.log('No metadata found.');
    }
}

test().catch(console.error);
