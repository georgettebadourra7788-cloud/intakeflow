import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../firebase.js'

const CONDITION_LABELS = {
  diabetes: 'Diabetes (Type 1 or 2)',
  hypertension: 'Hypertension (High Blood Pressure)',
  heartDisease: 'Heart Disease / Cardiovascular',
  asthma: 'Asthma / Respiratory Issues',
  other: 'Other Chronic Condition(s)',
}

function formatDateTime(date) {
  if (!date) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function IntakeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [intake, setIntake] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const ref = doc(db, 'intakes', id)
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true)
        } else {
          setIntake({ id: snap.id, ...snap.data() })
        }
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Unable to load this intake right now.')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [id])

  async function toggleReviewed() {
    if (!intake) return
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'intakes', intake.id), {
        status: intake.status === 'reviewed' ? 'new' : 'reviewed',
      })
    } catch (err) {
      console.error(err)
      setError('Unable to update this intake right now.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
          progress_activity
        </span>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center font-sans">
        <p className="text-on-surface-variant">This intake could not be found.</p>
        <Link
          to="/dashboard"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  const createdAt = intake.createdAt?.toDate ? intake.createdAt.toDate() : null
  const conditionKeys = Object.entries(intake.conditions ?? {})
    .filter(([, checked]) => checked)
    .map(([key]) => key)

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      <header className="sticky top-0 z-40 border-b border-outline bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:text-primary"
            aria-label="Back to dashboard"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <span className="text-xs leading-none font-semibold text-secondary">Staff Detail</span>
            <h1 className="text-lg leading-tight font-semibold tracking-tight text-on-surface">
              {intake.legalName || 'Unnamed patient'}
            </h1>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
            {intake.status === 'reviewed' ? 'Reviewed' : 'New'}
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5">
        {error && (
          <div className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
            {error}
          </div>
        )}

        <section className="rounded-xl bg-surface-card p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-on-surface-variant">Submitted {formatDateTime(createdAt)}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-semibold text-on-surface-variant uppercase">DOB</dt>
              <dd className="text-sm text-on-surface">{intake.dob || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-on-surface-variant uppercase">Gender</dt>
              <dd className="text-sm text-on-surface capitalize">{intake.gender || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-on-surface-variant uppercase">Phone</dt>
              <dd className="text-sm text-on-surface">{intake.phone || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl bg-surface-card p-5 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-on-surface">Visit Reason</h2>
          <p className="rounded-lg bg-surface-low p-3 text-sm text-on-surface">
            {intake.visitReason || 'No visit reason provided.'}
          </p>
        </section>

        <section className="rounded-xl bg-surface-card p-5 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-on-surface">Medical History</h2>
          <div className="flex flex-wrap gap-2">
            {conditionKeys.length > 0 ? (
              conditionKeys.map((key) => (
                <span
                  key={key}
                  className="rounded-md bg-surface-low px-2 py-0.5 text-sm text-on-surface"
                >
                  {CONDITION_LABELS[key] ?? key}
                </span>
              ))
            ) : (
              <span className="text-sm text-on-surface-variant">No conditions reported.</span>
            )}
          </div>
          {intake.otherConditionDetails && (
            <p className="mt-2 text-sm text-on-surface-variant">{intake.otherConditionDetails}</p>
          )}

          <h3 className="mt-4 mb-1 text-sm font-semibold text-on-surface">Current Medications</h3>
          <p className="text-sm text-on-surface-variant">{intake.medications || 'None reported.'}</p>

          <div className="mt-4 rounded-lg bg-error-container/40 p-3">
            <div className="flex items-center gap-2 text-error">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <h3 className="text-sm font-semibold">Known Allergies</h3>
            </div>
            <p className="mt-1 text-sm text-on-surface">{intake.allergies || 'None reported.'}</p>
          </div>
        </section>

        <section className="rounded-xl bg-surface-card p-5 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-on-surface">Consent & Signature</h2>
          <p className="mb-3 text-sm text-on-surface-variant">
            {intake.consentAgreed
              ? 'Patient agreed to the terms, consent to treatment, and privacy statement.'
              : 'Consent was not confirmed.'}
          </p>
          {intake.signature && (
            <img
              src={intake.signature}
              alt="Patient signature"
              className="h-24 w-full rounded-lg bg-surface-low object-contain"
            />
          )}
        </section>

        <section className="rounded-xl bg-surface-card p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-on-surface">Staff Action</h2>
          <button
            type="button"
            onClick={toggleReviewed}
            disabled={updating}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-on-primary shadow-sm disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[20px]">
              {intake.status === 'reviewed' ? 'undo' : 'check_circle'}
            </span>
            {intake.status === 'reviewed' ? 'Mark as New' : 'Mark Intake as Reviewed'}
          </button>
        </section>
      </main>
    </div>
  )
}
