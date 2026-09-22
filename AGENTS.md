# Watchtower — Agent Instructions

Watchtower is an open-source incident monitoring platform for civil society organizations. It enables structured incident reporting with geolocation, real-time alerting, interactive dashboards, and AI-powered analysis across 10 languages.

## Repo structure

```
watchtower/
├── backend/      Go 1.25 REST API (Clean Architecture)
└── frontend/     Next.js 15 + TypeScript + tRPC
```

## Documentation map

Before making changes, know where to look. Before finishing, know where to write.

```
watchtower/
├── README.md                        # Project overview, setup, CI/CD, branching
├── AGENTS.md                        # AI context — architecture, commands, conventions (this file)
├── CONTRIBUTING.md                  # Contributor guide including AI tooling setup
├── backend/
│   ├── README.md                    # Backend overview, architecture decisions, env vars
│   └── docs/
│       ├── API.md                   # Route groups, rate limits, error format
│       ├── BOOTSTRAP.md             # Startup sequence and DI wiring
│       ├── PACKAGES.md              # pkg/ service wrappers
│       └── SCRIPTS.md               # All make commands
└── frontend/
    ├── README.md                    # Frontend overview, project structure, stack
    └── docs/
        ├── README.md                # Docs index
        ├── CLEAN_ARCHITECTURE_MIGRATION.md  # Feature layer patterns and migration status
        ├── TRPC.md                  # tRPC setup, procedures, auth middleware
        ├── SCRIPTS.md               # All pnpm scripts
        └── DYNAMIC_MAP.md           # Dynamic map component approaches and data shape
```

**Where to put new documentation:**
- New project-wide concept or decision → root `README.md` or a new root-level doc
- Backend architecture decision or service → `backend/docs/`
- Frontend pattern, feature guide, or component reference → `frontend/docs/`
- Do **not** create READMEs inside `src/features/` or component folders — those belong in `frontend/docs/`

## Working across sessions

AI agents have no persistent memory — every session starts cold. Documentation is the only reliable way to share context between sessions and prevent regressions.

**Before making changes:**
- Read `AGENTS.md` (this file) and any relevant handler, usecase, or router files before editing them
- If a feature already exists, read its implementation before adding to it — don't assume, verify

**After making changes:**
- If you introduce a new architectural pattern, convention, or integration, update the relevant section of `AGENTS.md` so future sessions inherit it
- If you add a new domain entity or tRPC router, add it to the structure sections below
- If you change how auth, caching, or rate limiting works, update the description here
- If a "what not to do" rule is violated and causes a bug, add it to the conventions list

**Why this matters:**
An agent that skips reading docs and writes code based on assumptions will eventually break something that a previous session intentionally designed. Keeping `AGENTS.md` current is the equivalent of updating a team wiki — it protects everyone's work.

## Commands

### Root Makefile (run from the repo root)
```
make setup           # first-run: prereq checks, installs deps, copies env files, starts Postgres
make dev              # Postgres + Go backend (hot-reload) + frontend, all in one terminal
make test / build / lint            # both services
make test-backend / test-frontend   # (also build-*, lint-*)
make deploy-prod                    # rebase production onto main, force-push-with-lease (staging auto-syncs)
```
Thin wrapper around the per-service commands below — see `Makefile` and `scripts/` at the repo root.

### Backend (run from `backend/`)
```
make build        # compile
make run          # start server
make test         # unit tests
make itest        # integration tests (requires Docker for Postgres)
make watch        # live reload with air
make swagger      # regenerate Swagger docs after changing annotations
make seed         # one-time DB seed (skips tables that already have rows)
make refresh      # insert a fresh batch of weekly anonymous reports (safe to re-run)
```

### Weekly data refresh (Railway cron)
`cmd/refresh/main.go` inserts 5–10 anonymous incident reports dated within the last 7 days.
It has no skip-if-exists guard — running it weekly keeps the "past week" map filter populated.
Locations are spread across the supported countries: Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Pakistan.

To schedule on Railway:
1. Add a new **Cron Job** service pointing at the same repo.
2. Set the start command to `go run ./cmd/refresh/main.go` (run from `backend/`).
3. Set the schedule to `0 0 * * 0` (every Sunday at midnight UTC).
4. Add the `DATABASE_URL` environment variable (same value as the main API service).

### Frontend (run from `frontend/`)
```
pnpm dev          # start dev server on :3000
pnpm build        # production build
pnpm lint         # ESLint
pnpm test         # Jest
pnpm test:watch   # Jest watch mode
pnpm i18n:check   # fail if any marketing string is still English (see frontend/docs/SCRIPTS.md)
```

