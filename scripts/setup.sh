#!/usr/bin/env bash
# setup.sh — first-run setup for new contributors
# Usage: ./scripts/setup.sh  (or: make setup)
# Run once after cloning the repo.

set -euo pipefail

BLUE='\033[1;34m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ERRORS=0

# ── Banner ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║              Watchtower — First-Run Setup                 ║${RESET}"
echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════════════════════╝${RESET}"
echo ""

# ── Helper: pass / fail printing ──────────────────────────────────────────────
pass() { echo -e "  ${GREEN}✓${RESET} $*"; }
fail() { echo -e "  ${RED}✗${RESET} $*"; ERRORS=$((ERRORS + 1)); }
info() { echo -e "  ${YELLOW}→${RESET} $*"; }
header() { echo -e "\n${BOLD}$*${RESET}"; }

# ── 1. Prerequisite checks ─────────────────────────────────────────────────────
header "Checking prerequisites..."

# go ≥ 1.25
if command -v go &>/dev/null; then
  GO_VERSION=$(go version | grep -oP '\d+\.\d+' | head -1)
  GO_MAJOR=$(echo "$GO_VERSION" | cut -d. -f1)
  GO_MINOR=$(echo "$GO_VERSION" | cut -d. -f2)
  if [[ "$GO_MAJOR" -gt 1 ]] || [[ "$GO_MAJOR" -eq 1 && "$GO_MINOR" -ge 25 ]]; then
    pass "go $GO_VERSION (≥ 1.25)"
  else
    fail "go $GO_VERSION found — need ≥ 1.25. Install from https://go.dev/dl/"
  fi
else
  fail "go not found. Install from https://go.dev/dl/"
fi

# node ≥ 20
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [[ "$NODE_MAJOR" -ge 20 ]]; then
    pass "node v$NODE_VERSION (≥ 20)"
  else
    fail "node v$NODE_VERSION found — need ≥ 20. Install from https://nodejs.org/"
  fi
else
  fail "node not found. Install from https://nodejs.org/"
fi

# pnpm (any version)
if command -v pnpm &>/dev/null; then
  pass "pnpm $(pnpm --version)"
else
  fail "pnpm not found. Install with: npm install -g pnpm"
fi

# docker (running) — used for the local Postgres container in backend/docker-compose.yml
if command -v docker &>/dev/null; then
  if docker info &>/dev/null 2>&1; then
    pass "docker (running)"
  else
    fail "docker is installed but not running. Start Docker and retry."
  fi
else
  fail "docker not found. Install from https://www.docker.com/products/docker-desktop/"
fi

# Abort if any hard prerequisite failed
if [[ "$ERRORS" -gt 0 ]]; then
  echo ""
  echo -e "${RED}${BOLD}$ERRORS prerequisite(s) failed. Fix the issues above and re-run ./scripts/setup.sh.${RESET}"
  echo ""
  exit 1
fi

# ── 2. Install frontend dependencies ──────────────────────────────────────────
header "Installing frontend dependencies (pnpm install)..."
(cd "$SCRIPT_DIR/frontend" && pnpm install)
pass "frontend dependencies installed"

# ── 3. Install Husky git hooks ────────────────────────────────────────────────
header "Installing Husky git hooks..."
(cd "$SCRIPT_DIR" && pnpm install)
pass "husky pre-commit hook installed"

# ── 4. Copy env files (if not already present) ────────────────────────────────
header "Copying environment files..."

if [[ -f "$SCRIPT_DIR/backend/.env" ]]; then
  info "backend/.env already exists — skipping"
else
  cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
  pass "backend/.env.example → backend/.env"
fi

if [[ -f "$SCRIPT_DIR/frontend/.env.local" ]]; then
  info "frontend/.env.local already exists — skipping"
else
  info "frontend/.env.local not found — there is no committed template for it yet."
  info "Ask a teammate for the frontend env vars (DATABASE_URL, NEXT_PUBLIC_API_URL,"
  info "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN, auth/AI/AWS keys, etc.) and create it before running the frontend."
fi

# ── 5. Start Postgres ──────────────────────────────────────────────────────────
header "Starting Postgres (Docker Compose)..."
(cd "$SCRIPT_DIR/backend" && make docker-run) &
info "Waiting 5s for Postgres to be healthy..."
sleep 5
pass "Postgres container started"

# ── 6. Ready summary ───────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║   You're all set! Run these commands to start developing:  ║${RESET}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}Quickstart (all services in one terminal):${RESET}"
echo -e "    ${YELLOW}make dev${RESET}"
echo ""
echo -e "  ${BOLD}Or start each service individually:${RESET}"
echo -e "    ${BLUE}cd backend && make docker-run${RESET}   # Postgres"
echo -e "    ${GREEN}cd backend && make watch${RESET}        # Go backend  → http://localhost:8080"
echo -e "    ${YELLOW}cd frontend && pnpm dev${RESET}         # Next.js frontend → http://localhost:3000"
echo ""
echo -e "  ${BOLD}Before starting, make sure you've filled in:${RESET}"
echo -e "    backend/.env         — DB credentials, OAuth, R2, email, etc."
echo -e "    frontend/.env.local  — API URL, Mapbox token, auth secrets, etc."
echo ""
