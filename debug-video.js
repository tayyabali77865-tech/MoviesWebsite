const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVideo() {
    const id = 'cml3zi1s10000iuwr6xwjcyzx';
    console.log(`Checking video with ID: ${id}`);

    try {
        const video = await prisma.video.findUnique({
            where: { id },
            include: { subtitles: true, audioTracks: true }
        });

        if (!video) {
            console.log('Video not found!');
        } else {
            console.log('Video found:', JSON.stringify(video, null, 2));
        }
    } catch (error) {
        console.error('Error fetching video:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkVideo();
