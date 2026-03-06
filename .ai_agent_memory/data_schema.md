# Структура Данных (Актуальная модель)

> Последнее обновление: 06.03.2026. Схема соответствует `netlify/functions/api.js` (in-memory) и `server/db.js` (SQLite).

---

## Категории (Category)

### В базе данных / in-memory store:
```
id          TEXT PRIMARY KEY     — 'units', 'compressors', 'autoclaves', ...
name        TEXT                 — 'Установки', 'Компрессоры', ...
icon_name   TEXT                 — имя иконки Lucide ('Stethoscope', 'Wind', ...)
sort_order  INTEGER              — порядок в сайдбаре
```

### API-ответ (GET /api/categories):
```json
[{ "id": "units", "name": "Установки", "icon_name": "Stethoscope", "sort_order": 1 }]
```

### В React (Sidebar.jsx):
Иконки маппируются по `icon_name` в `src/components/Sidebar.jsx`.

---

## Шпаргалка по ценам (CategorySummary)

### В базе данных:
```
id           INTEGER PRIMARY KEY AUTOINCREMENT
category_id  TEXT     — FK → categories.id
country      TEXT     — 'Китай', 'Россия', 'Италия', 'Германия'
price_range  TEXT     — '150 000 – 800 000 ₽'
description  TEXT     — краткое описание сегмента
sort_order   INTEGER
```

### API-ответ (GET /api/categories/:id/summary):
```json
[
  { "country": "Китай", "range": "150 000 – 800 000 ₽", "desc": "Бюджетный сегмент..." },
  { "country": "Германия", "range": "1 500 000 – 3 500 000 ₽", "desc": "Премиум..." }
]
```

> Поля: `country`, `range`, `desc` (именно такие — CategorySummary.jsx их читает)

---

## Товар (Product)

### В базе данных / in-memory store:
```
id           TEXT PRIMARY KEY    — UUID (Netlify) или uuid() (SQLite)
category_id  TEXT                — FK → categories.id
brand        TEXT NOT NULL       — 'Ajax', 'KaVo', 'Cattani'
model        TEXT NOT NULL       — 'AJ-15', 'Estetica E70'
country      TEXT NOT NULL       — 'Китай', 'Германия'
price_label  TEXT NOT NULL       — '~ 350 000 – 450 000 ₽' (строка для отображения)
price_min    REAL                — 350000
price_avg    REAL                — 400000
price_max    REAL                — 450000
description  TEXT NOT NULL       — шпаргалка для менеджера
specs        TEXT                — тех. характеристики
— — — Поля для установок (units):
colors       TEXT                — варианты цветов обивки
upholstery   TEXT                — материал обивки
base_config  TEXT                — базовая комплектация
options      TEXT                — доп. опции за доплату
— — — Поля для компрессоров (compressors):
for_units    TEXT                — 'На 2-3 установки'
dryer        TEXT                — наличие осушителя
cover        TEXT                — шумозащитный кожух
type         TEXT                — 'Безмасляный поршневой'
cylinders    TEXT                — '2 цилиндра'
— — — Общие технические:
dimensions   TEXT                — габариты и вес
is_active    INTEGER DEFAULT 1   — 0 = скрыт в каталоге
created_at   TEXT
updated_at   TEXT
```

### API-ответ (GET /api/products, GET /api/products/:id) — после mapProduct():
```json
{
  "id": "unit-1",
  "categoryId": "units",
  "brand": "Ajax",
  "model": "AJ-15 Premium",
  "country": "Китай",
  "price": "~ 350 000 – 450 000 ₽",
  "priceGradation": { "min": 350000, "avg": 400000, "max": 450000 },
  "description": "Надёжная рабочая лошадка...",
  "specs": "Давление воды: 2–5 бар...",
  "colors": "Белый, Бежевый, Синий...",
  "upholstery": "Полиуретановая экокожа...",
  "baseConfig": "Кресло пациента, LED-светильник...",
  "options": "Фиброоптика (+15 000 ₽)...",
  "forUnits": null,
  "dryer": null,
  "cover": null,
  "type": null,
  "cylinders": null,
  "dimensions": null,
  "isActive": true,
  "images": [],
  "createdAt": "2026-03-01T10:00:00Z",
  "updatedAt": "2026-03-01T10:00:00Z"
}
```

