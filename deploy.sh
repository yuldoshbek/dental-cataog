#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────
# deploy.sh — Скрипт деплоя на сервер
#
# Использование:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Требования: Node.js 20+, npm, PM2 (`npm i -g pm2`), Nginx
# ──────────────────────────────────────────────────────────────────────────

set -e  # Прерывать при ошибке

# ── Настройка ─────────────────────────────────────────────────────────────
APP_DIR="/var/www/dental-catalog"
LOG_DIR="/var/log/dental-catalog"
NGINX_CONF="/etc/nginx/sites-available/dental-catalog"

echo "🚀 Деплой Dental Catalog..."

# ── 1. Создать директории ──────────────────────────────────────────────────
echo "📁 Создание директорий..."
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$APP_DIR/server/uploads"

# ── 2. Скопировать файлы (предполагает что скрипт запускается из корня проекта)
echo "📦 Копирование файлов..."
cp -r . "$APP_DIR/"

# ── 3. Установить зависимости Frontend ───────────────────────────────────
echo "📦 Установка зависимостей Frontend..."
cd "$APP_DIR"

# Создать .env если не существует
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  СОЗДАН .env — отредактируйте его перед запуском!"
fi

npm ci --omit=dev 2>/dev/null || npm install

# ── 4. Собрать Frontend ───────────────────────────────────────────────────
echo "🔨 Сборка Frontend..."
npm run build
echo "✅ Frontend собран: $APP_DIR/dist"

# ── 5. Установить зависимости Backend ──────────────────────────────────────
echo "📦 Установка зависимостей Backend..."
cd "$APP_DIR/server"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  СОЗДАН server/.env — отредактируйте перед запуском!"
fi

npm ci 2>/dev/null || npm install

# ── 6. Запустить Backend через PM2 ────────────────────────────────────────
echo "⚙️  Запуск Backend через PM2..."
cd "$APP_DIR"
pm2 describe dental-api > /dev/null 2>&1 \
  && pm2 reload dental-api --env production \
  || pm2 start ecosystem.config.js --env production

pm2 save

# ── 7. Настроить Nginx ────────────────────────────────────────────────────
echo "🌐 Настройка Nginx..."
if [ ! -f "$NGINX_CONF" ]; then
  cp "$APP_DIR/nginx.conf" "$NGINX_CONF"
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/dental-catalog
  echo "⚠️  Nginx конфиг скопирован. Замените 'yourdomain.com' на ваш домен!"
fi

nginx -t && systemctl reload nginx || echo "Ошибка Nginx — проверьте конфиг"

# ── Финал ─────────────────────────────────────────────────────────────────
echo ""
echo "✅ Деплой завершён!"
echo ""
echo "   Frontend:  http://yourdomain.com"
echo "   Admin:     http://yourdomain.com/admin"
echo "   API:       http://yourdomain.com/api/products"
echo ""
echo "📌 Следующие шаги:"
echo "   1. Отредактируйте server/.env (JWT_SECRET, ADMIN_PASSWORD, WHATSAPP_MANAGER_PHONE)"
echo "   2. Отредактируйте .env (VITE_WHATSAPP_PHONE)"
echo "   3. Отредактируйте nginx.conf (замените yourdomain.com)"
echo "   4. Получите SSL: certbot --nginx -d yourdomain.com"
echo "   5. pm2 logs dental-api — для просмотра логов"
