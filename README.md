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
npm run prisma:migrate        # create/apply tables
npm run db:seed               # optional: demo habits + completions
npm run dev                   # http://localhost:4000
```

`prisma migrate reset` also re-runs the seed (configured in `prisma.config.ts`).

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
(cd backend  && cp .env.example .env && npm install && npm run prisma:migrate && npm run db:seed && npm run dev)
(cd frontend && cp .env.example .env.local && npm install && npm run dev)
```

Then open the frontend and visit `/habits`.
