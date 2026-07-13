# helm

A small personal dashboard on an Express + Prisma + Postgres backend and a
Next.js frontend. Two full-stack features:

- **`/habits`** — habit tracker with streaks and daily/weekly completions.
- **`/projects`** — project-based **kanban board** (Backlog / Todo / In Progress
  / Done) with drag-and-drop, per-task **time tracking** (start/stop timer,
  estimates), tags, due dates, and sub-tasks. **`/worklog`** aggregates tracked
  time per day/week.

> **Firebase Auth required.** Every API route except `/api/health` requires a
> valid Firebase ID token (`Authorization: Bearer <token>`); the frontend
> attaches it automatically once signed in. `userId` on every owned model is
> the Firebase UID — no local `users` table. See **Auth** below for local dev
> (no real Firebase project needed, just the Auth Emulator).

## API overview

- Habits: `GET/POST /api/habits`, `PATCH/DELETE /api/habits/:id`,
  `.../:id/completions`.
- Projects: `GET/POST /api/projects`, `PATCH/DELETE /api/projects/:id`.
- Tasks: `GET/POST /api/projects/:projectId/tasks`,
  `GET/PATCH/DELETE /api/tasks/:id` (PATCH moves status/position).
- Time: `POST /api/tasks/:id/timer/{start,stop}`,
  `GET/POST/DELETE /api/tasks/:id/time-entries[/:entryId]`, `GET /api/worklog`.
- Tags: `GET/POST /api/tags`, `PATCH/DELETE /api/tags/:id`,
  attach/detach via `POST/DELETE /api/tasks/:id/tags/:tagId`.
- Sub-tasks: `GET/POST /api/tasks/:id/subtasks`,
  `PATCH/DELETE /api/subtasks/:id`.

## Auth

No real Firebase project exists yet. Local dev runs entirely against the
**Firebase Auth Emulator** instead:

```
npx firebase-tools emulators:start --only auth   # http://localhost:9099
```

`backend/.env` and `frontend/.env.local` already point at it
(`FIREBASE_AUTH_EMULATOR_HOST` / `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST`).
Sign up with any email/password at `/signup` — the emulator accepts anything
and doesn't send real email. Emulator accounts/data reset every time the
emulator restarts.

Note: seeded demo data (`npm run db:seed`) is attached to a placeholder
`DEFAULT_USER_ID`, not a real Firebase UID, so it won't show up under any
account you sign up with — it's only useful for direct DB inspection right
now.

Swapping in a real Firebase project later is env-only (`FIREBASE_PROJECT_ID`,
`NEXT_PUBLIC_FIREBASE_*` client config) — no code changes.

## Prerequisites

- Node.js
- Docker (for the local Postgres), or any reachable Postgres via `DATABASE_URL`

## Database

Local Postgres runs via `docker-compose` (`postgres:16`):

```
docker compose up -d
```

`DATABASE_URL` is swappable to a hosted Postgres (Neon/Supabase/Railway) for
prod with no code changes.

## Backend (Express + TS)

```
cd backend
cp .env.example .env          # PORT + DATABASE_URL
npm install
npm run prisma:deploy         # apply committed migrations (fresh DB)
npm run db:seed               # optional: demo data
npm run dev                   # http://localhost:4000
```

Schema changes are tracked as committed migrations under
`backend/prisma/migrations/`.

- **Fresh DB:** `npm run prisma:deploy` applies all migrations.
- **Local dev, changing the schema:** `npm run prisma:migrate` (`migrate dev`)
  creates + applies a new migration.
- **Reset local DB:** `npm run prisma:reset` drops, re-applies all migrations,
  and re-runs the seed (`migrations.seed` in `prisma.config.ts`).
- **Previously used `db push`** (tables already exist)? Run `npm run prisma:reset`
  once to adopt the committed migrations (this wipes local data; the seed
  repopulates demo data).

## Frontend (Next.js)

```
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_BASE_URL
npm install
npm run dev                   # http://localhost:3000
```

## Fresh-clone quickstart

```
docker compose up -d
(cd backend  && cp .env.example .env && npm install && npm run prisma:deploy && npm run db:seed && npm run dev)
(cd frontend && cp .env.example .env.local && npm install && npm run dev)
```

Then open the frontend and visit `/habits`, `/projects`, or `/worklog`. The
seed populates demo habits plus two projects with tasks, tags, sub-tasks, and
tracked time (including one running timer).