**Local env:** the frontend needs `NEXT_PUBLIC_API_URL` (the Go API, e.g. `http://localhost:8080/api/v1` — plain `http` for a local Go server) and `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. It has no database connection, so no `DATABASE_URL`, and no storage credentials: the R2 settings (`CLOUDFLARE_*`) go in `backend/.env`. The chat assistant's model still runs in Next and needs `GOOGLE_GENERATIVE_AI_API_KEY` there; its knowledge-base search runs in Go and needs the same key on the backend. Pull the dev envs with `vercel env pull .env.development.local --environment=development` (project `watchtower`, team `monarc-engineering`); `.env*` is gitignored.

## Backend architecture — Clean Architecture (strict)

Layers, in dependency order (inner layers must not import outer):

```
domain/          entities, repository interfaces, domain errors — no framework deps
usecase/         business logic — depends only on domain interfaces
adapter/         handler, middleware, repository implementations, presenter
bootstrap/       wires everything together
server/          Gin router setup
```

**Rules:**
- Business logic lives in `usecase/` only. Handlers orchestrate, never decide.
- Handlers call usecase methods and use `presenter.Error()` / `presenter.Success()` for responses.
- Every new domain entity needs: `domain/entity/`, `domain/repository/` interface, `adapter/repository/postgres/` impl, optionally `adapter/repository/cache/` decorator.
- Repository interfaces are defined in `domain/repository/` and injected in `server/server.go` (`NewServer` builds the repositories, cache decorators, usecases and handlers). `bootstrap/bootstrap.go` only starts the infrastructure services (Postgres, Redis) — despite CLAUDE.md's checklist, new wiring goes in `server.go`.
- Cache repositories wrap postgres repositories — they never own business logic.
- **Map data** (`/api/v1/map/points`, `/map/summary`, `/map/reports/:id`, in `handler/map.go` + `usecase/incident/map.go`) is the only source for the public maps. Points are GeoJSON with a `bbox`, deliberately slim (id, place name, country, date); descriptions and casualty figures come from `/map/reports/:id` when a marker is clicked. The summary is computed from the same rows as the points so counts always match the markers. Reports stored at 0,0 are placed at their country's centre (`entity/geo.go`).
- **Map cache invalidation:** `FindForMap` results are cached per filter under `anon:map:v{N}:{hash}`. Creating an anonymous report `INCR`s `anon:map:version`, which strands every old entry at once instead of deleting keys by pattern. Relative periods ("24h") are passed down as tokens, not timestamps, so the cache key stays stable; the TTL (5 min) bounds how far they drift.
- **Files** (`POST /api/v1/files`, `GET /api/v1/files/download`; `handler/file.go`, `usecase/file`, `pkg/r2`) are the only access to Cloudflare R2. Uploads are public (anonymous reporters and organization applicants attach files) under the strict limit, capped at 50 MB, with HTML/SVG/script/executable types refused; each file gets a random `<uuid>.<ext>` key that the record using it stores. These handlers extend their own read/write deadlines past the server's 10s/30s timeouts, which a slow connection can't upload 10 MB inside. Keys that are full URLs (older dataset records) redirect if the host is in `ALLOWED_EXTERNAL_DOMAINS`.
- Rate limiting middleware is applied per-route group in `server/routes.go` (public: 60/min, strict: 10/min, authed: 200/min).

## Frontend architecture

```
src/
├── app/                  Next.js App Router — pages and API routes
│   ├── api/              Server-only API routes (AI chat)
│   └── (main)/           Authenticated app shell
├── _trpc/
│   └── routers/          tRPC routers — one file per domain
├── features/             Feature modules (incidents, maps, alerts, etc.)
├── lib/
│   └── api/              HTTP client wrappers for the Go backend
```

**tRPC procedure types** (use the correct one — they enforce auth):
- `publicProcedure` — unauthenticated
- `protectedProcedure` — any authenticated user
- `watcherProcedure` — watcher role or above
- `adminProcedure` — admin or organization user
- `superAdminProcedure` — super-admin only

**Rules:**
- All mutations go through a tRPC procedure. Never call the Go backend directly from a component.
- `lib/api/` functions are called from tRPC routers, not from components.
- **The Go backend is the source of truth.** tRPC routers are pass-throughs: they validate input and forward it; they don't filter, group, geocode or reshape backend data. If a page needs a new shape, add it to the Go response. Components don't aggregate lists either — the maps get GeoJSON, counts and country lists ready-made from `/map/*` (`lib/api/map.ts`, the `map` tRPC router) and hand the GeoJSON to Mapbox as-is.
- ESLint (`no-restricted-imports`) blocks `@/db`, `drizzle-orm`, `@neondatabase/*`, `@aws-sdk/*` and `@/lib/aws/*` in `src/`. `@/lib/auth` and `better-auth` are blocked too. Nothing in `src/` is exempt.
- **No work at import time in anything tRPC reaches.** All routers share one route handler, so a module that throws when imported (Better Auth opening Neon without `DATABASE_URL`, an SDK client validating credentials in its constructor) takes down *every* procedure, public ones included, and `next build` with it. Create clients lazily on first use. Admin user invites go through Go's `POST /admin/watchers` for this reason.
- The frontend has no AWS/SNS code and needs no AWS credentials. The unused SNS publishing (tRPC `notifications` router, `/api/sns/publish`, `lib/aws/sns.ts`) was removed; if alert notifications are built, publish from the Go backend.
- The Epilogue font is declared in `src/app/globals.css`, not imported from `@fontsource-variable/epilogue`, so its vertical metrics can be overridden (`ascent-override`/`descent-override`) to centre capitals in every line box. Without that, text sits ~0.1em high in small pills and buttons. The woff2 files are copied into `public/fonts/epilogue/` because the bundler drops `@font-face` rules whose `url()` points into `node_modules`. Re-copy them when upgrading the package.
- **File bytes are the one exception to "never call Go from a component".** `utils/file-upload.ts` posts the file straight from the browser to Go's `/files`, and `utils/file-download.ts` links to `/files/download`, both using `API_BASE` from `lib/api/base.ts`. tRPC only carries JSON, and a Next route in between would hit Vercel's 4.5 MB function body limit. Only the returned key goes through tRPC, on the mutation that saves the record. The frontend holds no R2 credentials.
- Server-only code (API keys, DB access) must import `server-only`.
- State: Zustand for client state, React Query (via tRPC) for server state.

## Authentication

- The Go backend owns accounts and sessions: login, logout, `/me`, forgot/reset password and admin invites (`POST /admin/watchers`). The frontend has no auth library; tRPC's `authMiddleware` forwards the session cookie to Go's `/me`.
- The session cookie is still named `better-auth.session_token` (Go sets and reads it). Go accepts `Authorization: Bearer <token>` or the cookie, and strips the `.<signature>` suffix Better Auth used to append, so sessions it issued keep working.
- **Password hashes:** Go writes argon2id. Accounts created under Better Auth have scrypt hashes (`<saltHex>:<keyHex>`, N=16384, r=16, p=1, 64-byte key, NFKC-normalised password, the hex salt string used as the salt bytes — `usecase/auth/legacy_password.go`). Go verifies both and re-hashes a Better Auth hash as argon2id on the next successful login. Keep the scrypt path until no `account.password` rows lack the `$argon2id$` prefix.
- Roles: `super-admin`, `admin`, `watcher`, `independent-reporter`.

## External services

| Service | Purpose |
|---------|---------|
| Neon (Postgres + pgvector) | Primary database, accessed only by the Go backend |
| Railway (Redis) | Caching + rate limiting |
| Cloudflare R2 | Evidence file storage (S3-compatible) |
| Mailjet (from the Go backend) | Email notifications |
| Google Generative AI | Chat model (Gemini 2.5 Flash, in Next) and knowledge-base embeddings (`text-embedding-004`, in Go: `pkg/gemini`, `POST /assistant/knowledge/search`) |
| Sentry | Error monitoring |
| Mapbox | Geospatial visualization |

## CI

Two path-scoped pipelines, each only runs when its area changed:
- **`backend-pipeline.yml`** — PRs to `main`/`staging`/`production` touching `backend/**`: `go vet` + `make build` + `make test` (Redis sidecar) + `make itest`. Pushes to `staging`/`production` re-run the same job, then deploy to Railway on success.
- **`frontend-pipeline.yml`** — PRs touching `frontend/**`: `pnpm lint` + `pnpm test` + `pnpm build`. No deploy job yet — Vercel deploys from its own git integration on push to `staging`/`production` — but named/structured to match `backend-pipeline.yml` in case one's added later.

`staging` auto-syncs from `main` on every push (`sync-staging.yml`); `production` is promoted deliberately via `make deploy-prod`.

Always ensure `make test` and `pnpm test` pass before marking work done.

## Conventions

- Commits and PR titles use Conventional Commits **with scope**: `feat(scope): description`, `fix(auth): ...`, `docs(api): ...`
- Common scopes: `auth`, `incidents`, `alerts`, `reports`, `insights`, `datasets`, `admin`, `superadmin`, `map`, `i18n`, `api`, `db`, `ci`
- No attribution trailer in commits — do not add `Co-authored-by` or any AI attribution lines
- New API routes require Swagger annotations — run `make swagger` after adding them.
- New i18n strings must be added to all language files in `frontend/messages/`. Run `pnpm i18n:check` (from `frontend/`) to catch English strings left in marketing sections.
- Never commit `.env` files or credentials.
- No business logic in adapter layer. No direct DB access from usecases (use repository interfaces).
