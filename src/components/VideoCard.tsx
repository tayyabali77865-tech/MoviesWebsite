'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  category?: string;
  index?: number;
}

export function VideoCard({ id, title, thumbnailUrl, index = 0 }: VideoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      className="group"
    >
      <Link href={`/watch/${id}`} className="block rounded-lg overflow-hidden bg-surface-700 shadow-lg">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center">
              <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
            </span>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm sm:text-base truncate text-white">{title}</h3>
        </div>
      </Link>
    </motion.div>
  );
}
