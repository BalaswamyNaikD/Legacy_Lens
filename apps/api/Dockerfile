# ── Stage 1: build the API ────────────────────────────────────────────────
FROM node:20-alpine AS api-builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
COPY packages/analysis-core/package*.json ./packages/analysis-core/
COPY packages/repository-engine/package*.json ./packages/repository-engine/
COPY packages/dependency-engine/package*.json ./packages/dependency-engine/
COPY packages/business-rules-engine/package*.json ./packages/business-rules-engine/
COPY packages/data-flow-engine/package*.json ./packages/data-flow-engine/
COPY packages/impact-engine/package*.json ./packages/impact-engine/
COPY packages/onboarding-engine/package*.json ./packages/onboarding-engine/
COPY packages/config/package*.json ./packages/config/
RUN npm install --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN npm run build --workspace apps/api

# ── Stage 2: production runtime ───────────────────────────────────────────
FROM node:20-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=api-builder /app/package*.json ./
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/packages ./packages
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist
COPY --from=api-builder /app/apps/api/package.json ./apps/api/package.json
RUN mkdir -p apps/api/uploads
EXPOSE 4000
CMD ["node", "apps/api/dist/apps/api/src/index.js"]
