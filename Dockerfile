# One long-running Node process with a persistent volume at /data.
#
# The app keeps its database on disk and fans live bids out through an
# in-process event bus, so it wants a container that stays up — not a
# serverless function torn down between requests.

# ── deps ──────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# better-sqlite3 ships prebuilt binaries; the toolchain is the fallback if a
# prebuild is ever missing for this platform.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ── build ─────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Produces .next/standalone and dist/seed.mjs
RUN npm run build

# ── runtime ───────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/data/auction.db

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates wget \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# The standalone server, plus the two things Next does not trace into it.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public           ./public

# The seed is pre-bundled to plain JS, so the runtime needs no TypeScript
# loader — only better-sqlite3, which the standalone bundle already carries.
COPY --from=build --chown=nextjs:nodejs /app/dist/seed.mjs    ./dist/seed.mjs

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && mkdir -p /data && chown nextjs:nodejs /data /app

USER nextjs
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/" >/dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
