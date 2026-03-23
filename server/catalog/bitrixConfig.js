/**
 * bitrixConfig.js
 *
 * Конфигурация Bitrix24 интеграции для dental-catalog.
 *
 * Смарт-процесс: «Каталог оборудования»
 *   SP ID:         35
 *   entityTypeId:  1106
 *   Домен:         3dexpert.bitrix24.ru
 *
 * Поля созданы в Bitrix и соответствуют архитектуре (.ai_agent_memory/data_schema.md).
 * DEFAULT_FIELD_MAP, DEFAULT_CATEGORY_MAP и DEFAULT_STAGE_MAP прошиты по факту
 * — env-переменные нужны только для override.
 */

// ─── Маппинг полей: ключ = app-имя, значение = имя поля в Bitrix API ─────────
// Bitrix возвращает UF-поля в camelCase: ufCrm35_XXXXXXXXXX
// (не UF_CRM_35_* — это только код при создании поля в настройках Bitrix)
// Получено из crm.item.get (entityTypeId=1106, 23.03.2026)
const DEFAULT_FIELD_MAP = Object.freeze({
  // Системные
  title:              'title',
  status:             'stageId',

  // Идентификаторы
  externalCode:       'ufCrm35_1773638674',
  shareSlug:          'ufCrm35_1773647204',
  categoryId:         'ufCrm35_1773647756',   // enumeration (8 значений, ID → число)

  // Основные данные
  brand:              'ufCrm35_1773655225',
  model:              'ufCrm35_1773655598',
  country:            'ufCrm35_1773656378',

  // Цены
  priceLabel:         'ufCrm35_1773656991',
  priceMin:           'ufCrm35_1773657527',   // double
  priceAvg:           'ufCrm35_1773658331',   // string (числовые значения корректны)
  priceMax:           'ufCrm35_1773771966',   // double

  // Описания
  description:        'ufCrm35_1773909482',   // manager_description
  clientDescription:  'ufCrm35_1773906219',   // client_description

  // Характеристики
  specs:              'ufCrm35_1773961626',
  colors:             'ufCrm35_1773962010',
  upholstery:         'ufCrm35_1773962106',
  baseConfig:         'ufCrm35_1773962180',
  options:            null,                   // не создавалось в Bitrix смарт-процессе
  forUnits:           'ufCrm35_1773962262',
  dryer:              'ufCrm35_1773962398',
  cover:              'ufCrm35_1773962480',
  type:               'ufCrm35_1773962581',   // equipment_type
  cylinders:          'ufCrm35_1773906608',
  dimensions:         'ufCrm35_1773962687',

  // Медиа
  primaryImage:       'ufCrm35_1774173034',   // file
  gallery:            'ufCrm35_1774173226',   // file, multiple

  // Управление публикацией
  isActive:           'ufCrm35_1773962772',   // boolean → 'Y'/'N' или true/false
  publishWeb:         'ufCrm35_1774162123',
  publishShare:       'ufCrm35_1774164022',
  publishTelegram:    'ufCrm35_1774164088',

  // Служебные
  searchTags:         'ufCrm35_1773907582',
  sortOrder:          'ufCrm35_1773906476',
  lastSyncHash:       'ufCrm35_1774163735',
  sourceUpdatedAt:    'ufCrm35_1773658861',
});

// ─── Маппинг категорий ────────────────────────────────────────────────────────
// Bitrix enumeration ID → внутренний categoryId
// Enum-значения: crm.item.fields UF_CRM_35_1773647756 (23.03.2026)
const DEFAULT_CATEGORY_MAP = Object.freeze({
  '1229': 'units',          // Установки
  '1231': 'compressors',    // Компрессоры
  '1233': 'autoclaves',     // Автоклавы
  '1235': 'physio',         // Физиодиспенсеры
  '1237': 'scanners',       // Интраоральные сканеры
  '1239': 'xray',           // Портативные рентгены
  '1241': 'visiographs',    // Визиографы
  '1243': 'handpieces',     // Наконечники

  // Имена (запасной вариант, если Bitrix вернёт строку вместо ID)
  'Портативные рентгены':   'xray',  // в Bitrix отличается от нашего «Рентгены портативные»
});

// ─── Маппинг стадий ───────────────────────────────────────────────────────────
// Bitrix stageId → внутренний статус ('draft'|'review'|'ready_internal'|'published'|'archived')
// Стадии: crm.status.list filter[ENTITY_ID]=DYNAMIC_1106_STAGE_57 (23.03.2026)
const DEFAULT_STAGE_MAP = Object.freeze({
  'DT1106_57:NEW':            'draft',          // Черновик
  'DT1106_57:review':         'review',         // На проверке
  'DT1106_57:ready_internal': 'ready_internal', // Готово для менеджеров
  'DT1106_57:SUCCESS':        'published',      // Опубликовано
  'DT1106_57:FAIL':           'archived',       // Архив
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseJsonEnv(name, fallback) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    throw Object.assign(
      new Error(`Переменная ${name} содержит невалидный JSON.`),
      { status: 500 },
    );
  }
}

export function getCatalogProviderFromEnv() {
  const rawValue = (process.env.CATALOG_PROVIDER ?? 'local').trim().toLowerCase();
  return rawValue === 'bitrix' ? 'bitrix' : 'local';
}

export function getBitrixCatalogConfig() {
  const entityTypeId = Number.parseInt(process.env.BITRIX_SMART_PROCESS_ENTITY_TYPE_ID ?? '1106', 10);
  const cacheTtlMs   = Number.parseInt(process.env.BITRIX_CACHE_TTL_MS ?? '60000', 10);

  return {
    webhookUrl:   (process.env.BITRIX_WEBHOOK_URL ?? '').trim(),
    entityTypeId: Number.isFinite(entityTypeId) ? entityTypeId : 1106,
    cacheTtlMs:   Number.isFinite(cacheTtlMs) && cacheTtlMs >= 0 ? cacheTtlMs : 60000,

    // Env-переменные MERGE поверх defaults → override конкретных полей без замены всего маппинга
    fieldMap:     { ...DEFAULT_FIELD_MAP,     ...parseJsonEnv('BITRIX_FIELD_MAP_JSON', {}) },
    categoryMap:  { ...DEFAULT_CATEGORY_MAP,  ...parseJsonEnv('BITRIX_CATEGORY_MAP_JSON', {}) },
    stageMap:     { ...DEFAULT_STAGE_MAP,     ...parseJsonEnv('BITRIX_STAGE_MAP_JSON', {}) },
  };
}

export function ensureBitrixCatalogConfig(config = getBitrixCatalogConfig()) {
  if (!config.webhookUrl) {
    throw Object.assign(
      new Error('Не задан BITRIX_WEBHOOK_URL. Добавьте в server/.env.'),
      { status: 500 },
    );
  }

  if (!config.entityTypeId) {
    throw Object.assign(
      new Error('Не задан BITRIX_SMART_PROCESS_ENTITY_TYPE_ID.'),
      { status: 500 },
    );
  }

  return config;
}

export { DEFAULT_FIELD_MAP, DEFAULT_CATEGORY_MAP, DEFAULT_STAGE_MAP };
