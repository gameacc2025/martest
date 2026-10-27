# =============================================================
# Admin Dockerfile - Production (Vite build + nginx)
# Build context: repo root (docker build -f apps/admin/Dockerfile .)
# =============================================================

# ── Stage 1: Build ─────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Vite embeds these URLs in the browser bundle at build time.
ARG VITE_COMPANY_APP_URL=http://localhost:3002
ARG VITE_ADMIN_APP_URL=http://localhost:3003
ENV VITE_COMPANY_APP_URL=${VITE_COMPANY_APP_URL}
ENV VITE_ADMIN_APP_URL=${VITE_ADMIN_APP_URL}

# Copy workspace root files first (pnpm resolution)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy all package.json files for dependency resolution
COPY packages/shared-core/package.json ./packages/shared-core/
COPY packages/shared-ui/package.json ./packages/shared-ui/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/auth/package.json ./packages/auth/
COPY packages/permissions/package.json ./packages/permissions/
COPY packages/vite-config/package.json ./packages/vite-config/
COPY apps/admin/package.json ./apps/admin/

# Install all dependencies (pnpm workspace)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared-core/ ./packages/shared-core/
COPY packages/shared-ui/ ./packages/shared-ui/
COPY packages/api-client/ ./packages/api-client/
COPY packages/auth/ ./packages/auth/
COPY packages/permissions/ ./packages/permissions/
COPY packages/vite-config/ ./packages/vite-config/
COPY apps/admin/ ./apps/admin/

# Build
RUN pnpm --filter @telecom/admin build


# ── Stage 2: Serve ─────────────────────────────────────────
FROM nginx:stable-bookworm AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configs
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
