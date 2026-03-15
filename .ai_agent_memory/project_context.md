# Контекст Проекта — Dental Catalog

> Последнее обновление: 15.03.2026

## Цель
Внутренний web-каталог стоматологического оборудования для менеджеров по продажам.
Помогает строить диалог с клиентом во время звонка: быстро найти товар, цену,
характеристики, отправить клиенту ссылку через WhatsApp/Telegram.

---

## Стек технологий

| Уровень | Технология |
|---------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS v3, Lucide React, React Router v7.13.1 |
| Backend | Node.js 22+, Express, SQLite (`node:sqlite` — встроен, не требует зависимостей) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deploy | VPS + Docker (primary) / PM2 + nginx (alternative) |
| CI/CD | GitLab CI/CD (GitLab на сервере intelnet24.ru) |
| Source | GitHub `github.com/yuldoshbek/dental-cataog` (ветка `main`) |

> **ВАЖНО: Netlify УДАЛЁН (15.03.2026).** Директория `netlify/` и `netlify.toml` удалены.
> Все `@netlify/functions` убраны из `package.json`. Деплой только через VPS+SSH.

---

## Структура проекта

```
dental-catalog/
├── src/                              # Frontend (React SPA)
│   ├── App.jsx                       # Router: / | /product/:slug | /share/:id | /login | /admin
│   ├── pages/
│   │   ├── CatalogPage.jsx           # Каталог менеджера (главная страница)
│   │   ├── ProductPage.jsx           # Полная карточка товара (эталон: Aoralscan 3)
│   │   ├── SharePage.jsx             # Публичная страница клиента + WhatsApp
│   │   ├── AdminPage.jsx             # Admin CRUD (JWT-protected)
│   │   └── LoginPage.jsx             # Форма входа
│   ├── components/
│   │   ├── Sidebar.jsx               # Левое меню категорий (React.memo)
│   │   ├── ProductCard.jsx           # Карточка в сетке + кнопка "Полная карточка"
│   │   ├── Modal.jsx                 # Быстрый просмотр (попап)
│   │   ├── CategorySummary.jsx       # Шпаргалка цен по странам
│   │   ├── FilterBar.jsx             # Фильтры + сортировка
│   │   ├── TouchGallery.jsx          # Галерея с touch-свайпом
│   │   └── ui/
│   │       ├── Tabs.jsx              # Вкладки для ProductPage/AdminPage
│   │       ├── Badge.jsx             # Бейдж (счётчик запросов)
│   │       └── Skeleton.jsx          # Skeleton loader
│   ├── api/index.js                  # API-клиент (BASE_URL = '' → same-origin)
│   ├── context/AuthContext.jsx       # JWT state в localStorage
│   └── hooks/useProducts.js         # useProducts, useProduct, useSharedProduct
│
├── server/                           # Backend (Express + SQLite)
│   ├── index.js                      # Entry point (Helmet, CORS, rate-limit, logging)
│   ├── db.js                         # SQLite схема, индексы, seed категорий
│   ├── routes/
│   │   ├── products.js               # CRUD API + inquiries (с inquiryLimiter)
│   │   ├── auth.js                   # POST /api/auth/login → JWT
│   │   └── upload.js                 # POST/DELETE /api/upload/:productId (фото)
│   ├── middleware/auth.js            # requireAuth — Bearer-токен guard
│   ├── catalog/
│   │   ├── index.js                  # Фабрика: local или bitrix provider
│   │   ├── localCatalogRepository.js # SQLite CRUD + mapProduct()
│   │   ├── inquiryStore.js           # Запросы клиентов (local + external)
│   │   ├── bitrixCatalogRepository.js# Bitrix read-only provider
│   │   ├── bitrixClient.js           # HTTP-клиент Bitrix24 API
│   │   ├── bitrixConfig.js           # Конфиг Bitrix (env vars + field map)
│   │   ├── categoryDefinitions.js    # 8 категорий + resolveCategoryId
│   │   └── summaryUtils.js           # buildCategorySummaries, formatPriceRange
│   ├── .env                          # Секреты (НЕ коммитится)
│   ├── .env.example                  # Шаблон с документацией всех переменных
│   ├── Dockerfile                    # Node 22-alpine, --experimental-sqlite
│   ├── dental.db                     # SQLite БД (локально, на сервере через volume)
│   └── uploads/                      # Фото товаров (на сервере через volume)
│
├── dist/                             # Собранный frontend (git-ignored, CI создаёт)
├── public/                           # Статика (favicon и др.)
│
├── vite.config.js                    # manualChunks (vendor+icons), target es2020
├── tailwind.config.js                # primary-* цвета, dental-bg, shadow-modal
├── nginx.conf                        # HTTP/HTTPS структура с include
├── nginx.snippet.conf                # Контент nginx: security headers, gzip, proxy
├── nginx.docker.conf                 # nginx конфиг для Docker-контейнера
├── docker-compose.yml                # api (Node) + web (nginx) сервисы
├── .gitlab-ci.yml                    # GitLab CI: build → deploy (SSH rsync + docker-compose)
├── ecosystem.config.js               # PM2 (альтернатива Docker)
├── deploy.sh                         # Ручной деплой-скрипт
├── НАДЫР_ИНСТРУКЦИЯ.md               # Инструкция DevOps по первому деплою
├── ARCHITECTURE.md                   # Тех. документ архитектуры
├── BITRIX_SMART_PROCESS.md           # Инструкция по настройке Bitrix смарт-процесса
└── .ai_agent_memory/                 # ← ЭТА ДИРЕКТОРИЯ (документация для агентов)
```

