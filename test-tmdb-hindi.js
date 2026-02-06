const https = require('https');

const TMDB_API_KEY = '3370c7875d057cde17b3d68c22cba6e8';

async function searchTMDB(query, lang = 'en-US') {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=${lang}`;

    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'JSON parse error' });
                }
            });
        }).on('error', (e) => resolve({ error: e.message }));
    });
}

async function checkTranslations(id) {
    const url = `https://api.themoviedb.org/3/movie/${id}/translations?api_key=${TMDB_API_KEY}`;
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'JSON parse error' });
                }
            });
        }).on('error', (e) => resolve({ error: e.message }));
    });
}

async function run() {
    console.log("--- Testing Hollywood Movie (Avengers: Endgame) ---");
    const avengers = await searchTMDB('Avengers: Endgame', 'hi-IN');
    if (avengers.results && avengers.results.length > 0) {
        const movie = avengers.results[0];
        console.log(`Title (HI): ${movie.title}`);
        console.log(`Original Title: ${movie.original_title}`);
        console.log(`Overview (HI): ${movie.overview?.substring(0, 100)}...`);

        const trans = await checkTranslations(movie.id);
        const hasHindi = trans.translations?.find(t => t.iso_639_1 === 'hi');
        console.log(`Has Hindi Translation Metadata: ${!!hasHindi}`);
    } else {
        console.log("No results for Avengers: Endgame in Hindi");
    }

    console.log("\n--- Testing Anime (Naruto) ---");
    // Anime is usually TV on TMDB
    const tvUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=Naruto&language=hi-IN`;
    const narutoRes = await new Promise(resolve => {
        https.get(tvUrl, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
    });

    if (narutoRes.results && narutoRes.results.length > 0) {
        const anime = narutoRes.results.find(r => r.name.toLowerCase().includes('naruto'));
        if (anime) {
            console.log(`Title (HI): ${anime.name}`);
            console.log(`Original Name: ${anime.original_name}`);
            console.log(`Overview (HI): ${anime.overview?.substring(0, 100)}...`);

            const tvTransUrl = `https://api.themoviedb.org/3/tv/${anime.id}/translations?api_key=${TMDB_API_KEY}`;
            const tvTrans = await new Promise(resolve => {
                https.get(tvTransUrl, res => {
                    let data = '';
                    res.on('data', c => data += c);
                    res.on('end', () => resolve(JSON.parse(data)));
                });
            });
            const hasHindi = tvTrans.translations?.find(t => t.iso_639_1 === 'hi');
            console.log(`Has Hindi Translation Metadata: ${!!hasHindi}`);
        }
    } else {
        console.log("No results for Naruto in Hindi");
    }
}

run();
