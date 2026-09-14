.PHONY: setup dev dev-backend dev-frontend \
        test test-backend test-frontend \
        build build-backend build-frontend \
        lint lint-backend lint-frontend \
        deploy-prod

# ── Setup ────────────────────────────────────────────────────────────────────

setup:
	bash scripts/setup.sh

# ── Development ──────────────────────────────────────────────────────────────

dev:
	bash scripts/dev.sh

dev-backend:
	cd backend && make watch

dev-frontend:
	cd frontend && pnpm dev

# ── Testing ──────────────────────────────────────────────────────────────────

test-backend:
	cd backend && make test

test-frontend:
	cd frontend && pnpm test

test: test-backend test-frontend

# ── Build ────────────────────────────────────────────────────────────────────

build-backend:
	cd backend && make build

build-frontend:
	cd frontend && pnpm build

build: build-backend build-frontend

# ── Lint ─────────────────────────────────────────────────────────────────────

lint-backend:
	cd backend && go vet ./...

lint-frontend:
	cd frontend && pnpm lint

lint: lint-backend lint-frontend

# ── Deploy ───────────────────────────────────────────────────────────────────

# `staging` auto-syncs to `main` on every push (.github/workflows/sync-staging.yml)
# — there's no manual staging deploy step. `deploy-prod` rebases `production`
# onto main and force-pushes (with lease) to trigger the Railway (backend) +
# Vercel (frontend) deploys, per the CI/CD and Branching section in
# README.md. Aborts on a dirty working tree or a rebase conflict; prompts for
# confirmation before pushing unless CONFIRM=yes.
deploy-prod:
	bash scripts/deploy.sh production
