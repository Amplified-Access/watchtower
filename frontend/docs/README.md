# Frontend Documentation

Architecture guides and reference docs for the Watchtower frontend.

## Contents

| Document | Description |
|----------|-------------|
| [CLEAN_ARCHITECTURE_MIGRATION.md](./CLEAN_ARCHITECTURE_MIGRATION.md) | Clean Architecture guide: folder patterns, migration checklist, composition root examples, and per-feature migration status |
| [TRPC.md](./TRPC.md) | tRPC setup: transport, context, auth middleware, procedure types, error handling, composition root |
| [SCRIPTS.md](./SCRIPTS.md) | All pnpm scripts explained (dev, build, test, coverage, lint) |

## Architecture Overview

The frontend uses a feature-first Clean Architecture. Each feature under `src/features/` is a self-contained vertical slice with four layers:

```
src/features/<feature>/
├── domain/                      # Types, repository port interfaces, domain errors
├── application/
│   └── use-cases/               # Business logic — no Drizzle, no HTTP, no framework
├── infrastructure/
│   ├── repositories/            # Drizzle implementations of repository ports
│   └── <feature>.container.ts   # Composition root: wires adapters to use cases
└── index.ts                     # Public API — exports only use-case factories
```

**Key rule**: imports point inward. Domain never imports from application or infrastructure. Use cases depend only on domain ports — concrete adapters are injected by the composition root.

tRPC routers (`src/_trpc/routers/`) stay thin: auth, input validation, and use-case invocation only. `_app.ts` is the sole composition point for all routers.

## Adding a New Feature

1. `domain/` — define entity types, repository interface, and domain errors.
2. `application/use-cases/` — implement use-case classes that accept repository ports as constructor arguments.
3. `infrastructure/repositories/` — implement the repository port using Drizzle.
4. `infrastructure/<feature>.container.ts` — wire the Drizzle repository into the use cases.
5. `index.ts` — export use-case factories; nothing else.
6. `src/_trpc/routers/<feature>.ts` — create a thin tRPC router that calls use cases.
7. `src/_trpc/routers/_app.ts` — register the new router.
