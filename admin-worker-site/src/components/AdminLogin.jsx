import { useState } from 'react'
import './AdminLogin.css'
import { apiFetch, setAdminToken } from '../utils/api'

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState('absolute.cinema2027@gmail.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || 'Login failed')
      }

      const payload = await response.json()
      if (!payload?.token || !payload?.user) {
        throw new Error('Invalid login response')
      }

      setAdminToken(payload.token)
      onSuccess(payload.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>Absolute Cinema</h1>
        <p>Admin sign in</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error ? <div className="admin-login-error">{error}</div> : null}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="absolute.cinema2027@gmail.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
