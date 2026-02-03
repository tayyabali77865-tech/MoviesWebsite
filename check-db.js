const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('Checking database sanity...');
    const count = await prisma.video.count();
    console.log('Total videos:', count);

    const latest = await prisma.video.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { audioTracks: true }
    });

    latest.forEach(v => {
        console.log(`- [${v.id}] ${v.title} (${v.type}) | Netflix: ${v.netflixId} | TMDB: ${v.tmdbId}`);
        console.log(`  Audio Tracks: ${v.audioTracks.length} tracks found.`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
