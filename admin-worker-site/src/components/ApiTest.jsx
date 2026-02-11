import { useState } from 'react'

export default function ApiTest() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testGetMovies = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/movies')
      const data = await res.json()
      setResult(JSON.stringify(data.slice(0, 2), null, 2))
    } catch (err) {
      setResult(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testUpdateMovie = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/movies/1296505', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Update ' + new Date().getTime(),
          overview: 'Test',
          poster: 'http://test.jpg',
          duration: 100,
          genre: 'horror',
          directors: 'Test'
        })
      })
      setResult(`Status: ${res.status}`)
    } catch (err) {
      setResult(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0',
      color: '#ddd'
    }}>
      <h3>API Test</h3>
      <button onClick={testGetMovies} disabled={loading} style={{ marginRight: '10px' }}>
        Test GET /api/movies
      </button>
      <button onClick={testUpdateMovie} disabled={loading}>
        Test PUT /api/movies/1296505
      </button>
      <pre style={{
        background: '#0a0a0a',
        padding: '10px',
        borderRadius: '4px',
        marginTop: '10px',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        {result || 'Click a button to test...'}
      </pre>
    </div>
  )
}
