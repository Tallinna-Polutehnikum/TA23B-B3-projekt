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
  const [location, setLocation] = useState("Tallinn");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sessions, setSessions] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);

  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        // Extract unique genres
        const genres = new Set();
        data.forEach((session) => {
          if (session.genres) {
            session.genres.split(',').forEach((g) => genres.add(g.trim()));
          }
        });
        setAvailableGenres(Array.from(genres).sort());
      })
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

  const getCities = () => {
    const cities = new Set();
    sessions.forEach((s) => {
      if (s.cinema) {
        const city = s.cinema.split('-')[0].trim();
        cities.add(city);
      }
    });
    return Array.from(cities).sort();
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesDay = session.date === activeDay;
    if (!matchesDay) return false;

    // Filter by city
    const sessionCity = session.cinema ? session.cinema.split('-')[0].trim() : '';
    const matchesCity = location === "All" || sessionCity === location;
    if (!matchesCity) return false;

    // Filter by genre
    if (selectedGenre !== "All" && session.genres) {
      const genreList = session.genres.split(',').map((g) => g.trim());
      return genreList.includes(selectedGenre);
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
              <option value="All">All Cities</option>
              {getCities().map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
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
            <span className="showtimes-filter-value">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: 'inherit'
                }}
              >
                <option value="All">All Genres</option>
                {availableGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </span>
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
            No sessions found for the selected filters
          </div>
        )}
      </div>
    </section>
  );
}

