import { useState, useEffect } from 'react'
import './MoviesList.css'

export default function MoviesList({ refresh }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMovies()
  }, [refresh])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/movies/top')
      const data = await response.json()
      setMovies(data)
    } catch (err) {
      console.error('Failed to fetch movies', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading movies...</div>
  }

  return (
    <div className="movies-list-container">
      <div className="movies-table-wrapper">
        <table className="movies-table">
          <thead>
            <tr>
              <th>Poster</th>
              <th>Title</th>
              <th>Overview</th>
              <th>Genre</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map(movie => {
              const posterSrc = movie.poster
                ? (movie.poster.startsWith('http') ? movie.poster : `https://image.tmdb.org/t/p/w300${movie.poster}`)
                : 'https://via.placeholder.com/120x180?text=No+Image';

              return (
              <tr key={movie.id}>
                <td>
                  <img 
                    src={posterSrc} 
                    alt={movie.title}
                    className="movie-poster-thumb"
                  />
                </td>
                <td className="movie-title">{movie.title}</td>
                <td className="movie-overview">{movie.overview?.substring(0, 100)}...</td>
                <td>{movie.genre || '—'}</td>
                <td className="actions-cell">
                  <button className="action-btn edit">✏️ Edit</button>
                  <button className="action-btn delete">🗑️ Delete</button>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {movies.length === 0 && (
        <div className="empty-state">
          <p>No movies found. Create your first movie!</p>
        </div>
      )}
    </div>
  )
}
