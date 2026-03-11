# Changelog проекта — Dental Catalog

---

## [05.03.2026 17:15] — Этап 1: Первый прототип

**Что сделано:**
- Монолит `App.jsx` (исходный код из `Исходный код.txt`) разбит на React-компоненты
- Созданы: `Sidebar`, `ProductCard`, `CategorySummary`, `Modal`, `DetailRow`
- Настроен TailwindCSS + PostCSS
- Данные перенесены в `src/data/`
- Первая сборка `npm run build` — **успешна ✅**

**Статус:** Прототип собран, данные статические.
**Следующий шаг:** Backend, share-ссылки, admin-панель.

---

## [05.03.2026 20:30] — Этап 2: Production-реализация

**Что сделано:**

### Backend (VPS-вариант, Node.js + Express):
- `server/index.js` — Express с Helmet, rate-limiting, CORS, graceful shutdown
- `server/db.js` — SQLite через `node:sqlite` (Node.js v22.5+), полная схема + seed
- `server/routes/products.js` — CRUD API (GET/POST/PUT/DELETE) + inquiries endpoint
- `server/routes/upload.js` — загрузка фото через sharp (WebP, 1200px)
- `server/routes/auth.js` — JWT + bcrypt авторизация
- `server/middleware/auth.js` — защита admin-маршрутов Bearer-токеном
- `server/.env` / `server/.env.example` — конфиг окружения

### Frontend (React SPA):
- `src/App.jsx` — React Router v6, маршруты: `/`, `/share/:id`, `/login`, `/admin`
- `src/pages/CatalogPage.jsx` — каталог менеджера, живая загрузка из API
- `src/pages/SharePage.jsx` — публичная страница для клиента (галерея, WhatsApp, форма)
- `src/pages/AdminPage.jsx` — admin-панель (CRUD, фото, запросы клиентов)
- `src/pages/LoginPage.jsx` — форма JWT-входа
- `src/api/index.js` — централизованный API-клиент
- `src/context/AuthContext.jsx` — глобальный auth state (JWT в localStorage)
- `src/hooks/useProducts.js` — хуки для данных
- `src/components/ShareButton.jsx` — генератор ссылок (Share API + clipboard)
- `src/components/ImageGallery.jsx` — слайдер изображений

### Netlify-деплой (serverless):
- `netlify/functions/api.js` — единая Netlify Function, in-memory store
- `netlify.toml` — конфиг Netlify (build, functions, redirects)

### VPS-деплой:
- `nginx.conf`, `ecosystem.config.js` (PM2), `deploy.sh`

**Статус:** Код написан, npm run build ✅.
**Следующий шаг:** Деплой на реальный домен, env-переменные, SSL.

---

## [06.03.2026] — Этап 3: GitHub + Netlify deploy + баг-фиксы

### GitHub репозиторий:
- Инициализирован git-репозиторий в папке `dental-catalog/`
- Remote: `https://github.com/yuldoshbek/dental-cataog.git`
- Ветка: `main`
- Обновлён `.gitignore` (добавлены `.env`, `*.db`, `server/uploads/`)
- Создан полноценный `README.md`
- Первый коммит: 52 файла

### Баг-фикс #1 — Каталог не загружался на Netlify:
**Причина:** `src/api/index.js` — `BASE_URL` по умолчанию `'http://localhost:3001'` → на Netlify нет этого сервера.
**Исправление:** `BASE_URL = import.meta.env.VITE_API_URL ?? ''` (пустая строка = относительный URL).

### Баг-фикс #2 — Netlify Function не работала (API 500):
**Причина:** `netlify/functions/api.js` был написан как **Edge Function** (`Netlify.env.get()`, Web Request API), но лежал в папке обычных Functions.
**Исправление:** Полная перезапись как обычная Netlify Function (`export const handler`, `process.env`, `event.httpMethod`, `event.body`).

### Баг-фикс #3 — Неправильный редирект в netlify.toml:
**Причина:** `to = "/.netlify/functions/api/:splat"` — функция не принимала `:splat`.
**Исправление:** `to = "/.netlify/functions/api"`, добавлен `node_bundler = "esbuild"`.

