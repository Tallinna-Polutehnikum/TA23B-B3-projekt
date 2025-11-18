import React, { useState } from "react";
import SessionCard from "./SessionCard";

const mockSessions = [
  {
    poster: "https://via.placeholder.com/340x200?text=Movie+1",
    time: "8:50 PM",
    cinema: "Apollo Kino Ülemiste",
    hall: "3. Apollo restaurant",
    title: "Now You See Me: Now You Don't",
    originalTitle: "Now You See Me: Now You Don't",
    genres: "Thriller, Crime",
    seats: 10,
    language: "English",
    subtitles: "Estonian, Russian",
    format: "2D"
  },
  {
    poster: "https://via.placeholder.com/340x200?text=Movie+2",
    time: "9:00 PM",
    cinema: "Apollo Kino Ülemiste",
    hall: "1. Apollo Theatre screen",
    title: "The Running Man",
    originalTitle: "The Running Man",
    genres: "Action, Science Fiction, Thriller",
    seats: 441,
    language: "English",
    subtitles: "Estonian, Russian",
    format: "2D"
  }
];

const days = [
  { key: "today", label: "Today", date: "18. Nov" },
  { key: "tomorrow", label: "Wed", date: "19. Nov" },
  { key: "thu", label: "Thu", date: "20. Nov" },
];

export default function Showtimes() {
  const [activeDay, setActiveDay] = useState("today");
  const [location, setLocation] = useState("Tallinn - All Cinemas");

  return (
    <section className="section showtimes-section">
      <div className="showtimes-bar">
        <div className="showtimes-location">
          <span className="showtimes-label">Location</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option>Tallinn - All Cinemas</option>
            <option>Tartu - All Cinemas</option>
          </select>
        </div>

        <div className="showtimes-days">
          {days.map((d) => (
            <button
              key={d.key}
              className={
                "showtimes-day" + (activeDay === d.key ? " active" : "")
              }
              onClick={() => setActiveDay(d.key)}
            >
              <span className="showtimes-day-label">{d.label}</span>
              <span className="showtimes-day-date">{d.date}</span>
            </button>
          ))}
        </div>

        <div className="showtimes-filters">
          <button className="showtimes-filter">Genre: None</button>
          <button className="showtimes-filter">Filters: None</button>
        </div>
      </div>

      <div className="showtimes-list">
        {mockSessions.map((session, idx) => (
          <SessionCard key={idx} session={session} />
        ))}
      </div>
    </section>
  );
}

