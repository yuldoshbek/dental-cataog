const DEFAULT_FIELD_MAP = Object.freeze({
  title: 'title',
  status: 'stageId',
  categoryId: 'ufCrmCategory',
  brand: 'ufCrmBrand',
  model: 'ufCrmModel',
  country: 'ufCrmCountry',
  priceLabel: 'ufCrmPriceLabel',
  priceMin: 'ufCrmPriceMin',
  priceAvg: 'ufCrmPriceAvg',
  priceMax: 'ufCrmPriceMax',
  description: 'ufCrmManagerDescription',
  clientDescription: 'ufCrmClientDescription',
  specs: 'ufCrmSpecs',
  colors: 'ufCrmColors',
  upholstery: 'ufCrmUpholstery',
  baseConfig: 'ufCrmBaseConfig',
  options: 'ufCrmOptions',
  forUnits: 'ufCrmForUnits',
  dryer: 'ufCrmDryer',
  cover: 'ufCrmCover',
  type: 'ufCrmType',
  cylinders: 'ufCrmCylinders',
  dimensions: 'ufCrmDimensions',
  primaryImage: 'ufCrmPrimaryImage',
  gallery: 'ufCrmGallery',
  shareSlug: 'ufCrmShareSlug',
  externalCode: 'ufCrmExternalCode',
  isActive: 'ufCrmIsActive',
  publishWeb: 'ufCrmPublishWeb',
  publishShare: 'ufCrmPublishShare',
  publishTelegram: 'ufCrmPublishTelegram',
});

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
  const entityTypeId = Number.parseInt(process.env.BITRIX_SMART_PROCESS_ENTITY_TYPE_ID ?? '', 10);
  const cacheTtlMs = Number.parseInt(process.env.BITRIX_CACHE_TTL_MS ?? '60000', 10);

  return {
    webhookUrl: (process.env.BITRIX_WEBHOOK_URL ?? '').trim(),
    entityTypeId: Number.isFinite(entityTypeId) ? entityTypeId : null,
    cacheTtlMs: Number.isFinite(cacheTtlMs) && cacheTtlMs >= 0 ? cacheTtlMs : 60000,
    fieldMap: {
      ...DEFAULT_FIELD_MAP,
      ...parseJsonEnv('BITRIX_FIELD_MAP_JSON', {}),
    },
    categoryMap: parseJsonEnv('BITRIX_CATEGORY_MAP_JSON', {}),
    stageMap: parseJsonEnv('BITRIX_STAGE_MAP_JSON', {}),
  };
}

export function ensureBitrixCatalogConfig(config = getBitrixCatalogConfig()) {
  if (!config.webhookUrl) {
    throw Object.assign(
      new Error('Не задан BITRIX_WEBHOOK_URL для Bitrix provider.'),
      { status: 500 },
    );
  }

  if (!config.entityTypeId) {
    throw Object.assign(
      new Error('Не задан BITRIX_SMART_PROCESS_ENTITY_TYPE_ID для Bitrix provider.'),
      { status: 500 },
    );
  }

  return config;
}

export { DEFAULT_FIELD_MAP };
