import React, { useEffect, useRef, useState } from 'react';
import './Banner.css';

const SLIDE_INTERVAL = 30000; // 30 seconds

export default function Banner() {
  const slides = [
    { id: 1, title: 'Now Showing', subtitle: 'Top movies in cinemas', color: '#e6e6e6' },
    { id: 2, title: 'Special Events', subtitle: 'Concerts • Premieres • Festivals', color: '#dcd7f7' },
    { id: 3, title: 'Family Picks', subtitle: 'Fun for the whole family', color: '#f7e6e6' },
  ];

  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // autoplay
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL);

    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  function goTo(i) {
    setIndex(i);
  }

  return (
    <section className="hero" role="region" aria-label="Featured carousel">
      <div className="hero-inner">
        <div className="slides" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s) => (
            <article
              className="slide"
              key={s.id}
              aria-hidden={index !== slides.indexOf(s)}
              style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02)), ${s.color}` }}
            >
              <div className="slide-content">
                <h2 className="slide-title">{s.title}</h2>
                <p className="slide-sub">{s.subtitle}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="dots" role="tablist" aria-label="Slide navigation">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? 'active' : ''}`}
              aria-label={`Show slide ${i + 1}`}
              aria-selected={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <div className="sr-only" aria-live="polite">{slides[index].title}: {slides[index].subtitle}</div>
      </div>
    </section>
  );
}