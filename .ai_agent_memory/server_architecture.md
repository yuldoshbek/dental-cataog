# Серверная Архитектура — Dental Catalog

> Последнее обновление: 15.03.2026

---

## Обзор

```
Browser (React SPA)
        │
        ▼
   Nginx (80/443)
   ├── /           → dist/ (статика, кеш 1 год для assets/)
   ├── /api/       → proxy → http://127.0.0.1:3001
   ├── /uploads/   → proxy → http://127.0.0.1:3001
   └── /health     → proxy → http://127.0.0.1:3001
        │
        ▼
   Node.js Express (порт 3001)
   ├── Helmet (security headers)
   ├── CORS (только CORS_ORIGIN или same-origin)
   ├── Rate limiting (global 120/min, auth 5/min, inquiries 10/min)
   ├── /api/auth/*     → routes/auth.js    (JWT login)
   ├── /api/upload/*   → routes/upload.js  (multer, фото)
   ├── /api/*          → routes/products.js (CRUD + inquiries)
   ├── /uploads/       → express.static (папка uploads/)
   └── /health         → JSON {status, env, ts, catalog}
        │
        ▼
   SQLite (node:sqlite, WAL mode)
   ├── categories (8 строк, seed при первом запуске)
   ├── products (товары)
   ├── product_images (фото товаров)
   ├── category_summaries (шпаргалка цен)
   ├── client_inquiries (заявки из share-страниц)
   └── external_inquiries (заявки из Bitrix)
```

---

## Ключевые файлы сервера

### `server/index.js` — точка входа
- Startup validation: `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` → `process.exit(1)` если не заданы в prod
- `process.send?.('ready')` — сигнал PM2 `wait_ready: true`
- Логирование: timestamp + method + path + status + ms
  - `5xx` → `console.error` (PM2 → error.log)
  - `4xx` → `console.log`
  - `2xx` → только в dev mode

### `server/db.js` — база данных
- Использует `node:sqlite` (Node.js v22.5+ built-in, без npm зависимостей)
- `PRAGMA journal_mode = WAL` — параллельные чтения
- `PRAGMA foreign_keys = ON` — каскадное удаление
- Seed: категории добавляются при `catCount === 0`
- Индексы: `category_id`, `is_active`, `product_id` (images), `category_id` (summaries), `product_id` (inquiries)

### `server/catalog/index.js` — провайдер каталога
```js
// Выбор провайдера из env:
const provider = getCatalogProviderFromEnv(); // 'local' | 'bitrix'
const catalogRepository = provider === 'bitrix'
  ? createBitrixCatalogRepository({ inquiryStore })
  : createLocalCatalogRepository({ db, inquiryStore });
```

### `server/catalog/localCatalogRepository.js` — SQLite провайдер
Все методы: `listCategories`, `getCategorySummary`, `listProducts(filters)`, `getProduct(id)`,
`getSharedProduct(slug)`, `createProduct(payload)`, `updateProduct(id, payload)`,
`deleteProduct(id)`, `submitInquiry(payload, meta)`, `listInquiries()`

**`mapProduct(row, images)`** — конвертирует SQLite snake_case в camelCase API формат.

### `server/routes/auth.js`
- `POST /api/auth/login` — bcrypt сравнение, JWT `{username, role: 'admin'}`, `expiresIn: 8h`
- Если `ADMIN_PASSWORD` начинается с `$2` — считается bcrypt хешем
- Иначе — хешируется при первом логине (хеш логируется для копирования)

---

## Docker деплой

### `server/Dockerfile`
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p /app/uploads
EXPOSE 3001
HEALTHCHECK --interval=30s ...
CMD ["node", "--experimental-sqlite", "index.js"]
```

### `docker-compose.yml`
```yaml
services:
  api:
    build: ./server
    env_file: ./server/.env
    volumes:
      - ./data/dental.db:/app/dental.db
      - ./uploads:/app/uploads
    networks: [dental-network]

  web:
    image: nginx:1.25-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx.docker.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on: [api]
