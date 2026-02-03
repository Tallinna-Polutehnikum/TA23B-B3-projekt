import React, { useState, useEffect } from "react";
import SessionCard from "./SessionCard";

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Showtimes() {
  const [activeDay, setActiveDay] = useState(toDateKey(new Date()));
  const [location, setLocation] = useState("Tallinn - All Cinemas");
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => res.json())
      .then(setSessions)
      .catch((err) => console.error('Failed to load sessions', err));
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      key: toDateKey(date),
      label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    };
  });

  const hasTallinn = sessions.some((s) => s.cinema?.toLowerCase().includes("tallinn"));
  const hasTartu = sessions.some((s) => s.cinema?.toLowerCase().includes("tartu"));

  const filteredSessions = sessions.filter((session) => {
    const matchesDay = session.date === activeDay;
    if (!matchesDay) return false;
    if (location.startsWith("Tallinn")) {
      return !hasTallinn || session.cinema?.toLowerCase().includes("tallinn") || !session.cinema;
    }
    if (location.startsWith("Tartu")) {
      return !hasTartu || session.cinema?.toLowerCase().includes("tartu") || !session.cinema;
    }
    return true;
  });

  return (
    <section className="section showtimes-section">
      <div className="showtimes-bar">
        <div className="showtimes-location">
          <span className="showtimes-icon showtimes-icon--pin" aria-hidden="true" />
          <div className="showtimes-location-text">
            <span className="showtimes-label">Location</span>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option>Tallinn - All Cinemas</option>
              <option>Tartu - All Cinemas</option>
            </select>
          </div>
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
          <button className="showtimes-filter">
            <span className="showtimes-filter-label">Genre</span>
            <span className="showtimes-filter-value">None</span>
          </button>
          <button className="showtimes-filter">
            <span className="showtimes-filter-label">Filters</span>
            <span className="showtimes-filter-value">None</span>
          </button>
        </div>
      </div>

      <div className="showtimes-list">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        ) : (
          <div style={{ padding: '60px 20px', color: '#999', textAlign: 'center' }}>
            Загрузка сеансов...
          </div>
        )}
      </div>
    </section>
  );
}

