#!/usr/bin/env bash
# One-time Sanity setup for Watchtower (see docs/CMS.md). Run from frontend/
# with `pnpm sanity:setup`. It:
#   1. logs you in to the Sanity CLI (opens a browser),
#   2. creates a "Watchtower" project, or uses the one in .env.local,
#   3. creates the dataset (public: the site reads published content without a token),
#   4. allows the local site (http://localhost:3000, where /studio runs) to call the API (CORS),
#   5. imports the seed content (case studies, categories, privacy policy)
#      into a dataset that has none yet,
#   6. adds NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET to .env.local.
# Safe to re-run: existing datasets and CORS origins are left alone, and the
# seed is only imported into a dataset without content, so edits made in the
# Studio are never overwritten. (`pnpm sanity:seed` is the explicit "reset the
# seed documents" command.)
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE=.env.local
sanity() { pnpm exec sanity "$@"; }

pnpm install --frozen-lockfile

if ! sanity projects list >/dev/null 2>&1; then
  echo "→ Log in to the Sanity CLI (a browser window opens)"
  sanity login
fi

for file in .env .env.development.local .env.local; do
  if [ -f "$file" ]; then
    set -a
    # shellcheck disable=SC1090
    . "./$file"
    set +a
  fi
done
DATASET=${NEXT_PUBLIC_SANITY_DATASET:-production}
PROJECT_ID=${NEXT_PUBLIC_SANITY_PROJECT_ID:-}

if [ -z "$PROJECT_ID" ]; then
  echo
  echo "Your Sanity projects:"
  sanity projects list
  echo
  read -r -p "Project ID to use (leave empty to create a new \"Watchtower\" project): " PROJECT_ID
  if [ -z "$PROJECT_ID" ]; then
    # The dataset must be public: the site reads it without a token.
    sanity projects create "Watchtower" --dataset "$DATASET" --dataset-visibility public
    echo
    read -r -p "Paste the new project's ID from the output above: " PROJECT_ID
  fi
fi
[ -n "$PROJECT_ID" ] || { echo "No project ID given." >&2; exit 1; }

# Runs a CLI step that may fail only because its target already exists;
# any other failure stops the script.
unless_exists() {
  local output
  if output=$("$@" 2>&1); then
    echo "$output"
  elif grep -qiE "already exists|exists already|duplicate" <<<"$output"; then
    echo "  (already there)"
  else
    echo "$output" >&2
    exit 1
  fi
}

echo "→ Creating public dataset \"$DATASET\""
unless_exists sanity datasets create "$DATASET" -p "$PROJECT_ID" --visibility public

echo "→ Allowing the local site and its Studio (http://localhost:3000) to call the API"
unless_exists sanity cors add http://localhost:3000 -p "$PROJECT_ID" --credentials

# Published case studies, read without a token, as the site reads them.
count_case_studies() {
  curl -fsS "https://$PROJECT_ID.api.sanity.io/v2025-10-15/data/query/$DATASET?query=count(*%5B_type%3D%3D%22caseStudy%22%5D)" |
    sed -n 's/.*"result":\([0-9]*\).*/\1/p' || true
}

# Only a dataset without content gets the seed. Even with --missing, an
# import re-points image fields at the seed's images, which would undo an
# image an editor replaced.
if [ "$(count_case_studies)" -gt 0 ] 2>/dev/null; then
  echo "→ The dataset already has content; skipping the seed (\`pnpm sanity:seed\` resets it)"
else
  echo "→ Importing the seed content"
  sanity datasets import sanity/seed/seed.ndjson -p "$PROJECT_ID" -d "$DATASET" --missing
fi

# The site reads without a token, as anyone can: check that works.
COUNT=$(count_case_studies)
if [ "${COUNT:-0}" -gt 0 ]; then
  echo "→ The site can read $COUNT case studies without a token"
else
  echo "⚠ Reading without a token found no case studies. Is dataset \"$DATASET\" private?" >&2
  echo "  Make it public: pnpm exec sanity datasets visibility set $DATASET public -p $PROJECT_ID" >&2
fi

touch "$ENV_FILE"
if grep -q '^NEXT_PUBLIC_SANITY_PROJECT_ID=' "$ENV_FILE"; then
  echo "→ $ENV_FILE already names a Sanity project; left as is"
else
  printf '\n# Sanity (content, and the Studio at /studio): see docs/CMS.md\nNEXT_PUBLIC_SANITY_PROJECT_ID=%s\nNEXT_PUBLIC_SANITY_DATASET=%s\n' \
    "$PROJECT_ID" "$DATASET" >> "$ENV_FILE"
  echo "→ Added NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET to $ENV_FILE"
fi

cat <<EOF

Done. Start the site (pnpm dev) and open:
  http://localhost:3000/studio          the Studio (sign in with your Sanity account)
  http://localhost:3000/case-studies    and /privacy-policy, the content it edits
Switch languages with the site's language picker to see translations and English fallback.
EOF
