FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public
COPY openapi.yaml ./openapi.yaml

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]
