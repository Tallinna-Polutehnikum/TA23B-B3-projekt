import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Footer from './Footer';
import './MovieDetails.css';
import { formatDurationLabel, normalizeDisplayText } from '../utils/movieUi';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    // Try primary movie endpoint first; if not found, fall back to coming-soon list
    (async () => {
      try {
        const res = await fetch(`/api/movies/${id}`);
        if (res.ok) {
          const data = await res.json();
          setMovie(data);
          return;
        }

        // fallback: fetch coming-soon list and find the item by id
        const cs = await fetch('/api/movies/coming-soon');
        if (!cs.ok) {
          setMovie({ message: 'Not found' });
          return;
        }
        const list = await cs.json();
        const found = list.find((m) => String(m.id) === String(id));
        if (found) {
          setMovie(found);
        } else {
          setMovie({ message: 'Not found' });
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id]);

  const displayGenre = normalizeDisplayText(movie?.genre);
  const displayDirector = normalizeDisplayText(movie?.director);
  const displayDuration = formatDurationLabel(movie?.duration);
  const displayCast = movie?.cast ?? 'Cast info coming soon.';

  const goToShowtimes = () => {
    navigate(`/showtime?movieId=${id}`);
  };

  const handleBack = () => {
    if (location.state?.from === 'showtimes') {
      navigate('/showtime');
      return;
    }
    navigate(-1);
  };

  if (!movie) return null;

  return (
    <section className="movie-page">
      <button className="back-arrow" onClick={handleBack} aria-label="Back">
        &#8592;
      </button>
      <div className="movie-content">
        <div className="hero">
          <div className="media">
            {movie.poster ? (
              <img src={`https://image.tmdb.org/t/p/w780${movie.poster}`} alt={movie.title} />
            ) : (
              <div className="no-poster">Poster not available</div>
            )}
          </div>

          <div className="info">
            <div className="info-meta">
              <p className="subtitle">{movie.original_title}</p>
              <h1>{movie.title}</h1>
              <span className="badge">{movie.rating ?? 'MS-12'}</span>
              <ul className="meta-list">
                <li><strong>Genre</strong>{displayGenre}</li>
                <li><strong>Director</strong>{displayDirector}</li>
                <li><strong>Duration</strong>{displayDuration}</li>
              </ul>
              <div className="cast">
                <strong>Cast</strong>
                <p>{displayCast}</p>
              </div>
            </div>

            <section className="description-card">
              <h2>Description</h2>
              <p>{movie.overview}</p>
            </section>

            <button className="primary" onClick={goToShowtimes}>Choose a session</button>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}