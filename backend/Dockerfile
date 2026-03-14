# ============================================================
# Stage 1: Build
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source files and build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build

# Prune dev dependencies
RUN npm ci --omit=dev --ignore-scripts

# ============================================================
# Stage 2: Production image
# ============================================================
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only the production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY src/db/migrations ./src/db/migrations

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
