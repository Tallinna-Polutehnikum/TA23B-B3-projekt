import { useState, useEffect } from 'react'
import './AdminDashboard.css'
import AddMovieForm from './AddMovieForm'
import AddSessionForm from './AddSessionForm'
import MoviesList from './MoviesList'
import SessionsList from './SessionsList'
import { apiFetch } from '../utils/api'

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [refresh, setRefresh] = useState(0)
  const [movieCount, setMovieCount] = useState(0)
  const [activeSessionsCount, setActiveSessionsCount] = useState(0)
  const [activeTicketsCount, setActiveTicketsCount] = useState(0)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [moviesResponse, statsResponse] = await Promise.all([
          apiFetch('/api/movies', {}, { withAuth: true }),
          apiFetch('/api/admin/stats', {}, { withAuth: true })
        ])

        if (moviesResponse.ok) {
          const movies = await moviesResponse.json()
          setMovieCount(Array.isArray(movies) ? movies.length : 0)
        }

        if (statsResponse.ok) {
          const stats = await statsResponse.json()
          setActiveSessionsCount(Number(stats.activeSessions || 0))
          setActiveTicketsCount(Number(stats.activeTickets || 0))
        } else if (statsResponse.status === 401 || statsResponse.status === 403) {
          onLogout()
        }
      } catch (error) {
        console.error('Error loading admin stats:', error)
      }
    }

    loadStats()
  }, [refresh, onLogout])

  const handleRefresh = () => {
    setRefresh(prev => prev + 1)
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-brand">
          <h1>Absolute Cinema</h1>
          <p>Admin Panel</p>
        </div>
        <div className="admin-user">
          <span className="user-avatar">{String(user?.username || 'A').charAt(0).toUpperCase()}</span>
          <span className="user-name">{user?.username || 'Admin'}</span>
          <button className="logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <div className="admin-container">
        <nav className="admin-sidebar">
          <div className="nav-section">
            <h3>Dashboard</h3>
            <button 
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="icon">📊</span>
              Overview
            </button>
          </div>
          
          <div className="nav-section">
            <h3>Manage Content</h3>
            <button 
              className={`nav-item ${activeTab === 'movies' ? 'active' : ''}`}
              onClick={() => setActiveTab('movies')}
            >
              <span className="icon">🎬</span>
              Movies
            </button>
            <button 
              className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              <span className="icon">🎫</span>
              Sessions
            </button>
          </div>

          <div className="nav-section">
            <h3>Add New</h3>
            <button 
              className={`nav-item ${activeTab === 'add-movie' ? 'active' : ''}`}
              onClick={() => setActiveTab('add-movie')}
            >
              <span className="icon">➕</span>
              New Movie
            </button>
            <button 
              className={`nav-item ${activeTab === 'add-session' ? 'active' : ''}`}
              onClick={() => setActiveTab('add-session')}
            >
              <span className="icon">➕</span>
              New Session
            </button>
          </div>

          <div className="nav-section">
            <h3>Settings</h3>
            <button className="nav-item">
              <span className="icon">⚙️</span>
              Configuration
            </button>
            <button className="nav-item">
              <span className="icon">📋</span>
              Reports
            </button>
          </div>
        </nav>

        <main className="admin-main">
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="overview-header">
                <h2>Dashboard Overview</h2>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🎬</div>
                  <div className="stat-info">
                    <div className="stat-value">{movieCount}</div>
                    <div className="stat-label">Movies in Database</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎫</div>
                  <div className="stat-info">
                    <div className="stat-value">{activeSessionsCount}</div>
                    <div className="stat-label">Active Sessions</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎟️</div>
                  <div className="stat-info">
                    <div className="stat-value">{activeTicketsCount}</div>
                    <div className="stat-label">Active Tickets</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎭</div>
                  <div className="stat-info">
                    <div className="stat-value">8</div>
                    <div className="stat-label">Cinemas</div>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button 
                    className="action-btn primary"
                    onClick={() => setActiveTab('add-movie')}
                  >
                    ➕ Add Movie
                  </button>
                  <button 
                    className="action-btn primary"
                    onClick={() => setActiveTab('add-session')}
                  >
                    ➕ Add Session
                  </button>
                  <button className="action-btn secondary">
                    📊 View Reports
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'movies' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>Movies Management</h2>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab('add-movie')}
                >
                  ➕ Add New Movie
                </button>
              </div>
              <MoviesList refresh={refresh} onUnauthorized={onLogout} />
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>Sessions Management</h2>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab('add-session')}
                >
                  ➕ Add New Session
                </button>
              </div>
              <SessionsList refresh={refresh} onUnauthorized={onLogout} />
            </div>
          )}

          {activeTab === 'add-movie' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>Add New Movie</h2>
              </div>
              <AddMovieForm 
                onUnauthorized={onLogout}
                onSuccess={() => {
                  handleRefresh()
                  setActiveTab('movies')
                }}
              />
            </div>
          )}

          {activeTab === 'add-session' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>Add New Session</h2>
              </div>
              <AddSessionForm 
                onUnauthorized={onLogout}
                onSuccess={() => {
                  handleRefresh()
                  setActiveTab('sessions')
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
