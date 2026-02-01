# Complet Stream — Movie Streaming Website

A professional, responsive movie streaming site with Netflix-like UI, custom video player, full auth (email, Google, Facebook, phone OTP), and an admin panel for videos and carousel.

## Features

- **Layout**: Responsive (mobile, tablet, desktop), sticky navbar, toggleable sidebar
- **Carousel**: Homepage carousel (max 10), auto-slide + manual controls
- **Video sections**: New Movies, Trending, Upcoming, Random (50 per section, Load More)
- **Custom video player**: Play/pause, volume, mute, minimize, fullscreen, speed (0.5x–2x), resolution (360p–1080p), subtitles, autoplay
- **Auth**: Email/password, Google, Facebook, phone OTP; secure sessions, bcrypt passwords
- **Admin panel**: Video CRUD (title, description, thumbnail, category, resolutions, subtitles, autoplay, speed), carousel CRUD (add/remove/replace, max 10), role-based access

## Tech

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Prisma + SQLite (swap to PostgreSQL in production)
- NextAuth.js (credentials, Google, Facebook)
- Framer Motion, react-hot-toast, Zustand

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env` (or use the provided `.env`).
   - Set `NEXTAUTH_SECRET` and optionally Google/Facebook OAuth keys.

3. **Database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Admin

- **Login**: After seeding, use `admin@complet.local` / `admin123`.
- **Make a user admin**: In the database, set `User.role = 'admin'` for that user.
- **Admin routes**: `/admin` (dashboard), `/admin/videos`, `/admin/videos/new`, `/admin/videos/[id]`, `/admin/carousel`.

## OAuth (optional)

- **Google**: Create OAuth credentials, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
- **Facebook**: Create Facebook App, set `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` in `.env`.

## Phone OTP

After entering phone and OTP, the app creates a short-lived token and signs you in via NextAuth (credentials + `phoneToken`). In production, wire `/api/auth/phone/send-otp` to Twilio or Firebase to send real SMS; in dev, the OTP code is logged to the server console.

## Uploads

Admins can upload thumbnails and video files from the admin panel (Videos and Carousel). Files are stored in `public/uploads/` (images in `images/`, videos in `videos/`). Max file size 100MB. For serverless (e.g. Vercel), replace with S3 or similar and point the upload API there.
