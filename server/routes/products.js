/**
 * routes/products.js — CRUD API для оборудования
 *
 * Публичные:
 *   GET  /api/products              — список (с фильтрами)
 *   GET  /api/products/:id          — один товар
 *   GET  /api/categories            — все категории
 *   GET  /api/categories/:id/summary — шпаргалка по стране
 *
 * Admin-only (требует Bearer JWT):
 *   POST   /api/products             — создать
 *   PUT    /api/products/:id         — обновить
 *   DELETE /api/products/:id         — удалить
 *   POST   /api/inquiries            — сохранить запрос клиента
 */

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Возвращает изображения для продукта (first = primary) */
function getImages(productId) {
    return db.prepare(
        'SELECT id, filename, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC'
    ).all(productId);
}

/** Маппинг row → объект для клиента */
function mapProduct(row, images = []) {
    return {
        id: row.id,
        categoryId: row.category_id,
        brand: row.brand,
        model: row.model,
        country: row.country,
        price: row.price_label,
        priceGradation: (row.price_min || row.price_avg || row.price_max)
            ? { min: row.price_min, avg: row.price_avg, max: row.price_max }
            : null,
        description: row.description,
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
    };
}

// ─── Публичные маршруты ──────────────────────────────────────────────────────

/** GET /api/categories */
router.get('/categories', (_req, res) => {
    const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
    res.json(rows);
});

/** GET /api/categories/:id/summary */
router.get('/categories/:id/summary', (req, res) => {
    const rows = db.prepare(
        'SELECT country, price_range, description FROM category_summaries WHERE category_id = ? ORDER BY sort_order'
    ).all(req.params.id);
    res.json(rows);
});

/** GET /api/products?category=&search=&active= */
router.get('/products', (req, res) => {
    const { category, search, active = '1' } = req.query;
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
        query += ' AND (brand LIKE ? OR model LIKE ? OR country LIKE ?)';
        const like = `%${search}%`;
        params.push(like, like, like);
    }

    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params);
    const products = rows.map(r => mapProduct(r, getImages(r.id)));
    res.json(products);
});

/** GET /api/products/:id */
router.get('/products/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Товар не найден.' });
    res.json(mapProduct(row, getImages(row.id)));
});

// ─── Admin-only маршруты ─────────────────────────────────────────────────────

/** POST /api/products */
router.post('/products', requireAuth, (req, res) => {
    const {
        categoryId, brand, model, country, priceLabel,
        priceMin, priceAvg, priceMax, description, specs,
        colors, upholstery, baseConfig, options,
        forUnits, dryer, cover, type, cylinders, dimensions, isActive
    } = req.body;

    if (!categoryId || !brand || !model || !country || !priceLabel || !description) {
        return res.status(400).json({ error: 'Заполните обязательные поля: категория, бренд, модель, страна, цена, описание.' });
    }

    // Проверяем что категория существует
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!cat) return res.status(400).json({ error: 'Категория не найдена.' });

    const id = uuid();
    db.prepare(`
    INSERT INTO products (
      id, category_id, brand, model, country, price_label,
      price_min, price_avg, price_max, description, specs,
      colors, upholstery, base_config, options,
      for_units, dryer, cover, type, cylinders, dimensions, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id, categoryId, brand, model, country, priceLabel,
        priceMin ?? null, priceAvg ?? null, priceMax ?? null,
        description, specs ?? null, colors ?? null,
        upholstery ?? null, baseConfig ?? null, options ?? null,
        forUnits ?? null, dryer ?? null, cover ?? null,
        type ?? null, cylinders ?? null, dimensions ?? null,
        isActive !== false ? 1 : 0
    );

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json(mapProduct(newProduct, []));
});

/** PUT /api/products/:id */
router.put('/products/:id', requireAuth, (req, res) => {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Товар не найден.' });

    const {
        categoryId, brand, model, country, priceLabel,
        priceMin, priceAvg, priceMax, description, specs,
        colors, upholstery, baseConfig, options,
        forUnits, dryer, cover, type, cylinders, dimensions, isActive
    } = req.body;

    db.prepare(`
    UPDATE products SET
      category_id = COALESCE(?, category_id),
      brand       = COALESCE(?, brand),
      model       = COALESCE(?, model),
      country     = COALESCE(?, country),
      price_label = COALESCE(?, price_label),
      price_min   = ?,
      price_avg   = ?,
      price_max   = ?,
      description = COALESCE(?, description),
      specs       = ?,
      colors      = ?,
      upholstery  = ?,
      base_config = ?,
      options     = ?,
      for_units   = ?,
      dryer       = ?,
      cover       = ?,
      type        = ?,
      cylinders   = ?,
      dimensions  = ?,
      is_active   = COALESCE(?, is_active),
      updated_at  = datetime('now')
    WHERE id = ?
  `).run(
        categoryId ?? null, brand ?? null, model ?? null,
        country ?? null, priceLabel ?? null,
        priceMin ?? null, priceAvg ?? null, priceMax ?? null,
        description ?? null, specs ?? null, colors ?? null,
        upholstery ?? null, baseConfig ?? null, options ?? null,
        forUnits ?? null, dryer ?? null, cover ?? null,
        type ?? null, cylinders ?? null, dimensions ?? null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(mapProduct(updated, getImages(updated.id)));
});

/** DELETE /api/products/:id */
router.delete('/products/:id', requireAuth, (req, res) => {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Товар не найден.' });

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Товар удалён.' });
});

/** POST /api/inquiries — сохранение запроса от клиента */
router.post('/inquiries', (req, res) => {
    const { productId, type, clientName, clientPhone, message } = req.body;

    if (!productId || !type) {
        return res.status(400).json({ error: 'Укажите productId и type.' });
    }
    if (!['approve', 'question'].includes(type)) {
        return res.status(400).json({ error: 'type должен быть "approve" или "question".' });
    }

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ error: 'Товар не найден.' });

    const id = uuid();
    db.prepare(`
    INSERT INTO client_inquiries (id, product_id, type, client_name, client_phone, message, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, productId, type, clientName ?? null, clientPhone ?? null, message ?? null, req.ip);

    res.status(201).json({ success: true, id });
});

/** GET /api/inquiries — для admin */
router.get('/inquiries', requireAuth, (req, res) => {
    const rows = db.prepare(`
    SELECT ci.*, p.brand, p.model FROM client_inquiries ci
    LEFT JOIN products p ON ci.product_id = p.id
    ORDER BY ci.created_at DESC
    LIMIT 200
  `).all();
    res.json(rows);
});

export default router;
