import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from '@/components/SessionProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Complet Stream — Watch Movies & TV Shows Online for Free',
  description: 'Stream unlimited movies and TV shows with HD quality. MovieBox-powered streaming platform with custom player, multiple categories, and responsive design. Watch anytime, anywhere.',
  keywords: 'movies, TV shows, streaming, watch online, free movies, MovieBox, video streaming, entertainment',
  authors: [{ name: 'Complet Stream' }],
  openGraph: {
    title: 'Complet Stream — Watch Movies & TV Shows Online',
    description: 'Your ultimate streaming destination for movies and TV shows with premium features',
    type: 'website',
  },
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-[var(--background)] text-[var(--foreground)]">
        <SessionProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        </SessionProvider>
      </body>
    </html>
  );
}
