/**
 * server/index.js — Точка входа Express-сервера
 *
 * Архитектурные решения:
 * - Helmet задаёт безопасные HTTP-заголовки
 * - Rate-limiting защищает от brute-force на /api/auth
 * - CORS ограничен доменом из .env (в prod)
 * - Статика /uploads — только для изображений
 * - Graceful shutdown перехватывает SIGTERM/SIGINT
 * - process.send('ready') — сигнал PM2 wait_ready
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

// ─── Startup validation ────────────────────────────────────────────────────────
const WEAK_SECRETS = ['change_me_to_random_32_char_string', 'demo-secret-key-change-in-production', ''];
if (!process.env.JWT_SECRET || WEAK_SECRETS.includes(process.env.JWT_SECRET)) {
    if (!isDev) {
        console.error('❌ FATAL: JWT_SECRET не задан или небезопасен. Запуск в production невозможен.');
        process.exit(1);
    }
    console.warn('⚠️  JWT_SECRET небезопасен. Смените перед деплоем.');
}
if (!process.env.ADMIN_USERNAME) {
    console.error('❌ FATAL: ADMIN_USERNAME не задан в .env');
    process.exit(1);
}
if (!process.env.ADMIN_PASSWORD) {
    console.error('❌ FATAL: ADMIN_PASSWORD не задан в .env');
    process.exit(1);
}

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // для изображений
}));

// ─── CORS ──────────────────────────────────────────────────────────────────────
// Если CORS_ORIGIN не задан в production — API доступен только с того же домена
// (nginx проксирует /api/ на 127.0.0.1:3001, CORS не нужен)
const corsOrigin = process.env.CORS_ORIGIN ?? (isDev ? 'http://localhost:5173' : false);
app.use(cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Auth: строже — 5 попыток в минуту на IP
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: 'Слишком много попыток. Попробуйте через минуту.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Общий лимит: 120 запросов в минуту на IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);


// ─── Request logging ───────────────────────────────────────────────────────────
// В production: stdout → PM2 → /var/log/dental-catalog/out.log
// Логируем только ошибки (4xx/5xx) + все запросы в dev
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        const line = `${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${ms}ms`;
        if (res.statusCode >= 500) {
            console.error(line);
        } else if (isDev || res.statusCode >= 400) {
            console.log(line);
        }
    });
    next();
});

// ─── Статика: uploads ─────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d',
    immutable: false,
}));

// ─── API Маршруты ──────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api', productsRouter);

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
    console.error(`${new Date().toISOString()} ERROR:`, err.message, err.stack ?? '');
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `Файл слишком большой. Максимум ${process.env.MAX_FILE_SIZE_MB ?? 10}MB.` });
    }
    res.status(err.status ?? 500).json({ error: isDev ? err.message : 'Внутренняя ошибка сервера.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
    console.log(`${new Date().toISOString()} ✅ Dental Catalog API :${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
    console.log(`   Catalog: ${catalogProvider.provider} (${catalogProvider.source})`);
    if (isDev) console.log(`   API:     http://localhost:${PORT}/api/products`);

    // Сигнал PM2: процесс готов (нужен при wait_ready: true в ecosystem.config.js)
    process.send?.('ready');
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function gracefulShutdown(signal) {
    console.log(`${new Date().toISOString()} ${signal} — завершение сервера...`);
    server.close(() => {
        console.log(`${new Date().toISOString()} Сервер остановлен.`);
        process.exit(0);
    });
    setTimeout(() => {
        console.error(`${new Date().toISOString()} Принудительный выход.`);
        process.exit(1);
    }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
