import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const TMDB_API_KEY = process.env.TMDB_API_KEY || 'YOUR_TMDB_KEY';

// List of popular Hollywood movies known to have Hindi dubs
const POPULAR_HINDI_DUBBED_MOVIES = [
    { title: "Avengers: Endgame", year: 2019, tmdbId: 299536 },
    { title: "Avengers: Infinity War", year: 2018, tmdbId: 299534 },
    { title: "Spider-Man: No Way Home", year: 2021, tmdbId: 634649 },
    { title: "Black Panther", year: 2018, tmdbId: 284054 },
    { title: "Captain America: Civil War", year: 2016, tmdbId: 271110 },
    { title: "Iron Man", year: 2008, tmdbId: 1726 },
    { title: "Thor: Ragnarok", year: 2017, tmdbId: 284053 },
    { title: "Doctor Strange", year: 2016, tmdbId: 284052 },
    { title: "Guardians of the Galaxy", year: 2014, tmdbId: 118340 },
    { title: "Ant-Man", year: 2015, tmdbId: 102462 },
    { title: "Captain Marvel", year: 2019, tmdbId: 299537 },
    { title: "Black Widow", year: 2021, tmdbId: 678732 },
    { title: "Shang-Chi", year: 2021, tmdbId: 566525 },
    { title: "Eternals", year: 2021, tmdbId: 524434 },
    { title: "Fast & Furious 9", year: 2021, tmdbId: 38700 },
    { title: "Jumanji: The Next Level", year: 2019, tmdbId: 352860 },
    { title: "Aquaman", year: 2018, tmdbId: 297801 },
    { title: "Wonder Woman", year: 2017, tmdbId: 297761 },
    { title: "Justice League", year: 2017, tmdbId: 141052 },
    { title: "Batman v Superman", year: 2016, tmdbId: 209112 },
    { title: "The Dark Knight", year: 2008, tmdbId: 155 },
    { title: "Inception", year: 2010, tmdbId: 27205 },
    { title: "Interstellar", year: 2014, tmdbId: 157336 },
    { title: "The Matrix", year: 1999, tmdbId: 603 },
    { title: "John Wick", year: 2014, tmdbId: 245891 },
    { title: "Mission: Impossible - Fallout", year: 2018, tmdbId: 353486 },
    { title: "Transformers", year: 2007, tmdbId: 1858 },
    { title: "Pirates of the Caribbean", year: 2003, tmdbId: 58 },
    { title: "The Lion King", year: 2019, tmdbId: 424694 },
    { title: "Frozen", year: 2013, tmdbId: 109445 },
    { title: "Moana", year: 2016, tmdbId: 354912 },
    { title: "Coco", year: 2017, tmdbId: 356574 },
    { title: "Toy Story 4", year: 2019, tmdbId: 301528 },
    { title: "Finding Nemo", year: 2003, tmdbId: 12 },
    { title: "The Incredibles", year: 2004, tmdbId: 157336 },
    { title: "Ratatouille", year: 2007, tmdbId: 9322 },
    { title: "Cars", year: 2006, tmdbId: 10681 },
    { title: "Monsters, Inc.", year: 2001, tmdbId: 585 },
    { title: "Shrek", year: 2001, tmdbId: 808 },
    { title: "Kung Fu Panda", year: 2008, tmdbId: 10590 },
    { title: "Madagascar", year: 2005, tmdbId: 9459 },
    { title: "Ice Age", year: 2002, tmdbId: 590 },
    { title: "The Simpsons Movie", year: 2007, tmdbId: 137113 },
    { title: "South Park: Bigger Longer & Uncut", year: 1999, tmdbId: 341821 },
    { title: "Family Guy Presents Stewie Griffin", year: 2005, tmdbId: 382322 },
    { title: "Titanic", year: 1997, tmdbId: 597 },
    { title: "Avatar", year: 2009, tmdbId: 19995 },
    { title: "Avatar: The Way of Water", year: 2022, tmdbId: 76600 },
    { title: "Jurassic World", year: 2015, tmdbId: 135397 },
    { title: "Jurassic Park", year: 1993, tmdbId: 329 },
    { title: "King Kong", year: 2005, tmdbId: 12477 },
    { title: "Godzilla", year: 2014, tmdbId: 124905 },
    { title: "Pacific Rim", year: 2013, tmdbId: 68726 },
    { title: "Star Wars: The Force Awakens", year: 2015, tmdbId: 140607 },
    { title: "Star Wars: The Last Jedi", year: 2017, tmdbId: 181808 },
    { title: "Star Wars: The Rise of Skywalker", year: 2019, tmdbId: 348350 },
    { title: "Rogue One", year: 2016, tmdbId: 330459 },
    { title: "Solo", year: 2018, tmdbId: 351282 },
    { title: "Harry Potter and the Sorcerer's Stone", year: 2001, tmdbId: 671 },
    { title: "Harry Potter and the Chamber of Secrets", year: 2002, tmdbId: 672 },
    { title: "Harry Potter and the Prisoner of Azkaban", year: 2004, tmdbId: 673 },
    { title: "Harry Potter and the Goblet of Fire", year: 2005, tmdbId: 674 },
    { title: "Harry Potter and the Order of the Phoenix", year: 2007, tmdbId: 675 },
    { title: "Harry Potter and the Half-Blood Prince", year: 2009, tmdbId: 676 },
    { title: "Harry Potter and the Deathly Hallows - Part 1", year: 2010, tmdbId: 677 },
    { title: "Harry Potter and the Deathly Hallows - Part 2", year: 2011, tmdbId: 678 },
    { title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, tmdbId: 120 },
    { title: "The Lord of the Rings: The Two Towers", year: 2002, tmdbId: 121 },
    { title: "The Lord of the Rings: The Return of the King", year: 2003, tmdbId: 122 },
    { title: "The Hobbit: An Unexpected Journey", year: 2012, tmdbId: 49051 },
    { title: "The Hobbit: The Desolation of Smaug", year: 2013, tmdbId: 122917 },
    { title: "The Hobbit: The Battle of the Five Armies", year: 2014, tmdbId: 122923 },
    { title: "The Chronicles of Narnia", year: 2005, tmdbId: 12244 },
    { title: "Percy Jackson & the Olympians", year: 2010, tmdbId: 47555 },
    { title: "The Hunger Games", year: 2012, tmdbId: 70160 },
    { title: "Divergent", year: 2014, tmdbId: 176545 },
    { title: "The Maze Runner", year: 2014, tmdbId: 76757 },
    { title: "The Fault in Our Stars", year: 2014, tmdbId: 278927 },
    { title: "The Notebook", year: 2004, tmdbId: 258 },
    { title: "A Walk to Remember", year: 2002, tmdbId: 10888 },
    { title: "The Princess Diaries", year: 2001, tmdbId: 12985 },
    { title: "Mean Girls", year: 2004, tmdbId: 10681 },
    { title: "Clueless", year: 1995, tmdbId: 10749 },
    { title: "10 Things I Hate About You", year: 1999, tmdbId: 10587 },
    { title: "She's the Man", year: 2006, tmdbId: 10746 },
    { title: "John Tucker Must Die", year: 2006, tmdbId: 10746 },
    { title: "Bring It On", year: 2000, tmdbId: 10746 },
    { title: "Save the Last Dance", year: 2001, tmdbId: 10746 },
    { title: "Honey", year: 2003, tmdbId: 10746 },
    { title: "Step Up", year: 2006, tmdbId: 10746 },
    { title: "Dirty Dancing", year: 1987, tmdbId: 10746 },
    { title: "Grease", year: 1978, tmdbId: 10746 },
    { title: "Saturday Night Fever", year: 1977, tmdbId: 10746 },
    { title: "Footloose", year: 1984, tmdbId: 10746 },
    { title: "Flashdance", year: 1983, tmdbId: 10746 },
    { title: "Top Gun", year: 1986, tmdbId: 10746 },
    { title: "Top Gun: Maverick", year: 2022, tmdbId: 361743 },
    { title: "Die Hard", year: 1988, tmdbId: 562 },
    { title: "Terminator 2", year: 1991, tmdbId: 218 },
    { title: "Aliens", year: 1986, tmdbId: 218 },
    { title: "Predator", year: 1987, tmdbId: 218 },
    { title: "RoboCop", year: 1987, tmdbId: 218 },
    { title: "Total Recall", year: 1990, tmdbId: 218 },
    { title: "Basic Instinct", year: 1992, tmdbId: 218 },
    { title: "Lethal Weapon", year: 1987, tmdbId: 218 },
    { title: "Beverly Hills Cop", year: 1984, tmdbId: 218 },
    { title: "Coming to America", year: 1988, tmdbId: 218 },
    { title: "Trading Places", year: 1983, tmdbId: 218 },
    { title: "Ghostbusters", year: 1984, tmdbId: 218 },
    { title: "Back to the Future", year: 1985, tmdbId: 218 },
    { title: "E.T. the Extra-Terrestrial", year: 1982, tmdbId: 218 },
    { title: "Jaws", year: 1975, tmdbId: 218 },
    { title: "Close Encounters of the Third Kind", year: 1977, tmdbId: 218 },
    { title: "Raiders of the Lost Ark", year: 1981, tmdbId: 218 },
    { title: "Indiana Jones and the Temple of Doom", year: 1984, tmdbId: 218 },
    { title: "Indiana Jones and the Last Crusade", year: 1989, tmdbId: 218 },
    { title: "Indiana Jones and the Kingdom of the Crystal Skull", year: 2008, tmdbId: 218 },
];

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'movie';

    try {
        let results = [];

        if (query) {
            // Search TMDB for specific title
            const mediaType = type === 'series' ? 'tv' : 'movie';
            const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;
            
            console.log('Fetching TMDB for search:', url);
            const res = await fetch(url, { cache: 'no-store' });

            if (res.ok) {
                const data = await res.json();
                results = (data.results || []).map((item: any) => ({
                    id: item.id,
                    title: item.title || item.name,
                    overview: item.overview || 'No description available',
                    poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
                    release_year: item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || null,
                    type: type,
                    hindiDubbed: true,
                    tmdbId: item.id,
                    popularity: item.popularity,
                    vote_average: item.vote_average,
                }));
            }
        } else {
            // Return curated list of popular Hindi dubbed movies
            results = POPULAR_HINDI_DUBBED_MOVIES.map(movie => ({
                id: movie.tmdbId,
                title: movie.title,
                overview: `${movie.title} (${movie.year}) - Popular Hollywood movie available in Hindi dubbed version`,
                poster_path: `https://image.tmdb.org/t/p/w780${movie.tmdbId}`,
                release_year: movie.year.toString(),
                type: type,
                hindiDubbed: true,
                tmdbId: movie.tmdbId,
                popularity: 100,
                vote_average: 8.5,
            }));

            // Fetch actual poster images for a few movies
            for (let i = 0; i < Math.min(10, results.length); i++) {
                try {
                    const posterRes = await fetch(`https://api.themoviedb.org/3/movie/${results[i].tmdbId}?api_key=${TMDB_API_KEY}`, { cache: 'no-store' });
                    if (posterRes.ok) {
                        const posterData = await posterRes.json();
                        if (posterData.poster_path) {
                            results[i].poster_path = `https://image.tmdb.org/t/p/w780${posterData.poster_path}`;
                        }
                        if (posterData.overview) {
                            results[i].overview = posterData.overview;
                        }
                    }
                } catch (error) {
                    console.log(`Failed to fetch poster for ${results[i].title}:`, error);
                }
            }
        }

        // Sort by popularity (TMDB results first, then curated)
        results.sort((a: any, b: any) => b.popularity - a.popularity);

        return NextResponse.json({
            results: results.slice(0, 20),
            source: query ? 'TMDB Search Results' : 'Curated Hindi Dubbed Collection',
            total: results.length,
        });
    } catch (error: any) {
        console.error('Hindi Dub Search Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch Hindi dubbed content',
            results: []
        }, { status: 500 });
    }
}
