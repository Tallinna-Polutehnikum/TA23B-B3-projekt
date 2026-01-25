import React, { useState, useEffect } from "react";
import SessionCard from "./SessionCard";

export default function Showtimes() {
  const [activeDay, setActiveDay] = useState("today");
  const [location, setLocation] = useState("Tallinn - All Cinemas");
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => res.json())
      .then(setSessions)
      .catch((err) => console.error('Failed to load sessions', err));
  }, []);

  const days = [
    { key: "today", label: "Today", date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) },
    { key: "tomorrow", label: new Date(Date.now() + 86400000).toLocaleDateString('en-GB', { weekday: 'short' }), date: new Date(Date.now() + 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) },
    { key: "dayafter", label: new Date(Date.now() + 172800000).toLocaleDateString('en-GB', { weekday: 'short' }), date: new Date(Date.now() + 172800000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) },
  ];

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
        {sessions.length > 0 ? (
          sessions.map((session) => (
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

