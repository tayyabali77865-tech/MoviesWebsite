# 🇮🇳 Hollywood Hindi Dubbed Movies - Implementation Guide

## Overview
Complete implementation for adding Hollywood Hindi Dubbed Movies section to your streaming website with TMDB integration, admin panel, and frontend display.

---

## 📋 Database Schema Changes

### Updated Video Model (Prisma)
Fields added to `src/prisma/schema.prisma`:

```prisma
model Video {
  // ... existing fields ...
  
  // New Hindi Dubbed Support
  section       String   @default("new")   // Updated to support "hindi-dubbed"
  isHindiDubbed Boolean  @default(false)   // Flag for Hindi dubbed movies
  audioLanguage String?  // Primary audio language: "en", "hi", etc.
  hindiDubHlsUrl String? // Separate HLS URL for Hindi dubbed version
  
  @@index([isHindiDubbed])
  @@index([audioLanguage])
}
```

### Migration Required
```bash
npx prisma db push --accept-data-loss
# or
npx prisma migrate dev --name add_hindi_dubbed_support
```

---

## 🔌 API Endpoints

### 1. Hindi Dubbed Search API
**Endpoint:** `GET /api/admin/hindi-dub/search`

**Query Parameters:**
- `query` (optional): Search term (e.g., "Avengers")
- `type` (optional): "movie" | "series" | "anime" (default: "movie")

**Authentication:** Admin only (NextAuth)

**Response Format:**
```json
{
  "results": [
    {
      "id": 299536,
      "title": "Avengers: Endgame",
      "overview": "...",
      "poster_path": "/k3e12n...",      // Raw TMDB path
      "release_year": "2019",
      "type": "movie",
      "hindiDubbed": true,
      "tmdbId": 299536,
      "popularity": 350.5,
      "vote_average": 8.4,
      "original_language": "en"
    }
  ],
  "source": "TMDB Search Results",
  "total": 20
}
```

**Key Points:**
- Filters for English language (Hollywood) movies
- Returns raw poster_path values (starts with "/")
- Frontend builds full URLs: `https://image.tmdb.org/t/p/w500${poster_path}`
- Validates TMDB API Key from environment
- Returns 401 if user is not admin

### 2. Bulk Video Import API
**Endpoint:** `POST /api/admin/videos/bulk`

**Request Body:**
```json
{
  "videos": [
    {
      "title": "Avengers: Endgame",
      "description": "The Avengers assemble...",
      "thumbnailUrl": "https://image.tmdb.org/t/p/w500/k3e12n...",
      "tmdbId": "299536",
      "type": "movie",
      "section": "hindi-dubbed",
      "isHindiDubbed": true,
      "audioLanguage": "hi",
      "hlsUrl": "https://example.com/hindi-audio.m3u8",
      "hindiDubHlsUrl": "https://example.com/hindi-audio.m3u8"
    }
  ]
}
```

**Processing:**
- Validates admin authentication
- Creates Video records in database
- Associates with "hindi-dubbed" section
- Sets audio language to "hi"
- Stores TMDB metadata

---

## 👨‍💼 Admin Panel Features

### Path: `/admin/videos/bulk-hindi-dubbed`

**Features:**
1. **Search Interface**
   - Real-time TMDB search
   - Filter by movie title
   - Instant results

2. **Movie Selection**
   - Click cards to select/deselect
   - Visual feedback with red border
   - Selection counter in sidebar

3. **Import Options**
   - Optional Hindi HLS URL
   - Optional English subtitles
   - Optional English audio track

4. **Bulk Import**
   - Select multiple movies
   - Import with one click
   - Real-time toast notifications

**Curated Collections:**
When no search query:
- Shows popular Hollywood movies known to have Hindi dubs
- Automatically fetches real poster images from TMDB
- 20+ pre-configured movies

---

## 🎬 Frontend Display Components

### 1. Hindi Dubbed Section Component
**File:** `src/components/HindiDubbedSection.tsx`

**Features:**
- Fetches movies where `isHindiDubbed = true`
- Displays 12 movies in grid
- Shows "🇮🇳 HINDI" badge
- Hover effects and movie preview
- "View All" link to dedicated section

**Usage:**
```tsx
// Add to your home page (src/app/page.tsx)
import { HindiDubbedSection } from '@/components/HindiDubbedSection';

export default function HomePage() {
  return (
    <>
      {/* Other sections... */}
      <HindiDubbedSection />
      {/* More sections... */}
    </>
  );
}
```

### 2. Video Card Enhancements
**Display Badges:**
```tsx
// In video cards, show language label:
{movie.isHindiDubbed && (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
    <Volume2 className="w-3 h-3" />
    HINDI
  </span>
)}
```

### 3. Video Player Language Support
**File:** `src/components/CustomVideoPlayer.tsx`

Already supports:
- `audioTracks[]` - Multiple audio tracks
- `hlsUrl` - HLS streams
- Language selection in player

No changes needed! Existing player supports multiple audio tracks.

---

## 🔍 TMDB API Integration Details

### Query Logic
```javascript
// For Hollywood movies in Hindi:
GET https://api.themoviedb.org/3/search/movie
  ?api_key=${TMDB_API_KEY}
  &query=${searchTerm}
  &language=en-US
  &original_language=en    // English originals only
  &page=1
```

### Data Mapping
| TMDB Field | Database Field | Frontend Display |
|-----------|----------------|-----------------|
| `title` | `title` | Movie title |
| `poster_path` | Raw path stored | Full URL: `/t/p/w500{path}` |
| `overview` | `description` | Synopsis |
| `release_date` | Extracted year | Release year badge |
| `vote_average` | Not stored | Rating in card |
| `id` | `tmdbId` | Reference for links |
| `original_language` | Implicit "en" | Filter logic |

