/**
 * server/index.js — Точка входа Express-сервера
 *
 * Архитектурные решения:
 * - Helmet задаёт безопасные HTTP-заголовки
 * - Rate-limiting защищает от brute-force на /api/auth
 * - CORS ограничен доменом из .env (в prod)
 * - Статика /uploads — только для изображений
 * - Graceful shutdown перехватывает SIGTERM/SIGINT
 */

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import productsRouter from './routes/products.js';
import uploadRouter from './routes/upload.js';
import authRouter from './routes/auth.js';
import { getCatalogProviderInfo } from './catalog/index.js';

// Импорт db (инициализирует схему и seed при первом запуске)
import './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3001;
const isDev = process.env.NODE_ENV !== 'production';
const catalogProvider = getCatalogProviderInfo();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // для изображений
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN ?? (isDev ? 'http://localhost:5173' : false);
app.use(cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// На auth — строже (5 попыток в минуту)
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: 'Слишком много попыток. Попробуйте через минуту.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Общий лимит (120 запросов в минуту на IP)
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// ─── Request logging (только dev) ────────────────────────────────────────────
if (isDev) {
    app.use((req, _res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

// ─── Статика: uploads ────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d',
    immutable: false,
}));

// ─── API Маршруты ─────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api', productsRouter);
app.use('/api/upload', uploadRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        env: process.env.NODE_ENV,
        ts: new Date().toISOString(),
        catalog: catalogProvider,
    });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Маршрут не найден.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('❌ Необработанная ошибка:', err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `Файл слишком большой. Максимум ${process.env.MAX_FILE_SIZE_MB ?? 10}MB.` });
    }
    res.status(500).json({ error: isDev ? err.message : 'Внутренняя ошибка сервера.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
    console.log(`✅ Dental Catalog API запущен на порту ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
    console.log(`   Uploads: ${path.join(__dirname, 'uploads')}`);
    console.log(`   Catalog: ${catalogProvider.provider} (${catalogProvider.source})`);
    if (isDev) console.log(`   API:     http://localhost:${PORT}/api/products`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function gracefulShutdown(signal) {
    console.log(`\n${signal} получен. Завершение сервера...`);
    server.close(() => {
        console.log('Сервер остановлен. До свидания!');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('Принудительный выход.');
        process.exit(1);
    }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
