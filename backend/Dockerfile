# =============================================================
# Backend Dockerfile - Production
# Multi-stage build; the runtime includes Prisma CLI so migrations
# never depend on an implicit npx download during container startup.
# =============================================================

# Stage 1: install dependencies and generate the Prisma client.
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# Stage 2: runtime.
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Prisma is currently a devDependency but is required by the runtime CMD for
# "prisma migrate deploy". Copy the already-installed CLI and generated client
# from the builder rather than triggering a network install through npx.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 3000

# Apply migrations, seed baseline roles/admin idempotently, then start Fastify.
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
