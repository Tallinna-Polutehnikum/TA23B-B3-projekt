import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SessionCard from "./SessionCard";

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
};

export default function Showtimes() {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState(toDateKey(new Date()));
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);

  const pickInitialDay = (list, movieId) => {
    const scoped = movieId
      ? list.filter((s) => String(s.movie_id) === String(movieId))
      : list;
    if (scoped.length > 0) return scoped[0].date;
    return list[0]?.date ?? toDateKey(new Date());
  };

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
        setActiveDay((prev) => prev || pickInitialDay(data, selectedMovieId));
      })
      .catch((err) => console.error('Failed to load sessions', err));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const movieId = params.get('movieId');
    setSelectedMovieId(movieId);
  }, [routerLocation.search]);

  useEffect(() => {
    if (sessions.length === 0) return;
    const hasMatchForDay = sessions.some((s) => {
      const matchesMovie = !selectedMovieId || String(s.movie_id) === selectedMovieId;
      const matchesDay = s.date === activeDay;
      if (!matchesMovie || !matchesDay) return false;

      const todayKey = toDateKey(new Date());
      if (activeDay === todayKey) {
        const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
        return toMinutes(s.time) >= nowMinutes;
      }

      return true;
    });
    if (!hasMatchForDay) {
      const nextDay = pickInitialDay(sessions, selectedMovieId);
      if (nextDay !== activeDay) {
        setActiveDay(nextDay);
      }
    }
  }, [sessions, selectedMovieId, activeDay]);

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
    const todayKey = toDateKey(new Date());
    const isActiveToday = activeDay === todayKey;
    const nowMinutes = isActiveToday
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : null;

    const matchesDay = session.date === activeDay;
    if (!matchesDay) return false;

    if (selectedMovieId && String(session.movie_id) !== selectedMovieId) {
      return false;
    }

    if (isActiveToday) {
      if (!session.time) return false;
      const sessionMinutes = toMinutes(session.time);
      if (sessionMinutes < nowMinutes) return false;
    }

    // Filter by city
    const sessionCity = session.cinema ? session.cinema.split('-')[0].trim() : '';
    const matchesCity = selectedCity === "All" || sessionCity === selectedCity;
    if (!matchesCity) return false;

    // Filter by genre
    if (selectedGenre !== "All" && session.genres) {
      const genreList = session.genres.split(',').map((g) => g.trim());
      return genreList.includes(selectedGenre);
    }

    return true;
  });

  const movieFilterTitle = selectedMovieId
    ? sessions.find((s) => String(s.movie_id) === selectedMovieId)?.title
    : null;

  return (
    <section className="section showtimes-section">
      <div className="showtimes-bar">
        <div className="showtimes-location">
          <span className="showtimes-icon showtimes-icon--pin" aria-hidden="true" />
          <div className="showtimes-location-text">
            <span className="showtimes-label">Location</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
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

      {selectedMovieId && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '16px 0',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
          }}
        >
          <span style={{ opacity: 0.8 }}>
            Showing sessions for <strong>{movieFilterTitle || 'this movie'}</strong>
          </span>
          <button
            onClick={() => navigate('/showtime')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'inherit',
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Clear filter
          </button>
        </div>
      )}

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

