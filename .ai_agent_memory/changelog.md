# Changelog проекта — Dental Catalog

---

## [05.03.2026] — Этап 1: Первый прототип

**Что сделано:**
- Монолит `App.jsx` разбит на React-компоненты
- Созданы: `Sidebar`, `ProductCard`, `CategorySummary`, `Modal`, `DetailRow`
- Настроен TailwindCSS + PostCSS
- Первая сборка `npm run build` — ✅

---

## [05.03.2026] — Этап 2: Production-реализация

**Backend (VPS Node.js + Express):**
- `server/index.js` — Express с Helmet, rate-limiting, CORS, graceful shutdown
- `server/db.js` — SQLite через `node:sqlite`, полная схема + seed
- `server/routes/` — products, auth, upload
- `server/middleware/auth.js` — JWT Bearer guard

**Frontend:**
- Полный SPA с React Router, CatalogPage, SharePage, AdminPage, LoginPage
- `src/api/index.js`, `AuthContext.jsx`, `useProducts.js`

---

## [06.03.2026] — Этап 3: GitHub + Netlify + баг-фиксы

**Исправленные баги:**
1. `BASE_URL = ''` — был `localhost:3001`, Netlify не имеет этого сервера
2. Netlify Function переписана (была Edge Function синтаксис)
3. netlify.toml redirect: убран `:splat`
4. ProductCard: `product.imageIcon` / `product.desc` → `product.description` + иконки
5. POST body base64 decode (Netlify иногда кодирует тело)

**Статус:** Netlify deploy работает, 10 тестовых товаров

---

## [11.03.2026] — Этап 4: Новая архитектура + Эталонная карточка + Docker

**Новые файлы:**
- `ARCHITECTURE.md` — полный тех. документ
- `src/pages/ProductPage.jsx` — эталонная карточка (Aoralscan 3 Wireless)
- `server/catalog/` — localCatalogRepository, inquiryStore
- `catalog/` — bitrixCatalogRepository, bitrixClient, bitrixConfig (для будущего)
- `server/Dockerfile`, `docker-compose.yml`, `nginx.docker.conf`
- `.gitlab-ci.yml` — GitLab CI/CD: build → SSH deploy
- `НАДЫР_ИНСТРУКЦИЯ.md` — инструкция по первому деплою
- `BITRIX_SMART_PROCESS.md` — инструкция по настройке Bitrix

**Изменения:**
- `src/App.jsx` — добавлен маршрут `/product/:slug`
- `src/components/ProductCard.jsx` — кнопка "Полная карточка"

---

## [14-15.03.2026] — Этап 5: Полный редизайн UI (4 фазы)

**Дизайн-система:**
- `tailwind.config.js` — цвета `primary-*` (синий), `dental-bg`, `shadow-modal`, `animate-slide-down`
- Иконки по категориям из Lucide вместо emoji

**Фаза 1 — CatalogPage:**
- Новый header с фирменными цветами
- Sidebar переработан (React.memo)
- ProductCard обновлён (primary цвета)
- FilterBar: фильтры по стране, сортировка по имени/цене
- CategorySummary: redesign

**Фаза 2 — SharePage:**
- Новый дизайн для клиента
- **Баг-фикс:** `hasPriceGradation` использовал `product.price_min` → исправлено на `product.priceGradation?.min`
- Price cells: `price_min/avg/max` → `priceGradation.{min,avg,max}`

**Фаза 3 — LoginPage:**
- Полный редизайн формы входа

**Фаза 4 — AdminPage:**
- Тёмный header (slate-900)
- Tabs + Badge из `src/components/ui/`
- Сгруппированная форма с секциями
- **Баг-фикс:** "Просмотр" link использовал `product.slug` → исправлено на `product.shareSlug`

**Новые UI-компоненты:**
- `src/components/ui/Tabs.jsx`
- `src/components/ui/Badge.jsx`
- `src/components/ui/Skeleton.jsx`
- `src/components/TouchGallery.jsx`

---

## [15.03.2026] — Этап 6: Тестирование + Оптимизация

**Исправленные баги (аудит несоответствия полей API):**

| Файл | Баг | Исправление |
|------|-----|------------|
| `FilterBar.jsx` | Сортировка по цене: `a.price_min` → `a.priceGradation?.min` | Цена сортировалась неверно |
| `Modal.jsx` | `product.slug` → `product.shareSlug` | Ссылка "Полная карточка" была `/product/undefined` |
| `Modal.jsx` | `product.base_config` → `product.baseConfig` | Комплектация установок не показывалась |
| `Modal.jsx` | `product.for_units` → `product.forUnits` | Параметры компрессоров не показывались |
| `Modal.jsx` | `hasPriceGradation` → `priceGradation?.min\|avg\|max` | Ценовой диапазон никогда не показывался |
| `ProductCard.jsx` | `product.slug` → `product.shareSlug`, `price_label` → `price` | Ссылки и цены были сломаны |
| `CategorySummary.jsx` | `border-blue-100` → `border-primary-100`, `!currentSummary` → `!currentSummary?.length` | Дизайн + пустой массив guard |
| `CatalogPage.jsx` | Unused import `SlidersHorizontal` | Убран |
| `CatalogPage.jsx` | `handleCategoryChange` → `useCallback` | Sidebar перерисовывался без нужды |
| `useProducts.js` | Убран невалидный eslint-disable-next-line комментарий | |

