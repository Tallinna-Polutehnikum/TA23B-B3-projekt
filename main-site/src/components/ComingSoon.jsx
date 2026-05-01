import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './ComingSoon.css';
import { getPosterSrc } from '../utils/movieUi';

export default function ComingSoon() {
  const [movies, setMovies] = useState([]);
  const scrollerRef = useRef(null);

  const refreshComingSoon = useCallback(async () => {
    try {
      const res = await fetch('/api/movies/coming-soon', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to load coming soon (${res.status})`);
      }
      const data = await res.json();
      setMovies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load movies', err);
    }
  }, []);

  useEffect(() => {
    refreshComingSoon();

    const intervalId = window.setInterval(() => {
      refreshComingSoon();
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshComingSoon]);

  const scroll = (dir) => {
    const cardWidth = scrollerRef.current?.querySelector('.card')?.offsetWidth || 440;
    const gap = 24;
    const scrollAmount = dir * ((cardWidth + gap) * 4);
    scrollerRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="section coming-soon">
      <header className="section-header">
        <h2 className="title">Coming Soon</h2>
      </header>

      <div className="scroll-outer">
        <button
          className="nav-button prev"
          onClick={() => scroll(-1)}
          disabled={!movies.length}
          aria-label="Scroll left"
        >
          ‹
        </button>

        <div className="scroll-row" ref={scrollerRef}>
          {movies.map((movie) => (
            <Link key={movie.id} to={`/movie/${movie.id}`} className="card">
              {movie.poster && (
                <img
                  src={getPosterSrc(movie.poster, 'w500')}
                  alt={movie.title}
                  loading="lazy"
                />
              )}
              <div className="meta">
                <h3>{movie.title}</h3>
              </div>
            </Link>
          ))}
        </div>

        <button
          className="nav-button next"
          onClick={() => scroll(1)}
          disabled={!movies.length}
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </section>
  );
}