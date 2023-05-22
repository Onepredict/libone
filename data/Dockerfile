FROM node:17-alpine
RUN mkdir -p /app
WORKDIR /app
COPY . .
RUN npm install json-server
ADD . /app

EXPOSE 8000

CMD node server.js