# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /workspace

# Copy workspace metadata first for cacheable installs.
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN --mount=type=cache,target=/root/.npm \
    npm install --workspaces --include-workspace-root --no-audit --no-fund

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm --workspace @huntledger/api run build

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /workspace/apps/api/dist ./dist
COPY --from=builder /workspace/apps/api/package.json ./package.json
COPY --from=builder /workspace/packages/shared ./node_modules/@huntledger/shared
COPY --from=builder /workspace/node_modules ./node_modules

EXPOSE 8080
ENV PORT=8080 HOST=0.0.0.0
CMD ["node", "dist/server.js"]
