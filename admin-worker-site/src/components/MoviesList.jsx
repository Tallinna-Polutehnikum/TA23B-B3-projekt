import { useState, useEffect } from 'react'
import './MoviesList.css'

export default function MoviesList({ refresh }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [genres, setGenres] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', overview: '', poster: '', duration: '', genre: '', directors: '' })
  const posterFallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="90" viewBox="0 0 60 90" fill="none"><rect width="60" height="90" fill="%23181818" rx="4"/><text x="50%" y="50%" fill="%23aaaaaa" font-size="9" font-family="Arial" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>'

  const buildPosterSrc = (poster) => {
    const url = (poster || '').trim()
    if (!url) return posterFallback
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `https://image.tmdb.org/t/p/w200${url}`
    return url
  }

  useEffect(() => {
    fetchMovies()
  }, [refresh])

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const res = await fetch('/api/genres')
        const data = await res.json()
        setGenres(data)
      } catch (err) {
        console.error('Failed to fetch genres', err)
      }
    }

    loadGenres()
  }, [])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/movies')
      const data = await response.json()
      setMovies(data)
    } catch (err) {
      console.error('Failed to fetch movies', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (movieId) => {
    const ok = window.confirm('Delete this movie?')
    if (!ok) return

    try {
      const res = await fetch(`/api/movies/${movieId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      fetchMovies()
    } catch (err) {
      console.error('Failed to delete movie', err)
      alert('Could not delete movie')
    }
  }

  const openEditor = (movie) => {
    setEditing(movie)
    setForm({
      title: movie.title || '',
      overview: movie.overview || '',
      poster: movie.poster || '',
      duration: movie.duration || '',
      genre: movie.genre || '',
      directors: movie.directors || ''
    })
  }

  const closeEditor = () => {
    setEditing(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!editing) return
    const payload = {
      title: form.title.trim(),
      overview: form.overview.trim(),
      poster: form.poster.trim(),
      duration: form.duration === '' ? null : Number(form.duration),
      genre: form.genre.trim(),
      directors: form.directors.trim()
    }

    try {
      const res = await fetch(`/api/movies/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Update failed')
      closeEditor()
      fetchMovies()
    } catch (err) {
      console.error('Failed to update movie', err)
      alert('Could not update movie')
    }
  }

  const handleImgError = (e) => {
    if (e.target.dataset.fallback) return
    e.target.dataset.fallback = 'true'
    e.target.src = posterFallback
  }

  if (loading) {
    return <div className="loading">Loading movies...</div>
  }

  return (
    <>
      <div className="movies-list-container">
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
                      src={buildPosterSrc(movie.poster)}
                      alt={movie.title}
                      onError={handleImgError}
                      className="movie-poster-thumb"
                    />
                  </td>
                  <td className="movie-title">{movie.title}</td>
                  <td className="movie-overview">{movie.overview ? `${movie.overview.substring(0, 100)}...` : '—'}</td>
                  <td>{movie.duration ?? '—'}</td>
                  <td>{movie.directors || '—'}</td>
                  <td>{movie.genre || '—'}</td>
                  <td className="actions-cell">
                    <button className="action-btn edit" onClick={() => openEditor(movie)}>✏️ Edit</button>
                    <button className="action-btn delete" onClick={() => handleDelete(movie.id)}>🗑️ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {movies.length === 0 && (
          <div className="empty-state">
            <p>No movies found. Create your first movie!</p>
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={closeEditor}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Movie</h3>
            <div className="form-grid">
              <label>
                <span>Title</span>
                <input name="title" value={form.title} onChange={handleChange} />
              </label>
              <label>
                <span>Poster URL</span>
                <input name="poster" value={form.poster} onChange={handleChange} />
                {form.poster && (
                  <div className="poster-preview">
                    <img src={buildPosterSrc(form.poster)} alt="Poster preview" onError={handleImgError} />
                  </div>
                )}
              </label>
              <label>
                <span>Genre</span>
                <select name="genre" value={form.genre} onChange={handleChange}>
                  <option value="">Select genre</option>
                  {genres.map(g => (
                    <option key={g.id} value={g.type}>{g.type}</option>
                  ))}
                  {form.genre && !genres.find(g => g.type === form.genre) && (
                    <option value={form.genre}>{form.genre}</option>
                  )}
                </select>
              </label>
              <label>
                <span>Duration (min)</span>
                <input name="duration" value={form.duration} onChange={handleChange} />
              </label>
              <label>
                <span>Directors</span>
                <input name="directors" value={form.directors} onChange={handleChange} />
              </label>
              <label className="full-row">
                <span>Overview</span>
                <textarea name="overview" value={form.overview} onChange={handleChange} rows={4} />
              </label>
            </div>
            <div className="modal-actions">
              <button className="action-btn" onClick={closeEditor}>Cancel</button>
              <button className="action-btn edit" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
