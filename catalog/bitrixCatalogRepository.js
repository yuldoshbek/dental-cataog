import { buildCategoryPayloads, resolveCategoryId } from './categoryDefinitions.js';
import { ensureBitrixCatalogConfig, getBitrixCatalogConfig } from './bitrixConfig.js';
import { BitrixClient } from './bitrixClient.js';
import { buildCategorySummaries, formatPriceRange } from './summaryUtils.js';

const PUBLISHED_STATUS = 'published';

function createHttpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function readField(item, key) {
  if (!key) {
    return undefined;
  }
  if (key === 'id') {
    return item.id;
  }
  return item[key];
}

function readStringField(item, key) {
  const value = readField(item, key);
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => readStringField({ value: entry }, 'value'))
      .filter(Boolean)
      .join(', ');
  }

  return (
    value.value
    ?? value.VALUE
    ?? value.title
    ?? value.name
    ?? value.TEXT
    ?? value.text
    ?? ''
  ).toString().trim();
}

function readNumberField(item, key) {
  const rawValue = readField(item, key);
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return null;
  }
  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? rawValue : null;
  }

  const parsed = Number(String(rawValue).replace(/\s+/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function readBooleanField(item, key, fallback = false) {
  const rawValue = readField(item, key);
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }
  if (typeof rawValue === 'boolean') {
    return rawValue;
  }
  if (typeof rawValue === 'number') {
    return rawValue !== 0;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  return ['1', 'y', 'yes', 'true', 'да', 'on'].includes(normalized);
}

function readDateField(item, key) {
  const rawValue = readField(item, key);
  if (!rawValue) {
    return null;
  }

  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeStage(rawStage, stageMap = {}) {
  if (!rawStage) {
    return 'draft';
  }

  const directMatch = stageMap[rawStage];
  if (directMatch) {
    return directMatch;
  }

  const loweredStage = String(rawStage).trim().toLowerCase();
  const loweredMatch = Object.entries(stageMap).find(
    ([stage]) => String(stage).trim().toLowerCase() === loweredStage,
  );
  if (loweredMatch) {
    return loweredMatch[1];
  }

  if (loweredStage.includes('publish') || loweredStage.includes('success')) {
    return 'published';
  }
  if (loweredStage.includes('archive') || loweredStage.includes('fail')) {
    return 'archived';
  }
  if (loweredStage.includes('ready')) {
    return 'ready_internal';
  }
  if (loweredStage.includes('review')) {
    return 'review';
  }

  return 'draft';
}

function makeImage(id, filename, isPrimary, sortOrder) {
  return {
    id: String(id),
    filename: String(filename),
    is_primary: isPrimary ? 1 : 0,
    sort_order: sortOrder,
  };
}

function normalizeFiles(rawValue, prefix, isPrimary = false) {
  if (!rawValue) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue.flatMap((entry, index) => normalizeFiles(entry, `${prefix}-${index}`, isPrimary));
  }

  if (typeof rawValue === 'string') {
    const value = rawValue.trim();
    return value ? [makeImage(prefix, value, isPrimary, 0)] : [];
  }

  if (typeof rawValue === 'number') {
    return [makeImage(rawValue, rawValue, isPrimary, 0)];
  }

  const fileUrl = rawValue.downloadUrl
    ?? rawValue.url
    ?? rawValue.href
    ?? rawValue.src
    ?? rawValue.showUrl
    ?? rawValue.VALUE?.downloadUrl
    ?? rawValue.VALUE?.url
    ?? rawValue.VALUE;

  if (!fileUrl) {
    return [];
  }

  const fileId = rawValue.id ?? rawValue.ID ?? prefix;
  return [makeImage(fileId, fileUrl, isPrimary, 0)];
}

function buildImages(primaryValue, galleryValue) {
  const primaryImages = normalizeFiles(primaryValue, 'primary', true);
  const galleryImages = normalizeFiles(galleryValue, 'gallery', false).filter(
    (galleryImage) => !primaryImages.some((primaryImage) => primaryImage.filename === galleryImage.filename),
  );

  const images = [...primaryImages, ...galleryImages].map((image, index) => ({
    ...image,
    sort_order: index,
  }));

  if (images.length > 0 && !images.some((image) => image.is_primary)) {
    images[0].is_primary = 1;
  }

  return images;
}

function buildPriceLabel(priceLabel, priceMin, priceAvg, priceMax) {
  if (priceLabel) {
    return priceLabel;
  }

  const min = priceMin ?? priceAvg ?? priceMax;
  const max = priceMax ?? priceAvg ?? priceMin;
  return formatPriceRange(min, max);
}

function splitTitle(title) {
  const [brand = '', ...rest] = title.split(/\s+/);
  return {
    brand,
    model: rest.join(' ').trim(),
  };
}

function matchesProductIdentifier(product, identifier) {
  const candidate = String(identifier);
  return [product.id, product.shareSlug, product.externalCode]
    .filter(Boolean)
    .some((value) => String(value) === candidate);
}

function sortProducts(products) {
  return [...products].sort((left, right) => {
    const rightDate = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime();
    const leftDate = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
    return rightDate - leftDate || left.brand.localeCompare(right.brand, 'ru');
  });
}

function filterProductsBySearch(products, search) {
  if (!search) {
    return products;
  }

  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return products;
  }

  return products.filter((product) =>
    [product.brand, product.model, product.country, product.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalized)),
  );
}

