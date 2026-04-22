import React, { useEffect, useRef, useState } from 'react';
import './Banner.css';

const SLIDE_INTERVAL = 30000; // 30 seconds
const SLIDES = [
  { id: 1, title: 'Now Showing', subtitle: 'Top movies in cinemas', color: '#e6e6e6' },
  { id: 2, title: 'Special Events', subtitle: 'Concerts • Premieres • Festivals', color: '#dcd7f7' },
  { id: 3, title: 'Family Picks', subtitle: 'Fun for the whole family', color: '#f7e6e6' },
];

export default function Banner() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // autoplay
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_INTERVAL);

    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  function goTo(i) {
    setIndex(i);
  }

  return (
    <section className="hero" role="region" aria-label="Featured carousel">
      <div className="hero-inner">
        <div className={`slides slides--${index}`}>
          {SLIDES.map((s, slideIndex) => (
            <article
              className={`slide slide--${slideIndex + 1}`}
              key={s.id}
              aria-hidden={index !== slideIndex}
            >
              <div className="slide-content">
                <h2 className="slide-title">{s.title}</h2>
                <p className="slide-sub">{s.subtitle}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="dots" role="tablist" aria-label="Slide navigation">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? 'active' : ''}`}
              aria-label={`Show slide ${i + 1}`}
              aria-selected={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <div className="sr-only" aria-live="polite">{SLIDES[index].title}: {SLIDES[index].subtitle}</div>
      </div>
    </section>
  );
}