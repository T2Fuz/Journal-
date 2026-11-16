import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyTheme, getInitialTheme } from './theme.js'
import './index.css'

applyTheme(getInitialTheme()) // before first paint, so no white flash in dark mode

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
