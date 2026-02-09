import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './ComingSoon.css';

export default function ComingSoon() {
  const [movies, setMovies] = useState([]);
  const scrollerRef = useRef(null);

  useEffect(() => {
    fetch('/api/movies/coming-soon')
      .then((res) => res.json())
      .then(setMovies)
      .catch((err) => console.error('Failed to load movies', err));
  }, []);

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
                  src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
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