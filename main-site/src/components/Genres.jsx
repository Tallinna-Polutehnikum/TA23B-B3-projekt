import React, { useRef, useState, useEffect } from 'react';
import './Genres.css';

const DEFAULT_GENRES = [
  'Horror','Comedy','Historycal','Animation','Anime','Documentary','Drama','Fantasy',
  'Family','Action','Music','SCI-FI','War','Sport','Adventure'
];

export default function Genres({ genres = DEFAULT_GENRES, onSelect }) {
  const rowRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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
  }, [genres]);

  const scrollByWidth = (dir = 1) => {
    const el = rowRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.8) * dir;
    el.scrollBy({ left: step, behavior: 'smooth' });
  };

  const handleSelect = (genre) => {
    if (typeof onSelect === 'function') onSelect(genre);
    else console.log('Selected genre:', genre);
  };

  return (
    <section className="section genres-carousel" aria-labelledby="genres-title">
      <div id="genres-title" className="title">Žanrid</div>

      <div className="scroll-outer">
        <button
          className="nav-button prev"
          onClick={() => scrollByWidth(-1)}
          aria-label="Previous genres"
          disabled={!canPrev}
        >&lt;</button>

        <div className="cards scroll-row" ref={rowRef} role="list">
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              role="listitem"
              className="card small genre-card"
              onClick={() => handleSelect(g)}
              aria-label={`View ${g} movies`}
            >
              <div className="visual" aria-hidden="true" />
              <div className="meta">{g}</div>
            </button>
          ))}
        </div>

        <button
          className="nav-button next"
          onClick={() => scrollByWidth(1)}
          aria-label="Next genres"
          disabled={!canNext}
        >&gt;</button>
      </div>
    </section>
  );
}