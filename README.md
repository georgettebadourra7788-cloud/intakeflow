# IntakeFlow

A Vite + React + Firebase app for MetroCare Wellness Clinic's digital patient intake.

## Stack

- [Vite](https://vite.dev/) + React
- [Tailwind CSS v4](https://tailwindcss.com/) (teal/white clinical design system)
- [React Router](https://reactrouter.com/)
- [Firebase](https://firebase.google.com/) (Firestore + Hosting)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Firebase project's web app config
npm run dev
```

## Firebase setup

1. Create a Firebase project and a Firestore database.
2. Register a web app and copy its config values into `.env.local`.
3. Enable the **Email/Password** sign-in provider (Authentication → Sign-in
   method) and add a staff account (Authentication → Users) — there is no
   self-serve sign-up.
4. Set `default` in `.firebaserc` to your Firebase project ID.
5. Deploy Firestore rules/indexes and hosting:

```bash
npm run build
npx firebase-tools deploy
```

## Routes

- `/intake` — Patient intake form (no auth). Submits to the `intakes` Firestore
  collection and upserts `patients/{phone}` with `merge: true`.
- `/intake/thanks` — Confirmation screen shown after a successful submission.
- `/login` — Staff sign-in (Firebase email/password).
- `/dashboard` — Clinic staff dashboard (requires sign-in, redirects to
  `/login` otherwise). Real-time list of `intakes` ordered by `createdAt`
  desc, with search and date filtering.
