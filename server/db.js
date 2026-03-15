/**
 * db.js — SQLite через встроенный node:sqlite (Node.js v22.5+)
 * Нет внешних зависимостей, нет компиляции.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'dental.db');

const db = new DatabaseSync(DB_PATH);

// WAL-режим для производительности
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// ─── Схема ─────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    brand       TEXT NOT NULL,
    model       TEXT NOT NULL,
    country     TEXT NOT NULL,
    price_label TEXT NOT NULL,
    price_min   REAL,
    price_avg   REAL,
    price_max   REAL,
    description TEXT NOT NULL,
    specs       TEXT,
    colors      TEXT,
    upholstery  TEXT,
    base_config TEXT,
    options     TEXT,
    for_units   TEXT,
    dryer       TEXT,
    cover       TEXT,
    type        TEXT,
    cylinders   TEXT,
    dimensions  TEXT,
    is_active   INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id         TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    filename   TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS category_summaries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    country     TEXT NOT NULL,
    price_range TEXT NOT NULL,
    description TEXT,
    sort_order  INTEGER DEFAULT 0
  );

  -- Индексы для быстрой фильтрации и JOIN
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
  CREATE INDEX IF NOT EXISTS idx_images_product    ON product_images(product_id);
  CREATE INDEX IF NOT EXISTS idx_summaries_cat     ON category_summaries(category_id);
  CREATE INDEX IF NOT EXISTS idx_inquiries_product ON client_inquiries(product_id);

  CREATE TABLE IF NOT EXISTS client_inquiries (
    id           TEXT PRIMARY KEY,
    product_id   TEXT NOT NULL REFERENCES products(id),
    type         TEXT NOT NULL,
    client_name  TEXT,
    client_phone TEXT,
    message      TEXT,
    ip_address   TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS external_inquiries (
    id           TEXT PRIMARY KEY,
    source       TEXT NOT NULL DEFAULT 'bitrix',
    product_id   TEXT,
    share_slug   TEXT,
    external_code TEXT,
    brand        TEXT,
    model        TEXT,
    type         TEXT NOT NULL,
    client_name  TEXT,
    client_phone TEXT,
    message      TEXT,
    ip_address   TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Seed начальных данных ─────────────────────────────────────────────────
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get();

if (catCount.c === 0) {
  console.log('🌱 Заполнение начальных данных...');

  const insertCategory = db.prepare(
    'INSERT INTO categories (id, name, icon_name, sort_order) VALUES (?, ?, ?, ?)'
  );
  const insertSummary = db.prepare(
    'INSERT INTO category_summaries (category_id, country, price_range, description, sort_order) VALUES (?, ?, ?, ?, ?)'
  );

  const categories = [
    ['units', 'Установки', 'Stethoscope', 1],
    ['compressors', 'Компрессоры', 'Wind', 2],
    ['autoclaves', 'Автоклавы', 'Thermometer', 3],
    ['physio', 'Физиодиспенсеры', 'Activity', 4],
    ['scanners', 'Интраоральные сканеры', 'ScanFace', 5],
    ['xray', 'Рентгены портативные', 'Camera', 6],
    ['visiographs', 'Визиографы', 'Monitor', 7],
    ['handpieces', 'Наконечники', 'Zap', 8],
  ];
  categories.forEach(row => insertCategory.run(...row));

  const unitsSummaries = [
    ['units', 'Китай', '150 000 – 800 000 ₽', 'Бюджетный сегмент, быстрая окупаемость.', 1],
    ['units', 'Россия', '200 000 – 1 000 000 ₽', 'Хорошая ремонтопригодность, доступные запчасти.', 2],
    ['units', 'Италия', '800 000 – 1 500 000 ₽', 'Европейский дизайн, высокая надежность.', 3],
    ['units', 'Германия', '1 500 000 – 3 500 000 ₽', 'Премиум сегмент, максимальная эргономика и статус.', 4],
  ];
  unitsSummaries.forEach(row => insertSummary.run(...row));

  console.log('✅ Начальные данные добавлены.');
}

export default db;
