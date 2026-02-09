import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './AllMovies.css';

const toPoster = (poster) => {
  if (!poster) return 'https://via.placeholder.com/300x450?text=No+Image';
  return poster.startsWith('http') ? poster : `https://image.tmdb.org/t/p/w500${poster}`;
};

export default function AllMovies() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const normalize = (value) =>
    (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/movies'),
      fetch('/api/movies/coming-soon'),
      fetch('/api/genres'),
    ])
      .then(async ([allRes, comingRes, genresRes]) => {
        if (!allRes.ok) throw new Error('Failed to load movies');
        if (!comingRes.ok) throw new Error('Failed to load coming soon');
        const [allData, comingData, genreData] = await Promise.all([
          allRes.json(),
          comingRes.json(),
          genresRes.ok ? genresRes.json() : Promise.resolve([]),
        ]);

        const genreMap = new Map();
        (Array.isArray(genreData) ? genreData : []).forEach((g) => {
          if (g?.id && g?.type) genreMap.set(String(g.id), g.type);
        });

        const normalizedComing = (Array.isArray(comingData) ? comingData : []).map((m) => ({
          ...m,
          genre: m.genre || genreMap.get(String(m.genre_id)) || 'Coming soon',
          isComingSoon: true,
        }));

        const normalizedMovies = Array.isArray(allData)
          ? allData.map((m) => ({ ...m, isComingSoon: false }))
          : [];

        setGenres(['All', ...Array.from(new Set([...normalizedMovies, ...normalizedComing].map((m) => m.genre || '—')))]);
        setMovies([...normalizedMovies, ...normalizedComing]);
        setError('');
      })
      .catch((err) => setError(err.message || 'Could not load movies'))
      .finally(() => setLoading(false));
  }, []);

  // Debounce the raw query so filtering is less jittery on fast typing
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(normalize(query)), 180);
    return () => clearTimeout(handle);
  }, [query]);

  const filtered = useMemo(() => {
    const term = debouncedQuery;
    const bySearch = movies.filter((m) => {
      if (!term) return true;
      const title = normalize(m.title);
      return title.includes(term);
    });

    return bySearch.filter((m) => {
      if (selectedGenre === 'All') return true;
      return (m.genre || '—') === selectedGenre;
    });
  }, [movies, debouncedQuery, selectedGenre]);

  return (
    <section className="section all-movies" id="movies">
      <header className="section-header">
        <h2 className="title">All Movies</h2>
        <div className="movies-actions">
          <div className="movies-search-wrap">
            <input
              type="search"
              placeholder="Search by title"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="movies-search"
              aria-label="Search movies by title"
            />
            {query && (
              <button
                type="button"
                className="movies-search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <select
            className="movies-genre"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <span className="movies-count">{filtered.length} movie{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </header>

      {loading && <div className="movies-loading">Loading movies…</div>}
      {error && !loading && <div className="movies-error">{error}</div>}

      {!loading && !error && (
        <div className="movies-grid">
          {filtered.map((movie) => (
            <Link key={movie.id} to={`/movie/${movie.id}`} className="movie-card">
              <div className="poster-wrap">
                <img src={toPoster(movie.poster)} alt={movie.title} loading="lazy" />
              </div>
              <div className="movie-meta">
                <h3>{movie.title}</h3>
                <p className="movie-genre">{movie.genre || '—'}</p>
                <p className="movie-overview">{movie.overview?.slice(0, 120) || 'No overview yet.'}</p>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="movies-empty">No movies match your search.</div>
          )}
        </div>
      )}
    </section>
  );
}
