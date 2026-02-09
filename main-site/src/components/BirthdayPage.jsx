import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./BirthdayPage.css";
import hero1 from "../assets/HeroBanner/hero1.jpg";
import hero2 from "../assets/HeroBanner/hero2.jpg";
import hero3 from "../assets/HeroBanner/hero3.jpg";
import hero4 from "../assets/HeroBanner/hero4.jpg";

const BirthdayPage = () => {
  const [params] = useSearchParams();
  const slides = useMemo(() => [hero1, hero2, hero3, hero4], []);
  const slideIndex = Number(params.get("slide")) || 1;
  const heroImage = slides[Number.isNaN(slideIndex) ? 1 : Math.max(0, Math.min(slides.length - 1, slideIndex))];

  return (
    <div className="birthday-page">
      <section
        className="birthday-hero"
        style={{ backgroundImage: `linear-gradient(115deg, rgba(10,0,26,0.9) 0%, rgba(10,0,26,0.5) 42%, rgba(10,0,26,0.15) 74%), url(${heroImage})` }}
      >
        <div className="birthday-hero__copy">
          <span className="birthday-hero__eyebrow">Absolute Cinema Mustamäe</span>
          <h1 className="birthday-hero__title">Birthday Celebration</h1>
          <p className="birthday-hero__subtitle">
            Pick a film, friends, and popcorn. For Mustamäe cinema’s birthday we have special offers and a
            festive mood all day – come celebrate with us.
          </p>
          <div className="birthday-hero__cta">
            <Link className="birthday-hero__button" to="/showtime">Choose a film</Link>
            <span className="birthday-hero__hint">Offer valid on selected dates · Celebrate at a special price</span>
          </div>
        </div>
      </section>

      <section className="birthday-strip">
        <div className="birthday-strip__grid">
          <div className="birthday-strip__item">
            <div className="birthday-strip__icon">🎈</div>
            <div className="birthday-strip__meta">
              <div className="birthday-strip__title">Party package</div>
              <div className="birthday-strip__descr">Pick a film and book at promo rates</div>
            </div>
          </div>
          <div className="birthday-strip__item">
            <div className="birthday-strip__icon">🍿</div>
            <div className="birthday-strip__meta">
              <div className="birthday-strip__title">Popcorn & drinks</div>
              <div className="birthday-strip__descr">Birthday bundle with snacks</div>
            </div>
          </div>
          <div className="birthday-strip__item">
            <div className="birthday-strip__icon">🕒</div>
            <div className="birthday-strip__meta">
              <div className="birthday-strip__title">Flexible time</div>
              <div className="birthday-strip__descr">Choose morning, day, or evening</div>
            </div>
          </div>
          <div className="birthday-strip__item">
            <div className="birthday-strip__icon">📍</div>
            <div className="birthday-strip__meta">
              <div className="birthday-strip__title">Mustamäe cinema</div>
              <div className="birthday-strip__descr">Festive auditorium and lobby</div>
            </div>
          </div>
        </div>
      </section>

      <section className="birthday-content">
        <div className="birthday-content__text">
          <h2>Birthday offer details</h2>
          <p>
            For Absolute Cinema Mustamäe’s birthday we offer discounted party tickets for a limited time. The
            campaign is valid on selected dates and screenings; seats are limited.
          </p>
          <p>
            The package includes movie tickets and you can add popcorn and drinks at a special price. Please book
            in advance to secure seats for your group.
          </p>
          <p>
            Questions? Contact Absolute Cinema Mustamäe: <strong>mustamae@absolutecinema.ee</strong>.
          </p>
          <div className="birthday-content__cta">
            <Link to="/showtime" className="birthday-content__button">Book a screening</Link>
            <span className="birthday-content__note">Bring friends and celebrate with cinema</span>
          </div>
        </div>
        <div className="birthday-content__visual">
          <div className="birthday-content__card">
            <div className="birthday-content__balloons" aria-hidden>
              <span>🎈</span><span>🎈</span><span>🎈</span>
            </div>
            <div className="birthday-content__label">Absolute Mustamäe</div>
            <div className="birthday-content__headline">Birthday offer</div>
            <div className="birthday-content__sub">Special deals for the big day</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BirthdayPage;
