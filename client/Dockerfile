FROM node:20-alpine AS build
WORKDIR /app
# VITE_API_URL precisa ser ARG (build-time) — Railway injeta como build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# package-lock.json fica na raiz do monorepo (npm workspaces)
COPY package.json package-lock.json ./
COPY client/package.json ./client/
RUN npm ci
COPY client/ ./client/
RUN cd client && npm run build

FROM nginx:alpine AS runtime
ENV PORT=80
COPY --from=build /app/client/dist /usr/share/nginx/html
# Copiado como template — PORT é substituído pelo entrypoint em runtime
COPY client/nginx.conf /etc/nginx/conf.d/default.conf.template
COPY client/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
