FROM node:17-alpine AS base
FROM base as deps
RUN apk add --no-cache libc6-compat python3 build-base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build
RUN yarn install --frozen-lockfile --production
RUN rm -rf ./.next/cache

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV APP_ENV=production
ENV SHOULD_PROFILE=true
ENV SHOULD_TRACE=true

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

RUN mkdir -p /app/data

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/scheduler ./scheduler
COPY --from=builder /app/.env ./.env
COPY --from=builder /app/server-next.js ./server-next.js

RUN apk --no-cache add ca-certificates openssl curl bash procps coreutils
# Set the locale to Korean (ko_KR.UTF-8)
ENV LANG=ko_KR.UTF-8
ENV LANGUAGE=ko_KR:ko
ENV LC_ALL=ko_KR.UTF-8

# Install Korean font package
RUN apk --no-cache add fontconfig
RUN apk --no-cache add --virtual .build-deps msttcorefonts-installer \
    && update-ms-fonts \
    && fc-cache -f \
    && apk del .build-deps

USER nextjs

EXPOSE 7000
CMD ["npm", "run", "start"]