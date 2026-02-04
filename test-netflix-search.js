const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const NETFLIX_BASE_URL = 'https://netflix54.p.rapidapi.com';

async function testSearch(query) {
    console.log(`Testing Netflix Search for: "${query}"`);
    const url = `${NETFLIX_BASE_URL}/search/?query=${encodeURIComponent(query)}&offset=0&limit_titles=20&limit_suggestions=5&lang=en`;

    try {
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'netflix54.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        console.log('Status Code:', res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error Body:', errorText);
            return;
        }

        const data = await res.json();
        console.log('Search Results:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testSearch('Stranger Things');
