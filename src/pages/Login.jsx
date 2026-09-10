import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { auth } from '../firebase.js'

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    const redirectTo = location.state?.from ?? '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate(location.state?.from ?? '/dashboard', { replace: true })
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 font-sans">
      <div className="w-full max-w-sm rounded-xl bg-surface-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[20px]">local_hospital</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-primary">IntakeFlow</h1>
          <p className="text-sm text-on-surface-variant">Sign in to the clinic staff dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-on-surface">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="you@metrocare.clinic"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-lg bg-surface-low px-4 text-base text-on-surface shadow-sm outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-on-surface">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-lg bg-surface-low px-4 text-base text-on-surface shadow-sm outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-primary/30"
            />
          </label>

          {error && (
            <div className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
