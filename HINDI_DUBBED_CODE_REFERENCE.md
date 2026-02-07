# 🇮🇳 Hindi Dubbed Implementation - Code Reference

## 📂 Files Modified/Created

### 1. Database Schema
**File:** `prisma/schema.prisma`

**Changes:**
```prisma
model Video {
  // ... existing fields ...
  
  // NEW: Hindi Dubbed Support
  section       String   @default("new")     // "hindi-dubbed" section
  isHindiDubbed Boolean  @default(false)     // Flag
  audioLanguage String?                      // "hi" for Hindi
  hindiDubHlsUrl String?                     // Separate HLS stream
  
  @@index([isHindiDubbed])
  @@index([audioLanguage])
}
```

**Migration:**
```bash
npx prisma db push --accept-data-loss
```

---

### 2. Admin Import Page
**File:** `src/app/admin/videos/bulk-hindi-dubbed/page.tsx`

**Key Features:**
- Search TMDB for Hollywood movies
- Real data with actual TMDB posters
- Select multiple movies
- Bulk import with Hindi audio flag
- Optional HLS URL configuration

**URL:** `/admin/videos/bulk-hindi-dubbed`

**Screen Layout:**
```
┌─ Header ────────────────────────────────┐
│ 🌍 Hindi Dubbed Hollywood Movies        │
│ [Import 3 Selected]                     │
├─────────────────────────────────────────┤
│ SEARCH & RESULTS            │ OPTIONS   │
│ ┌─────────────────────┐     │ ┌───────┐ │
│ │ Search box...       │     │ │Selectd: 3
│ │ [Search]            │     │ │◆ ◆ ◆   │
│ ├─────────────────────┤     │ │       │
│ │ [Movie] [Movie]...  │     │ │Hindi  │
│ │ (2/3 grid)          │     │ │HLS URL│
│ │                     │     │ │Advanced
│ └─────────────────────┘     └───────┘ │
└─────────────────────────────────────────┘
```

---

### 3. Hindi Dub Search API
**File:** `src/app/api/admin/hindi-dub/search/route.ts`

**Endpoint:** `GET /api/admin/hindi-dub/search`

**Query Parameters:**
```typescript
query?:     string   // Search term
type?:      string   // 'movie' | 'series' | 'anime'
```

**Key Updates:**
```typescript
// 1. API Key from environment (not hardcoded)
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// 2. Filter for Hollywood (English language)
const url = `${TMDB_BASE_URL}/search/movie
  ?api_key=${TMDB_API_KEY}
  &query=${query}
  &original_language=en   // English originals only
`;

// 3. Return raw poster_path (not full URL)
results = results.map(item => ({
  id: item.id,
  title: item.title,
  poster_path: item.poster_path,  // e.g., "/k3e12n..."
  release_year: item.release_date?.split('-')[0],
  vote_average: item.vote_average,
  tmdbId: item.id,
  hindiDubbed: true,
}));
```

**Response Example:**
```json
{
  "results": [
    {
      "id": 299536,
      "title": "Avengers: Endgame",
      "overview": "After the devastating events...",
      "poster_path": "/or86db9d3b5t6bfj.jpg",
      "release_year": "2019",
      "type": "movie",
      "hindiDubbed": true,
      "tmdbId": 299536,
      "popularity": 350.5,
      "vote_average": 8.4,
      "original_language": "en"
    }
  ],
  "total": 20
}
```

---

### 4. Frontend Hindi Section
**File:** `src/components/HindiDubbedSection.tsx`

**Component Template:**
```tsx
export async function HindiDubbedSection() {
  const hindiDubbedMovies = await prisma.video.findMany({
    where: {
      isHindiDubbed: true,
      section: { in: ['hindi-dubbed', 'new', 'trending'] },
      parentId: null
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  if (hindiDubbedMovies.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Globe className="w-8 h-8 text-red-600" />
          <h2>🇮🇳 Hindi Dubbed Hollywood</h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {hindiDubbedMovies.map(movie => (
            <Link key={movie.id} href={`/watch/${movie.id}`}>
              {/* Poster with Hindi Badge */}
              <div className="relative aspect-[2/3]">
                <img src={movie.thumbnailUrl} alt={movie.title} />
                
                {/* Hindi Badge */}
                <div className="absolute top-2 left-2">
                  <span className="bg-red-600 text-white 
                                   text-xs font-bold rounded px-2 py-1
                                   flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    HINDI
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-8 text-center">
          <Link href="/results?section=hindi-dubbed">
            View All Hindi Dubbed Movies →
          </Link>
        </div>
      </div>
    </section>
  );
}
```

**Usage:**
```tsx
// src/app/page.tsx
import { HindiDubbedSection } from '@/components/HindiDubbedSection';

export default function HomePage() {
  return (
    <>
      <TrendingSection />
      <NewSection />
      <HindiDubbedSection />      {/* Add here */}
      <RandomSection />
    </>
  );
}
```

---

### 5. Admin Navigation
**File:** `src/app/admin/videos/page.tsx`

**Added Button:**
```tsx
import { Plus, Globe } from 'lucide-react';

<Link
  href="/admin/videos/bulk-hindi-dubbed"
  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 
             hover:bg-zinc-700 rounded-lg font-medium
             transition-colors border border-white/5"
>
  <Globe className="w-5 h-5 text-green-500" /> Hindi Dubbed
</Link>
```

---

## 🔄 Data Flow Diagram

