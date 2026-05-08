FROM node:20-alpine AS deps
WORKDIR /app
# package-lock.json fica na raiz do monorepo (npm workspaces)
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./server/
RUN cd server && npx prisma generate && npm run build

FROM node:20-alpine AS runtime
# node_modules são hoisted para /app pelo npm workspaces
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/prisma ./prisma
COPY server/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
