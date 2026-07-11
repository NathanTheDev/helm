# helm

A small personal dashboard. The `/habits` area is a full-stack habit tracker:
an Express + Prisma + Postgres backend and a Next.js frontend.

> **Single-user, no auth by design.** Every request runs as one hardcoded user
> (`DEFAULT_USER_ID`) via a `currentUser` middleware stub. `Habit.userId` is a
> plain indexed string, so real auth can be dropped in later without a schema
> rewrite.

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

Then open the frontend and visit `/habits`.
