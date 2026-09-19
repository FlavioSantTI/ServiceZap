# Multi-stage Dockerfile para ServiceZap em Produção

# 1. Dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache ffmpeg python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Runner de Produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Instala FFmpeg no container final para conversão de áudios WhatsApp (OGG/Opus)
RUN apk add --no-cache ffmpeg

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos gerados no modo standalone do Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cria diretórios de persistência de sessões Baileys e mídias
RUN mkdir -p /app/.whatsapp_sessions /app/.media_storage && chown -R nextjs:nodejs /app/.whatsapp_sessions /app/.media_storage

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
