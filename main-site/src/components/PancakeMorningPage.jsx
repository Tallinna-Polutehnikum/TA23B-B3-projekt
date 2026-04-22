import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./PancakeMorningPage.css";
import hero2 from "../assets/HeroBanner/hero2.jpg";
import hero4 from "../assets/HeroBanner/hero4.jpg";

const featureItems = [
  { title: "Sweet Sunday start", descr: "Warm pancakes before the film", icon: "🥞" },
  { title: "Cozy for families", descr: "Gentle lighting and a friendly vibe", icon: "🧡" },
  { title: "Pick your cinema", descr: "Tallinn Ülemiste or Tartu Tasku", icon: "📍" },
  { title: "Animated bumpers", descr: "Playful intros before the screening", icon: "🎬" },
];

const PancakeMorningPage = () => {
  const [params] = useSearchParams();
  const slides = useMemo(() => [1, 2, 3, 4], []);
  const rawIndex = Number(params.get("slide"));
  const slideIndex = Number.isNaN(rawIndex) ? 3 : rawIndex;
  const heroVariant = slides[Math.max(0, Math.min(slides.length - 1, slideIndex))];
  const gallery = useMemo(() => [hero4, hero2], []);

  return (
    <div className="pancake-page">
      <section
        className={`pancake-hero pancake-hero--${heroVariant}`}
      >
        <div className="pancake-hero__copy">
          <span className="pancake-hero__eyebrow">Weekend treat</span>
          <h1 className="pancake-hero__title">Pancake Morning</h1>
          <p className="pancake-hero__subtitle">
            Sunday mornings with warm pancakes, soft lights, and a relaxed start to the cinema experience. Bring
            the family, grab a plate, and settle in for a sweet kickoff to the day.
          </p>
          <div className="pancake-hero__cta">
            <Link className="pancake-hero__button" to="/showtime">
              Choose a session
            </Link>
            <span className="pancake-hero__hint">Every Sunday from 11:30 · Pancakes served while they last</span>
          </div>
        </div>
      </section>

      <section className="pancake-strip">
        <div className="pancake-strip__grid">
          {featureItems.map((item) => (
            <div className="pancake-strip__item" key={item.title}>
              <div className="pancake-strip__icon" aria-hidden>
                {item.icon}
              </div>
              <div className="pancake-strip__meta">
                <div className="pancake-strip__title">{item.title}</div>
                <div className="pancake-strip__descr">{item.descr}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pancake-ticket" id="tickets">
        <div className="pancake-ticket__form">
          <div className="pancake-ticket__select">
            <label htmlFor="cinema">Cinema</label>
            <select id="cinema" name="cinema" defaultValue="all">
              <option value="all">Tallinn · All cinemas</option>
              <option value="ulemiste">Tallinn · Ülemiste Absolute Cinema</option>
              <option value="tartu">Tartu · Tasku Absolute Cinema</option>
            </select>
          </div>
          <Link className="pancake-ticket__button" to="/showtime">
            Tickets
          </Link>
        </div>
      </section>

      <section className="pancake-layout">
        <div className="pancake-layout__grid">
          <div className="pancake-text">
            <p>
              Pancake Morning pairs a cozy lobby vibe with a calm auditorium. We ease into the day with gentle
              lighting and room for families to get comfortable before the film starts.
            </p>
            <p>
              Pancakes are prepared fresh on site; grab yours, find a seat, and enjoy short animated bumpers before
              the feature. It is a small ritual that makes Sunday feel special.
            </p>
            <p>
              Doors open at <strong>11:30</strong>. Pancakes are first come, first served, so arriving early is a
              good idea.
            </p>
          </div>
          <div className="pancake-photo" role="img" aria-label="Pancakes served at the cinema">
            <img src={gallery[0]} alt="Pancakes served at Absolute Cinema" loading="lazy" />
            <div className="pancake-photo__tag">Warm pancakes before the film</div>
          </div>
        </div>
      </section>

      <section className="pancake-story">
        <div className="pancake-story__grid">
          <div className="pancake-story__media">
            <div className="pancake-story__image" role="img" aria-label="Cinema seating with treats">
              <img src={gallery[1]} alt="Cinema treats on a seat" loading="lazy" />
            </div>
            <div className="pancake-story__subtitle">
              Sunday combo: pancakes, coffee, and a relaxed screening your whole crew can enjoy.
            </div>
          </div>
          <div className="pancake-story__text">
            <p>
              The program is built for easy Sundays: playful intros, warm snacks, and plenty of time to settle in
              before the lights fade. Kids, friends, and grandparents are all welcome.
            </p>
            <p>
              We update the lineup regularly, so each visit feels fresh. Check the sessions, pick a cinema, and make
              Pancake Morning part of your weekend ritual.
            </p>
            <div className="pancake-story__cta">
              <Link to="/showtime" className="pancake-story__button">
                See sessions
              </Link>
              <span className="pancake-story__note">Limited pancakes · Arrive early for a plate</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PancakeMorningPage;
