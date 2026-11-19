# ==============================================================================
# Dependencies
# ==============================================================================

FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

# pnpm-workspace.yaml carries onlyBuiltDependencies (sharp,
# unrs-resolver). Without it pnpm 10 refuses to run their build
# scripts and fails the install outright:
#   ERR_PNPM_IGNORED_BUILDS  Ignored build scripts: sharp...
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

# ==============================================================================
# Builder
# ==============================================================================

FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
ARG NEXT_PUBLIC_APP_NAME="Ghormu"
ARG MEDIA_HOST
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV MEDIA_HOST=$MEDIA_HOST
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# Rewrites are fixed at build time, so the image optimizer's /api/media
# rewrite needs the Compose address of Django here, not only at runtime.
# Without it the rewrite kept the development 127.0.0.1 address and every
# uploaded image on the site failed through next/image.
ARG API_INTERNAL_URL=http://web:8000
ENV API_INTERNAL_URL=$API_INTERNAL_URL
COPY frontend/ .

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && pnpm build

# ==============================================================================
# Runner
# ==============================================================================

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nextjs && \
    adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