function normalizeBitrixProduct(item, config) {
  const title = readStringField(item, config.fieldMap.title) || readStringField(item, 'title');
  const titleParts = splitTitle(title);
  const priceMin = readNumberField(item, config.fieldMap.priceMin);
  const priceAvg = readNumberField(item, config.fieldMap.priceAvg);
  const priceMax = readNumberField(item, config.fieldMap.priceMax);
  const stageValue = readStringField(item, config.fieldMap.status) || readStringField(item, 'stageId');
  const status = normalizeStage(stageValue, config.stageMap);
  const categoryId = resolveCategoryId(readField(item, config.fieldMap.categoryId), config.categoryMap);

  if (!categoryId) {
    return null;
  }

  const clientDescription = readStringField(item, config.fieldMap.clientDescription);
  const managerDescription = readStringField(item, config.fieldMap.description);
  const brand = readStringField(item, config.fieldMap.brand) || titleParts.brand || 'Без бренда';
  const model = readStringField(item, config.fieldMap.model) || titleParts.model || title || `Позиция ${item.id}`;
  const isActive = readBooleanField(item, config.fieldMap.isActive, status !== 'archived');
  const publishWeb = readBooleanField(item, config.fieldMap.publishWeb, status === PUBLISHED_STATUS);
  const publishShare = readBooleanField(item, config.fieldMap.publishShare, publishWeb);
  const publishTelegram = readBooleanField(item, config.fieldMap.publishTelegram, publishWeb);

  return {
    id: String(item.id),
    categoryId,
    brand,
    model,
    country: readStringField(item, config.fieldMap.country) || 'Не указано',
    price: buildPriceLabel(
      readStringField(item, config.fieldMap.priceLabel),
      priceMin,
      priceAvg,
      priceMax,
    ),
    priceGradation: (priceMin ?? priceAvg ?? priceMax) !== null
      ? { min: priceMin, avg: priceAvg, max: priceMax }
      : null,
    description: managerDescription || clientDescription || title || 'Описание пока не заполнено.',
    clientDescription: clientDescription || managerDescription || '',
    specs: readStringField(item, config.fieldMap.specs) || null,
    colors: readStringField(item, config.fieldMap.colors) || null,
    upholstery: readStringField(item, config.fieldMap.upholstery) || null,
    baseConfig: readStringField(item, config.fieldMap.baseConfig) || null,
    options: readStringField(item, config.fieldMap.options) || null,
    forUnits: readStringField(item, config.fieldMap.forUnits) || null,
    dryer: readStringField(item, config.fieldMap.dryer) || null,
    cover: readStringField(item, config.fieldMap.cover) || null,
    type: readStringField(item, config.fieldMap.type) || null,
    cylinders: readStringField(item, config.fieldMap.cylinders) || null,
    dimensions: readStringField(item, config.fieldMap.dimensions) || null,
    isActive,
    images: buildImages(
      readField(item, config.fieldMap.primaryImage),
      readField(item, config.fieldMap.gallery),
    ),
    createdAt: readDateField(item, 'createdTime') ?? readDateField(item, 'createdAt'),
    updatedAt: readDateField(item, 'updatedTime') ?? readDateField(item, 'updatedAt'),
    shareSlug: readStringField(item, config.fieldMap.shareSlug) || String(item.id),
    externalCode: readStringField(item, config.fieldMap.externalCode) || null,
    publishWeb,
    publishShare,
    publishTelegram,
    status,
    source: 'bitrix',
  };
}

