import './App.css'
import { useCallback, useEffect, useState } from 'react'
import AdminDashboard from './components/AdminDashboard'
import AdminLogin from './components/AdminLogin'
import { apiFetch, clearAdminToken, getAdminToken } from './utils/api'

function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState(null)

  const handleLogout = useCallback(() => {
    clearAdminToken()
    setUser(null)
  }, [])

  useEffect(() => {
    const restoreSession = async () => {
      const token = getAdminToken()
      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const response = await apiFetch('/api/auth/me', {}, { withAuth: true })
        if (!response.ok) {
          throw new Error('Session expired')
        }
        const payload = await response.json()
        if (!payload?.user?.isAdmin) {
          throw new Error('Admin account required')
        }
        setUser(payload.user)
      } catch {
        clearAdminToken()
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    restoreSession()
  }, [])

  if (authLoading) {
    return <div className="admin-app">Loading admin session...</div>
  }

  return (
    <div className="admin-app">
      {user ? (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
        />
      ) : (
        <AdminLogin onSuccess={setUser} />
      )}
    </div>
  )
}

export default App