---

## Маршруты Frontend

| URL | Компонент | Описание |
|-----|-----------|---------|
| `/` | CatalogPage | Главный каталог менеджера |
| `/product/:slug` | ProductPage | Полная карточка (эталон: Aoralscan 3) |
| `/share/:id` | SharePage | Публичная страница для клиента |
| `/login` | LoginPage | Форма входа |
| `/admin` | AdminPage | Админка CRUD (требует JWT) |

---

## API маршруты (VPS Express-сервер, порт 3001)

| Метод | Путь | Auth | Rate limit | Описание |
|-------|------|------|-----------|---------|
| GET | /health | — | global | Статус сервера |
| GET | /api/categories | — | global | Список категорий |
| GET | /api/categories/:id/summary | — | global | Шпаргалка по ценам |
| GET | /api/products | — | global | Список товаров (фильтры: category, search, active) |
| GET | /api/products/:id | — | global | Один товар |
| GET | /api/share/:slug | — | global | Публичная карточка (только active) |
| POST | /api/products | JWT | global | Создать товар |
| PUT | /api/products/:id | JWT | global | Обновить товар |
| DELETE | /api/products/:id | JWT | global | Удалить товар |
| POST | /api/auth/login | — | 5/мин | Логин → JWT токен |
| POST | /api/inquiries | — | 10/мин | Заявка от клиента |
| GET | /api/inquiries | JWT | global | Список заявок (admin) |
| POST | /api/upload/:productId | JWT | global | Загрузить фото |
| DELETE | /api/upload/:imageId | JWT | global | Удалить фото |
| PUT | /api/upload/:imageId/primary | JWT | global | Сделать фото главным |

**Rate limits:** global = 120 req/min, auth = 5/min, inquiries = 10/min

---

## Переменные окружения (server/.env)

```env
# Обязательные для production
NODE_ENV=production
PORT=3001
JWT_SECRET=<openssl rand -hex 32>   # min 32 символа, не дефолт
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<bcrypt-хэш или открытый текст — при открытом тексте хэш логируется>

# CORS (оставить пустым если frontend на том же домене)
CORS_ORIGIN=

# Файлы
MAX_FILE_SIZE_MB=10
MAX_FILES_PER_PRODUCT=8

# Каталог: 'local' (SQLite, дефолт) или 'bitrix'
CATALOG_PROVIDER=local

# Bitrix (только при CATALOG_PROVIDER=bitrix)
BITRIX_WEBHOOK_URL=
BITRIX_SMART_PROCESS_ENTITY_TYPE_ID=
BITRIX_CACHE_TTL_MS=60000
BITRIX_FIELD_MAP_JSON=
BITRIX_CATEGORY_MAP_JSON=
BITRIX_STAGE_MAP_JSON=
```

**Валидация при старте:**
- Если `JWT_SECRET` не задан или = дефолтному → production → `process.exit(1)`
- Если `ADMIN_USERNAME` не задан → `process.exit(1)`
- Если `ADMIN_PASSWORD` не задан → `process.exit(1)`

---

## Категории оборудования (8 штук)

| id | name | icon (Lucide) |
|----|------|---------------|
| units | Установки | Stethoscope |
| compressors | Компрессоры | Wind |
| autoclaves | Автоклавы | Thermometer |
| physio | Физиодиспенсеры | Activity |
| scanners | Интраоральные сканеры | ScanFace |
| xray | Рентгены портативные | Camera |
| visiographs | Визиографы | Monitor |
| handpieces | Наконечники | Zap |

---

## Деплой на VPS

### Вариант A: Docker (рекомендуется)
```bash
docker-compose up -d
# api: Node 22-alpine, порт 3001
# web: nginx:1.25-alpine, порты 80/443
```
Данные хранятся в `./data/dental.db` и `./uploads/` (Docker volumes).

### Вариант B: PM2 + nginx (без Docker)
```bash
pm2 start ecosystem.config.js --env production
# ВАЖНО: pm2 использует args: '--experimental-sqlite index.js'
# cwd: /var/www/dental-catalog/server
```

### GitLab CI/CD
- При push в `main`: build (Node 22) → deploy (SSH rsync + docker-compose up -d)
- Variables в GitLab: SSH_PRIVATE_KEY, SSH_USER, SSH_HOST, APP_DIR

---

## Текущий статус (15.03.2026)

| Что | Статус |
|-----|--------|
| GitHub (`main`) | ✅ `github.com/yuldoshbek/dental-cataog` |
| ESLint | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ 3.5s, без ошибок |
| API тесты | ✅ все endpoints протестированы |
| Netlify | ❌ УДАЛЁН (15.03.2026) |
| VPS деплой | 🔲 ожидает Надыра (GitLab setup) |
| Bitrix интеграция | 🔲 конфиг готов, нужен смарт-процесс |

---

## Правила для агентов

1. Всегда использовать `camelCase` имена полей в API (они приходят из `mapProduct()`):
   - `shareSlug` (не `slug`), `categoryId` (не `category_id`), `price` (не `price_label`)
   - `priceGradation.{min, avg, max}` (не `price_min/avg/max`)
   - `baseConfig` (не `base_config`), `forUnits` (не `for_units`)
2. Сервер запускается ТОЛЬКО с флагом `--experimental-sqlite` (Node 22 требует)
3. `BASE_URL = ''` в `src/api/index.js` — пустая строка для same-origin запросов
4. Все hooks в React-компонентах должны быть ДО любого раннего return
5. Не упоминать Netlify — проект переехал на VPS
6. После каждой сессии обновлять эти файлы + MEMORY.md
