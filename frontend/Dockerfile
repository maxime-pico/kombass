FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/tsconfig.json ./
COPY frontend/vite.config.ts ./
COPY frontend/index.html ./
ENV VITE_BACKEND_URL=""
RUN npm run build && test -d dist && test -f dist/index.html || (echo "Build failed or index.html missing" && exit 1)

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
