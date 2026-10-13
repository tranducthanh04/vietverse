# syntax=docker/dockerfile:1
# Vietverse API (Express, long-running listener `server/src/server.ts` -> dist/server.js).
# Build context: repository root.  docker build -f deploy/selfhost/api.Dockerfile .
# Node 22 matches `engines.node` in server/package.json (and the Vercel runtime).

FROM node:22-alpine AS base
WORKDIR /app
ENV npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false \
    MONGOMS_DISABLE_POSTINSTALL=1
# The root lockfile describes both workspaces; every workspace manifest must be present.
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/

# --- Build: full server deps (TypeScript) -> server/dist -------------------------------
FROM base AS build
# tsc needs no native addon; skipping install scripts avoids compiling bcrypt in this stage.
RUN npm ci -w server --ignore-scripts
COPY server/ server/
RUN npm run build -w server

# --- Production deps only (native bcrypt is built/selected for musl here) ----------------
FROM base AS prod-deps
# Toolchain only for the fallback when no musl prebuild matches; never reaches runtime.
RUN apk add --no-cache python3 make g++
RUN npm ci -w server --omit=dev \
 && mkdir -p server/node_modules \
 && npm cache clean --force

# --- Runtime ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
LABEL io.vietverse.project="vietverse" \
      io.vietverse.service="api"
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app
# Dependencies and code stay root-owned and read-only for the non-root runtime user.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/server/node_modules ./server/node_modules
COPY server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
WORKDIR /app/server
USER node
EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:5000/health || exit 1
# server.js connects MongoDB first, then listens on PORT (exits non-zero if DB is unreachable,
# so Docker's restart policy retries). Indexes: node dist/seeds/prepareDeploymentIndexes.js --apply
CMD ["node", "dist/server.js"]