### Environment Configuration
```env
# .env.local
TMDB_API_KEY=your_actual_key_here
```

Get free API key: https://www.themoviedb.org/settings/api

---

## 📊 Database Queries

### Get All Hindi Dubbed Movies
```prisma
const hindiMovies = await prisma.video.findMany({
  where: {
    isHindiDubbed: true,
    section: 'hindi-dubbed'
  },
  orderBy: { createdAt: 'desc' }
});
```

### Get With Audio Tracks
```prisma
const withAudio = await prisma.video.findMany({
  where: {
    isHindiDubbed: true,
    audioLanguage: 'hi'
  },
  include: {
    audioTracks: true,
    subtitles: true
  }
});
```

---

## 🎯 User Flow

### Admin Workflow
1. Go to Admin Panel → Videos → "Hindi Dubbed" button
2. Search for Hollywood movie (e.g., "Avengers")
3. Results show real TMDB data with posters
4. Click to select multiple movies
5. (Optional) Provide Hindi HLS stream URL
6. Click "Import" button
7. Videos appear in database with:
   - ✓ Real TMDB metadata & posters
   - ✓ Hindi audio flag
   - ✓ Correct section assignment
   - ✓ Audio language = Hindi

### User Viewing
1. Home page shows "Hindi Dubbed Hollywood" section
2. Click movie card → watch page
3. Video player shows:
   - Movie title & poster
   - "🇮🇳 Hindi" badge
   - Audio track options
   - Hindi audio by default
4. Language dropdown to switch audio (if available)

---

## ✅ Data Validation

### Before Import
- ✓ Movie must be from TMDB (verified with original_language = 'en')
- ✓ Title must not be empty
- ✓ TMDB ID must be valid
- ✓ Admin authentication required

### After Import
- ✓ `isHindiDubbed = true`
- ✓ `audioLanguage = 'hi'`
- ✓ `section = 'hindi-dubbed'`
- ✓ Real TMDB poster URL stored
- ✓ Real movie title & description

---

## 🐛 Troubleshooting

### Issue: No results in search
**Solution:**
1. Check TMDB_API_KEY in environment
2. Verify API key is valid at TMDB dashboard
3. Check browser console for API errors
4. Ensure query contains valid movie name

### Issue: Missing poster images
**Solution:**
1. Check if poster_path is null in database
2. Manually verify TMDB has poster for movie
3. Re-import with latest TMDB data
4. Check CDN URL: `https://image.tmdb.org/t/p/w500`

### Issue: No audio tracks in player
**Solution:**
1. Verify `hindiDubHlsUrl` was provided
2. Check if HLS stream is valid (test in browser)
3. Ensure audio tracks are added to video record
4. Verify CORS headers on streaming server

### Issue: Movies not appearing in frontend
**Solution:**
1. Check database: `isHindiDubbed` should be `true`
2. Verify `section` is set to `'hindi-dubbed'`
3. Clear browser cache
4. Check if movie has `parentId` (shouldn't for movies)

---

## 🚀 Performance Tips

1. **Caching:** TMDB results cached by Next.js (60 seconds)
2. **Pagination:** API returns max 20 results
3. **Image Optimization:** Use TMDB CDN URLs for posters
4. **Database:** Added indexes on `isHindiDubbed` and `audioLanguage`
5. **Lazy Loading:** Frontend images use standard `<img>` tags

---

## 📝 Code Examples

### Add Hindi Dubbed Section to Home Page
```tsx
// src/app/page.tsx
import { HindiDubbedSection } from '@/components/HindiDubbedSection';

export default function HomePage() {
  return (
    <div>
      <TrendingSection />
      <NewSection />
      <HindiDubbedSection />  {/* Add this */}
      <RandomSection />
    </div>
  );
}
```

### Display Language Badge in Existing Cards
```tsx
// In VideoCard.tsx
{video.isHindiDubbed && (
  <div className="absolute top-2 left-2">
    <span className="inline-flex items-center gap-1 px-2 py-1 
                     bg-red-600 text-white text-xs font-bold rounded">
      <Volume2 className="w-3 h-3" />
      HINDI
    </span>
  </div>
)}
```

### Audio Track Selection
```tsx
// Video player already supports audioTracks array
// Add tracks when importing:
{
  id: 'hindi-audio',
  videoId: videoId,
  language: 'Hindi',
  url: 'https://example.com/hindi-audio.m3u8'
}
```

---

## 📚 Related Files
- Database Schema: `prisma/schema.prisma`
- Admin Page: `src/app/admin/videos/bulk-hindi-dubbed/page.tsx`
- API Endpoint: `src/app/api/admin/hindi-dub/search/route.ts`
- Frontend Component: `src/components/HindiDubbedSection.tsx`
- Video Player: `src/components/CustomVideoPlayer.tsx` (already supports audio)
- Admin Hub: `src/app/admin/videos/page.tsx` (added navigation button)

---

## ✨ Features Summary

✅ **TMDB Integration**
- Real Hollywood movies only (original_language = 'en')
- Real poster images & metadata
- Verified movie titles & ratings

✅ **Admin Features**
- Search & import from TMDB
- Bulk import support
- Optional HLS URL configuration
- Curated fallback collection

✅ **Frontend Features**
- Dedicated "Hindi Dubbed" section
- Hindi language badges
- Audio track support
- Proper language indicators

✅ **Database**
- Hindi dubbed flag
- Audio language field
- Separate HLS URL for Hindi streams
- Indexed for performance

✅ **User Experience**
- One-click import
- Real-time search
- Visual feedback
- Secure admin panel

---

**Last Updated:** February 7, 2026
**Version:** 1.0
