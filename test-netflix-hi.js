const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const NETFLIX_ID = '81177634'; // Lookism 

async function test() {
    console.log('Inspecting Netflix Details for ID:', NETFLIX_ID);
    const url = `https://netflix54.p.rapidapi.com/title/details/?ids=${NETFLIX_ID}&lang=en`;
    const res = await fetch(url, {
        headers: {
            'x-rapidapi-host': 'netflix54.p.rapidapi.com',
            'x-rapidapi-key': RAPIDAPI_KEY
        }
    });
    const data = await res.json();
    console.log('Raw data structure (first item keys):', Object.keys(data[0] || {}));

    // Deep log the first item
    console.log('Full Item JSON:');
    console.log(JSON.stringify(data[0], null, 2).slice(0, 5000));
}

test().catch(console.error);
