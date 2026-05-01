import './App.css'
import { useState } from 'react'
import AdminLogin from './components/AdminLogin'

function App() {
  const [loginNotice, setLoginNotice] = useState('')

  const handleLoginSuccess = (adminUser) => {
    const username = adminUser?.username ? ` ${adminUser.username}` : ''
    setLoginNotice(`Admin login successful${username}.`)
  }

  return (
    <div className="admin-app">
      <AdminLogin onSuccess={handleLoginSuccess} />
      {loginNotice ? <p>{loginNotice}</p> : null}
    </div>
  )
}

export default App
