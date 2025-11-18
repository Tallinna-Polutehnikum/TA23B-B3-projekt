import React, { useState, useEffect, useRef } from "react";
import "./HeroBanner.css";

const slides = [
  {
    title: "Movie Premiere: The Big Adventure",
    description: "Join us for the premiere of The Big Adventure!",
    image: "https://via.placeholder.com/1200x350?text=Movie+Premiere",
  },
  {
    title: "Live Event: Stand-up Night",
    description: "Enjoy a night of laughter with top comedians!",
    image: "https://via.placeholder.com/1200x350?text=Stand-up+Night",
  },
  {
    title: "Family Day: Animated Hits",
    description: "Bring your family for a day of animated movies.",
    image: "https://via.placeholder.com/1200x350?text=Animated+Hits",
  },
  {
    title: "Special Screening: Classic Cinema",
    description: "Experience timeless classics on the big screen.",
    image: "https://via.placeholder.com/1200x350?text=Classic+Cinema",
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (idx) => {
    setCurrent(idx);
    // reset timer so user has full 30s on manual change
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 30000);
  };

  return (
    <section className="hero-banner" aria-roledescription="carousel">
      <div className="hero-banner__viewport">
        {slides.map((s, idx) => (
          <div
            key={idx}
            className={`hero-banner__slide ${idx === current ? "active" : ""}`}
            style={{ backgroundImage: `url(${s.image})` }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} of ${slides.length}`}
          >
            <div className="hero-banner__mini-info">
              <h2>{s.title}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-banner__dots">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`hero-banner__dot${idx === current ? " active" : ""}`}
            onClick={() => goTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
