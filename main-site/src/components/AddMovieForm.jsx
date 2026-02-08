import { useState } from 'react'
import './AddMovieForm.css'

export default function AddMovieForm({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    overview: '',
    poster: '',
    duration: '',
    genre: '',
    directors: '',
    releaseDate: '',
    rating: '7.5'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to add movie')
      }

      // Reset form
      setFormData({
        title: '',
        originalTitle: '',
        overview: '',
        poster: '',
        duration: '',
        genre: '',
        directors: '',
        releaseDate: '',
        rating: '7.5'
      })
      
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <form className="movie-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title">Movie Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., The Matrix"
            />
          </div>

          <div className="form-group">
            <label htmlFor="originalTitle">Original Title</label>
            <input
              type="text"
              id="originalTitle"
              name="originalTitle"
              value={formData.originalTitle}
              onChange={handleChange}
              placeholder="e.g., The Matrix (Original)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes) *</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              placeholder="e.g., 136"
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="releaseDate">Release Date *</label>
            <input
              type="date"
              id="releaseDate"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="genre">Genre *</label>
            <select
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
            >
              <option value="">Select Genre</option>
              <option value="Action">Action</option>
              <option value="Drama">Drama</option>
              <option value="Comedy">Comedy</option>
              <option value="Horror">Horror</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Romance">Romance</option>
              <option value="Thriller">Thriller</option>
              <option value="Animation">Animation</option>
              <option value="Adventure">Adventure</option>
              <option value="Documentary">Documentary</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rating">IMDb Rating</label>
            <input
              type="number"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              placeholder="e.g., 8.7"
              min="0"
              max="10"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="directors">Directors</label>
            <input
              type="text"
              id="directors"
              name="directors"
              value={formData.directors}
              onChange={handleChange}
              placeholder="e.g., Lana Wachowski, Lilly Wachowski"
            />
          </div>

          <div className="form-group">
            <label htmlFor="poster">Poster URL *</label>
            <input
              type="url"
              id="poster"
              name="poster"
              value={formData.poster}
              onChange={handleChange}
              required
              placeholder="https://example.com/poster.jpg"
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="overview">Overview *</label>
          <textarea
            id="overview"
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            required
            placeholder="Enter movie description here..."
            rows="6"
          ></textarea>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Adding Movie...' : '✓ Add Movie'}
          </button>
        </div>
      </form>
    </div>
  )
}