```
Admin Panel                 API                         Database              Frontend
────────────────────────────────────────────────────────────────────────────────────

User searches
"Avengers"
    │
    ├→ GET /api/admin/hindi-dub/search?query=avengers
    │     │
    │     ├→ Query TMDB API (with API Key)
    │     ├→ Filter original_language = 'en'
    │     └→ Return raw poster_path + metadata
    │
    └← Display results {
       "title": "Avengers: Endgame",
       "poster_path": "/k3e12n...",  // Raw path!
       "vote_average": 8.4,
       "tmdbId": 299536
    }

User selects & imports
    │
    ├→ POST /api/admin/videos/bulk
    │     {
    │       "videos": [{
    │         "title": "Avengers: Endgame",
    │         "section": "hindi-dubbed",
    │         "isHindiDubbed": true,
    │         "audioLanguage": "hi",
    │         "tmdbId": "299536",
    │         "thumbnailUrl": "https://image.tmdb.org/t/p/w500/k3e12n..."
    │       }]
    │     }
    │
    ├→ Create Video record in DB
    │     {
    │       "id": "cm123abc",
    │       "title": "Avengers: Endgame",
    │       "thumbnailUrl": "https://image.tmdb.org/t/p/w500/k3e12n...",
    │       "isHindiDubbed": true,
    │       "audioLanguage": "hi",
    │       "section": "hindi-dubbed"
    │     }
    │
    └← Success response


Home Page Renders
    │
    ├→ <HindiDubbedSection />
    │     │
    │     ├→ Query DB: WHERE isHindiDubbed = true
    │     ├→ Get 12 movies with full URLs stored
    │     ├→ Render grid with Hindi badges
    │     └→ Links to watch page
    │
    └← Display:
       "🇮🇳 Hindi Dubbed Hollywood"
       [Movie Poster] [Movie Poster] ...
```

---

## 🎯 Query Examples

### Get Hindi Dubbed Movies
```prisma
const movies = await prisma.video.findMany({
  where: { 
    isHindiDubbed: true,
    section: 'hindi-dubbed'
  },
  include: {
    audioTracks: true,
    subtitles: true
  },
  orderBy: { createdAt: 'desc' }
});
```

### By Audio Language
```prisma
const hindiAudio = await prisma.video.findMany({
  where: { audioLanguage: 'hi' }
});
```

### Get Specific Movie
```prisma
const movie = await prisma.video.findUnique({
  where: { id: 'cm123abc' },
  include: {
    audioTracks: true,
    subtitles: true
  }
});
```

---

## 📊 Expected Data Structure

### Video Record
```json
{
  "id": "cm123abc",
  "title": "Avengers: Endgame",
  "description": "After the devastating events inflicted by Thanos...",
  "thumbnailUrl": "https://image.tmdb.org/t/p/w500/or86db9d3b5t6bfj.jpg",
  "type": "movie",
  "section": "hindi-dubbed",
  "isHindiDubbed": true,
  "audioLanguage": "hi",
  "tmdbId": "299536",
  "hlsUrl": null,
  "hindiDubHlsUrl": "https://example.com/hindi.m3u8",
  "createdAt": "2026-02-07T10:30:00Z",
  "updatedAt": "2026-02-07T10:30:00Z"
}
```

### Audio Track
```json
{
  "id": "audio1",
  "videoId": "cm123abc",
  "language": "Hindi",
  "url": "https://example.com/hindi-dub.m3u8"
}
```

### Subtitle
```json
{
  "id": "sub1",
  "videoId": "cm123abc",
  "language": "English",
  "url": "https://example.com/english.vtt"
}
```

---

## 🌐 URL Structure

### Admin URLs
- `/admin/videos` - Videos list & navigation
- `/admin/videos/bulk-hindi-dubbed` - Hindi dubbed import

### Public URLs
- `/watch/[id]` - Watch video (already exists)
- `/results?section=hindi-dubbed` - View all Hindi dubbed

### API URLs
- `GET /api/admin/hindi-dub/search` - Search endpoint
- `POST /api/admin/videos/bulk` - Bulk import endpoint

---

## 🔐 Authentication

All admin endpoints require:
```javascript
const session = await getServerSession(authOptions);
if (!session?.user || session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 🚀 Performance Optimizations

### Database
```prisma
// Indexes added for fast queries
@@index([isHindiDubbed])
@@index([audioLanguage])
```

### Caching
```javascript
// TMDB API responses cached by Next.js
const posterRes = await fetch(url, { cache: 'no-store' });
```

### Images
```
TMDB CDN: https://image.tmdb.org/t/p/w500{path}
Breakpoints: w300, w500, w780, w1280
```

---

## 🎨 Frontend Components Needing Updates

### Optional: Add to VideoCard.tsx
```tsx
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

### Optional: Add to VideoSection.tsx
```tsx
// Show different sections including hindi-dubbed
const sections = ['trending', 'new', 'hindi-dubbed', 'random'];
```

---

## 📋 Checklist for Integration

- [ ] Run database migration: `npx prisma db push`
- [ ] Verify TMDB_API_KEY in .env.local
- [ ] Test admin page: `/admin/videos/bulk-hindi-dubbed`
- [ ] Search for "Avengers" - verify real results
- [ ] Import 3-5 movies
- [ ] Check database: movies have isHindiDubbed = true
- [ ] Visit home page - see Hindi Dubbed section
- [ ] Click movie - watch page loads
- [ ] Add HindiDubbedSection to home page (optional)
- [ ] Test player - verify audio tracks work

---

## 🧪 Quick Test Commands

```bash
# Check database migration
npx prisma studio

# Test API
curl "http://localhost:3000/api/admin/hindi-dub/search?query=avengers"

# Check logs
# Watch for: "✓ Found 20 real TMDB results for 'avengers'"
```

---

## 📚 Related Documentation Files

- `HINDI_DUBBED_SETUP.md` - Quick setup guide
- `HINDI_DUBBED_GUIDE.md` - Comprehensive documentation

---

**Complete Implementation Ready! 🎉**
