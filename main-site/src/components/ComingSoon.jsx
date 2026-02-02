import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ComingSoon.css';

export default function ComingSoon() {
  const rowRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch coming soon movies
    fetch('/api/movies/coming-soon')
      .then(res => res.json())
      .then(data => {
        console.log('✓ Coming soon data loaded:', data.length, 'movies');
        if (data.length > 0) {
          console.log('  First:', data[0].title, 'release:', data[0].release_date);
        }
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load coming soon movies:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const check = () => {
      setCanPrev(el.scrollLeft > 8);
      setCanNext(el.scrollLeft + el.clientWidth + 8 < el.scrollWidth);
    };

    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [items]);

  const scrollByWidth = (dir = 1) => {
    const el = rowRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: step, behavior: 'smooth' });
  };

  return (
    <section className="section coming-soon">
      <div className="title">Coming Soon</div>
      <div className="scroll-outer">
        <button
          className="nav-button prev"
          onClick={() => scrollByWidth(-1)}
          disabled={!canPrev}
          aria-label="Scroll left"
        >
          ‹
        </button>
        <div className="cards" ref={rowRef}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <article key={i} className="card large" aria-label={`Coming soon ${i}`}>
                <div className="visual" />
                <div className="meta">Coming soon</div>
              </article>
            ))
          ) : items.length > 0 ? (
            items.map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${movie.id}`}
                className="card large"
                aria-label={movie.title}
              >
                <div className="visual" style={{
                  backgroundImage: movie.poster ? `url(https://image.tmdb.org/t/p/w500${movie.poster})` : 'none'
                }} />
                <div className="meta">{movie.title}</div>
              </Link>
            ))
          ) : (
            <p>No coming soon movies</p>
          )}
        </div>
        <button
          className="nav-button next"
          onClick={() => scrollByWidth(1)}
          disabled={!canNext}
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </section>
  );
}