import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import './ReportsPanel.css'

function getDefaultStartDate() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  return first.toISOString().slice(0, 10)
}

function getDefaultEndDate() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReportsPanel({ onUnauthorized }) {
  const [startDate, setStartDate] = useState(getDefaultStartDate)
  const [endDate, setEndDate] = useState(getDefaultEndDate)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const search = new URLSearchParams()
      if (startDate) search.set('startDate', startDate)
      if (endDate) search.set('endDate', endDate)

      const response = await apiFetch(`/api/admin/reports/summary?${search.toString()}`, {}, { withAuth: true })
      if (response.status === 401 || response.status === 403) {
        onUnauthorized?.()
        throw new Error('Session expired. Please log in again.')
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || 'Failed to load reports')
      }
      const payload = await response.json()
      setReport(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, onUnauthorized])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  return (
    <div className="reports-panel">
      <div className="reports-panel__header">
        <h3>Reports</h3>
        <div className="reports-panel__filters">
          <label>
            <span>From</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <button onClick={loadReport} className="reports-btn">Refresh</button>
        </div>
      </div>

      {loading ? <div className="reports-status">Loading report...</div> : null}
      {error ? <div className="reports-status reports-status--error">{error}</div> : null}

      {!loading && !error && report ? (
        <>
          <div className="reports-cards">
            <article className="reports-card">
              <h4>Total users</h4>
              <strong>{report.totals.totalUsers}</strong>
            </article>
            <article className="reports-card">
              <h4>Admins</h4>
              <strong>{report.totals.totalAdmins}</strong>
            </article>
            <article className="reports-card">
              <h4>Sessions in period</h4>
              <strong>{report.totals.sessionsInRange}</strong>
            </article>
            <article className="reports-card">
              <h4>Tickets in period</h4>
              <strong>{report.totals.ticketsInRange}</strong>
            </article>
            <article className="reports-card">
              <h4>Paid transactions</h4>
              <strong>{report.totals.paidTransactions}</strong>
            </article>
            <article className="reports-card">
              <h4>Revenue (EUR)</h4>
              <strong>{Number(report.totals.revenueEur || 0).toFixed(2)}</strong>
            </article>
          </div>

          <div className="reports-top-movies">
            <h4>Top movies by sold tickets</h4>
            {report.topMovies?.length ? (
              <ul>
                {report.topMovies.map((movie) => (
                  <li key={movie.id}>
                    <span>{movie.title}</span>
                    <strong>{movie.ticketsSold}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No sales data for this period.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
