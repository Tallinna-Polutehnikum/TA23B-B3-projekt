import { useState, useEffect } from 'react'
import './AdminDashboard.css'
import AddMovieForm from './AddMovieForm'
import AddSessionForm from './AddSessionForm'
import MoviesList from './MoviesList'
import SessionsList from './SessionsList'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [refresh, setRefresh] = useState(0)
  const [movieCount, setMovieCount] = useState(0)

  useEffect(() => {
    const loadMovieCount = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/movies')
        if (response.ok) {
          const movies = await response.json()
          setMovieCount(movies.length)
        }
      } catch (error) {
        console.error('Error loading movie count:', error)
      }
    }
    loadMovieCount()
  }, [refresh])

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
          <span className="user-avatar">A</span>
          <span className="user-name">Admin</span>
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
                    <div className="stat-value">156</div>
                    <div className="stat-label">Active Sessions</div>
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
              <MoviesList refresh={refresh} />
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
              <SessionsList refresh={refresh} />
            </div>
          )}

          {activeTab === 'add-movie' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>Add New Movie</h2>
              </div>
              <AddMovieForm 
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
