import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyTheme, getInitialTheme } from './theme.js'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Offline + auto-update (same approach as TimeLogger): checks for a new
// version every time the app opens and every minute while it is open.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    registration.update()
    setInterval(() => registration.update(), 60 * 1000)
  },
})

applyTheme(getInitialTheme()) // before first paint, so no white flash in dark mode

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
