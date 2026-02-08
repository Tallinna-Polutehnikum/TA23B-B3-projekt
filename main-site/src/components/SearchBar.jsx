import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchBar.css";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [movies, setMovies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Load movies and sessions data from API
  useEffect(() => {
    fetch('/api/movies/top')
      .then((res) => res.json())
      .then(setMovies)
      .catch((err) => console.error('Failed to load movies', err));

    fetch('/api/sessions')
      .then((res) => res.json())
      .then(setSessions)
      .catch((err) => console.error('Failed to load sessions', err));
  }, []);

  // Close when clicking outside the component
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    // Search in movies
    movies.forEach(movie => {
      if (movie.title?.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: movie.id,
          title: movie.title,
          subtitle: movie.overview?.slice(0, 60) || "Movie",
          type: "movie",
          poster: movie.poster
        });
      }
    });

    // Search in sessions
    sessions.forEach(session => {
      if (
        session.title?.toLowerCase().includes(lowerQuery) ||
        session.cinema?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: session.id,
          title: session.title,
          subtitle: session.cinema,
          type: "session"
        });
      }
    });

    setSuggestions(results.slice(0, 8)); // Maximum 8 suggestions
    setIsOpen(results.length > 0);
  }, [query, movies, sessions]);

  const handleSelect = (suggestion) => {
    setQuery(suggestion.title);
    setIsOpen(false);
    
    // Navigate to the appropriate page
    if (suggestion.type === "movie") {
      navigate(`/movie/${suggestion.id}`);
    } else if (suggestion.type === "session") {
      navigate("/showtime");
    }
  };

  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <strong key={i}>{part}</strong> 
        : part
    );
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <input
        className="search-input"
        placeholder="Movie search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && suggestions.length > 0 && setIsOpen(true)}
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="search-dropdown">
          {suggestions.map((suggestion, idx) => (
            <div
              key={`${suggestion.type}-${suggestion.id}-${idx}`}
              className="search-suggestion"
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.poster && (
                <img
                  src={`https://image.tmdb.org/t/p/w92${suggestion.poster}`}
                  alt=""
                  className="search-suggestion-poster"
                />
              )}
              <div className="search-suggestion-content">
                <div className="search-suggestion-title">
                  {highlightMatch(suggestion.title, query)}
                </div>
                <div className="search-suggestion-subtitle">
                  {suggestion.subtitle}
                </div>
              </div>
              <div className="search-suggestion-type">
                {suggestion.type === "movie" ? "🎬" : "🎟️"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
