# ========= deps (prod) =========
FROM public.ecr.aws/docker/library/node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# instala solo prod deps para imagen final
RUN npm ci --omit=dev

# ========= build =========
FROM public.ecr.aws/docker/library/node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ========= runtime (prod) =========
FROM public.ecr.aws/docker/library/node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# utilidades livianas para healthcheck
RUN apk add --no-cache wget
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=10 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
