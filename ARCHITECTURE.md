# helm — Architecture, System Design & Deployment

This document describes the architectural, system design, and deployment
decisions behind **helm**, a personal productivity dashboard (habits,
projects/kanban, custom tables, collaborative notes, and a Google Calendar
widget). It is intended as a deep-dive companion to `README.md`, covering the
*why* behind the structure, not just the *what*.

---

## 1. High-level topology

helm is split into three independently deployable pieces, plus one external
service it depends on for a single feature (real-time collaborative notes):

```
                         ┌─────────────────────┐
                         │   Firebase Auth      │
                         │ (ID token issuance)  │
                         └──────────┬───────────┘
                                    │ sign in / sign up
                                    ▼
┌───────────────┐  Bearer ID token  ┌──────────────────┐        ┌──────────────┐
│   frontend     │ ────────────────▶│     backend       │──────▶│  PostgreSQL  │
│ Next.js 16,    │◀──────────────── │ Express 5 + Prisma│       │   (:5432)    │
│ React 19 (:3000)│      JSON        │      (:4000)      │       └──────────────┘
└───────┬────────┘                  └─────┬──────┬──────┘
        │                                 │      │
        │ ws (Firebase token)             │      └──▶ firebase-admin
        │                                 │           (verify ID tokens)
        ▼                                 ▼
┌────────────────────┐          ┌──────────────────────┐
│ LiveCode / ysocket  │          │ Google Calendar API   │
│  (y-websocket, :1234)│         │  (OAuth 2.0)          │
└─────────┬───────────┘          └───────────────────────┘
          │ internal API key (service-to-service)
          ▼
┌────────────────────┐
│ LiveCode / backend   │
│  (Rust/Axum, :3000)  │
│  + its own Postgres  │
└─────────────────────┘
```

Three trust domains meet at the backend:

1. **End-user identity** — Firebase ID tokens, verified per-request.
2. **Service-to-service trust** — a shared internal API key between helm's
   backend and LiveCode's backend, with no per-user identity check at that
   hop.
3. **Third-party OAuth** — Google Calendar tokens, obtained via a standard
   authorization-code flow and encrypted before being persisted.

Each of these is handled with a distinct mechanism (see §4), which is a
deliberate design choice: the trust model at each boundary is different, so
the code doesn't try to unify them behind one abstraction.

---

## 2. Service boundaries and why they're split this way

### 2.1 Frontend (Next.js 16 / React 19)

- Pure presentation + client-side data-fetching layer. It holds **no**
  business logic beyond client-side validation/derived state (e.g. kanban
  column derivation, habit streak *display*, not streak *computation*).
- Talks to the backend exclusively over HTTP via `NEXT_PUBLIC_API_BASE_URL`,
  attaching a Firebase ID token as a Bearer header on every call
  (`frontend/src/lib/api.ts`).
- Owns exactly one direct external connection that bypasses the backend: the
  collaborative notes WebSocket (`NEXT_PUBLIC_NOTES_WS_URL`), which connects
  straight to LiveCode's `ysocket`. This is intentional — proxying a
  real-time CRDT sync stream through the Express backend would add a hop with
  no benefit (helm's backend has no CRDT logic and doesn't need one), so the
  browser talks to the collaboration service directly, authenticated with its
  own Firebase ID token.

### 2.2 Backend (Express 5 / TypeScript / Prisma)

- The single source of truth for all domain data. Every route (except
  `/api/health` and the Calendar OAuth callback) sits behind `currentUser`
  middleware (`backend/src/middleware/currentUser.ts`), which verifies the
  Firebase ID token and attaches `req.userId`.
- **No local `users` table.** Every owned model (`Habit`, `Project`, `Task`,
  `Note`, `CustomTable`, `GoogleCalendarConnection`, …) carries a `userId`
  column that *is* the Firebase UID, indexed for per-user scoping
  (`@@index([userId])` throughout `schema.prisma`). This avoids a
  join-through-users pattern and a synchronization problem (keeping a local
  user row in sync with Firebase) that has no payoff here — Firebase is
  already the durable identity store.
- Route handlers query `where: { userId: req.userId, ... }` directly rather
  than through a shared authorization layer — a deliberate flat design given
  the app's single-tenant-per-row shape (see §5 for the trade-off).

### 2.3 Database (PostgreSQL 16 via Prisma)

- Prisma is used in **migration mode**, not `db push` — every schema change
  is a committed, reviewable file under `backend/prisma/migrations/`. This
  matters for production deploys: `prisma migrate deploy` is run as an
  explicit release step (see §6), so schema changes are versioned alongside
  code and can be rolled forward deterministically in any environment.
