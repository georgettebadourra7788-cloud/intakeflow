import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { auth, db } from '../firebase.js'

function formatRelativeTime(date) {
  if (!date) return ''
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const clock = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  if (diffMin < 1) return `just now (${clock})`
  if (diffMin < 60) return `${diffMin}m ago (${clock})`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago (${clock})`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago (${clock})`
}

function toDateInputValue(date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
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
    <article className="relative flex flex-col overflow-hidden rounded-xl bg-surface-card p-4 shadow-sm">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
      <div className="flex items-start justify-between gap-2 pl-1">
        <div className="min-w-0">
          <h2 className="truncate text-base leading-tight font-semibold text-on-surface">
            {intake.legalName || 'Unnamed patient'}
          </h2>
          <span className="text-sm text-on-surface-variant">
            {intake.dob ? `DOB: ${intake.dob}` : 'DOB: —'}
            {intake.phone ? ` • ${intake.phone}` : ''}
          </span>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <StatusBadge status={intake.status} />
          <span className="text-xs text-on-surface-variant">{formatRelativeTime(createdAt)}</span>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-surface-low p-3">
        <p className="line-clamp-2 text-sm text-on-surface">
          "{intake.visitReason || 'No visit reason provided.'}"
        </p>
      </div>
    </article>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [intakes, setIntakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

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
      if (term) {
        const haystack = `${intake.legalName ?? ''} ${intake.phone ?? ''} ${intake.dob ?? ''} ${intake.visitReason ?? ''}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (dateFilter) {
        const createdAt = intake.createdAt?.toDate ? intake.createdAt.toDate() : null
        if (!createdAt || toDateInputValue(createdAt) !== dateFilter) return false
      }
      return true
    })
  }, [intakes, search, dateFilter])

  const hasActiveFilters = search.trim() !== '' || dateFilter !== ''

  function clearFilters() {
    setSearch('')
    setDateFilter('')
  }

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
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Today's Intakes</h2>
            <span className="inline-flex items-center rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-on-secondary-container">
              {intakes.length} Total
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">Real-time triage queue for General Practice Unit</p>
        </section>

        <section className="flex items-center gap-2">
          <div className="relative flex flex-1 items-center rounded-xl bg-surface-card shadow-sm">
            <span className="material-symbols-outlined absolute left-3 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, DOB, or phone..."
              className="h-12 w-full rounded-xl bg-transparent pr-4 pl-10 text-base text-on-surface placeholder:text-on-surface-variant focus:outline-none"
            />
          </div>
          <div className="relative flex items-center rounded-xl bg-surface-card shadow-sm">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-primary">
              calendar_today
            </span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-12 rounded-xl bg-transparent py-2 pr-3 pl-10 text-sm text-on-surface focus:outline-none"
            />
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
                {hasActiveFilters ? 'search_off' : 'task_alt'}
              </span>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-on-surface">
              {hasActiveFilters ? 'No matching intakes' : 'All Caught Up!'}
            </h3>
            <p className="mb-6 max-w-[260px] text-sm text-on-surface-variant">
              {hasActiveFilters
                ? 'Try a different search term or date.'
                : 'No pending intakes yet. New patient self-check-ins will populate here in real-time.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary shadow-sm"
              >
                Clear filters
              </button>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
