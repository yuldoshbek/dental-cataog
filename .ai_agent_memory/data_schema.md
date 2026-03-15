# Структура данных — Dental Catalog

> Последнее обновление: 15.03.2026
> Источник истины: `server/db.js` (схема SQLite) + `server/catalog/localCatalogRepository.js` (mapProduct)

---

## КРИТИЧНО: Имена полей в API (camelCase)

API возвращает **camelCase** поля (через `mapProduct()` в `localCatalogRepository.js`).
Компоненты ДОЛЖНЫ использовать только эти имена.

| SQLite (snake_case) | API/React (camelCase) | Примечание |
|--------------------|----------------------|-----------|
| `price_label` | `price` | Строковое отображение цены |
| `price_min/avg/max` | `priceGradation.{min,avg,max}` | Числа или null |
| `category_id` | `categoryId` | FK → categories.id |
| `base_config` | `baseConfig` | Только для units |
| `for_units` | `forUnits` | Только для compressors |
| `is_active` | `isActive` | Boolean |
| `created_at` | `createdAt` | ISO string |
| `updated_at` | `updatedAt` | ISO string |
| `id` | `shareSlug` | Используется как slug |

---

## Категории (Category)

### SQLite:
```sql
CREATE TABLE categories (
  id         TEXT PRIMARY KEY,       -- 'units', 'compressors', ...
  name       TEXT NOT NULL,          -- 'Установки', 'Компрессоры', ...
  icon_name  TEXT NOT NULL,          -- 'Stethoscope', 'Wind', ... (Lucide)
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### API-ответ (GET /api/categories):
```json
[{ "id": "units", "name": "Установки", "icon_name": "Stethoscope", "sort_order": 1 }]
```

---

## Шпаргалка по ценам (CategorySummary)

### SQLite:
```sql
CREATE TABLE category_summaries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id TEXT NOT NULL,
  country     TEXT NOT NULL,          -- 'Китай', 'Германия', 'Италия', 'Россия'
  price_range TEXT NOT NULL,          -- '150 000 – 800 000 ₽'
  description TEXT,
  sort_order  INTEGER DEFAULT 0
);
CREATE INDEX idx_summaries_cat ON category_summaries(category_id);
```

### API-ответ (GET /api/categories/:id/summary):
```json
[
  { "country": "Китай",   "range": "150 000 – 800 000 ₽",     "desc": "Бюджетный сегмент..." },
  { "country": "Германия","range": "1 500 000 – 3 500 000 ₽", "desc": "Премиум сегмент..." }
]
```
> Ключи именно: `country`, `range`, `desc` — так читает `CategorySummary.jsx`

---

## Товар (Product)

### SQLite:
```sql
CREATE TABLE products (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  brand       TEXT NOT NULL,
  model       TEXT NOT NULL,
  country     TEXT NOT NULL,
  price_label TEXT NOT NULL,   -- строка для отображения: '~ 350 000 ₽'
  price_min   REAL,            -- 350000
  price_avg   REAL,            -- 400000
  price_max   REAL,            -- 450000
  description TEXT NOT NULL,   -- шпаргалка менеджера
  specs       TEXT,            -- тех. характеристики
  -- Поля для установок (units):
  colors      TEXT,            -- варианты цветов обивки
  upholstery  TEXT,            -- материал обивки
  base_config TEXT,            -- базовая комплектация
  options     TEXT,            -- доп. опции
  -- Поля для компрессоров (compressors):
  for_units   TEXT,            -- 'На 2-3 установки'
  dryer       TEXT,            -- осушитель
  cover       TEXT,            -- шумозащитный кожух
  type        TEXT,            -- 'Безмасляный поршневой'
  cylinders   TEXT,            -- '2 цилиндра'
  -- Общие:
  dimensions  TEXT,            -- габариты и вес
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active   ON products(is_active);
```

### API-ответ (mapProduct в localCatalogRepository.js):
```json
{
  "id": "uuid",
  "categoryId": "units",
  "brand": "Ajax",
  "model": "AJ-15",
  "country": "Китай",
  "price": "~ 350 000 – 450 000 ₽",
  "priceGradation": { "min": 350000, "avg": 400000, "max": 450000 },
  "description": "Надёжная рабочая лошадка...",
  "clientDescription": "Надёжная рабочая лошадка...",
  "specs": "Давление воды: 2–5 бар...",
  "colors": "Белый, Бежевый, Синий",
  "upholstery": "Полиуретановая экокожа",
  "baseConfig": "Кресло пациента, LED-светильник...",
  "options": "Фиброоптика (+15 000 ₽)",
  "forUnits": null,
  "dryer": null,
  "cover": null,
  "type": null,
  "cylinders": null,
  "dimensions": "1200 × 800 × 1500 мм, 120 кг",
  "isActive": true,
  "images": [],
  "createdAt": "2026-03-15T10:00:00.000Z",
  "updatedAt": "2026-03-15T10:00:00.000Z",
  "shareSlug": "uuid",
  "publishWeb": true,
  "publishShare": true,
  "publishTelegram": true,
  "status": "published",
  "source": "local"
}
```

> `shareSlug === id` в local provider. URL для share: `/share/${shareSlug}`

---

## Изображения (ProductImage)

### SQLite:
```sql
CREATE TABLE product_images (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filename   TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_images_product ON product_images(product_id);
```

### В объекте продукта (images[]):
```json
[
  { "id": "uuid", "filename": "abc123.jpg", "is_primary": 1, "sort_order": 0 },
  { "id": "uuid", "filename": "def456.jpg", "is_primary": 0, "sort_order": 1 }
]
```

### URL изображения:
```js
getImageUrl(filename) = `${BASE_URL}/uploads/${filename}`
// BASE_URL = '' → '/uploads/abc123.jpg' (same-origin)
```

---

## Запросы клиентов (Inquiries)

### SQLite — локальные (из /share/:id формы):
```sql
CREATE TABLE client_inquiries (
  id           TEXT PRIMARY KEY,
  product_id   TEXT NOT NULL REFERENCES products(id),
  type         TEXT NOT NULL,     -- 'approve' | 'question'
  client_name  TEXT,
  client_phone TEXT,
  message      TEXT,
  ip_address   TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_inquiries_product ON client_inquiries(product_id);
```

### SQLite — внешние (из Bitrix):
```sql
CREATE TABLE external_inquiries (
  id            TEXT PRIMARY KEY,
  source        TEXT NOT NULL DEFAULT 'bitrix',
  product_id    TEXT,
  share_slug    TEXT,
  external_code TEXT,
  brand         TEXT,
  model         TEXT,
  type          TEXT NOT NULL,
  client_name   TEXT,
  client_phone  TEXT,
  message       TEXT,
  ip_address    TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);
```

### POST /api/inquiries (body):
```json
{
  "productId": "uuid",
  "type": "approve",
  "clientName": "Иван",
  "clientPhone": "+7 900 000-00-00",
  "message": "Интересует установка"
}
```

### GET /api/inquiries (ответ — слияние local + external):
```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "type": "approve",
    "client_name": "Иван",
    "client_phone": "+7 900 000-00-00",
    "message": null,
    "ip_address": "127.0.0.1",
    "created_at": "2026-03-15 10:00:00",
    "brand": "Ajax",
    "model": "AJ-15",
    "source": "local"
  }
]
```

---

## Форма AdminPage → API mapping

| Поле формы (React state) | Поле API (POST/PUT body) | Обязательное |
|--------------------------|--------------------------|-------------|
| categoryId | categoryId | ✅ |
| brand | brand | ✅ |
| model | model | ✅ |
| country | country | ✅ |
| priceLabel | priceLabel | ✅ (строка) |
| priceMin | priceMin | — (число или '') |
| priceAvg | priceAvg | — |
| priceMax | priceMax | — |
| description | description | ✅ |
| specs | specs | — |
| colors | colors | — только units |
| upholstery | upholstery | — только units |
| baseConfig | baseConfig | — только units |
| options | options | — только units |
| forUnits | forUnits | — только compressors |
| dryer | dryer | — только compressors |
| cover | cover | — только compressors |
| type | type | — только compressors |
| cylinders | cylinders | — только compressors |
| dimensions | dimensions | — все категории |
| isActive | isActive | — boolean |

---

## Bitrix-провайдер (CATALOG_PROVIDER=bitrix)

При переключении на Bitrix:
- API `/api/products` читает данные из Bitrix24 смарт-процесса (через webhook)
- Кеш: 60 секунд (настраивается `BITRIX_CACHE_TTL_MS`)
- CRUD (`POST/PUT/DELETE /api/products`) → возвращает `409 Каталог в Bitrix — изменяйте там`
- Загрузка фото (`/api/upload`) → возвращает `409`

**Маппинг полей** (из `bitrixConfig.js`):
```
brand → ufCrmBrand, model → ufCrmModel, priceLabel → ufCrmPriceLabel,
priceMin/Avg/Max → ufCrmPriceMin/Avg/Max, shareSlug → ufCrmShareSlug
```

Настройка в `server/.env`:
```env
CATALOG_PROVIDER=bitrix
BITRIX_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/webhook-token/
BITRIX_SMART_PROCESS_ENTITY_TYPE_ID=1234
```

Подробная инструкция: `BITRIX_SMART_PROCESS.md`
