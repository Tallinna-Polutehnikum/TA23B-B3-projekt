import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./SessionCard.css";
import SeatMap from "./SeatMap";

export default function SessionCard({ session, onViewAllShows }) {
  const [showSeatMap, setShowSeatMap] = useState(false);

  const posterSrc = session.poster
    ? (session.poster.startsWith('http')
        ? session.poster
        : `https://image.tmdb.org/t/p/w342${session.poster}`)
    : 'https://via.placeholder.com/200x300?text=No+Image';

  const ribbonDate = session.date
    ? new Date(`${session.date}T00:00:00`).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
      })
    : null;

  return (
    <>
      <article className="session-card">
        {ribbonDate && (
          <div className="session-card__ribbon">{ribbonDate}</div>
        )}
        <div className="session-card__body">
          <div className="session-card__poster">
            <img src={posterSrc} alt={session.title} />
          </div>
          <div className="session-card__info">
            <div className="session-card__top">
              <div className="session-card__time-group">
                <div className="session-card__time">{session.time}</div>
                <div className="session-card__cinema">{session.cinema}</div>
                <div className="session-card__hall">Screen {session.hall}</div>
              </div>
              <div className="session-card__title-group">
                <Link
                  to={`/movie/${session.movie_id}`}
                  className="session-card__title"
                  state={{ from: 'showtimes' }}
                >
                  {session.title}
                </Link>
                <div className="session-card__original">{session.originalTitle}</div>
                <div className="session-card__genres">{session.genres}</div>
              </div>
              <div className="session-card__actions">
                <button
                  className="session-card__shows"
                  onClick={() => onViewAllShows?.(session.movie_id)}
                >
                  View all shows
                </button>
                <button 
                  className="session-card__buy"
                  onClick={() => setShowSeatMap(true)}
                >
                  Buy Tickets
                </button>
              </div>
            </div>
            <div className="session-card__meta-row">
              <button className="session-card__trailer">Trailer</button>
              <div className="session-card__seats">
                <span className="icon-seat" />
                <span>Free seats</span>
                <b>{session.seats}</b>
              </div>
              <div className="session-card__lang">
                <span>Language</span>
                <b>{session.language}</b>
              </div>
              <div className="session-card__subs">
                <span>Subtitles</span>
                <b>{session.subtitles}</b>
              </div>
              <div className="session-card__format">{session.format}</div>
            </div>
          </div>
        </div>
      </article>

      {showSeatMap && (
        <SeatMap 
          sessionId={session.id}
          onClose={() => setShowSeatMap(false)}
        />
      )}
    </>
  );
}
