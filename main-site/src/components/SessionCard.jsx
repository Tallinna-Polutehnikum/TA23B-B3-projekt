import React from "react";
import "./SessionCard.css";

export default function SessionCard({ session }) {
  return (
    <div className="session-card">
      <div className="session-card__poster">
        <img src={session.poster} alt={session.title} />
      </div>
      <div className="session-card__info">
        <div className="session-card__time">{session.time}</div>
        <div className="session-card__cinema">{session.cinema}</div>
        <div className="session-card__hall">{session.hall}</div>
        <a href="#" className="session-card__title">{session.title}</a>
        <div className="session-card__original">{session.originalTitle}</div>
        <div className="session-card__genres">{session.genres}</div>
        <div className="session-card__meta-row">
          <button className="session-card__trailer">Trailer</button>
          <div className="session-card__seats">
            <span className="icon-seat" />
            {session.seats}
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
        <div className="session-card__actions">
          <button className="session-card__shows">View all shows</button>
          <button className="session-card__buy">Buy Tickets</button>
        </div>
      </div>
    </div>
  );
}
