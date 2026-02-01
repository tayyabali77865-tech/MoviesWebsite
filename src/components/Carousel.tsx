'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface Slide {
  id: string;
  imageUrl: string;
  title: string | null;
  order: number;
}

const AUTO_INTERVAL = 6000;

export function Carousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  const len = slides.length;
  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + len) % len);
    },
    [len]
  );

  useEffect(() => {
    if (len <= 1) return;
    const t = setInterval(() => go(1), AUTO_INTERVAL);
    return () => clearInterval(t);
  }, [len, go]);

  if (!len) return null;

  const current = slides[index];

  return (
    <section className="relative w-full aspect-[21/9] min-h-[200px] sm:min-h-[280px] md:min-h-[400px] overflow-hidden rounded-b-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
          <Image
            src={current.imageUrl}
            alt={current.title || 'Featured'}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            onLoad={() => setLoaded((l) => ({ ...l, [index]: true }))}
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg max-w-2xl">
              {current.title || 'Watch now'}
            </h2>
          </div>
        </motion.div>
      </AnimatePresence>

      {len > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all',
                  i === index ? 'bg-red-500 w-6' : 'bg-white/50 hover:bg-white/80'
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
