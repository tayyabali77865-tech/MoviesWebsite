import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Volume2, Globe } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  vote_average?: number;
  audioLanguage?: string;
  isHindiDubbed?: boolean;
  createdAt: Date;
}

export async function HindiDubbedSection() {
  try {
    const hindiDubbedMovies = await (prisma.video as any).findMany({
      where: {
        isHindiDubbed: true,
        section: {
          in: ['hindi-dubbed', 'new', 'trending']
        },
        parentId: null
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }) as Video[];

    if (hindiDubbedMovies.length === 0) {
      return null;
    }

    return (
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-8 flex items-center gap-3">
            <Globe className="w-8 h-8 text-red-600" />
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">🇮🇳 Hindi Dubbed Hollywood</h2>
              <p className="text-gray-400 mt-1 text-sm">Hollywood movies available in Hindi audio</p>
            </div>
          </div>

          {/* Movies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {hindiDubbedMovies.map((movie) => (
              <Link
                key={movie.id}
                href={`/watch/${movie.id}`}
                className="group relative rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                {/* Poster Image */}
                <div className="relative aspect-[2/3] bg-zinc-800">
                  {movie.thumbnailUrl ? (
                    <img
                      src={movie.thumbnailUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/300x450?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                      <Globe className="w-12 h-12 text-gray-600" />
                    </div>
                  )}

                  {/* Hindi Dubbed Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md">
                      <Volume2 className="w-3 h-3" />
                      HINDI
                    </span>
                  </div>

                  {/* Overlay with Title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-xs md:text-sm font-bold text-white line-clamp-2">
                      {movie.title}
                    </h3>
                    {movie.vote_average && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] text-yellow-500">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Link */}
          <div className="mt-8 text-center">
            <Link
              href="/results?section=hindi-dubbed"
              className="inline-block px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              View All Hindi Dubbed Movies →
            </Link>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error loading Hindi dubbed section:', error);
    return null;
  }
}
