import { useState, useEffect } from 'react'
import './SessionsList.css'

export default function SessionsList({ refresh }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [refresh])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()
      setSessions(data)
    } catch (err) {
      console.error('Failed to fetch sessions', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sessionId) => {
    const ok = window.confirm('Delete this session?')
    if (!ok) return

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      fetchSessions()
    } catch (err) {
      console.error('Failed to delete session', err)
      alert('Could not delete session')
    }
  }

  const handleEdit = async (session) => {
    const movieId = window.prompt('Movie ID', session.movie_id ?? '')
    if (movieId === null) return

    const cinemaId = window.prompt('Cinema ID (leave blank to keep current)', session.cinema_id ?? '')
    if (cinemaId === null) return

    const date = window.prompt('Date (YYYY-MM-DD)', session.date || '')
    if (date === null) return

    const time = window.prompt('Time (HH:MM)', session.time || '')
    if (time === null) return

    const hall = window.prompt('Hall', session.hall || '')
    if (hall === null) return

    const seatsAvailable = window.prompt('Seats available', session.seats ?? session.seats_available ?? '')
    if (seatsAvailable === null) return

    const language = window.prompt('Language', session.language || '')
    if (language === null) return

    const subtitles = window.prompt('Subtitles', session.subtitles || '')
    if (subtitles === null) return

    const format = window.prompt('Format (2D/3D/IMAX)', session.format || '')
    if (format === null) return

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: movieId ? Number(movieId) : null,
          cinemaId: cinemaId ? Number(cinemaId) : null,
          date,
          time,
          hall,
          seatsAvailable: seatsAvailable ? Number(seatsAvailable) : null,
          language,
          subtitles,
          format
        })
      })

      if (!res.ok) throw new Error('Update failed')
      fetchSessions()
    } catch (err) {
      console.error('Failed to update session', err)
      alert('Could not update session')
    }
  }

  const handleBulkDelete = async () => {
    if (!startDate || !endDate) {
      alert('Pick both start and end dates')
      return
    }

    const toDelete = sessions.filter(s => s.date >= startDate && s.date <= endDate)
    if (toDelete.length === 0) {
      alert('No sessions in that range')
      return
    }

    const ok = window.confirm(`Delete ${toDelete.length} sessions between ${startDate} and ${endDate}?`)
    if (!ok) return

    setBulkDeleting(true)
    try {
      await Promise.all(
        toDelete.map(s => fetch(`/api/sessions/${s.id}`, { method: 'DELETE' }))
      )
      fetchSessions()
    } catch (err) {
      console.error('Failed bulk delete', err)
      alert('Could not delete some sessions')
    } finally {
      setBulkDeleting(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading sessions...</div>
  }

  return (
    <div className="sessions-list-container">
      <div className="sessions-filters">
        <div className="date-range">
          <label>
            <span>From</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </label>
        </div>
        <button className="action-btn delete" disabled={bulkDeleting} onClick={handleBulkDelete}>
          {bulkDeleting ? 'Deleting…' : 'Delete by date range'}
        </button>
      </div>
      <div className="sessions-table-wrapper">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Cinema</th>
              <th>Date</th>
              <th>Time</th>
              <th>Hall</th>
              <th>Seats</th>
              <th>Language</th>
              <th>Format</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id}>
                <td className="session-title">{session.title}</td>
                <td>{session.cinema}</td>
                <td>{session.date}</td>
                <td className="session-time">{session.time}</td>
                <td className="session-hall">{session.hall}</td>
                <td className="session-seats">
                  <span className={`seats-badge ${(session.seats ?? session.seats_available) < 20 ? 'low' : ''}`}>
                    {session.seats ?? session.seats_available ?? '—'}
                  </span>
                </td>
                <td>{session.language}</td>
                <td>{session.format}</td>
                <td className="actions-cell">
                  <button className="action-btn edit" onClick={() => handleEdit(session)}>✏️ Edit</button>
                  <button className="action-btn delete" onClick={() => handleDelete(session.id)}>🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessions.length === 0 && (
        <div className="empty-state">
          <p>No sessions found. Create your first session!</p>
        </div>
      )}
    </div>
  )
}