> ВАЖНО: поле `description` (не `desc`!), `price` (не `priceLabel`!)

### Фотографии товара (images[]):
```json
[{ "id": "uuid", "filename": "abc.webp", "is_primary": true, "sort_order": 0 }]
```
URL фото: `${BASE_URL}/uploads/${filename}` — функция `getImageUrl(filename)` в `src/api/index.js`

---

## Запрос клиента (ClientInquiry)

### В базе данных:
```
id           TEXT PRIMARY KEY
product_id   TEXT    — FK → products.id
type         TEXT    — 'approve' | 'question'
client_name  TEXT    — может быть null
client_phone TEXT    — может быть null
message      TEXT    — может быть null (для type='question')
brand        TEXT    — денормализовано для удобства в admin
model        TEXT    — денормализовано для удобства в admin
created_at   TEXT
```

### POST /api/inquiries (body):
```json
{
  "productId": "unit-1",
  "type": "approve",
  "clientName": "Иван",
  "clientPhone": "+7 900 000-00-00",
  "message": "Интересует установка"
}
```

---

## Тестовые демо-данные (seed в Netlify Function)

| ID | Категория | Бренд | Модель | Страна | Цена |
|----|-----------|-------|--------|--------|------|
| unit-1 | units | Ajax | AJ-15 Premium | Китай | 350–450 тыс. ₽ |
| unit-2 | units | Stern Weber | S200 Trinity | Италия | 1.2–1.5 млн ₽ |
| unit-3 | units | KaVo | Estetica E70 Vision | Германия | 2.8–3.2 млн ₽ |
| comp-1 | compressors | Durr Dental | Tornado 1 | Германия | 180–220 тыс. ₽ |
| comp-2 | compressors | Ekom | DUO 2V/50 | Чехия | 90–120 тыс. ₽ |
| auto-1 | autoclaves | Euronda | E9 Next | Италия | 220–280 тыс. ₽ |
| physio-1 | physio | W&H | Elcomed SA-310 | Австрия | 130–160 тыс. ₽ |
| scan-1 | scanners | Medit | i700 | Южная Корея | 900 тыс.–1.1 млн ₽ |
| xray-1 | xray | Vatech | EzRay Air W | Южная Корея | 85–110 тыс. ₽ |
| visio-1 | visiographs | Dentsply Sirona | Schick 33 | США | 180–240 тыс. ₽ |
| hand-1 | handpieces | NSK | Ti-Max X600L | Япония | 35–50 тыс. ₽ |

---

## Форма AdminPage.jsx → API mapping

| Поле формы | Поле API (body POST/PUT) | Примечание |
|-----------|--------------------------|-----------|
| categoryId | categoryId | select |
| brand | brand | required |
| model | model | required |
| country | country | required |
| priceLabel | priceLabel | required, строка |
| priceMin | priceMin | number, nullable |
| priceAvg | priceAvg | number, nullable |
| priceMax | priceMax | number, nullable |
| description | description | required |
| specs | specs | nullable |
| colors | colors | nullable, только units |
| upholstery | upholstery | nullable, только units |
| baseConfig | baseConfig | nullable, только units |
| options | options | nullable, только units |
| forUnits | forUnits | nullable, только compressors |
| dryer | dryer | nullable, только compressors |
| cover | cover | nullable, только compressors |
| type | type | nullable, только compressors |
| cylinders | cylinders | nullable, только compressors |
| dimensions | dimensions | nullable, все категории |
| isActive | isActive | boolean |
