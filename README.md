# Wardline

A lightweight ward-management prototype for a quarantine & treatment facility, built around one core clinical fact: a patient is cured after 3 full fever-free days. Everything in the app exists to track that reliably and get patients in and out of beds without anything falling through the cracks.

**Live demo:** _add your Vercel URL here once deployed_

## The problem

A 74-bed quarantine facility was tracking temperatures on paper. Readings got duplicated or skipped, doctors sometimes visited before a nurse had taken that day's temperature, discharges got delayed because doctors forgot to tell admin, and there was no way to see whether the facility's recovery rate was holding up against its target. Wardline replaces the paper journal with a small, role-based app that enforces the right order of operations and surfaces the two numbers leadership actually cares about: bed occupancy and recovery rate.

## Roles

- **Nurse** — sees who still needs a temperature reading today, logs it once per patient per day.
- **Doctor** — sees only patients whose reading is already in; can't visit a patient before the nurse has measured them. Approves discharge once a patient hits 3 fever-free days, or records an outcome.
- **Admin** — manages bed capacity, finalizes discharges a doctor has approved, admits new patients (blocked once the ward is full), and monitors recovery rate against an 85% benchmark.

Switch roles using the pills in the top bar — there's no real authentication in this prototype, it's meant to demonstrate the three perspectives in one build.

## Tech stack

- React 18 + Vite
- [lucide-react](https://lucide.dev/) for icons
- No CSS framework — all styling is inline, so there's nothing extra to configure

## Running locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Building for production

```bash
npm run build
npm run preview   # serve the production build locally to sanity-check it
```

## Deploying

This is a standard Vite app, so Vercel auto-detects everything — no config needed:

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Click **Deploy**.

## Project structure

```
.
├── index.html
├── package.json
├── vite.config.js
└── src
    ├── main.jsx     # mounts the app
    └── App.jsx      # the entire Wardline UI and logic
```

## Notes on the data

Patient records are seeded in-memory in `App.jsx` for demo purposes — there's no backend or persistence, so a page refresh resets the ward to its seed state. The seed data is written to walk through every state the app needs to demonstrate: a patient needing a reading, one ready for a doctor visit, one hitting the 3-day threshold, one already approved and awaiting admin, and a couple of closed historical records that feed the recovery-rate stat.
