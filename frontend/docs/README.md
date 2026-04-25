# Frontend Documentation

Architecture and decision records for the Watchtower frontend.

## Contents

| Document | Description |
|----------|-------------|
| [CLEAN_ARCHITECTURE_MIGRATION.md](./CLEAN_ARCHITECTURE_MIGRATION.md) | Clean Architecture guide: folder patterns, migration checklist, composition root examples, and per-feature migration status |

## Architecture Overview

The frontend uses a feature-first Clean Architecture. Each feature under `src/features/` is a self-contained vertical slice with four layers:

```
src/features/<feature>/
├── domain/                 # Types, repository port interfaces, domain errors
├── application/
│   └── use-cases/          # Business logic — no Drizzle, no HTTP, no framework
├── infrastructure/
│   ├── repositories/       # Drizzle implementations of repository ports
│   └── <feature>.container.ts   # Composition root: wires adapters to use cases
└── index.ts                # Public API — exports only use-case factories
```

tRPC routers (`src/_trpc/routers/`) stay thin: they handle auth, input validation, and call use cases. All business logic lives in use cases; all SQL lives in infrastructure repositories.

**Key rule**: imports must point inward. Domain never imports from application or infrastructure. Use cases never import from infrastructure directly — they receive repository instances via constructor injection from the composition root.

## Migration Status

See [CLEAN_ARCHITECTURE_MIGRATION.md](./CLEAN_ARCHITECTURE_MIGRATION.md#migration-status) for the current per-feature status (completed, in progress, queued).

## Adding a New Feature

1. Create `src/features/<feature>/domain/` — define entity types, repository interface, and domain errors.
2. Create `src/features/<feature>/application/use-cases/` — implement use-case classes that accept repository ports as constructor arguments.
3. Create `src/features/<feature>/infrastructure/repositories/` — implement the repository port using Drizzle.
4. Create `src/features/<feature>/infrastructure/<feature>.container.ts` — wire the Drizzle repository into the use cases.
5. Export use-case factories from `src/features/<feature>/index.ts`.
6. Import from the feature index in the tRPC router — never import infrastructure directly from a router.
