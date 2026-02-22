FROM node:20-alpine
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY server/package*.json ./
COPY server/tsconfig.json ./
COPY server/prisma ./prisma/
COPY server/src ./src/
RUN npm ci
RUN npx prisma generate
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
