# --- build ---
  FROM node:20-alpine AS build
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build
  
  # --- runtime ---
  FROM node:20-alpine AS runtime
  WORKDIR /app
  ENV NODE_ENV=production
  # Next.js standalone output
  COPY --from=build /app/.next/standalone ./
  COPY --from=build /app/.next/static ./.next/static
  COPY --from=build /app/public ./public
  EXPOSE 3000
  CMD ["node", "server.js"]
  