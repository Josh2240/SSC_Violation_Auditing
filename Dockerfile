# ---------- Dependencies ----------
FROM node:22-alpine3.22 AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- Runtime ----------
FROM node:22-alpine3.22 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./

# Static assets
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]