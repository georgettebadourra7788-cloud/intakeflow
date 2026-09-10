import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SignaturePad from '../components/SignaturePad.jsx'
import { db } from '../firebase.js'

const CONDITIONS = [
  { key: 'diabetes', label: 'Diabetes (Type 1 or 2)' },
  { key: 'hypertension', label: 'Hypertension (High Blood Pressure)' },
  { key: 'heartDisease', label: 'Heart Disease / Cardiovascular' },
  { key: 'asthma', label: 'Asthma / Respiratory Issues' },
  { key: 'other', label: 'Other Chronic Condition(s)' },
]

const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'nonbinary', label: 'Non-Binary' },
  { value: 'prefer_not', label: 'Prefer not to say' },
]

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <section className="rounded-xl bg-surface-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
          {subtitle && <p className="text-sm text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function TextField({ label, required, ...props }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-on-surface">
        {label}
        {required && ' *'}
      </span>
      <input
        required={required}
        className="h-12 w-full rounded-lg bg-surface-low px-4 text-base text-on-surface shadow-sm outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-primary/30"
        {...props}
      />
    </label>
  )
}

function TextArea({ label, hint, required, ...props }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-on-surface">
        {label}
        {required && ' *'}
      </span>
      {hint && <p className="text-sm text-on-surface-variant">{hint}</p>}
      <textarea
        required={required}
        className="w-full resize-none rounded-lg bg-surface-low p-3 text-base text-on-surface shadow-sm outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-primary/30"
        {...props}
      />
    </label>
  )
}

