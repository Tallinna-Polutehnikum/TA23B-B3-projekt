import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
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

export default function Showtimes({ addSeatsToCart }) {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const [activeDay, setActiveDay] = useState(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('activeDay') : null;
    return stored || toDateKey(new Date());
  });
  const [selectedCity, setSelectedCity] = useState(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('selectedCity') : null;
    return stored || "All";
  });
  const [selectedGenre, setSelectedGenre] = useState(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('selectedGenre') : null;
    return stored || "All";
  });
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
        setActiveDay((prev) => prev || pickInitialDay(data, null));
      })
      .catch((err) => console.error('Failed to load sessions', err));
  }, []);

  useEffect(() => {
    if (activeDay) {
      sessionStorage.setItem('activeDay', activeDay);
    }
  }, [activeDay]);

  useEffect(() => {
    sessionStorage.setItem('selectedCity', selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    sessionStorage.setItem('selectedGenre', selectedGenre);
  }, [selectedGenre]);

  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const movieId = params.get('movieId');
    setSelectedMovieId(movieId);
  }, [routerLocation.search]);

  // If returning via browser back/forward, drop the movie filter query so it doesn't stick
  useEffect(() => {
    if (navigationType !== 'POP') return;
    const params = new URLSearchParams(routerLocation.search);
    if (!params.has('movieId')) return;
    params.delete('movieId');
    navigate({ pathname: routerLocation.pathname, search: params.toString() }, { replace: true });
    setSelectedMovieId(null);
  }, [navigationType, routerLocation.pathname, routerLocation.search, navigate]);

  // Keep activeDay on a valid date for current filters (movie + city + genre)
  useEffect(() => {
    if (!sessions || sessions.length === 0) return;

    const scoped = sessions.filter((s) => {
      const matchesMovie = !selectedMovieId || String(s.movie_id) === String(selectedMovieId);
      const sessionCity = s.cinema ? s.cinema.split('-')[0].trim() : '';
      const matchesCity = selectedCity === 'All' || sessionCity === selectedCity;
      const matchesGenre = selectedGenre === 'All'
        || (s.genres && s.genres.split(',').map((g) => g.trim()).includes(selectedGenre));
      return matchesMovie && matchesCity && matchesGenre;
    });

    if (scoped.length === 0) return;

    const dates = Array.from(new Set(scoped.map((s) => s.date))).sort();
    if (dates.includes(activeDay)) return; // current day still valid

    const todayKey = toDateKey(new Date());
    const nextAvailable = dates.find((d) => d >= todayKey) || dates[0];
    setActiveDay(nextAvailable);
    sessionStorage.setItem('activeDay', nextAvailable);
  }, [sessions, selectedMovieId, selectedCity, selectedGenre, activeDay]);

  // User can freely switch days; no auto-reset to avoid interfering with manual selection

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
    const isSessionToday = session.date === todayKey;
    const nowMinutes = isSessionToday
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : null;

    const matchesDay = session.date === activeDay;
    if (!matchesDay) return false;

    if (selectedMovieId && String(session.movie_id) !== selectedMovieId) {
      return false;
    }

    if (isSessionToday) {
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

  const handleViewAllShows = (movieId) => {
    if (!movieId) return;
    navigate(`/showtime?movieId=${movieId}`);
    setSelectedMovieId(String(movieId));
  };

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
                className="showtimes-genre-select"
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
        <div className="showtimes-movie-filter">
          <span className="showtimes-movie-filter__text">
            Showing sessions for <strong>{movieFilterTitle || 'this movie'}</strong>
          </span>
          <button
            onClick={() => navigate('/showtime')}
            className="showtimes-movie-filter__clear"
          >
            Clear filter
          </button>
        </div>
      )}

      <div className="showtimes-list">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onViewAllShows={handleViewAllShows}
              onAddSeats={addSeatsToCart}
            />
          ))
        ) : (
          <div className="showtimes-empty-state">
            No sessions found for the selected filters
          </div>
        )}
      </div>
    </section>
  );
}

