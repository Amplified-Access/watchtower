# tRPC Setup

tRPC provides end-to-end type-safe RPC between the frontend and the database layer (via Drizzle). All tRPC code lives in `src/_trpc/`.

## Directory Structure

```
src/_trpc/
├── trpc.ts                    # tRPC instance, context creator, error formatter
├── client.tsx                 # createTRPCReact hook typed against AppRouter
├── provider.tsx               # TRPCProvider wrapping React Query's QueryClientProvider
├── query-client.ts            # React Query client factory (stale time: 30s)
├── middleware.ts              # Auth and role/org guards; pre-built procedure types
└── routers/
    ├── _app.ts                # Root router — merges all feature routers
    ├── core.ts                # Health, current user, org application, incident submit
    ├── admin.ts               # Forms, watchers, incident types, incidents, analytics
    ├── super-admin.ts         # Platform-wide admin operations
    ├── organizations.ts
    ├── reports.ts
    ├── insights.ts
    ├── datasets.ts
    ├── anonymous-reporting.ts
    ├── organization-reporting.ts
    ├── alert-subscriptions.ts
    └── notifications.ts
```

## Transport and Serialization

Requests go through `httpBatchLink` to `/api/trpc`. [SuperJSON](https://github.com/blitz-js/superjson) is the transformer, which handles `Date`, `Map`, `Set`, `BigInt`, and other non-JSON-native types transparently across the wire.

## Context and Authentication

Each tRPC request passes raw `Headers` as context (`trpc.ts`). The `authMiddleware` in `middleware.ts`:

1. Reads the `better-auth.session_token` cookie.
2. Validates the session via Better Auth.
3. Fetches the current user from the Go backend (`GET /api/v1/me` via `NEXT_PUBLIC_API_URL`).
4. Returns `{ session, user }` on success, or throws `UNAUTHORIZED` if the token is missing or invalid.

## Procedure Types

Pre-built procedures are exported from `middleware.ts` and used directly in routers:

| Procedure               | Guard                                          |
|-------------------------|------------------------------------------------|
| `publicProcedure`       | No auth required                              |
| `protectedProcedure`    | Valid session required                        |
| `watcherProcedure`      | Watcher, Admin, or Super Admin role           |
| `adminProcedure`        | Admin or Super Admin role                     |
| `superAdminProcedure`   | Super Admin role only                         |
| `organizationProcedure` | Valid session + organisation membership       |

Role checks use `requireRole(allowedRoles[])` and organisation checks use `requireOrganizationMembership`. Both throw `FORBIDDEN` on failure.

## Error Handling

The error formatter in `trpc.ts` flattens Zod validation errors into `fieldErrors` and `formErrors`. This lets form components map server-side validation failures directly onto individual fields without manual parsing.

## Composition Root

`routers/_app.ts` is the only file that imports and merges feature routers. Feature routers never import each other.

```ts
// _app.ts — add a new feature router here only
export const appRouter = router({
  ...coreRouter,
  reports: reportsRouter,
  insights: insightsRouter,
  // ...
});
```

Adding a new feature means creating a router file and registering it in `_app.ts` — nothing else changes.

## React Integration

`client.tsx` exports `trpc = createTRPCReact<AppRouter>()`. Components use hooks like `trpc.reports.getPublicReports.useQuery()` which are fully typed end-to-end from the router definition.

`provider.tsx` wraps the app in both `trpc.Provider` and React Query's `QueryClientProvider`. The React Query client is created fresh per request on the server side and shared as a singleton on the client side (from `query-client.ts`).
