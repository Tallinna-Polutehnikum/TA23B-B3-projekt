import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from './Footer';
import './MovieDetails.css';

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    fetch(`/api/movies/${id}`)
      .then((res) => res.json())
      .then(setMovie)
      .catch(console.error);
  }, [id]);

  const formatDuration = (value) => {
    if (!value) return '—';
    const [h, m] = value.split(':');
    return `${Number(h)}h ${m}min`;
  };

  if (!movie) return null;

  return (
    <section className="movie-page">
      <a className="back-arrow" href="/">&#8592;</a>
      <div className="movie-content">
        <div className="hero">
          <div className="media">
            <img src={`https://image.tmdb.org/t/p/w780${movie.poster}`} alt={movie.title} />
          </div>

          <div className="info">
            <div className="info-meta">
              <p className="subtitle">{movie.original_title}</p>
              <h1>{movie.title}</h1>
              <span className="badge">{movie.rating ?? 'MS-12'}</span>
              <ul className="meta-list">
                <li><strong>Genre</strong>{movie.genre ?? '—'}</li>
                <li><strong>Director</strong>{movie.director ?? '—'}</li>
                <li><strong>Duration</strong>{formatDuration(movie.duration)}</li>
              </ul>
              <div className="cast">
                <strong>Cast</strong>
                <p>{movie.cast ?? 'Cast info coming soon.'}</p>
              </div>
            </div>

            <section className="description-card">
              <h2>Description</h2>
              <p>{movie.overview}</p>
            </section>

            <button className="primary">Choose a session</button>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}