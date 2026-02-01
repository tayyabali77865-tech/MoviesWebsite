async function testApi() {
    try {
        const res = await fetch('https://tatakai.vercel.app/api/v1/animehindidubbed/search?q=Naruto');
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
testApi();