function createReadOnlyError() {
  return createHttpError(
    409,
    'Каталог переведён в Bitrix smart-process. Изменяйте карточки товаров в Bitrix.',
  );
}

export function createBitrixCatalogRepository({
  config = getBitrixCatalogConfig(),
  client = null,
  inquiryStore,
} = {}) {
  const resolvedConfig = ensureBitrixCatalogConfig(config);
  const bitrixClient = client ?? new BitrixClient({ webhookUrl: resolvedConfig.webhookUrl });
  const cache = {
    loadedAt: 0,
    products: [],
  };

  async function loadProducts() {
    const now = Date.now();
    if (cache.loadedAt && now - cache.loadedAt < resolvedConfig.cacheTtlMs) {
      return cache.products;
    }

    const items = await bitrixClient.listAll('crm.item.list', {
      entityTypeId: resolvedConfig.entityTypeId,
      select: ['*', 'id', 'title', 'stageId', 'createdTime', 'updatedTime'],
      order: { updatedTime: 'DESC' },
    });

    cache.products = items
      .map((item) => normalizeBitrixProduct(item, resolvedConfig))
      .filter(Boolean);
    cache.loadedAt = now;
    return cache.products;
  }

  async function findProduct(identifier) {
    const products = await loadProducts();
    const product = products.find((item) => matchesProductIdentifier(item, identifier));
    if (!product) {
      throw createHttpError(404, 'Товар не найден.');
    }
    return product;
  }

  return {
    getProviderInfo() {
      return {
        provider: 'bitrix',
        source: 'bitrix-smart-process',
        readOnly: true,
      };
    },

    async listCategories() {
      const products = await loadProducts();
      const categoryIds = new Set(
        products
          .filter((product) => product.publishWeb && product.isActive && product.status === PUBLISHED_STATUS)
          .map((product) => product.categoryId),
      );
      return buildCategoryPayloads().filter((category) => categoryIds.has(category.id));
    },

    async getCategorySummary(categoryId) {
      const products = await loadProducts();
      const publishedProducts = products.filter(
        (product) => product.publishWeb && product.isActive && product.status === PUBLISHED_STATUS,
      );
      return buildCategorySummaries(publishedProducts, categoryId);
    },

    async listProducts(filters = {}) {
      const products = await loadProducts();
      const { category, search, active = '1' } = filters;

      let filtered = products;
      if (active === 'all') {
        filtered = products;
      } else if (active === '0') {
        filtered = products.filter(
          (product) => !product.isActive || !product.publishWeb || product.status !== PUBLISHED_STATUS,
        );
      } else {
        filtered = products.filter(
          (product) => product.isActive && product.publishWeb && product.status === PUBLISHED_STATUS,
        );
      }

      if (category) {
        filtered = filtered.filter((product) => product.categoryId === category);
      }

      return sortProducts(filterProductsBySearch(filtered, search));
    },

    async getProduct(id) {
      return findProduct(id);
    },

    async getSharedProduct(identifier) {
      const product = await findProduct(identifier);
      if (!product.isActive || !product.publishShare || product.status !== PUBLISHED_STATUS) {
        throw createHttpError(404, 'Карточка не опубликована.');
      }
      return product;
    },

    async createProduct() {
      throw createReadOnlyError();
    },

    async updateProduct() {
      throw createReadOnlyError();
    },

    async deleteProduct() {
      throw createReadOnlyError();
    },

    async submitInquiry(payload, meta = {}) {
      const { productId, type, clientName, clientPhone, message } = payload;
      if (!productId || !type) {
        throw createHttpError(400, 'Укажите productId и type.');
      }
      if (!['approve', 'question'].includes(type)) {
        throw createHttpError(400, 'type должен быть "approve" или "question".');
      }

      const product = await findProduct(productId);
      return inquiryStore.createExternalInquiry({
        product,
        type,
        clientName: clientName ?? null,
        clientPhone: clientPhone ?? null,
        message: message ?? null,
        ipAddress: meta.ipAddress ?? null,
        source: 'bitrix',
      });
    },

    async listInquiries() {
      return inquiryStore.listAll();
    },
  };
}
