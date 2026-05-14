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
```

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
- Repository interfaces are defined in `domain/repository/` and injected via `bootstrap/bootstrap.go`.
- Cache repositories wrap postgres repositories — they never own business logic.
- Rate limiting middleware is applied per-route group in `server/routes.go` (public: 60/min, strict: 10/min, authed: 200/min).

## Frontend architecture

```
src/
├── app/                  Next.js App Router — pages and API routes
│   ├── api/              Server-only API routes (AI chat, auth, S3)
│   └── (main)/           Authenticated app shell
├── _trpc/
│   └── routers/          tRPC routers — one file per domain
├── features/             Feature modules (incidents, maps, alerts, etc.)
├── lib/
│   ├── api/              HTTP client wrappers for the Go backend
│   └── ai/               Embeddings and knowledge base helpers
└── db/                   Drizzle ORM schemas and migrations
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
- Server-only code (API keys, DB access) must import `server-only`.
- State: Zustand for client state, React Query (via tRPC) for server state.

## Authentication

- Better Auth manages sessions in Postgres via Drizzle ORM.
- The Go backend accepts auth via `Authorization: Bearer <token>` or `better-auth.session_token` cookie.
- Roles: `super-admin`, `admin`, `watcher`, `independent-reporter`.

## External services

| Service | Purpose |
|---------|---------|
| Neon (Postgres) | Primary database |
| Railway (Redis) | Caching + rate limiting |
| Cloudflare R2 | Evidence file storage (S3-compatible) |
| AWS SNS + Mailjet | Notifications |
| Google Generative AI | Chat assistant + embeddings (Gemini 2.5 Flash) |
| Sentry | Error monitoring |
| Mapbox | Geospatial visualization |

## CI

PRs to `main`, `staging`, `production` run:
- `make build` + `make test` + `make itest` (backend, with Redis sidecar)
- Frontend lint and build run in `ci-cd.yml`

Always ensure `make test` and `pnpm test` pass before marking work done.

## Conventions

- Commits and PR titles use Conventional Commits **with scope**: `feat(scope): description`, `fix(auth): ...`, `docs(api): ...`
- Common scopes: `auth`, `incidents`, `alerts`, `reports`, `insights`, `datasets`, `admin`, `superadmin`, `map`, `i18n`, `api`, `db`, `ci`
- No attribution trailer in commits — do not add `Co-authored-by` or any AI attribution lines
- New API routes require Swagger annotations — run `make swagger` after adding them.
- New i18n strings must be added to all language files in `frontend/messages/`.
- Never commit `.env` files or credentials.
- No business logic in adapter layer. No direct DB access from usecases (use repository interfaces).
