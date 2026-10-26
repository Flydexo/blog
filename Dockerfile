# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app

# Notebooks are converted from saved outputs during the Astro build.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN python3 -m venv /opt/notebooks \
    && /opt/notebooks/bin/pip install --no-cache-dir -r requirements.txt
ENV PATH="/opt/notebooks/bin:${PATH}" \
    ASTRO_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL=https://matheold.com
ENV SITE_URL=${SITE_URL}
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
