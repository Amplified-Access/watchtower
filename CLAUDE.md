# Claude Code — Watchtower

See [AGENTS.md](./AGENTS.md) for full project context, commands, architecture rules, and conventions.

## Documentation discipline

Every session starts cold — there is no memory of previous sessions. Follow this discipline to avoid breaking things:

1. **Read before writing.** Before editing any file, read the relevant section of `AGENTS.md` and the file itself. Never assume a pattern — verify it.
2. **Update `AGENTS.md` when architecture changes.** If you add a new entity, change a layer boundary, introduce a new pattern, or wire up a new service, update the relevant section. Future sessions depend on it.
3. **If something surprises you, document why.** If you encounter an unusual pattern or constraint (e.g. why caching is applied at the repository layer, not the usecase layer), add a note to `AGENTS.md` under the relevant section so the next session understands the intent.

## Claude-specific guidance

### Subagents
- Use the `Explore` subagent for broad codebase searches before editing.
- Use a second Claude instance to review non-trivial changes — fresh context prevents bias toward code just written.

### Adding a backend feature end-to-end
1. Define entity in `domain/entity/`
2. Define repository interface in `domain/repository/`
3. Implement usecase in `usecase/<domain>/usecase.go`
4. Implement postgres repository in `adapter/repository/postgres/`
5. Optionally add cache decorator in `adapter/repository/cache/`
6. Add handler in `adapter/handler/`
7. Register route in `server/routes.go` with the correct rate limit group
8. Wire dependencies in `bootstrap/bootstrap.go`
9. Add Swagger annotations, run `make swagger`

### Adding a frontend feature end-to-end
1. Add HTTP wrapper in `lib/api/` if calling the Go backend
2. Add tRPC router (or extend existing) in `_trpc/routers/` with the correct procedure type
3. Build the feature under `features/<domain>/`
4. Add the page under `app/(main)/` or the relevant route group
5. Add any new i18n strings to all files in `messages/`

### What not to do
- Do not put logic in Gin handlers — delegate to usecases.
- Do not call `lib/api/` from React components — always go through tRPC.
- Do not use `any` in TypeScript without a comment explaining why.
- Do not skip `make swagger` after adding or changing API routes.
- Do not add new Zod schemas without checking `drizzle-zod` can generate them from the DB schema first.
