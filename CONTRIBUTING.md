# Contributing to Watchtower

Thank you for your interest in contributing to Watchtower — an incident monitoring and reporting platform built for civil society organizations. Contributions of all kinds are welcome: bug fixes, new features, translations, documentation, and more.

Please read this guide before opening a pull request or issue.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Making Changes](#making-changes)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Documentation](#documentation)
- [Translations](#translations)
- [AI Coding Tools](#ai-coding-tools)
- [Security Issues](#security-issues)

---

## Code of Conduct

This project follows the [AmplifiedAccess Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms. Please report unacceptable behavior to [noble@amplifiedaccess.org](mailto:noble@amplifiedaccess.org) or [aziz@amplifiedaccess.org](mailto:aziz@amplifiedaccess.org).

---

## Getting Started

1. **Fork** the repository and clone your fork locally.
2. Create a new branch for your work (see [Branching Strategy](#branching-strategy)).
3. Make your changes, write or update tests, and verify everything passes.
4. Open a pull request against the `main` branch.

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Go   | 1.25+   |
| Node.js | 20+ |
| pnpm | 9+      |
| Docker | Latest (for local Redis/PostgreSQL) |

### Backend (Go)

```bash
cd backend
cp .env.example .env   # fill in your local values
docker compose up -d   # start Redis and PostgreSQL
go mod download
make build
make test
```

### Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local   # fill in your local values
pnpm install
pnpm dev
```

API documentation is available via Swagger at `http://localhost:8080/swagger/index.html` when the backend is running.

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Integration branch — all PRs target here |
| `staging` | Pre-production testing |
| `production` | Live deployment |

Name your feature branches descriptively:

```
feat/incident-export-csv
fix/alert-subscription-duplicate
docs/update-setup-guide
```

---

## Making Changes

- Keep changes focused. One feature or fix per pull request.
- For backend changes, follow the existing Clean Architecture layer boundaries (domain → usecase → adapter).
- For frontend changes, co-locate feature code under `src/features/` and shared UI under `src/components/`.
- Add or update tests for any logic you change.
- Run `make test` (backend) and `pnpm test` (frontend) before opening a PR.
- If you add a new API route, regenerate Swagger docs with `make swagger`.

---

## Commit Messages

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>

[optional body]
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`.

Examples:
```
feat(incidents): add CSV export endpoint
fix(alerts): deduplicate subscription emails
docs(api): regenerate swagger after route changes
```

---

## Pull Requests

- Target the `main` branch.
- Fill in the PR template completely — reviewers rely on it.
- Link any related issue with `Closes #<number>`.
- Ensure CI passes before requesting review.
- Keep the PR description updated if you push additional commits.

---

## Reporting Bugs

Use the **Bug Report** issue template. Include:

- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, browser, Go version, etc.)
- Relevant logs or screenshots

---

## Suggesting Features

Use the **Feature Request** issue template. Describe:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

---

## Documentation

Good documentation is especially important in an AI-assisted codebase — AI agents have no memory between sessions and rely entirely on written context to avoid breaking things that were intentionally designed.

### Documentation structure

```
watchtower/
├── README.md                   # Project overview, setup, tech stack, CI/CD
├── AGENTS.md                   # AI agent context (architecture, commands, conventions)
├── backend/
│   ├── README.md               # Backend overview, architecture decisions, env vars
│   └── docs/
│       ├── API.md              # Route groups, rate limits, error format
│       ├── BOOTSTRAP.md        # Startup sequence and DI wiring
│       ├── PACKAGES.md         # pkg/ service wrappers
│       └── SCRIPTS.md          # All make commands
└── frontend/
    ├── README.md               # Frontend overview, project structure, stack
    └── docs/
        ├── README.md           # Docs index
        ├── CLEAN_ARCHITECTURE_MIGRATION.md
        ├── TRPC.md
        ├── SCRIPTS.md
        └── DYNAMIC_MAP.md      # (example of a component/feature guide)
```

### Where to put new docs

| Type of documentation | Where it goes |
|-----------------------|---------------|
| Project-wide concept, decision, or integration | Root `README.md` |
| Backend architecture decision or service detail | `backend/docs/` |
| Frontend pattern, feature guide, or component reference | `frontend/docs/` |
| AI agent context update (new pattern, layer change) | `AGENTS.md` |

**Do not** create READMEs inside `src/features/` or component folders. If a component needs documentation, write it in `frontend/docs/` and link to it from `frontend/docs/README.md`.

### When to write documentation

Write or update documentation when you:

- Add a new architectural pattern or layer boundary decision
- Introduce a new external service or integration
- Add a Make command or pnpm script
- Build a non-obvious component with specific data requirements
- Discover a constraint or gotcha that would surprise the next person (or next AI session)

If you are using an AI coding tool: **instruct it to update `AGENTS.md` as part of the task**, not as an afterthought. A session that ships code without updating docs has left the next session worse off.

---

## Translations

Watchtower supports 10 languages. Locale files live in `frontend/messages/`. To add or improve a translation:

1. Copy the English base file (`en.json`) as a reference.
2. Translate the values (not the keys) in the target locale file.
3. Open a PR with only locale file changes — no code changes needed.

Currently supported: English, French, Swahili, Kinyarwanda, Amharic, Luganda, Urdu, and more.

---

## AI Coding Tools

This project is optimised for AI-assisted development. The preferred tool is **[Claude Code](https://claude.ai/code)**, but any agent that reads `AGENTS.md` is fully supported — including GitHub Copilot, Cursor, Windsurf, and OpenAI Codex.

### How it works

- [`AGENTS.md`](./AGENTS.md) — loaded automatically by all supported agents. Contains project context, commands, architecture rules, and conventions.
- [`CLAUDE.md`](./CLAUDE.md) — Claude Code-specific layer with step-by-step checklists for common tasks.
- [`.claude/settings.json`](./.claude/settings.json) — pre-approved commands and linting hooks for Claude Code sessions.

### Shared vs personal settings

Claude Code loads two settings files with different scopes:

| File | Tracked | Purpose |
|------|---------|---------|
| `.claude/settings.json` | Yes — committed | Team-wide: attribution rules, command allowlist, `.env` deny rules |
| `.claude/settings.local.json` | No — gitignored | Personal: hooks, model preference, extra allowed commands |

The hook that auto-runs ESLint and `gofmt` lives in `settings.local.json` because it is shell- and OS-specific. Copy the example to get started:

```bash
cp .claude/settings.local.json.example .claude/settings.local.json
```

Then adjust the `shell` field and commands to match your environment (`"shell": "bash"` on macOS/Linux).

### Preferred settings (Claude Code)

The project ships a `.claude/settings.json` with the team's preferred configuration:

```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  },
  "permissions": {
    "allow": [
      "Bash(go test *)",
      "Bash(pnpm test*)",
      "Bash(pnpm lint*)",
      "Bash(pnpm build*)",
      "Bash(make test)",
      "Bash(make build)",
      "Bash(make swagger)",
      "Bash(git status)",
      "Bash(git log *)",
      "Bash(git diff*)"
    ],
    "deny": [
      "Edit(.env*)",
      "Write(.env*)",
      "Edit(frontend/.env*)",
      "Write(frontend/.env*)",
      "Edit(backend/.env*)",
      "Write(backend/.env*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "shell": "powershell",
            "command": "...",
            "timeout": 30,
            "statusMessage": "Linting..."
          }
        ]
      }
    ]
  }
}
```

The hook auto-runs `eslint --fix` on TypeScript/JS files and `gofmt` on Go files after every edit.

### Adapting for other agents

| Agent | Config file | What to replicate |
|-------|-------------|-------------------|
| **Cursor** | `.cursor/rules/watchtower.mdc` | Add the no-attribution and scoped commit rules; set up a format-on-save action for ESLint and gofmt |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Paste the conventions from `AGENTS.md`; Copilot doesn't support permission rules or hooks natively |
| **Windsurf** | `.windsurfrules` | Same as Copilot — context and conventions only |
| **Other agents** | `AGENTS.md` | Already supported — all compliant agents read this automatically |

Regardless of tool, apply these settings manually if your agent supports them:

- **No attribution trailers** in commits (`Co-authored-by`, `Generated-by`, etc.)
- **Conventional Commits with scope** required: `feat(scope): ...`
- **Block writes to `.env` files** — configure your agent to never modify environment files
- **Auto-format on edit** — wire ESLint (`pnpm exec eslint --fix`) for `.ts`/`.tsx` files and `gofmt -w` for `.go` files

### Things to know

- Do not ask an AI to manage code style — ESLint and `gofmt` handle that automatically.
- **`AGENTS.md` is the single source of truth for project context.** Every AI session starts cold with no memory of previous sessions. If you change the architecture, add a new pattern, or discover a non-obvious constraint, update `AGENTS.md`. Future sessions (and future contributors) depend on it.
- Always instruct your agent to read `AGENTS.md` before making changes to an existing system — not after.

---

## Security Issues

**Do not open public issues for security vulnerabilities.** See [SECURITY.md](./SECURITY.md) for the responsible disclosure process. Email [noble@amplifiedaccess.org](mailto:noble@amplifiedaccess.org) or [aziz@amplifiedaccess.org](mailto:aziz@amplifiedaccess.org) directly.
