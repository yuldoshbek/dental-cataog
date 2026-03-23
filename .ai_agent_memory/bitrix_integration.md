# Bitrix24 Интеграция — Dental Catalog

> Последнее обновление: 23.03.2026

---

## Смарт-процесс (факт)

| Параметр | Значение |
|----------|---------|
| Название | Каталог оборудования |
| Домен | 3dexpert.bitrix24.ru |
| SP ID | 35 |
| **entityTypeId** | **1106** |
| Стадий | 5 |
| Полей создано | 30 из 30 |
| Статус | ✅ Готов к использованию |

---

## Вебхук

```
https://3dexpert.bitrix24.ru/rest/22473/<TOKEN>/
```

> Токен хранится только в `server/.env` на сервере (не коммитится в git).
> В `.env.example` показан формат без токена.

Активация в `server/.env`:
```env
CATALOG_PROVIDER=bitrix
BITRIX_WEBHOOK_URL=https://3dexpert.bitrix24.ru/rest/22473/<TOKEN>/
BITRIX_SMART_PROCESS_ENTITY_TYPE_ID=1106
```

---

## Маппинг полей (полный)

Все коды прошиты в `server/catalog/bitrixConfig.js` → `DEFAULT_FIELD_MAP`.
Override через `BITRIX_FIELD_MAP_JSON` в `.env` (не нужен при стандартной конфигурации).

| App-имя | Bitrix код | Тип | Примечание |
|---------|-----------|-----|-----------|
| `externalCode` | `UF_CRM_35_1773638674` | string | Внешний ID |
| `shareSlug` | `UF_CRM_35_1773647204` | string | Slug для публичной ссылки |
| `categoryId` | `UF_CRM_35_1773647756` | enumeration | 8 значений |
| `brand` | `UF_CRM_35_1773655225` | string | |
| `model` | `UF_CRM_35_1773655598` | string | |
| `country` | `UF_CRM_35_1773656378` | string | |
| `priceLabel` | `UF_CRM_35_1773656991` | string | Строка цены для отображения |
| `priceMin` | `UF_CRM_35_1773657527` | double | |
| `priceAvg` | `UF_CRM_35_1773658331` | string* | Числовое значение корректно |
| `priceMax` | `UF_CRM_35_1773771966` | double | |
| `description` | `UF_CRM_35_1773909482` | string | manager_description |
| `clientDescription` | `UF_CRM_35_1773906219` | string | |
| `specs` | `UF_CRM_35_1773961626` | string | |
| `colors` | `UF_CRM_35_1773962010` | string | |
| `upholstery` | `UF_CRM_35_1773962106` | string | |
| `baseConfig` | `UF_CRM_35_1773962180` | string | |
| `options` | `null` | — | Не создавалось в Bitrix |
| `forUnits` | `UF_CRM_35_1773962262` | string | |
| `dryer` | `UF_CRM_35_1773962398` | string | |
| `cover` | `UF_CRM_35_1773962480` | string | |
| `type` | `UF_CRM_35_1773962581` | string | equipment_type |
| `cylinders` | `UF_CRM_35_1773906608` | string | |
| `dimensions` | `UF_CRM_35_1773962687` | string | |
| `isActive` | `UF_CRM_35_1773962772` | boolean | |
| `publishWeb` | `UF_CRM_35_1774162123` | boolean | |
| `publishShare` | `UF_CRM_35_1774164022` | boolean | |
| `publishTelegram` | `UF_CRM_35_1774164088` | boolean | |
| `primaryImage` | `UF_CRM_35_1774173034` | file | |
| `gallery` | `UF_CRM_35_1774173226` | file, multiple | |
| `lastSyncHash` | `UF_CRM_35_1774163735` | string | |
| `sourceUpdatedAt` | `UF_CRM_35_1773658861` | string* | |
| `searchTags` | `UF_CRM_35_1773907582` | string | |
| `sortOrder` | `UF_CRM_35_1773906476` | string* | |

---

## Маппинг категорий

Bitrix enumeration ID → внутренний categoryId.
Прошит в `DEFAULT_CATEGORY_MAP` (`bitrixConfig.js`).

| Bitrix enum ID | Битрикс имя | Внутренний ID |
|---------------|------------|--------------|
| 1229 | Установки | `units` |
| 1231 | Компрессоры | `compressors` |
| 1233 | Автоклавы | `autoclaves` |
| 1235 | Физиодиспенсеры | `physio` |
| 1237 | Интраоральные сканеры | `scanners` |
| 1239 | Портативные рентгены | `xray` |
| 1241 | Визиографы | `visiographs` |
| 1243 | Наконечники | `handpieces` |

> ⚠️ «Портативные рентгены» в Bitrix ≠ «Рентгены портативные» в БД. Маппинг добавлен в `DEFAULT_CATEGORY_MAP` по строке тоже.

---

## Маппинг стадий

Proshit в `DEFAULT_STAGE_MAP` (`bitrixConfig.js`).
statusType: `DYNAMIC_1106_STAGE_57`

| Bitrix stageId | Название | Внутренний статус |
|---------------|---------|-----------------|
| `DT1106_57:NEW` | Черновик | `draft` |
| `DT1106_57:review` | На проверке | `review` |
| `DT1106_57:ready_internal` | Готово для менеджеров | `ready_internal` |
| `DT1106_57:SUCCESS` | Опубликовано | `published` |
| `DT1106_57:FAIL` | Архив | `archived` |

---

## Как работает интеграция

### Режим Bitrix (read-only):

```
Bitrix24 (смарт-процесс)
    ↓  crm.item.list (entityTypeId=1106)
BitrixClient (bitrixClient.js)
    ↓  нормализация через normalizeBitrixProduct()
bitrixCatalogRepository.js
    ↓  API-ответ с теми же полями что и local provider
routes/products.js → frontend
```

- Кеш в памяти, TTL = `BITRIX_CACHE_TTL_MS` (по умолчанию 60 сек)
- CRUD (`POST/PUT/DELETE /api/products`) → 409 «Изменяйте в Bitrix»
- Загрузка фото → 409

### Фильтрация публикации:
```js
// Показывается в каталоге менеджера (publishWeb=true + isActive=true + status='published')
// Показывается по ссылке (publishShare=true + isActive=true + status='published')
```

---

## Отклонения от архитектуры (не блокирующие)

| Поле | Тип в архитектуре | Тип в Bitrix | Влияние |
|------|------------------|-------------|---------|
| `priceAvg` | double | string | Числа сохраняются корректно (readNumberField парсит) |
| `sortOrder` | integer | string | Аналогично |
| `sourceUpdatedAt` | datetime | string | Парсится через readDateField (ISO строки) |
| `manager_description` / text-поля | большой текст | string | Функционально совместимо |
| `is_active`, `publish_web` | boolean обязательное | boolean необязательное | OK, defaults: isActive=true при publishWeb |

---

## Следующие шаги для полной интеграции

1. ✅ Смарт-процесс создан (entityTypeId=1106)
2. ✅ Коды полей прошиты в `bitrixConfig.js`
3. 🔲 Получить токен вебхука и задать `BITRIX_WEBHOOK_URL` в `server/.env`
4. 🔲 Переключить `CATALOG_PROVIDER=bitrix` в `server/.env`
5. 🔲 Добавить первые товары в Bitrix смарт-процессе (стадия «Опубликовано»)
6. 🔲 Проверить через `/health` что `catalog.provider = bitrix`
7. 🔲 При двусторонней синхронизации — реализовать `server/services/bitrixSync.js`
