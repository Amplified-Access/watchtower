#!/usr/bin/env bash
# dev.sh — start backend and frontend in parallel in a single terminal.
# Usage: ./scripts/dev.sh  (or: make dev)
# Press Ctrl+C to stop everything.

set -euo pipefail

BLUE='\033[1;34m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Kill all background jobs when the script exits (Ctrl+C or error)
trap 'echo ""; echo "Stopping all services..."; kill $(jobs -p) 2>/dev/null; wait' EXIT

PIDS=()

# ── Postgres (Docker Compose) ─────────────────────────────────────────────────
echo -e "${BLUE}[postgres]  Starting Docker Compose (Postgres)...${RESET}"
(cd "$SCRIPT_DIR/backend" && make docker-run) &
PIDS+=("$!")

# ── Backend (Air hot-reload) — wait for Postgres to be ready ─────────────────
(
  echo -e "${GREEN}[backend]   Waiting for Postgres to be healthy...${RESET}"
  for _ in $(seq 1 30); do
    STATUS="$(cd "$SCRIPT_DIR/backend" && docker compose ps -q psql_bp 2>/dev/null | xargs -r docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || true)"
    [[ "$STATUS" == "healthy" ]] && break
    sleep 1
  done
  echo -e "${GREEN}[backend]   Starting Go backend with Air (hot-reload) on :8080...${RESET}"
  cd "$SCRIPT_DIR/backend" && make watch
) &
PIDS+=("$!")

# ── Frontend (Next.js) ────────────────────────────────────────────────────────
echo -e "${YELLOW}[frontend]  Starting Next.js dev server on :3000...${RESET}"
(cd "$SCRIPT_DIR/frontend" && pnpm dev) &
PIDS+=("$!")

# Exit as soon as any one service dies, instead of hanging on `wait` with only
# the survivors left — propagate its exit status so a failed `make dev` reads
# as failed. Polls rather than `wait -n` so this still works under bash 3.2
# (macOS's default /bin/bash).
while true; do
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid"
      exit $?
    fi
  done
  sleep 1
done