export default function IntakeForm() {
  const navigate = useNavigate()
  const signatureRef = useRef(null)

  const [legalName, setLegalName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [visitReason, setVisitReason] = useState('')
  const [conditions, setConditions] = useState({})
  const [otherConditionDetails, setOtherConditionDetails] = useState('')
  const [medications, setMedications] = useState('')
  const [allergies, setAllergies] = useState('')
  const [consentAgreed, setConsentAgreed] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function toggleCondition(key) {
    setConditions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!consentAgreed) {
      setError('Please agree to the consent statement before submitting.')
      return
    }
    if (signatureRef.current?.isEmpty()) {
      setError('Please provide your signature before submitting.')
      return
    }

    const patientId = phone.replace(/\D/g, '')
    if (!patientId) {
      setError('Please enter a valid phone number.')
      return
    }

    setSubmitting(true)
    try {
      const intake = {
        legalName,
        phone,
        dob,
        gender,
        visitReason,
        conditions,
        otherConditionDetails,
        medications,
        allergies,
        consentAgreed,
        signature: signatureRef.current.toDataURL(),
        status: 'new',
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'intakes'), intake)
      await setDoc(
        doc(db, 'patients', patientId),
        {
          legalName,
          phone,
          dob,
          gender,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      navigate('/intake/thanks')
    } catch (err) {
      console.error(err)
      setError('Something went wrong submitting your intake. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 pt-6 pb-32">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[18px]">local_hospital</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-primary">IntakeFlow</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary-container/40 px-3 py-1 text-xs font-semibold text-secondary">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Secure Intake</span>
          </div>
        </div>

        <header className="mb-5 rounded-xl bg-surface-card p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block truncate text-xs font-semibold tracking-wider text-secondary uppercase">
                MetroCare Wellness Clinic
              </span>
              <span className="block truncate text-lg font-semibold tracking-tight text-on-surface">
                Patient Check-in
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-secondary-container/50 px-3 py-1 text-xs font-semibold text-secondary">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              <span>~3 mins</span>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">
            Welcome, please complete your intake details below. Your personal and health data
            is encrypted and HIPAA compliant.
          </p>
        </header>

        <form id="intake-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
          <SectionCard
            icon="person"
            title="Personal Information"
            subtitle="Verify legal identity for clinical records"
          >
            <div className="flex flex-col gap-4">
              <TextField
                label="Full Legal Name"
                required
                type="text"
                placeholder="e.g. Eleanor Vance"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
              <TextField
                label="Phone Number"
                required
                type="tel"
                placeholder="(555) 234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <TextField
                label="Date of Birth"
                required
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-on-surface">Gender Identity</span>
                <div className="grid grid-cols-2 gap-2">
                  {GENDERS.map((g) => (
                    <label
                      key={g.value}
                      className={`flex h-12 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                        gender === g.value
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-low text-on-surface-variant hover:bg-secondary-container/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g.value}
                        checked={gender === g.value}
                        onChange={(e) => setGender(e.target.value)}
                        className="sr-only"
                      />
                      <span>{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon="assignment"
            title="Visit Reason"
            subtitle="Clinical motivation & current symptoms"
          >
            <TextArea
              label="What brings you in today?"
              required
              rows={3}
              hint="Describe your primary symptoms, how long you've felt them, or if this is a routine follow-up."
              placeholder="e.g. Mild chest tightness when climbing stairs for 3 days; also need refill for maintenance inhaler."
              value={visitReason}
              onChange={(e) => setVisitReason(e.target.value)}
            />
          </SectionCard>

          <SectionCard
            icon="medical_services"
            title="Medical History"
            subtitle="Help us avoid dangerous interactions"
          >
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-sm font-medium text-on-surface">
                  Select all existing conditions that apply to you:
                </p>
                <div className="flex flex-col gap-2">
                  {CONDITIONS.map((c) => (
                    <label
                      key={c.key}
                      className={`flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors ${
                        conditions[c.key] ? 'bg-secondary-container/50' : 'bg-surface-low'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-primary">
                          {conditions[c.key] && (
                            <span className="material-symbols-outlined text-[18px]">check</span>
                          )}
                        </div>
                        <span className="text-base text-on-surface">{c.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!conditions[c.key]}
                        onChange={() => toggleCondition(c.key)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <TextField
                label="If 'Other', please specify"
                type="text"
                placeholder="e.g. Thyroid condition, autoimmune history"
                value={otherConditionDetails}
                onChange={(e) => setOtherConditionDetails(e.target.value)}
                disabled={!conditions.other}
              />

              <TextArea
                label="Current Medications"
                rows={2}
                hint="List any prescription, over-the-counter medications, or supplements you take regularly."
                placeholder="e.g. Lisinopril 10mg daily, Multivitamin"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
              />

              <div className="flex flex-col gap-2 rounded-lg bg-error-container/40 p-4">
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                  <span className="text-sm font-medium">
                    Known Allergies (Food, Latex, Penicillin, etc.)
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Crucial for clinical safety. Write "None" if you have no known drug or contact
                  allergies.
                </p>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Penicillin (Hives), Peanuts (Severe anaphylaxis)"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full resize-none rounded-lg bg-white p-3 text-base text-on-surface shadow-sm outline-none transition-colors focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon="draw" title="Consent & Signature" subtitle="Acknowledgment & authorization">
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-surface-low p-4 text-sm leading-relaxed text-on-surface-variant">
                I certify that the information provided is accurate and complete to the best of
                my knowledge. I consent to outpatient medical evaluation and care and acknowledge
                receipt of the MetroCare Clinic Notice of Privacy Practices (HIPAA).
              </div>

              <label className="flex cursor-pointer items-start gap-3 select-none">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-1 h-5 w-5 cursor-pointer rounded accent-primary"
                />
                <span className="text-sm font-medium text-on-surface">
                  I agree to the terms, consent to treatment, and acknowledge the privacy
                  statement. *
                </span>
              </label>

              <SignaturePad ref={signatureRef} />
            </div>
          </SectionCard>

          {error && (
            <div className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
              {error}
            </div>
          )}
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-surface/90 px-4 py-3 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          <button
            type="submit"
            form="intake-form"
            disabled={submitting}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? (
              <span>Securing & Submitting...</span>
            ) : (
              <>
                <span>Submit Intake Form</span>
                <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-1 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span>256-Bit SSL Encrypted • MetroCare Clinic</span>
          </div>
        </div>
      </div>
    </div>
  )
}
