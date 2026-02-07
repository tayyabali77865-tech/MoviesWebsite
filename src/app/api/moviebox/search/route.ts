import { NextRequest, NextResponse } from 'next/server';

// TMDB API for metadata
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'movie';
    const page = searchParams.get('page') || '1';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    if (!TMDB_API_KEY) {
      console.error('TMDB_API_KEY environment variable is not set');
      return NextResponse.json({ error: 'TMDB API Key not configured' }, { status: 500 });
    }

    // Fetch real data from TMDB
    let tmdbMetadata = null;
    try {
      const tmdbEndpoint = type === 'movie' ? 'search/movie' : 'search/tv';
      const tmdbUrl = `${TMDB_BASE_URL}/${tmdbEndpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
      console.log('Fetching TMDB:', tmdbUrl.replace(TMDB_API_KEY, 'HIDDEN'));
      const tmdbResponse = await fetch(tmdbUrl);
      console.log('TMDB Response status:', tmdbResponse.status);
      
      if (tmdbResponse.ok) {
        tmdbMetadata = await tmdbResponse.json();
        console.log('TMDB Data received:', tmdbMetadata.results?.length, 'results');
        
        // Validate that we got real results
        if (tmdbMetadata.results && tmdbMetadata.results.length > 0) {
          console.log(`✓ Found ${tmdbMetadata.results.length} real TMDB results for "${query}"`);
        } else {
          console.log('⚠ TMDB returned no results');
        }
      } else {
        console.error('✗ TMDB failed, status:', tmdbResponse.status);
        const errorText = await tmdbResponse.text();
        console.error('TMDB error response:', errorText);
      }
    } catch (error) {
      console.error('✗ TMDB fetch failed:', error);
    }

    // Convert TMDB data to response format
    const results = convertTmdbResults(query, type, tmdbMetadata);
    
    return NextResponse.json({
      results,
      page: parseInt(page),
      total_pages: tmdbMetadata?.total_pages || 1,
      total_results: tmdbMetadata?.total_results || results.length
    });

  } catch (error) {
    console.error('MovieBox search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

function convertTmdbResults(query: string, type: string, tmdbMetadata: any) {
  const results = [];
  
  if (tmdbMetadata && tmdbMetadata.results && tmdbMetadata.results.length > 0) {
    console.log(`✓ Converting ${tmdbMetadata.results.length} TMDB results`);
    
    // Map real TMDB results
    tmdbMetadata.results.forEach((item: any, index: number) => {
      const title = item.title || item.original_title || item.name;
      console.log(`  [${index + 1}] ${title} (${item.release_date || item.first_air_date || 'N/A'})`);
      
      results.push({
        id: `tmdb_${item.id}`,
        title: title,
        original_title: item.original_title || item.original_name || title,
        overview: item.overview || '',
        poster_path: item.poster_path || '', // Return raw path - frontend will concatenate
        backdrop_path: item.backdrop_path || '', // Return raw path - frontend will concatenate
        release_date: item.release_date || item.first_air_date || '',
        vote_average: item.vote_average || 0,
        popularity: item.popularity || 0,
        video: false,
        adult: item.adult || false,
        media_type: type,
        moviebox_url: '',
        video_url: ''
      });
    });
  } else {
    console.error(`✗ No TMDB results found for "${query}"`);
    // Return empty instead of giving fake data
    console.log('Returning empty results - please try a different search query');
  }

  return results;
}
