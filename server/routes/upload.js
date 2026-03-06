/**
 * routes/upload.js — Загрузка изображений (без sharp, чистый multer)
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const router = Router();

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? '10');
const MAX_FILES = parseInt(process.env.MAX_FILES_PER_PRODUCT ?? '8');

// Сохраняем файлы напрямую на диск (без sharp)
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${uuid()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Допустимы только JPG, PNG, WebP, GIF'), false);
    },
});

// POST /api/upload/:productId
router.post('/:productId', requireAuth, upload.array('images', MAX_FILES), (req, res) => {
    const { productId } = req.params;

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ error: 'Товар не найден.' });

    const existing = db.prepare('SELECT COUNT(*) as c FROM product_images WHERE product_id = ?').get(productId);
    const isFirst = existing.c === 0;

    const savedImages = [];
    req.files.forEach((file, idx) => {
        const imageId = uuid();
        const lastOrder = db.prepare(
            'SELECT COALESCE(MAX(sort_order), -1) as m FROM product_images WHERE product_id = ?'
        ).get(productId).m;

        db.prepare(
            'INSERT INTO product_images (id, product_id, filename, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)'
        ).run(imageId, productId, file.filename, (isFirst && idx === 0) ? 1 : 0, lastOrder + 1);

        savedImages.push({ id: imageId, filename: file.filename, url: `/uploads/${file.filename}` });
    });

    res.status(201).json({ uploaded: savedImages.length, images: savedImages });
});

// DELETE /api/upload/:imageId
router.delete('/:imageId', requireAuth, (req, res) => {
    const row = db.prepare('SELECT * FROM product_images WHERE id = ?').get(req.params.imageId);
    if (!row) return res.status(404).json({ error: 'Изображение не найдено.' });

    const filePath = path.join(UPLOADS_DIR, row.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM product_images WHERE id = ?').run(row.id);

    if (row.is_primary) {
        const next = db.prepare(
            'SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order LIMIT 1'
        ).get(row.product_id);
        if (next) db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?').run(next.id);
    }

    res.json({ success: true });
});

// PUT /api/upload/:imageId/primary
router.put('/:imageId/primary', requireAuth, (req, res) => {
    const row = db.prepare('SELECT * FROM product_images WHERE id = ?').get(req.params.imageId);
    if (!row) return res.status(404).json({ error: 'Изображение не найдено.' });

    db.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').run(row.product_id);
    db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?').run(row.id);

    res.json({ success: true });
});

export default router;
