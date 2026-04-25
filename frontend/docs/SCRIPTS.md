# Frontend Scripts

All commands are run from the `frontend/` directory using `pnpm`.

## Development

```bash
pnpm dev
```

Starts the Next.js development server on port 3000 using [Turbopack](https://turbo.build/pack) (`next dev --turbopack -p 3000`). Turbopack provides significantly faster incremental rebuilds compared to webpack — cold starts and hot reloads are noticeably quicker on large projects.

## Build and Production

```bash
pnpm build
```

Runs the full Next.js production build (`next build`). Includes type checking, static generation, and bundle optimisation. This is also what the Husky pre-commit hook runs to ensure the build does not break before a commit lands.

```bash
pnpm start
```

Starts the compiled production server (`next start`). Requires `pnpm build` to have been run first.

## Linting

```bash
pnpm lint
```

Runs ESLint across the project (`next lint`). Configuration is in `eslint.config.mjs`. Also runs as part of the Husky pre-commit hook.

## Testing

```bash
pnpm test
```

Runs the Jest test suite once (`jest`). Configuration is in `jest.config.ts`; setup is in `jest.setup.ts`.

```bash
pnpm test:watch
```

Runs Jest in interactive watch mode (`jest --watch`). Re-runs affected tests on every file save. Useful during active development.

```bash
pnpm test:coverage
```

Runs Jest with coverage collection enabled (`jest --coverage`). Outputs a coverage summary to the terminal and writes a detailed HTML report to `coverage/`.
