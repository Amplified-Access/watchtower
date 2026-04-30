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
- [Translations](#translations)
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

## Translations

Watchtower supports 10 languages. Locale files live in `frontend/messages/`. To add or improve a translation:

1. Copy the English base file (`en.json`) as a reference.
2. Translate the values (not the keys) in the target locale file.
3. Open a PR with only locale file changes — no code changes needed.

Currently supported: English, French, Swahili, Kinyarwanda, Amharic, Luganda, Urdu, and more.

---

## Security Issues

**Do not open public issues for security vulnerabilities.** See [SECURITY.md](./SECURITY.md) for the responsible disclosure process. Email [noble@amplifiedaccess.org](mailto:noble@amplifiedaccess.org) or [aziz@amplifiedaccess.org](mailto:aziz@amplifiedaccess.org) directly.
