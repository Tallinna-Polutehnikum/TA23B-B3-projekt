import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HeroBanner.css";
import hero1 from "../assets/HeroBanner/hero1.jpg";
import hero2 from "../assets/HeroBanner/hero2.jpg";
import hero3 from "../assets/HeroBanner/hero3.jpg";
import hero4 from "../assets/HeroBanner/hero4.jpg";
import heroBirthday from "../assets/HeroBanner/hero-birthday.svg";

const slides = [hero1, hero2, hero3, hero4];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const slideLinks = {
    0: "/family?slide=0",
    1: "/birthday?slide=1",
    2: "/vaartkino?slide=2",
    3: "/pancake-morning?slide=3",
  };

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

  const goToSlideLink = () => {
    const target = slideLinks[current];
    if (target) {
      navigate(target);
    }
  };

  const isClickable = Boolean(slideLinks[current]);

  return (
    <section className="hero-banner" aria-roledescription="carousel">
      <div
        className="hero-banner__viewport"
        role="button"
        tabIndex={0}
        onClick={goToSlideLink}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToSlideLink();
          }
        }}
        aria-label={isClickable ? "Ava kampaanialeht" : "Vaheta slaidi"}
        style={{ cursor: isClickable ? "pointer" : "default" }}
      >
        {slides.map((image, idx) => (
          <div
            key={idx}
            className={`hero-banner__slide ${idx === current ? "active" : ""}`}
            style={{ backgroundImage: `url(${image})` }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} of ${slides.length}`}
          />
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
