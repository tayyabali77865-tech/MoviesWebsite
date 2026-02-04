const fetch = require('node-fetch');

async function test() {
    // Attempting to fetch a playlist page.
    // If I can't find a live one, I'll rely on generic regex patterns that usually work for Dailymotion.
    // Let's try to 'search' for a playlist first via scraping? No, that's too complex.
    // I'll just try to fetch a playlist ID I saw in some logs or just 'x5xvz9' (mock)
    // Actually, let's try to find a real one by scraping the channel page 'kicker-de' again

    try {
        const channelRes = await fetch('https://www.dailymotion.com/kicker-de');
        const channelHtml = await channelRes.text();
        // Look for /playlist/
        const match = channelHtml.match(/\/playlist\/([a-zA-Z0-9]+)/);
        if (match) {
            const playlistId = match[1];
            console.log(`Found Playlist ID: ${playlistId}`);
            const playlistUrl = `https://www.dailymotion.com/playlist/${playlistId}`;
            console.log(`Fetching: ${playlistUrl}`);

            const plRes = await fetch(playlistUrl);
            const plHtml = await plRes.text();

            // Look for video IDs in the playlist html
            // href="/video/x..." 
            const videoMatches = plHtml.matchAll(/\/video\/([a-zA-Z0-9]+)/g);
            const videos = new Set();
            for (const m of videoMatches) {
                videos.add(m[1]);
            }
            console.log(`Found ${videos.size} unique videos.`);
            console.log([...videos].slice(0, 5));
        } else {
            console.log('No playlist found on channel page.');
        }
    } catch (e) {
        console.error(e);
    }
}

test();
