import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SampleVideo {
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  url720?: string;
  url480?: string;
  url360?: string;
  url1080?: string;
  defaultSpeed: number;
  autoplay: boolean;
}

const SAMPLE_VIDEOS: SampleVideo[] = [
  {
    title: 'Sample Movie 1',
    description: 'A great sample movie for the streaming platform.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop',
    category: 'new',
    url720: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    url480: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    defaultSpeed: 1,
    autoplay: false,
  },
  {
    title: 'Sample Movie 2',
    description: 'Another sample for trending section.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=640&h=360&fit=crop',
    category: 'trending',
    url720: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    defaultSpeed: 1,
    autoplay: false,
  },
  {
    title: 'Upcoming Feature',
    description: 'Coming soon to the platform.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=640&h=360&fit=crop',
    category: 'upcoming',
    url720: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    defaultSpeed: 1,
    autoplay: false,
  },
  {
    title: 'Random Pick',
    description: 'Random video for discovery.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=640&h=360&fit=crop',
    category: 'random',
    url720: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    defaultSpeed: 1,
    autoplay: false,
  },
];

const CAROUSEL_IMAGES = [
  { imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=800&fit=crop', title: 'Featured 1' },
  { imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=800&fit=crop', title: 'Featured 2' },
  { imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&h=800&fit=crop', title: 'Featured 3' },
];

async function main() {
  const adminEmail = 'admin@complet.local';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        passwordHash: hash,
        role: 'admin',
      },
    });
    console.log('Admin user created: admin@complet.local / admin123');
  }

  const videoCount = await prisma.video.count();
  if (videoCount === 0) {
    for (const v of SAMPLE_VIDEOS) {
      await prisma.video.create({
        data: {
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          category: v.category,
          url360: v.url360 ?? undefined,
          url480: v.url480 ?? undefined,
          url720: v.url720 ?? undefined,
          url1080: v.url1080 ?? undefined,
          defaultSpeed: v.defaultSpeed,
          autoplay: v.autoplay,
        },
      });
    }
    console.log('Sample videos created');
  }

  const carouselCount = await prisma.carouselSlide.count();
  if (carouselCount === 0) {
    for (let i = 0; i < CAROUSEL_IMAGES.length; i++) {
      await prisma.carouselSlide.create({
        data: { ...CAROUSEL_IMAGES[i], order: i },
      });
    }
    console.log('Carousel slides created');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
