# syntax=docker/dockerfile:1
# Vietverse web: static SPA build + nginx that proxies /api/* to vietverse-api inside vietverse_net.
# Build context: repository root.  docker build -f deploy/selfhost/web.Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
ENV npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci -w client
COPY client/ client/
# VITE_API_URL stays unset: the SPA calls same-origin /api/v1 (cookies stay first-party).
RUN npm run build -w client

FROM nginx:1.27-alpine AS runtime
LABEL io.vietverse.project="vietverse" \
      io.vietverse.service="web"
COPY deploy/selfhost/web.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/index.html || exit 1
