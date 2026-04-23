import { useState, useEffect, useRef } from 'react'
import './MoviesList.css'
import { apiFetch } from '../utils/api'

const FALLBACK_POSTER = 'https://via.placeholder.com/60x90?text=No+Image'

function resolvePosterUrl(poster) {
  if (!poster) return FALLBACK_POSTER

  const normalized = String(poster).trim()
  if (!normalized) return FALLBACK_POSTER

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  if (normalized.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w342${normalized}`
  }

  return FALLBACK_POSTER
}

export default function MoviesList({ refresh, onUnauthorized }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [genres, setGenres] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    overview: '',
    poster: '',
    duration: '',
    genre: '',
    directors: ''
  })
  
  // Use refs to track if we've already loaded data
  const genresLoadedRef = useRef(false)

  // Simple fetch functions without useCallback to avoid re-render loops
  const loadMovies = async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/movies', {}, { withAuth: true })
      if (res.status === 401 || res.status === 403) {
        onUnauthorized?.()
        throw new Error('Unauthorized')
      }
      const data = await res.json()
      setMovies(data)
    } catch (err) {
      console.error('Error loading movies:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadGenres = async () => {
    try {
      const res = await apiFetch('/api/genres')
      const data = await res.json()
      setGenres(data)
    } catch (err) {
      console.error('Error loading genres:', err)
    }
  }

  // Load movies when refresh changes
  useEffect(() => {
    loadMovies()
  }, [refresh])

  // Load genres only once on mount
  useEffect(() => {
    if (!genresLoadedRef.current) {
      genresLoadedRef.current = true
      loadGenres()
    }
  }, [])

  // Prevent scroll when modal is open
  useEffect(() => {
    if (editingId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [editingId])

  const handleEdit = (movie) => {
    setEditingId(movie.id)
    setEditForm({
      title: movie.title || '',
      overview: movie.overview || '',
      poster: movie.poster || '',
      duration: movie.duration || '',
      genre: movie.genre || '',
      directors: movie.directors || ''
    })
  }

  const handleSave = async () => {
    if (!editingId) return

    try {
      const res = await apiFetch(`/api/movies/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          overview: editForm.overview,
          poster: editForm.poster,
          duration: editForm.duration === '' ? null : Number(editForm.duration),
          genre: editForm.genre,
          directors: editForm.directors
        })
      }, { withAuth: true })

      if (res.status === 401 || res.status === 403) {
        onUnauthorized?.()
        throw new Error('Session expired. Please log in again.')
      }

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      // Reset state immediately
      setEditingId(null)
      setEditForm({
        title: '',
        overview: '',
        poster: '',
        duration: '',
        genre: '',
        directors: ''
      })
      // Reload movies after successful save
      loadMovies()
    } catch (err) {
      alert('Error saving movie: ' + err.message)
    }
  }

  const handleDelete = async (movieId) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) {
      return
    }

    try {
      const res = await apiFetch(`/api/movies/${movieId}`, {
        method: 'DELETE'
      }, { withAuth: true })

      if (res.status === 401 || res.status === 403) {
        onUnauthorized?.()
        throw new Error('Session expired. Please log in again.')
      }

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      loadMovies()
    } catch (err) {
      alert('Error deleting movie: ' + err.message)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({
      title: '',
      overview: '',
      poster: '',
      duration: '',
      genre: '',
      directors: ''
    })
  }

  if (loading) {
    return <div className="loading">Loading movies...</div>
  }

  return (
    <div className="movies-list-container">
      {movies.length === 0 ? (
        <div className="empty-state">
          <p>No movies found. Create your first movie!</p>
        </div>
      ) : (
        <div className="movies-table-wrapper">
          <table className="movies-table">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Title</th>
                <th>Overview</th>
                <th>Duration</th>
                <th>Directors</th>
                <th>Genre</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map(movie => (
                <tr key={movie.id}>
                  <td>
                    <img
                      src={resolvePosterUrl(movie.poster)}
                      alt={movie.title}
                      className="movie-poster-thumb"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_POSTER) {
                          e.currentTarget.src = FALLBACK_POSTER
                        }
                      }}
                    />
                  </td>
                  <td className="movie-title">{movie.title}</td>
                  <td className="movie-overview">
                    {movie.overview ? `${movie.overview.substring(0, 100)}...` : '—'}
                  </td>
                  <td>{movie.duration || '—'}</td>
                  <td>{movie.directors || '—'}</td>
                  <td>{movie.genre || '—'}</td>
                  <td className="actions-cell">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEdit(movie)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(movie.id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingId && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Movie</h3>
            <div className="form-grid">
              <label>
                <span>Title</span>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </label>
              <label>
                <span>Poster URL</span>
                <input
                  type="text"
                  value={editForm.poster}
                  onChange={(e) => setEditForm({ ...editForm, poster: e.target.value })}
                />
              </label>
              <label>
                <span>Genre</span>
                <select
                  value={editForm.genre}
                  onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                >
                  <option value="">Select genre</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.type}>
                      {g.type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Duration (min)</span>
                <input
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                />
              </label>
              <label>
                <span>Directors</span>
                <input
                  type="text"
                  value={editForm.directors}
                  onChange={(e) => setEditForm({ ...editForm, directors: e.target.value })}
                />
              </label>
              <label className="full-row">
                <span>Overview</span>
                <textarea
                  rows="4"
                  value={editForm.overview}
                  onChange={(e) => setEditForm({ ...editForm, overview: e.target.value })}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="action-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="action-btn edit" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
