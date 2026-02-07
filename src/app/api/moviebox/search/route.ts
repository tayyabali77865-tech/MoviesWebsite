import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'movie';
    const page = searchParams.get('page') || '1';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Mock MovieBox API response - replace with actual MovieBox API
    // This is a simulation of what MovieBox API would return
    const mockResults = generateMockResults(query, type, parseInt(page));
    
    return NextResponse.json({
      results: mockResults,
      page: parseInt(page),
      total_pages: 5, // Mock pagination
      total_results: mockResults.length * 5
    });

  } catch (error) {
    console.error('MovieBox search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

function generateMockResults(query: string, type: string, page: number) {
  const baseResults = [
    {
      id: `mb_${Date.now()}_1`,
      title: `${query} - MovieBox Result 1`,
      original_title: `${query} - MovieBox Result 1`,
      overview: `This is a great ${type} from MovieBox matching your search for "${query}". High quality streaming available.`,
      poster_path: `https://via.placeholder.com/500x750/FF6B6B/FFFFFF?text=${encodeURIComponent(query)}+1`,
      backdrop_path: `https://via.placeholder.com/1280x720/4ECDC4/FFFFFF?text=${encodeURIComponent(query)}+1`,
      release_date: '2024-01-15',
      vote_average: 8.5,
      popularity: 95.2,
      video: true,
      adult: false,
      media_type: type
    },
    {
      id: `mb_${Date.now()}_2`,
      title: `${query} - MovieBox Result 2`,
      original_title: `${query} - MovieBox Result 2`,
      overview: `Another excellent ${type} from MovieBox. This content matches your search for "${query}" perfectly.`,
      poster_path: `https://via.placeholder.com/500x750/45B7D1/FFFFFF?text=${encodeURIComponent(query)}+2`,
      backdrop_path: `https://via.placeholder.com/1280x720/96CEB4/FFFFFF?text=${encodeURIComponent(query)}+2`,
      release_date: '2024-02-20',
      vote_average: 7.8,
      popularity: 87.3,
      video: true,
      adult: false,
      media_type: type
    },
    {
      id: `mb_${Date.now()}_3`,
      title: `${query} - MovieBox Result 3`,
      original_title: `${query} - MovieBox Result 3`,
      overview: `Top rated ${type} from MovieBox database. Perfect match for "${query}" search query.`,
      poster_path: `https://via.placeholder.com/500x750/FFA07A/FFFFFF?text=${encodeURIComponent(query)}+3`,
      backdrop_path: `https://via.placeholder.com/1280x720/DDA0DD/FFFFFF?text=${encodeURIComponent(query)}+3`,
      release_date: '2024-03-10',
      vote_average: 9.1,
      popularity: 92.7,
      video: true,
      adult: false,
      media_type: type
    },
    {
      id: `mb_${Date.now()}_4`,
      title: `${query} - MovieBox Result 4`,
      original_title: `${query} - MovieBox Result 4`,
      overview: `Popular ${type} from MovieBox. Great content for "${query}" search results.`,
      poster_path: `https://via.placeholder.com/500x750/98D8C8/FFFFFF?text=${encodeURIComponent(query)}+4`,
      backdrop_path: `https://via.placeholder.com/1280x720/F7DC6F/FFFFFF?text=${encodeURIComponent(query)}+4`,
      release_date: '2024-04-05',
      vote_average: 8.2,
      popularity: 89.1,
      video: true,
      adult: false,
      media_type: type
    },
    {
      id: `mb_${Date.now()}_5`,
      title: `${query} - MovieBox Result 5`,
      original_title: `${query} - MovieBox Result 5`,
      overview: `Latest ${type} from MovieBox streaming. Perfect match for your "${query}" search.`,
      poster_path: `https://via.placeholder.com/500x750/BB8FCE/FFFFFF?text=${encodeURIComponent(query)}+5`,
      backdrop_path: `https://via.placeholder.com/1280x720/85C1E2/FFFFFF?text=${encodeURIComponent(query)}+5`,
      release_date: '2024-05-12',
      vote_average: 7.5,
      popularity: 84.6,
      video: true,
      adult: false,
      media_type: type
    }
  ];

  // Return different results based on page
  const startIndex = (page - 1) * 5;
  return baseResults.slice(startIndex, startIndex + 5);
}
