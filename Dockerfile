FROM node:17-alpine AS base
FROM base as deps
RUN apk add --no-cache libc6-compat python3 build-base
WORKDIR /app
COPY . .

EXPOSE 7000
CMD ["node","server.js"]