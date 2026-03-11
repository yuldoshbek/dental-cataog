import { v4 as uuid } from 'uuid';

function mapImages(db, productId) {
  return db.prepare(`
    SELECT id, filename, is_primary, sort_order
    FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC
  `).all(productId);
}

function mapProduct(row, images = []) {
  return {
    id: row.id,
    categoryId: row.category_id,
    brand: row.brand,
    model: row.model,
    country: row.country,
    price: row.price_label,
    priceGradation: (row.price_min ?? row.price_avg ?? row.price_max) !== null
      ? { min: row.price_min, avg: row.price_avg, max: row.price_max }
      : null,
    description: row.description,
    clientDescription: row.description,
    specs: row.specs,
    colors: row.colors,
    upholstery: row.upholstery,
    baseConfig: row.base_config,
    options: row.options,
    forUnits: row.for_units,
    dryer: row.dryer,
    cover: row.cover,
    type: row.type,
    cylinders: row.cylinders,
    dimensions: row.dimensions,
    isActive: Boolean(row.is_active),
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shareSlug: row.id,
    publishWeb: Boolean(row.is_active),
    publishShare: Boolean(row.is_active),
    publishTelegram: Boolean(row.is_active),
    status: row.is_active ? 'published' : 'draft',
    source: 'local',
  };
}

function findCategory(db, categoryId) {
  return db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
}

function readProductRow(db, productId) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
}

function createHttpError(status, message) {
  return Object.assign(new Error(message), { status });
}

export function createLocalCatalogRepository({ db, inquiryStore }) {
  return {
    getProviderInfo() {
      return {
        provider: 'local',
        source: 'sqlite',
        readOnly: false,
      };
    },

    async listCategories() {
      return db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
    },

    async getCategorySummary(categoryId) {
      const rows = db.prepare(`
        SELECT country, price_range, description
        FROM category_summaries
        WHERE category_id = ?
        ORDER BY sort_order
      `).all(categoryId);

      return rows.map((row) => ({
        country: row.country,
        range: row.price_range,
        desc: row.description,
      }));
    },

    async listProducts(filters = {}) {
      const { category, search, active = '1' } = filters;
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (active !== 'all') {
        query += ' AND is_active = ?';
        params.push(active === '1' ? 1 : 0);
      }
      if (category) {
        query += ' AND category_id = ?';
        params.push(category);
      }
      if (search) {
        query += ' AND (brand LIKE ? OR model LIKE ? OR country LIKE ? OR description LIKE ?)';
        const like = `%${search}%`;
        params.push(like, like, like, like);
      }

      query += ' ORDER BY created_at DESC';
      const rows = db.prepare(query).all(...params);
      return rows.map((row) => mapProduct(row, mapImages(db, row.id)));
    },

    async getProduct(productId) {
      const row = readProductRow(db, productId);
      if (!row) {
        throw createHttpError(404, 'Товар не найден.');
      }
      return mapProduct(row, mapImages(db, row.id));
    },

    async getSharedProduct(identifier) {
      const row = readProductRow(db, identifier);
      if (!row || !row.is_active) {
        throw createHttpError(404, 'Карточка не опубликована.');
      }
      return mapProduct(row, mapImages(db, row.id));
    },

    async createProduct(payload) {
      const {
        categoryId,
        brand,
        model,
        country,
        priceLabel,
        priceMin,
        priceAvg,
        priceMax,
        description,
        specs,
        colors,
        upholstery,
        baseConfig,
        options,
        forUnits,
        dryer,
        cover,
        type,
        cylinders,
        dimensions,
        isActive,
      } = payload;

      if (!categoryId || !brand || !model || !country || !priceLabel || !description) {
        throw createHttpError(
          400,
          'Заполните обязательные поля: категория, бренд, модель, страна, цена, описание.',
        );
      }

      if (!findCategory(db, categoryId)) {
        throw createHttpError(400, 'Категория не найдена.');
      }

      const id = uuid();
      db.prepare(`
        INSERT INTO products (
          id, category_id, brand, model, country, price_label,
          price_min, price_avg, price_max, description, specs,
          colors, upholstery, base_config, options,
          for_units, dryer, cover, type, cylinders, dimensions, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        categoryId,
        brand,
        model,
        country,
        priceLabel,
        priceMin ?? null,
        priceAvg ?? null,
        priceMax ?? null,
        description,
        specs ?? null,
        colors ?? null,
        upholstery ?? null,
        baseConfig ?? null,
        options ?? null,
        forUnits ?? null,
        dryer ?? null,
        cover ?? null,
        type ?? null,
        cylinders ?? null,
        dimensions ?? null,
        isActive !== false ? 1 : 0,
      );

      const createdRow = readProductRow(db, id);
      return mapProduct(createdRow, []);
    },

    async updateProduct(productId, payload) {
      const existingRow = readProductRow(db, productId);
      if (!existingRow) {
        throw createHttpError(404, 'Товар не найден.');
      }

      const categoryId = payload.categoryId ?? existingRow.category_id;
      if (!findCategory(db, categoryId)) {
        throw createHttpError(400, 'Категория не найдена.');
      }

      db.prepare(`
        UPDATE products SET
          category_id = ?,
          brand = ?,
          model = ?,
          country = ?,
          price_label = ?,
          price_min = ?,
          price_avg = ?,
          price_max = ?,
          description = ?,
          specs = ?,
          colors = ?,
          upholstery = ?,
          base_config = ?,
          options = ?,
          for_units = ?,
          dryer = ?,
          cover = ?,
          type = ?,
          cylinders = ?,
          dimensions = ?,
          is_active = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        categoryId,
        payload.brand ?? existingRow.brand,
        payload.model ?? existingRow.model,
        payload.country ?? existingRow.country,
        payload.priceLabel ?? existingRow.price_label,
        payload.priceMin ?? null,
        payload.priceAvg ?? null,
        payload.priceMax ?? null,
        payload.description ?? existingRow.description,
        payload.specs ?? null,
        payload.colors ?? null,
        payload.upholstery ?? null,
        payload.baseConfig ?? null,
        payload.options ?? null,
        payload.forUnits ?? null,
        payload.dryer ?? null,
        payload.cover ?? null,
        payload.type ?? null,
        payload.cylinders ?? null,
        payload.dimensions ?? null,
        payload.isActive !== undefined ? (payload.isActive ? 1 : 0) : existingRow.is_active,
        productId,
      );

      const updatedRow = readProductRow(db, productId);
      return mapProduct(updatedRow, mapImages(db, productId));
    },

    async deleteProduct(productId) {
      const existingRow = readProductRow(db, productId);
      if (!existingRow) {
        throw createHttpError(404, 'Товар не найден.');
      }

      db.prepare('DELETE FROM products WHERE id = ?').run(productId);
      return { success: true, message: 'Товар удалён.' };
    },

    async submitInquiry(payload, meta = {}) {
      const { productId, type, clientName, clientPhone, message } = payload;
      if (!productId || !type) {
        throw createHttpError(400, 'Укажите productId и type.');
      }
      if (!['approve', 'question'].includes(type)) {
        throw createHttpError(400, 'type должен быть "approve" или "question".');
      }

      const product = readProductRow(db, productId);
      if (!product) {
        throw createHttpError(404, 'Товар не найден.');
      }

      return inquiryStore.createLocalProductInquiry({
        productId,
        type,
        clientName: clientName ?? null,
        clientPhone: clientPhone ?? null,
        message: message ?? null,
        ipAddress: meta.ipAddress ?? null,
      });
    },

    async listInquiries() {
      return inquiryStore.listAll();
    },
  };
}
