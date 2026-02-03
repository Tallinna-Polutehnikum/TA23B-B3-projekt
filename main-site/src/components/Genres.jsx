import React, { useRef, useState, useEffect } from 'react';
import './Genres.css';

import horrorImg from '../assets/genres/genre-horror.jpg';
import comedyImg from '../assets/genres/genre-comedy.jpg';
import historycalImg from '../assets/genres/genre-historycal.jpg';
import animationImg from '../assets/genres/genre-animation.jpg';
import animeImg from '../assets/genres/genre-anime.jpg';
import documentaryImg from '../assets/genres/genre-documentary.jpg';
import dramaImg from '../assets/genres/genre-drama.jpg';
import fantasyImg from '../assets/genres/genre-fantasy.jpg';
import familyImg from '../assets/genres/genre-family.jpg';
import actionImg from '../assets/genres/genre-action.jpg';
import musicImg from '../assets/genres/genre-music.jpg';
import sciFiImg from '../assets/genres/genre-scifi.jpg';
import warImg from '../assets/genres/genre-war.jpg';
import sportImg from '../assets/genres/genre-sport.jpg';
import adventureImg from '../assets/genres/genre-adventure.jpg';

const DEFAULT_GENRES = [
  'Horror','Comedy','Historycal','Animation','Anime','Documentary','Drama','Fantasy',
  'Family','Action','Music','SCI-FI','War','Sport','Adventure'
];

const GENRE_IMAGES = {
  Horror: horrorImg,
  Comedy: comedyImg,
  Historycal: historycalImg,
  Animation: animationImg,
  Anime: animeImg,
  Documentary: documentaryImg,
  Drama: dramaImg,
  Fantasy: fantasyImg,
  Family: familyImg,
  Action: actionImg,
  Music: musicImg,
  'SCI-FI': sciFiImg,
  War: warImg,
  Sport: sportImg,
  Adventure: adventureImg,
};

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
      <div id="genres-title" className="title">Genres</div>

      <div className="scroll-outer">
        <button
          className="nav-button prev"
          onClick={() => scrollByWidth(-1)}
          aria-label="Previous genres"
          disabled={!canPrev}
        >‹</button>

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
              <div
                className="visual"
                aria-hidden="true"
                style={GENRE_IMAGES[g] ? { backgroundImage: `url(${GENRE_IMAGES[g]})` } : undefined}
              />
              <div className="meta">{g}</div>
            </button>
          ))}
        </div>

        <button
          className="nav-button next"
          onClick={() => scrollByWidth(1)}
          aria-label="Next genres"
          disabled={!canNext}
        >›</button>
      </div>
    </section>
  );
}