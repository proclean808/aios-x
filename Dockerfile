# ── Stage 1: deps ─────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: build frontend ───────────────────────────────────────────────
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: production runtime ───────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Security: non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build-frontend /app/dist ./dist
COPY src/ ./src/
COPY package.json ./

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "src/api/server.js"]
