# ── Stage 1: Dependências ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args viram env só no build (não ficam na imagem final)
ARG DATABASE_URL
ARG JWT_SECRET
ARG TELEGRAM_BOT_TOKEN

ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Produção ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia apenas o necessário do standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Diretório de storage para anexos (montar volume aqui)
RUN mkdir -p /app/storage/anexos && chown -R nextjs:nodejs /app/storage
ENV STORAGE_PATH=/app/storage/anexos

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
