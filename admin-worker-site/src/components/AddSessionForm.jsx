import { useState, useEffect } from 'react'
import './AddSessionForm.css'
import { buildHallsEndpoint, createInitialSessionFormData } from '../utils/sessionForm'

export default function AddSessionForm({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [movies, setMovies] = useState([])
  const [cinemas, setCinemas] = useState([])
  const [halls, setHalls] = useState([])

  const [formData, setFormData] = useState(createInitialSessionFormData)

  useEffect(() => {
    // Fetch movies list
    fetch('/api/movies/top')
      .then(res => res.json())
      .then(data => setMovies(data))
      .catch(err => console.error('Failed to load movies', err))

    // Fetch cinemas list
    fetch('/api/cinemas')
      .then(res => res.json())
      .then(data => setCinemas(data))
      .catch(err => console.error('Failed to load cinemas', err))
  }, [])

  useEffect(() => {
    if (!formData.cinemaId) {
      setHalls([])
      return
    }

    fetch(buildHallsEndpoint(formData.cinemaId))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load halls: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => setHalls(Array.isArray(data) ? data : []))
      .catch((err) => {
        setHalls([])
        console.error('Failed to load halls', err)
      })
  }, [formData.cinemaId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'cinemaId' ? { hallId: '' } : {})
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
        let message = 'Failed to add session'
        try {
          const payload = await response.json()
          if (payload?.message) {
            message = payload.message
          }
        } catch {
          // Keep generic message if response is not JSON.
        }
        throw new Error(message)
      }

      // Reset form
      setFormData(createInitialSessionFormData())
      
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
            <label htmlFor="cinemaId">Cinema *</label>
            <select
              id="cinemaId"
              name="cinemaId"
              value={formData.cinemaId}
              onChange={handleChange}
              required
            >
              <option value="">Choose a cinema...</option>
              {cinemas.map(cinema => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name}
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
            <label htmlFor="hallId">Hall *</label>
            <select
              id="hallId"
              name="hallId"
              value={formData.hallId}
              onChange={handleChange}
              required
              disabled={!formData.cinemaId}
            >
              <option value="">{formData.cinemaId ? 'Choose a hall...' : 'Select cinema first'}</option>
              {halls.map(hall => (
                <option key={hall.id} value={hall.id}>
                  Hall {hall.hall_number}
                </option>
              ))}
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
