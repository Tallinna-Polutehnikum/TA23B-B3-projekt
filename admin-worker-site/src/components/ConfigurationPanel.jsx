import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import './ConfigurationPanel.css'

const INITIAL_CONFIG = {
  siteName: '',
  supportEmail: '',
  contactPhone: '',
  bookingPolicy: ''
}

export default function ConfigurationPanel({ onUnauthorized }) {
  const [config, setConfig] = useState(INITIAL_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadConfig = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/admin/config', {}, { withAuth: true })
      if (response.status === 401 || response.status === 403) {
        onUnauthorized?.()
        throw new Error('Session expired. Please log in again.')
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || 'Failed to load configuration')
      }
      const payload = await response.json()
      setConfig({ ...INITIAL_CONFIG, ...(payload?.config || {}) })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [onUnauthorized])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const response = await apiFetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      }, { withAuth: true })

      if (response.status === 401 || response.status === 403) {
        onUnauthorized?.()
        throw new Error('Session expired. Please log in again.')
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || 'Failed to save configuration')
      }

      const payload = await response.json()
      setConfig({ ...INITIAL_CONFIG, ...(payload?.config || {}) })
      setNotice('Configuration saved successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="config-panel config-panel--status">Loading configuration...</div>
  }

  return (
    <div className="config-panel">
      <h3>Configuration</h3>
      <p className="config-panel__subtitle">Update key operational settings for the admin team.</p>

      <form className="config-form" onSubmit={handleSubmit}>
        {error ? <div className="config-feedback config-feedback--error">{error}</div> : null}
        {notice ? <div className="config-feedback config-feedback--ok">{notice}</div> : null}

        <label>
          <span>Site name</span>
          <input
            type="text"
            value={config.siteName}
            onChange={(event) => setConfig((prev) => ({ ...prev, siteName: event.target.value }))}
            required
          />
        </label>

        <label>
          <span>Support email</span>
          <input
            type="email"
            value={config.supportEmail}
            onChange={(event) => setConfig((prev) => ({ ...prev, supportEmail: event.target.value }))}
            required
          />
        </label>

        <label>
          <span>Contact phone</span>
          <input
            type="text"
            value={config.contactPhone}
            onChange={(event) => setConfig((prev) => ({ ...prev, contactPhone: event.target.value }))}
          />
        </label>

        <label className="config-form__full-row">
          <span>Booking policy</span>
          <textarea
            rows="5"
            value={config.bookingPolicy}
            onChange={(event) => setConfig((prev) => ({ ...prev, bookingPolicy: event.target.value }))}
            required
          />
        </label>

        <div className="config-form__actions">
          <button type="button" className="config-btn config-btn--secondary" onClick={loadConfig}>Reload</button>
          <button type="submit" className="config-btn config-btn--primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}