- `DATABASE_URL` is the only coupling point to Postgres — local dev points at
  a docker-composed instance; production can point at any hosted Postgres
  (Neon, Supabase, Railway, RDS) with zero code changes.
- Local Postgres runs as a single `docker-compose.yml` service; this is dev
  tooling only, not a deployment artifact — production Postgres is assumed to
  be a managed instance, not the docker-compose container.

### 2.4 LiveCode — the collaborative-notes dependency

helm treats real-time collaborative editing as **outsourced infrastructure**
rather than something to build in-house. That's the core design decision
behind the Notes feature, and it's worth spelling out why and how.

---

## 3. LiveCode integration deep dive

**Repository:** [github.com/NathanTheDev/LiveCode](https://github.com/NathanTheDev/LiveCode)

LiveCode is a **headless** collaborative-editing backend — it has no UI of
its own and is designed purely to be embedded as a dependency by a consuming
application, exactly as helm does. It is composed of two independently
running processes:

| Component | Stack | Role |
|---|---|---|
| **backend** | Rust, Axum, sqlx, its own Postgres | Owns note lifecycle & CRDT state at rest. REST API, gated by a shared internal API key. No per-end-user identity check — trusts whatever service holds the key. |
| **ysocket** | Node.js, `y-websocket` | The actual WebSocket endpoint browsers connect to. Verifies a Firebase ID token *per connection* and polls the backend's active/inactive flag every 5 seconds, disconnecting clients whose room goes inactive mid-session. |

### 3.1 Why split "state owner" from "socket gateway"

This two-process split lets each half authenticate against the trust domain
it actually faces:

- The **Axum backend** never sees a browser directly — only helm's Express
  server, which it trusts via a static shared secret
  (`X-Internal-Key` / `INTERNAL_API_KEY`, matched exactly between helm's
  `NOTES_INTERNAL_API_KEY` and LiveCode's own `.env`). Verifying a Firebase
  token on every internal CRDT-state request would be pure overhead — the
  caller isn't a browser, so there's no browser identity to check.
- **ysocket** is the only piece that ever talks to an end user's browser, so
  it's the only piece that verifies Firebase ID tokens — one verification per
  WebSocket handshake, not per message, since messages are Yjs sync frames,
  not something with independently forgeable identity per-packet.

This means the "is this room still open" check and the "is this user allowed
to connect" check live in different processes, at different frequencies:
active/inactive is backend-owned and polled (5s), identity is per-connection
and checked once at handshake time.

### 3.2 The publish/edit/close lifecycle (helm side)

A helm `Note` is plain rows in helm's own Postgres — title, markdown
`content`, `published` flag — until a user chooses to make it collaborative.
`backend/src/services/notesCollab.ts` and `backend/src/routes/notes.ts`
implement the handoff:

1. **Publish** (`POST /api/notes/:id/publish`) — helm seeds a fresh Yjs
   document from the note's current plain-text `content`
   (`buildYjsSeed`), inserting it into a `Y.Doc`'s `"codemirror"` text type
   (the key must match what the frontend editor binds to — see §3.3), encodes
   it as a raw update, and `POST`s the bytes to LiveCode's
   `POST /notes` as `application/octet-stream`. LiveCode responds with an
   `{ id, is_active }` — that `id` becomes helm's `externalDocId`, and helm
   mints its own `shareToken` for the "anyone with the link" sharing model.
   This step is idempotent: publishing an already-published note is a no-op
   that just returns it, so it can't orphan a second LiveCode room.
2. **Live editing** — once published, the frontend's `useYjsEditor` hook
   connects a browser directly to `ysocket` (bypassing helm's Express server
   entirely) using the note's `externalDocId` as the WebSocket room name and
   the user's live Firebase ID token as a connection param. helm's backend is
   not in the hot path for keystrokes at all — sync happens entirely between
   collaborating browsers and ysocket.
3. **Close** (`POST /api/notes/:id/close`) — helm `PATCH`es
   `/notes/:id/active` to `false` (which makes ysocket's active-poll reject
   any further join/reconnect, live sessions included), then `GET`s the raw
   final ydoc bytes back and decodes them (`decodeYjsContent`) into plain
   text, which is written back into helm's own `content` column. LiveCode's
   row for the note is deliberately left inactive/orphaned rather than
   deleted — cheap to leave, and a cleanup sweep is explicitly out of scope
   for this feature rather than being half-built.

The result: helm's own database is the durable, canonical store for note
content in both the "never published" and "closed" states; LiveCode only
owns the content transiently, for the duration a note is actively being
collaborated on. This means LiveCode can be treated as effectively stateless
from helm's perspective — losing a LiveCode instance mid-session is the worst
case, not a permanent data-loss case, since the last-synced content is
whatever helm seeded it with.

### 3.3 The CodeMirror ↔ Yjs ↔ ysocket wiring

`frontend/src/hooks/useYjsEditor.ts` binds:

- a `Y.Doc` synced over `y-websocket`'s `WebsocketProvider` (pointed at
  `NEXT_PUBLIC_NOTES_WS_URL`, room = the note's `externalDocId`),
- to a CodeMirror 6 `EditorView` via `y-codemirror.next`'s `yCollab`,
- with presence (cursor color, display name, avatar) carried through Yjs
  **awareness** state rather than a separate presence channel — each client
  sets `awareness.setLocalStateField("user", {...})` once connected, and
  every other client's hook derives its peer list by reading
  `awareness.getStates()` (see `readPeers` in the hook, and
  `frontend/src/lib/presence.ts` for the color/display-name derivation).

The shared text key, `"codemirror"`, is a load-bearing convention between
three separate places in the codebase — the backend's seed
(`notesCollab.ts`), the backend's decode (`decodeYjsContent`), and the
frontend's editor binding — because LiveCode's `Y.Doc` has no notion of
"plain content" on its own, only whatever CRDT text type the application
layer agrees to use. Changing that key on one side without the others would
silently desync new notes from old ones.

Connection status (`connecting` / `connected` / `reconnecting` / `offline`)
is derived from a combination of the provider's own `status`/`sync` events
and the browser's `online`/`offline` events, specifically so a client that
loses network doesn't misreport itself as "connecting" (which would imply
retrying is imminent) when it's actually offline.

### 3.4 Running LiveCode locally / in deployment

LiveCode ships its own `docker-compose` (backend, ysocket, and its own
Postgres — a separate database from helm's). It is deployed as a **fully
independent service** from helm:

- Local dev: run LiveCode's compose stack alongside helm's; point
  `NOTES_BACKEND_URL` at its backend (`:3000` by default) and
  `NEXT_PUBLIC_NOTES_WS_URL` at its ysocket (`ws://localhost:1234`).
- The only coupling that must be kept in lock-step across the two codebases
  is the shared secret: helm's `NOTES_INTERNAL_API_KEY` must exactly match
  LiveCode's own `INTERNAL_API_KEY`, and LiveCode's ysocket must be configured
  with the *same* `FIREBASE_PROJECT_ID` helm's backend uses, since it verifies
  the same tokens.
- In production, LiveCode would be deployed as its own set of services
  (e.g. its Axum backend and ysocket as two separate containers/processes,
  fronted by its own Postgres), with `NOTES_BACKEND_URL` and
  `NEXT_PUBLIC_NOTES_WS_URL` pointed at wherever that lives — helm's own
  deploy has no dependency on *how* LiveCode is hosted, only that it's
  reachable and configured with matching secrets.

This is the same pattern used for helm's own Postgres — configuration-only
coupling, no code path assumes a particular hosting story for the dependency.

---

## 4. Authentication & authorization design

Three distinct trust boundaries, three distinct mechanisms — this is a
deliberate rejection of a single unified "auth layer" in favor of matching
each boundary to what it actually needs:

| Boundary | Mechanism | Verified by | Frequency |
|---|---|---|---|
| Browser ↔ helm backend | Firebase ID token (`Authorization: Bearer`) | `firebase-admin` (`currentUser.ts`) | every request |
| Browser ↔ ysocket | Firebase ID token (WS connection param) | LiveCode's own token verification (mirrors helm's `verifyToken`) | once, at WS handshake |
| helm backend ↔ LiveCode backend | Static shared secret (`X-Internal-Key`) | LiveCode's backend | every internal REST call |
| helm backend ↔ Google Calendar | OAuth 2.0 authorization-code + refresh token | Google | token refresh as needed |

**Token verification never throws** — `currentUser.ts`'s `verifyToken` always
returns `DecodedIdToken | null`, folding "missing", "malformed", "expired",
and "wrong project" into the same rejection path (`401`), rather than leaking
which failure mode occurred. The comment in the code notes this mirrors
ysocket's own `verifyToken` in LiveCode — the two services independently
converged on (or were deliberately built to match) the same failure-hiding
shape.

**Local dev auth** runs against the Firebase Auth Emulator
(`firebase-tools emulators:start --only auth`, port `9099`) rather than a
real Firebase project — `firebase.json`/`.firebaserc` are checked in with a
placeholder project id (`helm-dev-stub`). Swapping to a real project is
env-only (`FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_*`), which is the
explicit design intent noted in the README: no code changes between emulated
and real Firebase.

**Google Calendar OAuth state handling**
(`backend/src/services/googleCalendar.ts`) has one subtlety worth calling
out: Google's redirect back to `/api/calendar/oauth/callback` is a top-level
browser navigation, so it *can't* carry a Firebase Authorization header — the
route is registered **before** the `currentUser` middleware in
`backend/src/index.ts` for exactly this reason. Instead, identity is threaded
through the OAuth `state` parameter: `buildAuthUrl` (called from an
already-authenticated request) mints a random state token and stashes
`{ userId, expiresAt }` in an in-memory `Map` with a 10-minute TTL; the
callback consumes (and deletes) that entry once. This is explicitly
acknowledged in the code as a single-process-scale pattern — acceptable here,
not a pattern to scale past one backend instance without moving it to shared
storage (e.g. Redis) if the backend is ever run with multiple replicas.

**Encryption at rest**: Calendar access/refresh tokens are never stored in
plaintext. `backend/src/lib/crypto.ts` implements AES-256-GCM with a 32-byte
key from `GOOGLE_TOKEN_ENCRYPTION_KEY`, packing `iv (12B) || authTag (16B) ||
ciphertext` into one base64 string per column — a self-contained format
chosen so a single `String` column holds everything `decrypt()` needs,
without a second column for the IV or auth tag.

---

## 5. Data model design decisions

- **No `User` table** — see §2.2. Every domain model is `userId`-scoped
  directly against the Firebase UID, indexed for lookup. This is the single
  biggest structural decision in the schema: it means there's no foreign key
  to enforce referential integrity against a users table, so scoping
  correctness is a per-route-handler discipline (`where: { userId: req.userId
  }` everywhere), not a database-enforced constraint. Given the row-per-user
  ownership shape of every model here, this trade-off favors simplicity over
  defense-in-depth.
- **`position: Float`** on `Project`, `Task`, `SubTask`, `CustomTable`, and
  `CustomRow` — fractional-index ordering for drag-and-drop reorder
  (dnd-kit on the frontend). A `Float` position lets a reorder insert between
  two existing items by computing a midpoint, without renumbering every
  sibling row — an O(1) write for a single move instead of an O(n) shift.
- **`CustomTable` / `CustomField` / `CustomRow`** — user-defined schemas
  modeled as metadata (`CustomField.type` + `config: Json?` for
  type-specific settings, e.g. `SELECT` options) plus schemaless row storage
  (`CustomRow.values: Json`). Row validation happens in application code
  (`backend/src/services/customTableValues.ts`), not the database: a Zod
  schema is derived *per field* from its declared `type` at request time
  (`schemaForField`), so adding a new field type is a code change in one
  place rather than a migration. Two distinct validation paths reflect two
  distinct semantics: row **create** (`buildRowValues`) populates every field
  on the table (provided value or the field's `defaultValue`), while row
  **update** (`mergeRowValues`) only touches keys present in the patch,
  leaving the rest of the row's JSON untouched — an explicit partial-update
  semantic, not "resend the whole row."
- **`Note.externalDocId` / `shareToken` / `published`** — modeling a note's
  collaborative session as *optional* state layered on top of a plain-text
  note, rather than every note always having a LiveCode-backed document. This
  keeps the common case (a private, never-shared note) free of any
  dependency on LiveCode being reachable at all.
- **`GoogleCalendarConnection`** is a single row per user (`userId` as the
  primary key, not a separate `id` + unique index), upserted on
  connect/reconnect — modeling "at most one calendar connection per user" as
  a schema-level invariant rather than an application-level check.
- **Migration-based schema evolution** — every change to `schema.prisma` is
  paired with a committed migration folder under
  `backend/prisma/migrations/` (four so far: initial schema, notes, custom
  tables, Google Calendar connection). This is what makes `prisma migrate
  deploy` safe to run unattended as a release step in any environment (see
  §6) — the migration history *is* the schema's version control, independent
  of which environment applies it.

---

## 6. Deployment architecture

helm is designed so each of its three pieces deploys independently, with
**environment variables as the only coupling** — no code branches on
environment, and no service assumes a particular host for another.

### 6.1 Frontend

- A standard Next.js 16 app (`npm run build && npm start`, or any Next-native
  host such as Vercel).
- Production config is entirely `NEXT_PUBLIC_*` env vars:
  `NEXT_PUBLIC_API_BASE_URL` (backend origin), `NEXT_PUBLIC_FIREBASE_*`
  (client-safe Firebase web config — not secrets), and
  `NEXT_PUBLIC_NOTES_WS_URL` (LiveCode's ysocket origin).
- Note: this Next.js version has diverged from upstream conventions the
  model may already "know" — `frontend/AGENTS.md` flags that API/file
  structure may differ from training data and to check
  `node_modules/next/dist/docs/` before writing Next-specific code.

### 6.2 Backend

- A standard Express app (`npm run build && npm start`) — deployable to
  Railway, Fly.io, Render, or any Node/container host.
- `postinstall` runs `prisma generate` automatically, so the Prisma client is
  always regenerated against `schema.prisma` on a fresh `npm install` in any
  environment (CI, container build, etc.) without a manual step.
- The release step for any environment must run `npm run prisma:deploy`
  (`prisma migrate deploy`) against the target `DATABASE_URL` before the new
  backend version serves traffic — this applies committed migrations
  idempotently and is the only schema-mutation path intended for anything
  but local dev (local dev's iterative path is `prisma:migrate` /
  `migrate dev`, which additionally *creates* migrations from schema diffs).
- Production secrets the backend needs beyond local dev's `.env.example`
  defaults: `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (from a configured
  Google Cloud OAuth client with the Calendar API enabled),
  `GOOGLE_TOKEN_ENCRYPTION_KEY` (a random 32-byte hex key — generation
  one-liner is inlined as a comment in `crypto.ts` and `.env.example`),
  `GOOGLE_REDIRECT_URI` (must exactly match a URI registered on the OAuth
  client), `FRONTEND_URL` (where the OAuth callback redirects the browser
  back to), and `NOTES_BACKEND_URL`/`NOTES_INTERNAL_API_KEY` (LiveCode's
  production backend origin + matching shared secret).

### 6.3 Database

- Local dev: `docker compose up -d` (single `postgres:16` service, named
  volume for persistence).
- Production: any hosted Postgres — the only integration point is
  `DATABASE_URL`. No code assumes docker-compose's Postgres specifically;
  the compose file is dev tooling, not a deployment artifact.

### 6.4 Auth (Firebase)

- Local dev: Firebase Auth Emulator, no real project needed
  (`firebase.json` configures the emulator on port `9099`; `.firebaserc`
  points at a placeholder project id).
- Production: point both frontend and backend at a real Firebase project
  (`FIREBASE_PROJECT_ID` server-side, `NEXT_PUBLIC_FIREBASE_*` client-side) —
  purely a config swap, the emulator host env vars are simply left unset.

### 6.5 LiveCode (external dependency)

- Deployed as its own service(s), independent of helm's release cycle — see
  §3.4. helm's only deployment-time responsibility toward it is pointing
  `NOTES_BACKEND_URL` / `NEXT_PUBLIC_NOTES_WS_URL` at wherever it's hosted in
  that environment, and keeping the shared internal API key and Firebase
  project id in sync between the two systems.

### 6.6 Google Calendar

- Requires a one-time setup in Google Cloud Console per environment: enable
  the Calendar API, configure the OAuth consent screen, create a "Web
  application" OAuth client, and register the exact production redirect URI.
  This is external, manual, environment-specific setup that can't be
  captured in code — env vars are the only artifact of it inside the repo.

---

## 7. Cross-cutting design principles observed in this codebase

A few patterns recur across otherwise-unrelated parts of helm, worth naming
explicitly since they represent house style rather than one-off choices:

- **Idempotent lifecycle endpoints** — both `notes/:id/publish` and
  `notes/:id/close` return the current state as a no-op if already in the
  target state, rather than erroring. This avoids a whole class of
  double-click/retry bugs at the API boundary.
- **Config-only environment coupling** — every external dependency
  (Postgres, Firebase, LiveCode, Google Calendar) is swapped via env vars
  alone; no code path branches on "are we in prod." This is stated explicitly
  in the README for both Postgres and Firebase, and holds for LiveCode and
  Calendar too.
- **Fail loud at boot, fail closed at request time** — missing
  `GOOGLE_TOKEN_ENCRYPTION_KEY` or `FIREBASE_PROJECT_ID` logs a `WARNING` at
  module load rather than crashing immediately (so the rest of the app can
  still boot for routes that don't need them locally), but the functions that
  actually need those values throw / reject every call once invoked — never a
  silent partial-failure.
- **Durable store owns the truth; external services own transient state
  only** — Notes' relationship to LiveCode (§3.2) and Calendar's relationship
  to Google's tokens (encrypted, refreshed, but always re-derivable from a
  refresh token) both follow this shape: helm's own Postgres is never merely
  a cache of another system, and no other system is ever the sole copy of
  data helm needs to keep.