### Баг-фикс #4 — Карточки товаров пустые:
**Причина:** `ProductCard.jsx` использовал `product.imageIcon` и `product.desc` — поля из старого статического кода. API возвращает `product.description`, а иконки статичны.
**Исправление:** Заменено на `product.description` + категориальные иконки из Lucide.

### Баг-фикс #5 — Логин не работал (401 "Неверный логин или пароль"):
**Причина:** Netlify Functions иногда кодируют тело POST-запроса в base64 (`isBase64Encoded: true`). `JSON.parse(event.body)` читал base64-строку вместо JSON → `{username, password}` = `undefined`.
**Исправление:**
```js
const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : event.body;
body = JSON.parse(raw);
```

### Тестовые данные — 10 товаров по всем категориям:
- **Установки:** Ajax AJ-15 (Китай), Stern Weber S200 (Италия), KaVo E70 (Германия)
- **Компрессоры:** Durr Dental Tornado 1 (Германия), Ekom DUO 2V/50 (Чехия)
- **Автоклавы:** Euronda E9 Next (Италия)
- **Физиодиспенсеры:** W&H Elcomed SA-310 (Австрия)
- **Сканеры:** Medit i700 (Корея)
- **Рентгены:** Vatech EzRay Air W (Корея)
- **Визиографы:** Dentsply Sirona Schick 33 (США)
- **Наконечники:** NSK Ti-Max X600L (Япония)

**Статус: ✅ Сайт деплоится на Netlify через GitHub auto-deploy.**
**Логин в admin:** `admin` / `admin123`

---

## Текущее состояние (06.03.2026)

| Что | Статус |
|-----|--------|
| GitHub репозиторий | ✅ `github.com/yuldoshbek/dental-cataog` |
| Netlify деплой | ✅ Подключён к GitHub, автодеплой при пуше |
| Каталог (`/`) | ✅ Загружает данные из Netlify Function |
| Admin (`/admin`) | ✅ Вход работает (admin/admin123) |
| Share-страница (`/share/:id`) | ✅ WhatsApp-интеграция |
| `npm run build` | ✅ Собирается без ошибок |

## [11.03.2026] — Этап 4: Аудит + Новая архитектура + Эталонная карточка

### Файлы добавлены/изменены:

**Новые файлы:**
- `ARCHITECTURE.md` (корень проекта) — полный тех. документ новой архитектуры
- `src/pages/ProductPage.jsx` — эталонный шаблон карточки товара
- `catalog/` — заготовка Bitrix-интеграции (bitrixClient, bitrixConfig, bitrixCatalogRepository)
- `server/catalog/` — серверный слой (localCatalogRepository, inquiryStore)

**Изменения:**
- `src/App.jsx` — добавлен маршрут `/product/:slug`
- `src/components/ProductCard.jsx` — добавлена кнопка "Полная карточка" → Link на /product/:slug
- `.ai_agent_memory/project_context.md` — исправлено: React Router v6 → v7.13.1

### Эталонная карточка (ProductPage.jsx):
- Данные: Shining 3D Aoralscan 3 Wireless (из Сканеры.docx)
- Маршрут: `/product/:slug`
- Секции: Галерея фото | Информация | Вкладки | Share-блок
- Вкладки: Описание / Характеристики / Применение / Комплектация
- Share: WhatsApp, Telegram, Копировать ссылку
- Таблица характеристик сгруппирована по блокам

### Новая архитектура (ARCHITECTURE.md):
- Каталог (SQLite на сервере) = мастер-база
- Bitrix = синхронизируется в обе стороны
- Двусторонняя синхронизация: Admin→Bitrix + Bitrix→Admin через webhook
- 22 поля смарт-процесса Bitrix (UF_BRAND, UF_SPECS_JSON, UF_PHOTOS и др.)
- Инструкция по созданию смарт-процесса

### Статус после деплоя:
- Netlify URL: `/product/shining3d-aoralscan3-wireless` — эталонная карточка
- `npm run build` ✅

## Следующие шаги

1. Создать смарт-процесс в Bitrix по инструкции в ARCHITECTURE.md
2. Получить webhook URL и Entity Type ID → добавить в .env
3. Реализовать двустороннюю синхронизацию (server/services/bitrixSync.js)
4. Обновить Админку под новый шаблон карточки (SpecsEditor, ListEditor, ImageUploader)
5. Добавить первые реальные товары через Админку или Bitrix
