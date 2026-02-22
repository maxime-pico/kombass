FROM node:20-alpine
WORKDIR /app

# Install OpenSSL and postgresql client (for pg_isready) for Prisma
RUN apk add --no-cache openssl postgresql-client

COPY server/package*.json ./
COPY server/tsconfig.json ./
COPY server/prisma ./prisma/
COPY server/src ./src/
RUN npm ci
RUN npx prisma generate
EXPOSE 3000
CMD ["sh", "-c", "until pg_isready -h db -p 5432 -U kombass; do echo 'Waiting for database...'; sleep 2; done && npx prisma migrate deploy && node dist/server.js"]
