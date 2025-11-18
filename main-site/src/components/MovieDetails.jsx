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

  if (!movie) return null;

  return (
    <div className="movie-page">
      <div className="hero">
        <div className="media">
          <img src={`https://image.tmdb.org/t/p/w780${movie.poster}`} alt={movie.title} />
        </div>
        <div className="info">
          <p className="subtitle">{movie.original_title}</p>
          <h1>{movie.title}</h1>
          <span className="badge">{movie.rating ?? 'MS-12'}</span>
          <ul className="meta-list">
            <li><strong>Жанр</strong>{movie.genres}</li>
            <li><strong>Режиссёр</strong>{movie.director}</li>
            <li><strong>Продолжительность</strong>{movie.runtime ?? '1h 53min'}</li>
          </ul>
          <div className="cast">
            <strong>В ролях</strong>
            <p>{movie.cast}</p>
          </div>
          <button className="primary">Выберите сеанс</button>
        </div>
      </div>
      <section className="synopsis">
        <h2>Описание</h2>
        <p>{movie.overview}</p>
      </section>
      <Footer />
    </div>
  );
}