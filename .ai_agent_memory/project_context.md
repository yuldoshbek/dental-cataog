# Контекст Проекта — Dental Catalog

## Цель
Внутренний web-каталог (шпаргалка) стоматологического оборудования для менеджеров по продажам. Помогает строить диалог с клиентом во время звонка: быстро найти товар, цену, характеристики, отправить клиенту ссылку.

## Стек технологий
- **Frontend:** React 19, Vite 7, Tailwind CSS v3, Lucide React, React Router v6
- **API (Netlify):** Netlify Functions (Node.js) — in-memory store с demo-данными
- **API (VPS):** Node.js 22+, Express, SQLite (`node:sqlite` — без доп. зависимостей)
- **Auth:** JWT (jsonwebtoken) + прямое сравнение пароля (без bcrypt в Netlify Function)
- **Deploy:** Netlify (основной) / VPS+PM2+nginx (альтернативный)

## Правила проекта
1. Каталог для менеджеров (подсказка во время звонков), не публичный магазин.
2. Цены примерные (рыночные диапазоны). Точные коммерческие цены добавляются позже.
3. Каждое изменение фиксируется в `changelog.md`.
4. "Шпаргалка" сверху — ценовые диапазоны по странам (Китай / Россия / Италия / Германия).
5. Менеджер должен ЗНАТЬ товар заранее, каталог — для проверки памяти.

## Структура проекта

```
dental-catalog/
├── src/
│   ├── App.jsx                     # Router: / | /share/:id | /login | /admin
│   ├── pages/
│   │   ├── CatalogPage.jsx         # Главный каталог менеджера
│   │   ├── SharePage.jsx           # Публичная страница для клиента
│   │   ├── AdminPage.jsx           # Admin CRUD (JWT protected)
│   │   └── LoginPage.jsx           # Форма входа
│   ├── components/
│   │   ├── Sidebar.jsx             # Левое меню категорий
│   │   ├── ProductCard.jsx         # Карточка товара в сетке
│   │   ├── Modal.jsx               # Детальная карточка (попап)
│   │   ├── CategorySummary.jsx     # Шпаргалка по ценам (блоки стран)
│   │   ├── DetailRow.jsx           # Строка характеристики
│   │   ├── ShareButton.jsx         # Кнопка генерации share-ссылки
│   │   └── ImageGallery.jsx        # Слайдер фотографий
│   ├── api/index.js                # API-клиент (BASE_URL = '' на Netlify)
│   ├── context/AuthContext.jsx     # JWT auth state (localStorage)
│   └── hooks/useProducts.js        # useProducts, useProduct
├── netlify/
│   └── functions/api.js            # Netlify Function — ВСЕ /api/* маршруты
├── server/                         # VPS-вариант (Express + SQLite)
│   ├── index.js                    # Express entry point
│   ├── db.js                       # SQLite схема + seed
│   ├── routes/products.js          # CRUD products + inquiries
│   ├── routes/auth.js              # JWT login
│   ├── routes/upload.js            # Загрузка фото (sharp → WebP)
│   ├── middleware/auth.js          # Bearer token guard
│   ├── .env                        # Секреты (в git не коммитится)
│   └── .env.example                # Шаблон конфига
├── netlify.toml                    # Build + redirects Netlify
├── vite.config.js                  # Vite + dev proxy /api → :3001
├── nginx.conf                      # VPS nginx config
└── ecosystem.config.js             # PM2 config
```

## GitHub репозиторий
- URL: `https://github.com/yuldoshbek/dental-cataog.git`
- Ветка: `main`
- Auto-deploy: Netlify подключён к GitHub → деплой при каждом `git push`

## Netlify деплой
- Build command: `npm run build`
- Publish dir: `dist`
- Functions dir: `netlify/functions` (node_bundler: esbuild)
- Redirect: `/api/*` → `/.netlify/functions/api` (status 200)
- SPA fallback: `/*` → `/index.html` (status 200)

### Netlify Environment Variables (задать в Dashboard → Site settings → Env vars):
| Переменная | Значение | Примечание |
|-----------|---------|-----------|
| `JWT_SECRET` | случайная строка 32+ символов | обязательно |
| `ADMIN_USERNAME` | admin | можно изменить |
| `ADMIN_PASSWORD` | admin123 | **изменить в prod!** |
| `VITE_WHATSAPP_PHONE` | 7XXXXXXXXXX | номер менеджера для WhatsApp |

> Если переменные НЕ заданы — используются defaults: admin / admin123

## API маршруты (Netlify Function)

| Метод | Путь | Auth | Описание |
|-------|------|------|---------|
| GET | /api/categories | — | Список категорий |
| GET | /api/categories/:id/summary | — | Шпаргалка по категории |
| GET | /api/products | — | Список товаров (фильтры: category, search, active) |
| GET | /api/products/:id | — | Один товар |
| POST | /api/products | JWT | Создать товар |
| PUT | /api/products/:id | JWT | Обновить товар |
| DELETE | /api/products/:id | JWT | Удалить товар |
| POST | /api/auth/login | — | Логин → JWT токен |
| POST | /api/inquiries | — | Запрос от клиента |
| GET | /api/inquiries | JWT | Список запросов (admin) |
| GET | /api/health | — | Health check |

## Важные технические детали

### Netlify Function — критические моменты:
1. **BASE_URL в api/index.js = `''`** (пустая строка) → относительный URL → работает на Netlify
2. **process.env** — не `Netlify.env.get()` (это Edge Functions API)
3. **isBase64Encoded** — тело POST-запроса может быть base64-encoded:
   ```js
   const raw = event.isBase64Encoded
       ? Buffer.from(event.body, 'base64').toString('utf-8')
       : event.body;
   ```
4. **In-memory store** — данные сбрасываются при cold start Netlify Function (норма для демо)

### Категории оборудования (8 штук):
| id | name |
|----|------|
| units | Установки |
| compressors | Компрессоры |
| autoclaves | Автоклавы |
| physio | Физиодиспенсеры |
| scanners | Интраоральные сканеры |
| xray | Рентгены портативные |
| visiographs | Визиографы |
| handpieces | Наконечники |

## Текущий статус (06.03.2026)
- Каталог (`/`) — работает, загружает данные
- Admin (`/admin`) — работает, вход: `admin` / `admin123`
- Share (`/share/:id`) — реализована, WhatsApp-интеграция
- GitHub — `github.com/yuldoshbek/dental-cataog`
- Netlify — авто-деплой при пуше в main
- `npm run build` — ✅ без ошибок