```

**Volumes на сервере:**
- `./data/dental.db` — БД (не исчезает при пересборке контейнера)
- `./uploads/` — загруженные фото
- `./dist/` — собранный frontend (CI кладёт сюда через rsync)

---

## PM2 деплой (без Docker)

### `ecosystem.config.js`
```js
{
  name: 'dental-api',
  script: 'node',
  args: '--experimental-sqlite index.js',    // ОБЯЗАТЕЛЬНО этот флаг!
  cwd: '/var/www/dental-catalog/server',
  wait_ready: true,     // ждёт process.send('ready') из server/index.js
  kill_timeout: 10000,
  out_file: '/var/log/dental-catalog/out.log',
  error_file: '/var/log/dental-catalog/error.log',
}
```

**ВАЖНО:** `script: 'node', args: '--experimental-sqlite index.js'`
(не `script: './server/index.js'` — так флаг не передаётся!)

### Nginx (без Docker) — `nginx.conf` + `nginx.snippet.conf`
```nginx
# nginx.conf
server {
    listen 80;
    server_name yourdomain.com;
    include /etc/nginx/snippets/dental-catalog-content.conf;
}

# nginx.snippet.conf
root /var/www/dental-catalog/dist;
# Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy ...
# gzip: on, types: js/css/json/svg
# /assets/*: Cache-Control: public, immutable; expires 1y
# /api/: proxy_pass http://127.0.0.1:3001
# /uploads/: proxy_pass http://127.0.0.1:3001
# /: try_files $uri $uri/ /index.html
```

---

## GitLab CI/CD

### `.gitlab-ci.yml`
```yaml
stages: [build, deploy]

build:
  image: node:22-alpine
  script:
    - npm ci
    - npm run build        # → dist/
  artifacts:
    paths: [dist/]

deploy:
  image: alpine
  script:
    - rsync -az dist/ "$SSH_USER@$SSH_HOST:$APP_DIR/dist/"
    - rsync -az --exclude=node_modules ... . "$SSH_USER@$SSH_HOST:$APP_DIR/"
    - ssh ... "cd $APP_DIR && docker-compose build --no-cache api && docker-compose up -d"
```

### Variables в GitLab (Settings → CI/CD → Variables):
| Variable | Значение |
|----------|---------|
| `SSH_PRIVATE_KEY` | приватный ключ для SSH |
| `SSH_USER` | пользователь на VPS (напр. `deploy`) |
| `SSH_HOST` | IP или домен сервера |
| `APP_DIR` | путь на сервере (`/var/www/dental-catalog`) |

---

## Nginx security headers

Добавлены в `nginx.snippet.conf`:
```nginx
add_header X-Frame-Options           "DENY"                            always;
add_header X-Content-Type-Options    "nosniff"                         always;
add_header X-XSS-Protection          "1; mode=block"                   always;
add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
add_header Permissions-Policy        "camera=(), microphone=(), geolocation=()" always;
```

HTTPS/HSTS (в `nginx.conf`, раскомментировать после certbot):
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

---

## Первый запуск на новом сервере

```bash
# 1. Клонировать репозиторий
git clone https://github.com/yuldoshbek/dental-cataog.git /var/www/dental-catalog
cd /var/www/dental-catalog

# 2. Создать .env
cp server/.env.example server/.env
nano server/.env  # задать JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD

# 3. Создать директории
mkdir -p data uploads

# 4. Собрать frontend
npm ci && npm run build

# 5. Запустить Docker
docker-compose up -d

# 6. Проверить
curl http://localhost:3001/health
```

Подробная инструкция: `НАДЫР_ИНСТРУКЦИЯ.md`

---

## Troubleshooting

| Проблема | Причина | Решение |
|----------|---------|---------|
| `FATAL: JWT_SECRET не задан` | Запуск prod без .env | Задать переменные в server/.env |
| `Error: Cannot find module 'node:sqlite'` | Node.js < 22.5 | Использовать Node 22+ |
| Сервер стартует, но сразу падает | Нет флага `--experimental-sqlite` | PM2: проверить `args` в ecosystem.config.js |
| Фото не загружаются | Нет папки uploads/ | `mkdir -p server/uploads` или Docker volume |
| `429 Too Many Requests` | Rate limit auth | Подождать 1 минуту |
| Docker: Bitrix не работает | Старые пути `../../catalog/` | Уже исправлено — все файлы в `server/catalog/` |
