# Watchtower Frontend

Next.js 15 application for the Watchtower incident monitoring platform. Uses the App Router with role-based route groups, tRPC for type-safe server communication, and a Clean Architecture feature structure.

## Tech Stack

| Concern          | Technology                                      |
|------------------|-------------------------------------------------|
| Framework        | Next.js 15 (App Router)                         |
| Language         | TypeScript (strict)                             |
| Styling          | Tailwind CSS, shadcn/ui, Radix UI               |
| API layer        | tRPC + REST (Go backend)                        |
| Database         | Drizzle ORM → PostgreSQL (Neon)                 |
| Auth             | Better Auth                                     |
| State            | Zustand (client), React Query (server cache)    |
| Forms            | React Hook Form + Zod                           |
| Maps             | Mapbox GL                                       |
| i18n             | next-intl (10 languages)                        |
| AI               | Google Generative AI (embeddings + analysis)    |
| Storage          | Cloudflare R2 (S3-compatible)                   |
| Notifications    | AWS SNS                                         |
| Monitoring       | Sentry                                          |
| Testing          | Jest + Testing Library                          |

## Project Structure

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Sign in, sign up, password reset
│   │   ├── (main)/                 # Public-facing pages
│   │   ├── (watcher)/              # Watcher dashboard and incident views
│   │   ├── (admin)/                # Organization admin dashboard
│   │   ├── (superadmin)/           # Platform-wide super admin dashboard
│   │   ├── [locale]/               # Locale wrapper for i18n
│   │   ├── api/                    # Next.js API routes (email, etc.)
│   │   └── context/                # React context providers
│   ├── features/                   # Feature modules (Clean Architecture)
│   │   ├── <feature>/
│   │   │   ├── domain/             # Types, repository interfaces, domain errors
│   │   │   ├── application/        # Use cases
│   │   │   ├── infrastructure/     # Drizzle repositories, external adapters
│   │   │   └── index.ts            # Composition root
│   │   └── ...
│   ├── components/                 # Shared UI components
│   │   ├── ui/                     # shadcn base components
│   │   ├── layout/                 # Navigation, shell, sidebar
│   │   ├── dashboard/              # Dashboard-specific components
│   │   ├── ai/                     # AI-powered UI components
│   │   └── common/                 # Generic reusable components
│   ├── _trpc/                      # tRPC setup
│   │   └── routers/                # Feature routers merged in _app.ts
│   ├── db/                         # Drizzle schema definitions
│   ├── lib/                        # Utilities (auth, AI, AWS, geocoding, etc.)
│   ├── hooks/                      # Shared React hooks
│   ├── i18n/                       # next-intl config and routing
│   ├── types/                      # Shared TypeScript types
│   └── utils/                      # Pure helper functions
├── messages/                       # Translation files (en, fr, sw, rw, am, lg, ur, ...)
├── public/                         # Static assets
└── docs/                           # Architecture documentation
```

## Getting Started

**Prerequisites**: Node.js 20+, pnpm

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`. The backend API must also be running for full functionality — see [`../backend/README.md`](../backend/README.md).

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run Jest test suite
pnpm test:watch   # Run tests in watch mode
```

## Feature Architecture

Features follow Clean Architecture. Each feature under `src/features/` is a vertical slice:

- **Domain** — plain TypeScript types, repository port interfaces, domain errors. No framework imports.
- **Application** — use-case classes that call domain ports. No Drizzle, no HTTP.
- **Infrastructure** — Drizzle repository implementations and external service adapters.
- **Composition root** (`<feature>.container.ts`) — wires concrete implementations to use cases.

tRPC routers call use cases only — no SQL or business logic lives in routers.

See [`docs/CLEAN_ARCHITECTURE_MIGRATION.md`](./docs/CLEAN_ARCHITECTURE_MIGRATION.md) for the full guide and migration status.

## Internationalization

Locale files live in `messages/`. Supported languages:

`en`, `fr`, `sw` (Swahili), `rw` (Kinyarwanda), `am` (Amharic), `lg` (Luganda), `ur` (Urdu), and more.

The `[locale]` dynamic segment in the App Router handles locale routing via next-intl.

## Deployment

The frontend deploys to Vercel automatically on pushes to `staging` and `production` branches.
