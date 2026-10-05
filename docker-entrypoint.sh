#!/bin/sh
set -e

: "${DATABASE_PATH:=/data/auction.db}"

if [ -z "${AUTH_SECRET:-}" ]; then
  echo "WARNING: AUTH_SECRET is not set. The app falls back to its public"
  echo "         development secret, and session cookies can be forged."
  echo "         Set AUTH_SECRET before anyone else sees this deployment."
fi

# Seed on first boot only, so the demo's countdowns run from container start
# rather than from whenever the image was built. SEED_ON_START=force rebuilds
# the catalogue — that is how you reset the demo before a presentation.
if [ ! -f "$DATABASE_PATH" ] || [ "${SEED_ON_START:-}" = "force" ]; then
  echo "Seeding database at $DATABASE_PATH ..."
  rm -f "$DATABASE_PATH" "$DATABASE_PATH-wal" "$DATABASE_PATH-shm"
  node ./dist/seed.mjs
else
  echo "Database present at $DATABASE_PATH — leaving it as it is."
fi

exec "$@"
