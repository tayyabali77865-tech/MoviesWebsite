async function test() {
    const videoUrl = 'https://www.dailymotion.com/video/x7xtx84';
    const url = `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(videoUrl)}`;
    console.log(`Testing: ${url}`);
    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            console.log('SUCCESS');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(`Failed: ${res.status}`);
        }
    } catch (e) {
        console.error(e);
    }
}
test();
