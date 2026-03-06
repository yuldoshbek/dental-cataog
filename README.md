# Dental Catalog — База Знаний для менеджеров

Внутренний web-каталог стоматологического оборудования. Инструмент для менеджеров по продажам: быстро найти модель, узнать цену, отправить клиенту ссылку прямо во время звонка.

## Что умеет

**Для менеджера (`/`)**
- Каталог по категориям: установки, компрессоры, автоклавы, физиодиспенсеры, сканеры, рентгены, визиографы, наконечники
- Шпаргалка сверху — ценовые диапазоны по странам производства (Китай / Россия / Италия / Германия)
- Поиск по бренду и модели
- Детальная карточка товара с ценовой градацией (мин / средняя / макс) и всеми характеристиками
- Кнопка "Поделиться" — генерирует ссылку для клиента

**Для клиента (`/share/:id`)**
- Мобильная страница с фотогалереей, описанием и характеристиками
- Кнопки "Одобрить" и "Задать вопрос" — открывают WhatsApp или форму
- Запрос фиксируется в системе

**Admin-панель (`/admin`)**
- Добавление / редактирование / удаление товаров
- Загрузка фотографий
- Просмотр запросов от клиентов
- Вход через логин + пароль (JWT)

## Стек

| Часть | Технология |
|-------|-----------|
| Frontend | React 19, React Router v6, Vite, Tailwind CSS v3, Lucide React |
| API (Netlify) | Netlify Functions — in-memory store |
| API (VPS) | Node.js, Express, SQLite (`node:sqlite`) |
| Авторизация | JWT + bcrypt |
| Деплой | Netlify (рекомендуется) / VPS + PM2 + nginx |

## Быстрый старт (локально)

```bash
# 1. Установить зависимости фронтенда
npm install

# 2. Запустить Vite dev-сервер
npm run dev
# → http://localhost:5173
```

Для локальной работы с Express-бэкендом:

```bash
# 3. Перейти в папку server и установить зависимости
cd server
npm install

# 4. Скопировать .env и заполнить
cp .env.example .env

# 5. Запустить сервер
node index.js
# → http://localhost:3001
```

## Деплой на Netlify

1. Подключить этот репозиторий в [Netlify](https://app.netlify.com/)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Выставить переменные окружения в Netlify Dashboard → Site settings → Environment variables:

| Переменная | Описание |
|-----------|---------|
| `JWT_SECRET` | Случайная строка 32+ символов |
| `ADMIN_USERNAME` | Логин администратора |
| `ADMIN_PASSWORD` | Пароль администратора |
| `VITE_WHATSAPP_PHONE` | Номер менеджера для WhatsApp (без `+`, например `79001234567`) |

> **Важно:** Netlify Function использует in-memory хранилище — данные сбрасываются при cold start. Для постоянного хранения данных используйте VPS-деплой.

## Деплой на VPS

```bash
# На сервере
bash deploy.sh
```

Конфигурации: `ecosystem.config.js` (PM2), `nginx.conf` (nginx).

## Структура проекта

```
dental-catalog/
├── src/
│   ├── App.jsx                  # Router: /, /share/:id, /login, /admin
│   ├── pages/
│   │   ├── CatalogPage.jsx      # Главный каталог менеджера
│   │   ├── SharePage.jsx        # Публичная страница для клиента
│   │   ├── AdminPage.jsx        # Admin-панель
│   │   └── LoginPage.jsx        # Форма входа
│   ├── components/              # Sidebar, ProductCard, Modal, ...
│   ├── api/index.js             # Централизованный API-клиент
│   ├── context/AuthContext.jsx  # JWT auth state
│   └── hooks/useProducts.js     # Data hooks
├── netlify/
│   └── functions/api.js         # Netlify Function (все /api/* маршруты)
├── server/
│   ├── index.js                 # Express сервер
│   ├── db.js                    # SQLite схема + seed
│   ├── routes/                  # products, auth, upload
│   └── .env.example             # Пример конфига
├── netlify.toml                 # Конфиг Netlify
├── nginx.conf                   # Конфиг nginx (VPS)
└── ecosystem.config.js          # PM2 конфиг (VPS)
```

## Категории оборудования

- Стоматологические установки
- Компрессоры
- Автоклавы
- Физиодиспенсеры
- Интраоральные сканеры
- Рентгены портативные
- Визиографы
- Наконечники

## Лицензия

Внутренний инструмент компании. Все права защищены.
