import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./VaartKinoPage.css";

const highlights = [
  { title: "Awarded & acclaimed", descr: "Festival hits, laurels, and critics' picks", icon: "award" },
  { title: "Deeply moving", descr: "Stories that stay with you", icon: "mask" },
  { title: "Thought-provoking", descr: "Themes that spark discussion", icon: "film" },
  { title: "Inspiring & gripping", descr: "Bold ideas and vivid characters", icon: "clap" },
];

const iconMap = {
  award: (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path d="M16 3l2.4 5 5.6.5-4.3 3.6 1.3 5.4L16 15.4 10.9 17.5l1.3-5.4-4.3-3.6 5.6-.5z" fill="currentColor" fillOpacity="0.9" />
      <path d="M12 19h8v2H12zm2 2h4v6h-4z" fill="currentColor" fillOpacity="0.82" />
    </svg>
  ),
  mask: (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path d="M6 8c0 6 4 12 10 12s10-6 10-12c0-2-.9-3-2.4-3H8.4C6.9 5 6 6 6 8z" fill="currentColor" fillOpacity="0.8" />
      <path d="M11 10c.6-.6 1.4-.6 2 0 .6.6.6 1.4 0 2-.6.6-1.4.6-2 0-.6-.6-.6-1.4 0-2zm8 0c.6-.6 1.4-.6 2 0 .6.6.6 1.4 0 2-.6.6-1.4.6-2 0-.6-.6-.6-1.4 0-2z" fill="#0b0b0d" />
      <path d="M14 15.5c1.7 1 3.4 1 5.1 0" stroke="#0b0b0d" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  film: (
    <svg viewBox="0 0 32 32" aria-hidden>
      <rect x="5" y="8" width="22" height="16" rx="2.5" ry="2.5" fill="currentColor" fillOpacity="0.85" />
      <path d="M5 13h22M5 19h22" stroke="#0b0b0d" strokeWidth="1.6" />
      <path d="M11 8v16M21 8v16" stroke="#0b0b0d" strokeWidth="1.6" />
    </svg>
  ),
  clap: (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path d="M6 26l-1.2-7a2 2 0 0 1 1.7-2.3l14.8-2.2a2 2 0 0 1 2.3 1.7L25 26z" fill="currentColor" fillOpacity="0.85" />
      <path d="M7 12.8l11-5.5 3.3 6.5M10.2 14.4L22 8.5" stroke="#0b0b0d" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

const VaartKinoPage = () => {
  const [params] = useSearchParams();
  const slides = useMemo(() => [1, 2, 3, 4], []);
  const rawIndex = Number(params.get("slide"));
  const slideIndex = Number.isNaN(rawIndex) ? 2 : rawIndex;
  const heroVariant = slides[Math.max(0, Math.min(slides.length - 1, slideIndex))];
  const cinemas = [
    { value: "all", label: "Tallinn · All cinemas" },
    { value: "ulemiste", label: "Tallinn · Ülemiste Absolute Cinema" },
    { value: "tartu", label: "Tartu · Tasku Absolute Cinema" },
  ];
  return (
    <div className="vaartkino-page">
      <section className={`vaartkino-hero vaartkino-hero--${heroVariant}`} aria-label="Väärtkino landing page">
        <div className="vaartkino-hero__overlay" />
        <div className="vaartkino-hero__content">
          <span className="vaartkino-eyebrow">Absolute Cinema × PÖFF</span>
          <h1 className="vaartkino-title">Arthouse & Festival Picks</h1>
          <p className="vaartkino-subtitle">
            Absolute Cinema programmes feature a wide range of films and PÖFF recommendations. Väärtkino brings
            auteur cinema that lingers in your thoughts and offers fresh perspectives.
          </p>
          <div className="vaartkino-cta">
            <Link to="/showtime" className="vaartkino-button">Tickets</Link>
            <span className="vaartkino-hint">Curated highlights · Black Nights Film Festival picks</span>
          </div>
          <div className="vaartkino-brandline" aria-label="Partnerlogod">
            <span className="vaartkino-logo vaartkino-logo--poff">PÖFF</span>
            <span className="vaartkino-logo vaartkino-logo--vaart">VÄÄRT KINO</span>
            <span className="vaartkino-logo vaartkino-logo--absolute">ABSOLUTE CINEMA</span>
          </div>
        </div>
        <div className="vaartkino-hero__badge">New special program</div>
      </section>

      <section className="vaartkino-strip" aria-label="Väärtkino highlights">
        <div className="vaartkino-strip__grid">
          {highlights.map((item) => (
            <div className="vaartkino-strip__item" key={item.title}>
              <div className="vaartkino-strip__icon">{iconMap[item.icon]}</div>
              <div className="vaartkino-strip__meta">
                <div className="vaartkino-strip__title">{item.title}</div>
                <div className="vaartkino-strip__descr">{item.descr}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="vaartkino-ticket" id="piletid">
        <div className="vaartkino-ticket__form">
          <div className="vaartkino-ticket__select">
            <label htmlFor="cinema">Cinema</label>
            <select id="cinema" name="cinema" defaultValue="all">
              {cinemas.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <Link className="vaartkino-ticket__button" to="/showtime">Tickets</Link>
        </div>
      </section>

      <section className="vaartkino-info">
        <div className="vaartkino-info__text">
          <h2>Väärtkino film selection</h2>
          <p>
            Looking for films that resonate and stay with you? Discover carefully curated arthouse titles and
            Black Nights Film Festival recommendations that deliver deeper experiences and broaden horizons.
          </p>
          <p>
            The Absolute Plaza Väärtkino hall screens only arthouse films, documentaries, and award-winning
            festival selections. Explore the lineup and find your next inspiring cinema experience.
          </p>
          <div className="vaartkino-info__cta">
            <Link to="/showtime" className="vaartkino-info__button">Find a screening</Link>
            <span className="vaartkino-info__note">Auteur and arthouse lineup updated regularly</span>
          </div>
        </div>
        <div className="vaartkino-info__visual" aria-label="Väärtkino kujundus">
          <div className={`vaartkino-collage vaartkino-collage--${heroVariant}`}>
            <div className="vaartkino-collage__tag">Väärtkino</div>
            <div className="vaartkino-collage__label">Absolute cinema</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VaartKinoPage;
