FROM node:20-alpine AS deps
WORKDIR /app
# package.json raiz (workspaces) + lock
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server/ ./server/
COPY client/ ./client/
RUN cd server && npx prisma generate && npm run build
RUN npm run build --workspace=client

FROM node:20-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/prisma ./prisma
COPY --from=build /app/client/dist ./public
COPY server/package.json ./
COPY server/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
