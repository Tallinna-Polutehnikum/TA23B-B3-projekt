import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./FamilyScreeningPage.css";
import hero1 from "../assets/HeroBanner/hero1.jpg";
import hero2 from "../assets/HeroBanner/hero2.jpg";
import hero3 from "../assets/HeroBanner/hero3.jpg";
import hero4 from "../assets/HeroBanner/hero4.jpg";

const featureItems = [
  {
    title: "Second Wednesday each month",
    descr: "A steady rhythm for family mornings",
    icon: "🗓️",
  },
  {
    title: "Softer sound, dimmed lights",
    descr: "Comfier for little ones",
    icon: "🎬",
  },
  {
    title: "Two films",
    descr: "One for grown-ups, one for kids",
    icon: "👨‍👧",
  },
  {
    title: "Absolute Cinema Ülemiste & Tasku",
    descr: "Pick the location that suits you",
    icon: "🐻",
  },
];

const FamilyScreeningPage = () => {
  const [params] = useSearchParams();
  const slides = useMemo(() => [hero1, hero2, hero3, hero4], []);
  const slideIndex = Number(params.get("slide")) || 0;
  const heroImage = slides[Number.isNaN(slideIndex) ? 0 : Math.max(0, Math.min(slides.length - 1, slideIndex))];
  const gallery = useMemo(() => [hero2, hero3, hero4], []);

  return (
    <div className="family-page">
      <section
        className="family-hero"
        style={{ backgroundImage: `linear-gradient(110deg, rgba(10,0,26,0.9) 0%, rgba(10,0,26,0.45) 48%, rgba(10,0,26,0.1) 76%), url(${heroImage})` }}
      >
        <div className="family-hero__copy">
          <span className="family-hero__eyebrow">Family morning special</span>
          <h1 className="family-hero__title">Cinema with your little one</h1>
          <p className="family-hero__subtitle">
            Two films in one morning, softer sound and a safe, gently dimmed auditorium. Choose your cinema
            and join us with your tiny movie fan.
          </p>
          <div className="family-hero__cta">
            <Link className="family-hero__button" to="#piletid">
              Tickets
            </Link>
            <span className="family-hero__hint">Ülemiste & Tasku · every second Wednesday</span>
          </div>
        </div>
      </section>

      <section className="family-strip">
        <div className="family-strip__grid">
          {featureItems.map((item) => (
            <div className="family-strip__item" key={item.title}>
              <div className="family-strip__icon" aria-hidden>
                {item.icon}
              </div>
              <div className="family-strip__meta">
                <div className="family-strip__title">{item.title}</div>
                <div className="family-strip__descr">{item.descr}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="family-ticket" id="piletid">
        <div className="family-ticket__form">
          <div className="family-ticket__select">
            <label htmlFor="cinema">Cinema</label>
            <select id="cinema" name="cinema" defaultValue="tallinn">
              <option value="tallinn">Tallinn · All cinemas</option>
              <option value="ulemiste">Tallinn · Ülemiste Absolute Cinema</option>
              <option value="tartu">Tartu · Tasku Absolute Cinema</option>
            </select>
          </div>
          <Link className="family-ticket__button" to="/showtime">
            Tickets
          </Link>
        </div>
      </section>

      <section className="family-layout">
        <div className="family-layout__grid">
          <div className="family-text">
            <p>
              We welcome families once a month to Absolute Cinema Ülemiste and Tasku for kid-friendly
              screenings. These mornings are built so you can enjoy a great film with your little one –
              comfortably, safely, and with the needs of young kids in mind.
            </p>
            <p>
              Each family morning shows two films – one for adults, one for kids – so everyone finds
              something they like. Sound is softer and the room is gently dimmed.
            </p>
            <p>
              Family mornings run every second Wednesday starting at <strong>10:30</strong>.
            </p>
          </div>
          <div className="family-photo" role="img" aria-label="Kids at the cinema">
            <img src={gallery[0]} alt="Family morning at the cinema" loading="lazy" />
            <div className="family-photo__tag">Cozy foyer with softer lighting</div>
          </div>
        </div>
      </section>

      <section className="family-story">
        <div className="family-story__grid">
          <div className="family-story__media">
            <div className="family-story__video" role="img" aria-label="Animafilmi kaader">
              <img src={gallery[1]} alt="Animafilmi kadr" loading="lazy" />
              <div className="family-story__play">▶</div>
            </div>
            <div className="family-story__subtitle">
              On February 11 at 10:30 we watch the story of a 12-year-old boy in the family adventure
              film <strong>“My Friend Named Fiik”</strong>.
            </div>
          </div>
          <div className="family-story__text">
            <p>
              Luckily Fiik appears – a helpful furry creature from another dimension – and takes the boy
              into a fantasy world where he can walk again. But he must learn to stop the monsters born
              from his own shadow.
            </p>
            <p>
              Told through a child’s eyes, this story shows how friendship, imagination, and kindness help
              overcome the toughest challenges.
            </p>
            <div className="family-story__cta">
              <Link to="/showtime" className="family-story__button">
                Pick a date
              </Link>
              <span className="family-story__note">Softer sound · Diffused lights</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FamilyScreeningPage;
