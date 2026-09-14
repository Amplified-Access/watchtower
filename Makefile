.PHONY: setup dev dev-backend dev-frontend \
        test test-backend test-frontend \
        build build-backend build-frontend \
        lint lint-backend lint-frontend \
        deploy-staging deploy-prod

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

# Rebases `staging`/`production` onto main and force-pushes (with lease) to
# trigger Railway (backend) + Vercel (frontend) deploys, per the CI/CD and
# Branching section in README.md. Aborts on a dirty working tree or a rebase
# conflict; prompts for confirmation before pushing unless CONFIRM=yes.
deploy-staging:
	bash scripts/deploy.sh staging

deploy-prod:
	bash scripts/deploy.sh production
