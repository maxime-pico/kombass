FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
COPY server/tsconfig.json ./
COPY server/prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY server/src ./src/
RUN npx tsc
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
