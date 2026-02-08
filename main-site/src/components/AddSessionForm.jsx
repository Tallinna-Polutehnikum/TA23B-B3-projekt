import { useState, useEffect } from 'react'
import './AddSessionForm.css'

export default function AddSessionForm({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [movies, setMovies] = useState([])
  const [cinemas] = useState([
    'Tallinn - Kino',
    'Tallinn - CinemaX',
    'Tallinn - Forum',
    'Tartu - Cinema',
    'Tartu - Plaza'
  ])

  const [formData, setFormData] = useState({
    movieId: '',
    cinema: '',
    date: '',
    time: '',
    hall: '1',
    seatsAvailable: '100',
    language: 'Estonian',
    subtitles: 'English',
    format: '2D'
  })

  useEffect(() => {
    // Fetch movies list
    fetch('/api/movies/top')
      .then(res => res.json())
      .then(data => setMovies(data))
      .catch(err => console.error('Failed to load movies', err))
  }, [])

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
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to add session')
      }

      // Reset form
      setFormData({
        movieId: '',
        cinema: '',
        date: '',
        time: '',
        hall: '1',
        seatsAvailable: '100',
        language: 'Estonian',
        subtitles: 'English',
        format: '2D'
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
      <form className="session-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="movieId">Select Movie *</label>
            <select
              id="movieId"
              name="movieId"
              value={formData.movieId}
              onChange={handleChange}
              required
            >
              <option value="">Choose a movie...</option>
              {movies.map(movie => (
                <option key={movie.id} value={movie.id}>
                  {movie.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cinema">Cinema *</label>
            <select
              id="cinema"
              name="cinema"
              value={formData.cinema}
              onChange={handleChange}
              required
            >
              <option value="">Choose a cinema...</option>
              {cinemas.map(cinema => (
                <option key={cinema} value={cinema}>
                  {cinema}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Time *</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hall">Hall Number</label>
            <select
              id="hall"
              name="hall"
              value={formData.hall}
              onChange={handleChange}
            >
              <option value="1">Hall 1</option>
              <option value="2">Hall 2</option>
              <option value="3">Hall 3</option>
              <option value="4">Hall 4</option>
              <option value="5">Hall 5</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="seatsAvailable">Available Seats *</label>
            <input
              type="number"
              id="seatsAvailable"
              name="seatsAvailable"
              value={formData.seatsAvailable}
              onChange={handleChange}
              required
              min="1"
              max="500"
            />
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
            >
              <option value="Estonian">Estonian</option>
              <option value="English">English</option>
              <option value="Russian">Russian</option>
              <option value="German">German</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subtitles">Subtitles</label>
            <select
              id="subtitles"
              name="subtitles"
              value={formData.subtitles}
              onChange={handleChange}
            >
              <option value="None">None</option>
              <option value="Estonian">Estonian</option>
              <option value="English">English</option>
              <option value="Russian">Russian</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="format">Format</label>
            <select
              id="format"
              name="format"
              value={formData.format}
              onChange={handleChange}
            >
              <option value="2D">2D</option>
              <option value="3D">3D</option>
              <option value="IMAX">IMAX</option>
              <option value="4DX">4DX</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Adding Session...' : '✓ Add Session'}
          </button>
        </div>
      </form>
    </div>
  )
}
