# Clean Architecture Migration Guide

This project is being migrated toward Clean Architecture (Uncle Bob) to make frameworks, data sources, and external services swappable.

## Core Rule

Dependencies point inward:

- Domain: pure business rules and contracts.
- Application: use cases that orchestrate domain logic.
- Infrastructure: adapters to concrete tools (Drizzle, APIs, file storage).
- Interface Adapters: transport/UI layer (tRPC, Next routes, React forms).

Inner layers must not import outer layers.

## Folder Pattern Per Feature

Use this structure for each feature:

- `src/features/<feature>/domain/*`
- `src/features/<feature>/application/use-cases/*`
- `src/features/<feature>/infrastructure/repositories/*`
- `src/features/<feature>/infrastructure/<feature>.container.ts`
- `src/features/<feature>/index.ts`

## What Was Implemented (Reference Slice)

Organization reporting now follows this pattern:

- Domain models and repository port defined in `domain`.
- Use cases moved to `application/use-cases`.
- Drizzle implementation moved to `infrastructure/repositories`.
- Composition root added for dependency injection.
- tRPC router calls use cases rather than writing SQL directly.

Implemented files:

- `src/features/organization-reporting/domain/organization-incident-report.ts`
- `src/features/organization-reporting/domain/organization-reporting-repository.ts`
- `src/features/organization-reporting/domain/errors.ts`
- `src/features/organization-reporting/application/use-cases/submit-organization-incident-report.ts`
- `src/features/organization-reporting/application/use-cases/get-organization-incident-reports.ts`
- `src/features/organization-reporting/application/use-cases/get-user-organization-incident-reports.ts`
- `src/features/organization-reporting/application/use-cases/get-organization-incident-stats.ts`
- `src/features/organization-reporting/infrastructure/repositories/drizzle-organization-reporting-repository.ts`
- `src/features/organization-reporting/infrastructure/organization-reporting.container.ts`
- `src/features/organization-reporting/index.ts`
- `src/_trpc/routers/organization-reporting.ts`

## Composition And Swapping

The composition root is responsible for choosing concrete adapters.

Current wiring:

- `createOrganizationReportingUseCases()` defaults to `DrizzleOrganizationReportingRepository`.
- Router imports only `createOrganizationReportingUseCases` from the feature index.

To swap persistence implementation:

1. Create a new repository adapter that implements `OrganizationReportingRepository`.
2. Pass that adapter to `createOrganizationReportingUseCases(newAdapter)`.
3. Keep use cases and router contracts unchanged.

This allows replacing infrastructure with minimal blast radius.

## Rule Of Thumb For New Code

- Put business decisions in use cases, not in routers/components.
- Put SQL and provider SDK calls in infrastructure adapters only.
- Keep domain types free from framework imports.
- Import direction should always be inward toward domain/application.

## Migration Checklist For Other Features

1. Extract feature business entities/value objects into `domain`.
2. Define repository/service interfaces in `domain`.
3. Move business logic from routers/actions to use-case classes.
4. Implement adapters (Drizzle, external APIs, queues) in `infrastructure`.
5. Wire in one composition root per feature.
6. Keep router/controller thin: validation + auth + use-case invocation.
7. Preserve existing response contracts during migration.
8. Add tests per use case and per adapter.

## Swap Examples

- Swap Drizzle with Prisma: keep repository port, replace only infrastructure implementation.
- Swap tRPC with REST: keep use cases unchanged, replace interface adapter layer.
- Swap cloud provider integrations: replace outbound adapter only.

## Recommended Next Targets

1. `admin`
2. `super-admin`

These are the next highest-impact vertical slices still mixing transport and business concerns.

## Migration Status

Completed:

- `organization-reporting`
- `alert-subscriptions`
- `notifications`
- `anonymous-reporting`
- `auth`
- `organization-registration`
- `datasets`
- `maps`
- `watcher`

In progress:

- `admin` (organization user-management + form-management + incident-management + incident-type-management + dashboard-list + dashboard-analytics flows migrated)
- `super-admin` (form-management + incident-management + report-management + dashboard-stats + recent-activity + pending-applications + critical-incidents + organization-type-distribution + platform-activity-trend + admin-watcher-directory flows migrated)
- `reports` (public read flows migrated: `getPublicReports`, `getPublicReportById`)
- `organizations` (public directory flows migrated: `getPublicOrganizations`, `getOrganizationBySlug`)

In queue (next):

1. `admin`
2. `super-admin`

Notes:

- This list is feature-first and may be adjusted for dependency order.
- Migration is considered complete for a feature when router/controller logic calls use cases, use cases depend on domain ports, and infrastructure is injected through a feature container.
