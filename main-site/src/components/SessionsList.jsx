import { useState, useEffect } from 'react'
import './SessionsList.css'

export default function SessionsList({ refresh }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return <div className="loading">Loading sessions...</div>
  }

  return (
    <div className="sessions-list-container">
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
                  <span className={`seats-badge ${session.seats_available < 20 ? 'low' : ''}`}>
                    {session.seats_available}
                  </span>
                </td>
                <td>{session.language}</td>
                <td>{session.format}</td>
                <td className="actions-cell">
                  <button className="action-btn edit">✏️ Edit</button>
                  <button className="action-btn delete">🗑️ Delete</button>
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
