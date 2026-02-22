FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/tsconfig.json ./
ENV REACT_APP_BACKEND_URL=""
RUN npm run build && test -d build && test -f build/index.html || (echo "Build failed or index.html missing" && exit 1)

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
