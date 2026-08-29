# ── Stage 1: build the React app ─────────────────────────────────────────
FROM node:20-alpine AS web-builder
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/types/package*.json ./packages/types/
COPY packages/ui/package*.json ./packages/ui/
RUN npm install --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/types/ ./packages/types/
COPY packages/ui/ ./packages/ui/
COPY apps/web/ ./apps/web/
RUN npm run build --workspace apps/web

# ── Stage 2: serve with nginx ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS web
COPY --from=web-builder /app/apps/web/dist /usr/share/nginx/html
# Nginx config that proxies /api to the API service
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
