# ==============================================================================
# Dependencies
# ==============================================================================

FROM node:25-alpine AS deps

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

FROM node:25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
ARG NEXT_PUBLIC_APP_NAME="Ghormu"
ARG MEDIA_HOST
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV MEDIA_HOST=$MEDIA_HOST
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
COPY frontend/ .

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && pnpm build

# ==============================================================================
# Runner
# ==============================================================================

FROM node:25-alpine AS runner

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
