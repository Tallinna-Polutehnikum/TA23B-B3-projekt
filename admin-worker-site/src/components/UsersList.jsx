import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import './UsersList.css'

export default function UsersList({ onUnauthorized }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/admin/users', {}, { withAuth: true })
      if (response.status === 401 || response.status === 403) {
        onUnauthorized?.()
        throw new Error('Session expired. Please log in again.')
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || 'Failed to load users')
      }
      const payload = await response.json()
      setUsers(Array.isArray(payload) ? payload : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [onUnauthorized])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  if (loading) {
    return <div className="users-panel users-panel--status">Loading users...</div>
  }

  if (error) {
    return <div className="users-panel users-panel--status users-panel--error">{error}</div>
  }

  return (
    <div className="users-panel">
      <div className="users-panel__header">
        <h3>Registered users</h3>
        <button className="users-panel__refresh" onClick={loadUsers}>Refresh</button>
      </div>

      <div className="users-panel__table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Tickets</th>
              <th>Paid orders</th>
              <th>Spent (EUR)</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username || 'User'}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={`users-table__role ${user.isAdmin ? 'is-admin' : 'is-user'}`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>{user.ticketsCount}</td>
                <td>{user.paidOrders}</td>
                <td>{Number(user.spentEur || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
