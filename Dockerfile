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

# Variáveis NEXT_PUBLIC_* são inlined pelo Next.js durante o build.
# Precisam ser ARG+ENV aqui para ficarem no bundle final.
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
ARG NEXT_PUBLIC_APPWRITE_PROJECT_ID=6a9b45c9002dbf4b28ae
ARG NEXT_PUBLIC_APPWRITE_DATABASE_ID=servicezap_db
ARG NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages
ARG NEXT_PUBLIC_APP_URL=https://servicezap.flaviosantiago.com.br

ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT
ENV NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NEXT_PUBLIC_APPWRITE_PROJECT_ID
ENV NEXT_PUBLIC_APPWRITE_DATABASE_ID=$NEXT_PUBLIC_APPWRITE_DATABASE_ID
ENV NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=$NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

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
