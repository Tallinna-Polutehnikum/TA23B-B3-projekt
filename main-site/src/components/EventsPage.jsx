import React from "react";
import { Link } from "react-router-dom";
import "./EventsPage.css";

const cards = [
  {
    title: "Family Morning",
    eyebrow: "Absolute Cinema · Monthly",
    descr: "Softer sound, dimmed lights, and two films in one morning for kids and parents.",
    cta: "Go to Family page",
    to: "/family",
    imageClass: "events-card--1",
  },
  {
    title: "Birthday Celebration",
    eyebrow: "Mustamäe special offer",
    descr: "Pick a film, gather friends, and celebrate with party bundles and popcorn deals.",
    cta: "View birthday offer",
    to: "/birthday",
    imageClass: "events-card--2",
  },
  {
    title: "Arthouse & Festival Picks",
    eyebrow: "Väärtkino × PÖFF",
    descr: "Curated auteur cinema, award winners, and Black Nights Film Festival highlights.",
    cta: "Explore Väärtkino",
    to: "/vaartkino",
    imageClass: "events-card--3",
  },
  {
    title: "Pancake Morning",
    eyebrow: "Weekend treat",
    descr: "Sunday screenings with warm pancakes, gentle lighting, and playful intros.",
    cta: "See Pancake Morning",
    to: "/pancake-morning",
    imageClass: "events-card--4",
  },
];

const EventsPage = () => {
  return (
    <div className="events-page">
      <header className="events-hero">
        <div className="events-hero__copy">
          <span className="events-hero__eyebrow">Absolute Cinema</span>
          <h1 className="events-hero__title">Events & Specials</h1>
          <p className="events-hero__subtitle">
            Explore current campaigns and special experiences. Pick an event to see details, timings, and how to
            join.
          </p>
        </div>
      </header>

      <section className="events-list">
        {cards.map((card) => (
          <article key={card.title} className={`events-card ${card.imageClass}`}>
            <div className="events-card__body">
              <span className="events-card__eyebrow">{card.eyebrow}</span>
              <h2 className="events-card__title">{card.title}</h2>
              <p className="events-card__descr">{card.descr}</p>
              <Link className="events-card__cta" to={card.to}>{card.cta}</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default EventsPage;
