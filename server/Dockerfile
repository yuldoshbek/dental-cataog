# ──────────────────────────────────────────────────────────────────────────
# Dockerfile — Dental Catalog API
# Node 22 обязателен: node:sqlite встроен только в Node 22.5+
# ──────────────────────────────────────────────────────────────────────────

FROM node:22-alpine

WORKDIR /app

# Установить зависимости отдельно (кеш слоя Docker)
COPY package*.json ./
RUN npm ci --only=production

# Скопировать исходники (кроме node_modules и db — см. .dockerignore)
COPY . .

# Создать директории для данных и загрузок (монтируются как volumes)
RUN mkdir -p /app/uploads

EXPOSE 3001

# Healthcheck: проверить /health каждые 30 сек
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

CMD ["node", "--experimental-sqlite", "index.js"]
