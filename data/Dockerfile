FROM node:17-alpine
RUN mkdir -p /app
WORKDIR /app
COPY . .
RUN yarn add json-server

EXPOSE 8000

CMD ["node","server.js"]