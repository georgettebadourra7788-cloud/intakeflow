import { BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function IntakeThanks() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 font-sans text-center text-on-surface">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-secondary">
        <BadgeCheck className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-on-surface">
        Intake Received!
      </h1>
      <p className="mt-2 max-w-sm text-sm text-on-surface-variant">
        Thank you. Your information has been securely submitted to MetroCare Wellness Clinic.
        A staff member will call you back shortly to confirm your visit.
      </p>
      <Link
        to="/intake"
        className="mt-8 flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary shadow-lg"
      >
        Submit another intake
      </Link>
    </div>
  )
}
