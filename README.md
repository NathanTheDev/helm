# helm

**A personal productivity dashboard** — habits, projects, notes, tables, and
your calendar in one place, built on a Next.js frontend and an Express +
Prisma + Postgres API.

<img width="1579" height="995" alt="image" src="https://github.com/user-attachments/assets/6cf31c49-d66f-4edd-a314-3990e5766817" />

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-black?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Postgres](https://img.shields.io/badge/Postgres-16-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

## Features

- **Habits** — daily/weekly habit tracking with streaks and a completion
  history chart.
- **Projects** — Notion-style **kanban boards** (Backlog / Todo / In Progress
  / Done) with drag-and-drop, tags, due dates, sub-tasks, and per-task
  **time tracking** (start/stop timers, estimates). **Worklog** rolls up
  tracked time per day/week.
- **Tables** — custom, user-defined data tables: create fields of any type,
  add/edit/delete rows, sort and filter, with drag-to-reorder rows and
  columns.
- **Notes** — a markdown editor with live syntax highlighting and real-time
  collaborative editing (via [LiveCode](https://github.com/NathanTheDev/LiveCode)),
  with a split preview/edit view.
- **Calendar** — a home-page widget backed by real Google Calendar OAuth,
  showing upcoming events at a glance.
- **Customizable appearance** — theme presets, a custom color theme builder,
  font picker, and a reorderable home dashboard.
- **Auth** — every route (aside from `/api/health`) requires a Firebase ID
  token; data is scoped per-user by Firebase UID.

## Tech stack

| Layer        | Stack                                                                |
| ------------ | --------------------------------------------------------------------- |
| Frontend     | Next.js 16, React 19, Tailwind CSS 4, dnd-kit, CodeMirror, Yjs        |
| Backend      | Express 5, TypeScript, Zod validation                                |
| Database     | PostgreSQL 16, Prisma ORM (migration-based schema)                   |
| Auth         | Firebase Authentication (ID token verification via firebase-admin)   |
| Integrations | Google Calendar API (OAuth 2.0), LiveCode (collaborative notes)      |

## Architecture

```
frontend (Next.js, :3000)  --->  backend (Express, :4000)  --->  Postgres (:5432)
        |                              |
        |                              +--> Firebase Admin (ID token verification)
        |                              +--> Google Calendar API (OAuth)
        |                              +--> LiveCode (collaborative notes backend + ysocket)
        +--> Firebase Auth (sign up / sign in)
```

Every owned model is scoped by `userId` (the Firebase UID) — there's no local
`users` table. Calendar OAuth tokens are encrypted at rest (AES-256-GCM)
before being persisted.

## Getting started

### Prerequisites

- Node.js
- Docker (for local Postgres), or any reachable Postgres via `DATABASE_URL`

### Quickstart

```bash
docker compose up -d
npx firebase-tools emulators:start --only auth &

cd backend
cp .env.example .env
npm install
npm run prisma:deploy
npm run db:seed
npm run seed:auth
npm run dev              # http://localhost:4000

cd ../frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

Open the frontend and sign in at `/login` with `demo@helm.dev` /
`helm-demo-1234` (created by `seed:auth`) to see seeded demo habits, two
projects with tasks/tags/sub-tasks/tracked time (including a running timer),
and sample tables — or sign up fresh at `/signup` for an empty account.

## API overview

- **Habits** — `GET/POST /api/habits`, `PATCH/DELETE /api/habits/:id`,
  `.../:id/completions`.
- **Projects** — `GET/POST /api/projects`, `PATCH/DELETE /api/projects/:id`.
- **Tasks** — `GET/POST /api/projects/:projectId/tasks`,
  `GET/PATCH/DELETE /api/tasks/:id` (PATCH moves status/position).
- **Time tracking** — `POST /api/tasks/:id/timer/{start,stop}`,
  `GET/POST/DELETE /api/tasks/:id/time-entries[/:entryId]`, `GET /api/worklog`.
- **Tags** — `GET/POST /api/tags`, `PATCH/DELETE /api/tags/:id`, attach/detach
  via `POST/DELETE /api/tasks/:id/tags/:tagId`.
- **Sub-tasks** — `GET/POST /api/tasks/:id/subtasks`,
  `PATCH/DELETE /api/subtasks/:id`.
- **Tables** — custom fields and rows under `/api/tables`.
- **Notes** — `/api/notes`, proxying collaborative sessions to LiveCode.
- **Calendar** — `/api/calendar`, including the Google OAuth flow and
  callback.

## Auth

Every API route (aside from `/api/health`) requires a valid Firebase ID token
(`Authorization: Bearer <token>`); the frontend attaches it automatically once
signed in.

For local development there's no need for a real Firebase project — everything
runs against the **Firebase Auth Emulator**:

```bash
npx firebase-tools emulators:start --only auth   # http://localhost:9099
```

`backend/.env` and `frontend/.env.local` already point at it
(`FIREBASE_AUTH_EMULATOR_HOST` / `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST`).
Sign up with any email/password at `/signup` — the emulator accepts anything
and doesn't send real email. Emulator accounts/data reset every time the
emulator restarts.

Seeded demo data (`npm run db:seed`) is attached to a placeholder
`DEFAULT_USER_ID`, not a real Firebase UID, so it won't show up under an
account you sign up fresh. `npm run seed:auth` (emulator must be running)
creates a fixed emulator account whose UID matches `DEFAULT_USER_ID` — sign in
at `/login` with `demo@helm.dev` / `helm-demo-1234`.

Swapping in a real Firebase project is env-only (`FIREBASE_PROJECT_ID`,
`NEXT_PUBLIC_FIREBASE_*` client config) — no code changes required.

## Database

Local Postgres runs via `docker-compose` (`postgres:16`):

```bash
docker compose up -d
```

`DATABASE_URL` is swappable to any hosted Postgres (Neon, Supabase, Railway,
RDS, …) with no code changes. Schema changes are tracked as committed
migrations under `backend/prisma/migrations/`.

- **Fresh DB:** `npm run prisma:deploy` applies all migrations.
- **Local dev, changing the schema:** `npm run prisma:migrate` (`migrate dev`)
  creates + applies a new migration.
- **Reset local DB:** `npm run prisma:reset` drops, re-applies all migrations,
  and re-runs the seed (`migrations.seed` in `prisma.config.ts`).

## Deployment

helm is built as two independently deployable services plus a managed
Postgres instance, with no code changes needed between environments:

- **Frontend** — a standard Next.js app; deploys to Vercel or any Node host.
  Set `NEXT_PUBLIC_API_BASE_URL` and the `NEXT_PUBLIC_FIREBASE_*` client
  config to production values.
- **Backend** — a standard Express app (`npm run build && npm start`); deploys
  to Railway, Fly.io, Render, or any container/Node host. Point
  `DATABASE_URL` at a hosted Postgres instance and run `npm run prisma:deploy`
  as part of the release step.
- **Auth** — point both services at a real Firebase project
  (`FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_*`) instead of the emulator.
- **Google Calendar** — register the production redirect URI
  (`GOOGLE_REDIRECT_URI`) on the OAuth client and set `FRONTEND_URL` to the
  deployed frontend origin.

See `backend/.env.example` and `frontend/.env.example` for the full list of
environment variables each service needs in production.
