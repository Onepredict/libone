FROM node:17-alpine
RUN mkdir -p /app
WORKDIR /app
COPY . .
RUN yarn add https fs path lodash json-server
CMD node server.js

EXPOSE 8000