**Оптимизация производительности:**
- `Sidebar.jsx` — обёрнут в `React.memo`
- `CatalogPage.jsx` — `useCallback` для `handleCategoryChange`
- `useProducts.js` — `filterKey = JSON.stringify(filters)` вместо объекта в deps
- `FilterBar.jsx` — `extractCountries`: `.sort()` → `.localeCompare('ru')` (правильный рус. алфавит)

---

## [15.03.2026] — Этап 7: Переход на VPS (удаление Netlify)

**Netlify УДАЛЁН:**
- Удалены `netlify/` и `netlify.toml`
- Удалена зависимость `@netlify/functions` из `package.json`

**Vite оптимизация:**
- `vite.config.js` → `manualChunks`: vendor (React/Router) и icons (lucide) в отдельные chunks
- Главный бандл: 237 kB → 187 kB (-21%), vendor кешируется браузером

**Nginx:**
- `nginx.conf` — HTTP/HTTPS с include snippet
- `nginx.snippet.conf` — security headers (X-Frame-Options, X-Content-Type-Options и др.), gzip, кеш assets 1 год, proxy /api/ и /uploads/

**Сервер:**
- `server/index.js` — `process.send?.('ready')` для PM2 `wait_ready`
- Логирование с timestamp: 5xx → stderr, 4xx → stdout, 2xx только в dev
- Startup validation: ADMIN_USERNAME + ADMIN_PASSWORD + JWT_SECRET

**PM2:**
- `ecosystem.config.js` — **критический баг исправлен**: `--experimental-sqlite` не передавался → `script: 'node', args: '--experimental-sqlite index.js'`

---

## [15.03.2026] — Этап 8: Серверный код для production

**Критические баги исправлены:**

1. **Docker: Bitrix-модули не попадали в образ**
   - `server/catalog/index.js` импортировал `../../catalog/` (корень проекта)
   - Docker build context = `./server` → файлы из корня НЕ включались в образ
   - **Fix:** скопированы все 5 файлов из `catalog/` → `server/catalog/`, исправлены импорты `./`
   - Файлы в `server/catalog/`: `bitrixCatalogRepository.js`, `bitrixClient.js`, `bitrixConfig.js`, `categoryDefinitions.js`, `summaryUtils.js`

2. **ADMIN_USERNAME не проверялся при старте**
   - Если не задан → логин всегда возвращал "неверные данные"
   - **Fix:** добавлена проверка в `server/index.js` startup validation

**Безопасность:**
- `server/routes/products.js` — `inquiryLimiter` (10/мин) на `POST /api/inquiries`

**Производительность:**
- `server/db.js` — SQLite индексы: `idx_products_category`, `idx_products_active`, `idx_images_product`, `idx_summaries_cat`, `idx_inquiries_product`

---

## [15.03.2026] — Этап 9: Финальная проверка + ESLint чистка

**ESLint: 20 ошибок → 0**

| Ошибка | Файл | Исправление |
|--------|------|------------|
| **Критический**: hooks после `if (!isAuthenticated) return` | `AdminPage.jsx` | Все hooks перенесены ДО условного return |
| Unused param `half` | `AdminPage.jsx` | Переименован в `_half` |
| `setLoading(true)` синхронно в `useEffect` (×2) | `useProducts.js` | `eslint-disable-next-line` |
| `setSummary([])` синхронно в `useEffect` | `CatalogPage.jsx` | `eslint-disable-next-line` |
| Non-component exports в файле с компонентом (×3) | `FilterBar.jsx`, `AuthContext.jsx` | `eslint-disable-next-line` |

**Итоговые тесты API:**
- Auth login → JWT токен ✅
- CRUD (Create/Read/Delete) ✅
- Rate limit auth (429 на 6-й попытке) ✅
- Protected endpoints (401 без токена) ✅
- Share endpoint (404 если товар не найден) ✅

---

## Текущее состояние (15.03.2026)

| Что | Статус |
|-----|--------|
| ESLint | ✅ 0 errors |
| `npm run build` | ✅ 3.5s |
| API (все endpoints) | ✅ протестированы |
| GitHub main | ✅ commit `3b0034d` |
| VPS деплой | 🔲 ожидает Надыра |
| Bitrix смарт-процесс | 🔲 инструкция в BITRIX_SMART_PROCESS.md |

## Следующие шаги

1. **Надыр** — создаёт GitLab репозиторий на `gitlab.intelnet24.ru`
2. Настроить CI/CD Variables в GitLab: `SSH_PRIVATE_KEY`, `SSH_USER`, `SSH_HOST`, `APP_DIR`
3. Первый деплой по `НАДЫР_ИНСТРУКЦИЯ.md`
4. Задать `server/.env` на сервере (сменить JWT_SECRET, ADMIN_PASSWORD)
5. Bitrix смарт-процесс по `BITRIX_SMART_PROCESS.md`
6. Добавить реальные товары через AdminPage
