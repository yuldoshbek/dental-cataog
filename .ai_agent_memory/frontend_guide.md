# Frontend — Dental Catalog

> Последнее обновление: 15.03.2026

---

## Дизайн-система

### Цвета (tailwind.config.js)
```js
primary: {
  50:  '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
  300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6',
  600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
}
dental-bg: '#f0f4f8'  // фон всего приложения
```

### Кастомные стили
```js
boxShadow: {
  card:   '0 2px 8px rgba(0,0,0,0.08)',
  modal:  '0 8px 32px rgba(0,0,0,0.16)',
}
animation: { 'slide-down': 'slideDown 0.2s ease-out' }
```

---

## Сборка (Vite)

### Chunk splitting (vite.config.js)
```js
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],  // 47 kB / 16 kB gz
  icons:  ['lucide-react'],                             // 9 kB / 3.7 kB gz
}
// Главный chunk: 187 kB / 59 kB gz (был 237 kB)
```

### Lazy loading (App.jsx)
Все страницы загружаются лениво через `React.lazy` + `Suspense`:
```js
const CatalogPage  = lazy(() => import('./pages/CatalogPage.jsx'));
const AdminPage    = lazy(() => import('./pages/AdminPage.jsx'));
const SharePage    = lazy(() => import('./pages/SharePage.jsx'));
const ProductPage  = lazy(() => import('./pages/ProductPage.jsx'));
const LoginPage    = lazy(() => import('./pages/LoginPage.jsx'));
```

---

## Компоненты

### Страницы

**CatalogPage** (`/`) — основная страница менеджера
- State: `activeCategory`, `selectedProduct`, `searchQuery`, `filters`, `summary`
- Хуки: `useProducts(filters)`, `useDebounce(search, 300)`
- Оптимизации: `useMemo(applyFilters)`, `useCallback(handleCategoryChange, [])`, `Sidebar` в `React.memo`
- Дочерние: `Sidebar`, `FilterBar`, `CategorySummary`, `ProductCard` (grid), `Modal`

**AdminPage** (`/admin`) — CRUD-панель
- **Правило:** все `useState`/`useEffect`/`useProducts` — ДО `if (!isAuthenticated) return`
- Tabs: "Товары" / "Запросы" (с Badge-счётчиком)
- Форма: секции (Основное / Цена / Описание / Характеристики / Детали / Комплектация)
- Загрузка фото: multer, прогресс-индикатор

**SharePage** (`/share/:id`) — публичная страница
- `useSharedProduct(id)` — данные из `/api/share/:id`
- Блоки: галерея, цена, форма заявки, WhatsApp/Telegram кнопки
- **Правило:** использовать `priceGradation?.min/avg/max` (не `price_min/max`)

**ProductPage** (`/product/:slug`) — эталонная карточка (захардкожены данные Aoralscan 3)
- Данные пока статические — нужно заменить на API fetch

### Ключевые компоненты

**Sidebar** (`React.memo`) — меню категорий
- Принимает `activeCategory`, `onCategoryChange` (стабильный `useCallback`)
- Не перерисовывается при изменении поиска/фильтров

**FilterBar** — фильтры + сортировка
```js
// Экспортирует 2 утилиты (eslint-disable для react-refresh):
export function extractCountries(products)   // уникальные страны, сортировка localeCompare('ru')
export function applyFilters(products, filters)  // фильтр по странам + сортировка
```

**Modal** — быстрый просмотр товара
- Использует `priceGradation?.min/avg/max` (не `price_min/max`)
- Использует `baseConfig` (не `base_config`), `forUnits` (не `for_units`)
- shareSlug: `product.shareSlug ?? product.id`

**ProductCard** — карточка в сетке
- `shareSlug = product.shareSlug ?? product.id`
- `price = product.price` (не `price_label`)
- Иконки по `categoryId` из Lucide

**CategorySummary** — шпаргалка
- Принимает `currentSummary: Array<{country, range, desc}>`
- Рендерит только если `currentSummary?.length > 0`

---

## Хуки

### `useProducts(filters)` — список товаров
```js
const { products, loading, error, refetch } = useProducts({ category: 'units', active: '1' });
// filters сериализуются через JSON.stringify → стабильный dep для useCallback
```

### `useProduct(id)` — один товар
```js
const { product, loading, error } = useProduct(id);
```

### `useSharedProduct(slug)` — публичная карточка
```js
const { product, loading, error } = useSharedProduct(slug);
```

---

## API-клиент (`src/api/index.js`)

```js
const BASE_URL = import.meta.env.VITE_API_URL ?? '';  // '' = same-origin

export const productsApi = {
  getAll(filters)   → GET /api/products?...
  getById(id)       → GET /api/products/:id
  getShared(slug)   → GET /api/share/:slug
  create(data)      → POST /api/products (JWT)
  update(id, data)  → PUT /api/products/:id (JWT)
  delete(id)        → DELETE /api/products/:id (JWT)
};

export const categoriesApi = {
  getAll()          → GET /api/categories
  getSummary(id)    → GET /api/categories/:id/summary
};

export const uploadApi = {
  upload(productId, files)  → POST /api/upload/:productId (multipart, JWT)
  delete(imageId)           → DELETE /api/upload/:imageId (JWT)
  setPrimary(imageId)       → PUT /api/upload/:imageId/primary (JWT)
};

export const inquiriesApi = {
  getAll()          → GET /api/inquiries (JWT)
  submit(data)      → POST /api/inquiries
};

export const getImageUrl = (filename) => `${BASE_URL}/uploads/${filename}`;
```

---

## Auth (`src/context/AuthContext.jsx`)

```js
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { ... }

// Хранит JWT в localStorage
// { isAuthenticated, token, login(username, password), logout() }
```

---

## ESLint правила (0 ошибок)

Конфиг: `eslint.config.js` (ESLint v9 flat config)
- `eslint-plugin-react-hooks` v7
- `eslint-plugin-react-refresh`

**Актуальные eslint-disable в коде:**
```js
// useProducts.js — setLoading(true) перед async операцией в useEffect
// eslint-disable-next-line react-hooks/set-state-in-effect

// FilterBar.jsx — экспорт утилит из файла с компонентом
// eslint-disable-next-line react-refresh/only-export-components

// AuthContext.jsx — экспорт useAuth из файла с AuthProvider
// eslint-disable-next-line react-refresh/only-export-components
```

---

## Переменные окружения Frontend (Vite)

```env
# .env (корень проекта)
VITE_API_URL=         # пустая строка = same-origin (production)
                      # http://localhost:3001 = для локальной разработки
VITE_WHATSAPP_PHONE=  # 79001234567 (только цифры)
```

---

## Локальная разработка

```bash
# 1. Запустить сервер
cd server && node --experimental-sqlite index.js

# 2. Запустить Vite dev server (proxy /api → :3001)
npm run dev

# 3. Открыть http://localhost:5173
```

Vite автоматически проксирует `/api/*` на `http://localhost:3001` (настроено в `vite.config.js`).

---

## Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| Цены не отображаются | `product.price_min` вместо `product.priceGradation?.min` | Использовать API поля |
| Ссылка `/product/undefined` | `product.slug` вместо `product.shareSlug` | `product.shareSlug ?? product.id` |
| Комплектация пустая | `product.base_config` вместо `product.baseConfig` | camelCase поля |
| Компрессор без характеристик | `product.for_units` вместо `product.forUnits` | camelCase поля |
| AdminPage ошибка хуков | Hooks после `if (!isAuthenticated) return` | Все hooks ДО условного return |
| Sidebar перерисовывается | Нестабильный `onCategoryChange` | `useCallback(fn, [])` |
