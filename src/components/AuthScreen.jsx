import { useState } from 'react'
import { friendlyError, logIn, signUp } from '../auth.js'
import ThemeToggle from './ThemeToggle.jsx'

export default function AuthScreen({ theme, onToggleTheme }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') await signUp(username, password)
      else await logIn(username, password)
      // On success App.jsx notices the login by itself and switches screen.
    } catch (err) {
      setError(friendlyError(err))
      setBusy(false)
    }
  }

  const isSignup = mode === 'signup'

  return (
    <div className="min-h-screen bg-cream text-ink flex items-center justify-center p-6">
      <div className="fixed top-4 right-4">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <form onSubmit={submit} className="w-full max-w-sm border border-line rounded-xl p-7 bg-surface">
        <h1 className="text-2xl font-bold mb-1">Journal</h1>
        <p className="text-sm text-muted mb-6">
          {isSignup ? 'Notun account banan' : 'Apnar account e login korun'}
        </p>

        <label className="block text-xs text-muted mb-1">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          className="w-full border border-line bg-cream text-ink rounded-lg px-3 py-2 mb-4 outline-none focus:border-pink-400"
        />

        <label className="block text-xs text-muted mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="w-full border border-line bg-cream text-ink rounded-lg px-3 py-2 mb-4 outline-none focus:border-pink-400"
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full bg-pink-800 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? 'Wait...' : isSignup ? 'Sign up' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? 'login' : 'signup')
            setError('')
          }}
          className="w-full text-sm text-muted mt-4"
        >
          {isSignup ? 'Account ache? Login' : 'Notun? Account banan'}
        </button>
      </form>
    </div>
  )
}
