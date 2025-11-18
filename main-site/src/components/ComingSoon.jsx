import React, { useRef, useState, useEffect } from 'react';
import './ComingSoon.css';

export default function ComingSoon({ items = [1, 2, 3, 4, 5, 6] }) {
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
          aria-hidden={!canPrev}
          aria-label="Previous"
          disabled={!canPrev}
        >&lt;</button>

        <div className="cards scroll-row" ref={rowRef} role="list">
          {items.map((i) => (
            <div key={i} className="card medium" role="listitem">
              <div className="visual" />
              <div className="meta">Coming soon</div>
            </div>
          ))}
        </div>

        <button
          className="nav-button next"
          onClick={() => scrollByWidth(1)}
          aria-hidden={!canNext}
          aria-label="Next"
          disabled={!canNext}
        >&gt;</button>
      </div>
    </section>
  );
}