# =============================================================
# Backend Dockerfile - Production
# Multi-stage build: کوچک‌ترین image نهایی
# =============================================================

# Stage 1: نصب dependencies
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
RUN apt-get update -y && apt-get install -y openssl
# Stage 2: generate prisma client
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# Stage 3: runtime image
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# The runtime executes `prisma migrate deploy`, so include the generated client
# and the Prisma CLI (a backend devDependency) from the builder stage. Copying
# only production node_modules omits the CLI and makes startup depend on npx/network.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 3000

# اجرای migration، سپس seed (ایجاد نقش‌ها/دسترسی‌ها + ادمین اولیه)
# و در نهایت شروع سرور. seed با upsert کار می‌کند، پس اجرای چندباره امن است.
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]