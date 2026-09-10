import { signOut } from 'firebase/auth'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { auth, db } from '../firebase.js'

const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'all', label: 'All' },
]

function formatTime(date) {
  if (!date) return ''
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const clock = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  if (diffMin < 1) return `just now (${clock})`
  if (diffMin < 60) return `${diffMin}m ago (${clock})`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago (${clock})`
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function matchesDateFilter(createdAt, filter) {
  if (filter === 'all') return true
  if (!createdAt) return false
  if (filter === 'today') return isSameDay(createdAt, new Date())
  if (filter === 'week') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdAt >= weekAgo
  }
  return true
}

function StatusBadge({ status }) {
  if (status === 'reviewed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-0.5 text-xs font-semibold text-on-secondary-container">
        <span className="material-symbols-outlined text-[14px]">check</span>
        Reviewed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-0.5 text-xs font-semibold text-on-secondary-container">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      New
    </span>
  )
}

function IntakeCard({ intake }) {
  const createdAt = intake.createdAt?.toDate ? intake.createdAt.toDate() : null

  return (
    <Link
      to={`/dashboard/intake/${intake.id}`}
      className="relative flex flex-col overflow-hidden rounded-xl bg-surface-card p-4 shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
      <div className="flex items-start justify-between gap-2 pl-1">
        <div className="min-w-0">
          <h2 className="truncate text-base leading-tight font-semibold text-on-surface">
            {intake.legalName || 'Unnamed patient'}
          </h2>
          <span className="text-xs text-on-surface-variant">{formatTime(createdAt)}</span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <StatusBadge status={intake.status} />
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            chevron_right
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-surface-low p-3 pl-4">
        <p className="line-clamp-2 text-sm text-on-surface">
          "{intake.visitReason || 'No visit reason provided.'}"
        </p>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [intakes, setIntakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('today')

  useEffect(() => {
    const q = query(collection(db, 'intakes'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setIntakes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Unable to load the intake queue right now.')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const filteredIntakes = useMemo(() => {
    const term = search.trim().toLowerCase()
    return intakes.filter((intake) => {
      if (term && !(intake.legalName ?? '').toLowerCase().includes(term)) return false
      const createdAt = intake.createdAt?.toDate ? intake.createdAt.toDate() : null
      if (!matchesDateFilter(createdAt, dateFilter)) return false
      return true
    })
  }, [intakes, search, dateFilter])

  const hasSearch = search.trim() !== ''

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      <header className="sticky top-0 z-40 border-b border-outline bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <div className="flex flex-col">
            <span className="text-xs leading-none font-semibold text-secondary">
              MetroCare Wellness Clinic
            </span>
            <h1 className="text-lg leading-tight font-semibold tracking-tight text-on-surface">
              Staff Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-on-surface-variant sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="flex h-10 items-center gap-1 rounded-full bg-surface-low px-3 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5">
        <section className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Intake Queue</h2>
            <span className="inline-flex items-center rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-on-secondary-container">
              {filteredIntakes.length} shown
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">Real-time triage queue for General Practice Unit</p>
        </section>

        <section className="flex flex-col gap-3">
          <div className="relative flex items-center rounded-xl bg-surface-card shadow-sm">
            <span className="material-symbols-outlined absolute left-3 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name..."
              className="h-12 w-full rounded-xl bg-transparent pr-4 pl-10 text-base text-on-surface placeholder:text-on-surface-variant focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {DATE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setDateFilter(f.value)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                  dateFilter === f.value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-card text-on-surface-variant'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
              progress_activity
            </span>
          </div>
        ) : filteredIntakes.length > 0 ? (
          <section className="flex flex-col gap-3">
            {filteredIntakes.map((intake) => (
              <IntakeCard key={intake.id} intake={intake} />
            ))}
          </section>
        ) : (
          <section className="my-4 flex flex-col items-center justify-center rounded-xl bg-surface-card p-8 text-center shadow-sm">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-surface-low">
              <span className="material-symbols-outlined text-[48px] text-primary">
                {hasSearch ? 'search_off' : 'task_alt'}
              </span>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-on-surface">
              {hasSearch
                ? 'No matching intakes'
                : dateFilter === 'today'
                  ? 'No intakes yet today'
                  : 'No intakes found'}
            </h3>
            <p className="mb-6 max-w-[260px] text-sm text-on-surface-variant">
              {hasSearch
                ? 'Try a different patient name.'
                : 'New patient self-check-ins will populate here in real-time.'}
            </p>
            {(hasSearch || dateFilter !== 'today') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setDateFilter('today')
                }}
                className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary shadow-sm"
              >
                Reset filters
              </button>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
