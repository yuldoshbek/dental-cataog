/**
 * netlify/functions/api.js
 * Единый Netlify Function, обрабатывающий все /api/* запросы.
 * In-memory хранилище с seed-данными для демо-режима.
 * (Данные сбрасываются при cold-start контейнера — это нормально для демо)
 */

import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ─── JWT Secret (в Netlify Variables) ────────────────────────────────────────
const JWT_SECRET = Netlify.env.get('JWT_SECRET') ?? 'demo-secret-key-for-preview';
const ADMIN_USER = Netlify.env.get('ADMIN_USERNAME') ?? 'admin';
const ADMIN_PASS = Netlify.env.get('ADMIN_PASSWORD') ?? 'admin123';

// ─── In-Memory Store ─────────────────────────────────────────────────────────
const store = {
    categories: [
        { id: 'units', name: 'Установки', icon_name: 'Stethoscope', sort_order: 1 },
        { id: 'compressors', name: 'Компрессоры', icon_name: 'Wind', sort_order: 2 },
        { id: 'autoclaves', name: 'Автоклавы', icon_name: 'Thermometer', sort_order: 3 },
        { id: 'physio', name: 'Физиодиспенсеры', icon_name: 'Activity', sort_order: 4 },
        { id: 'scanners', name: 'Интраоральные сканеры', icon_name: 'ScanFace', sort_order: 5 },
        { id: 'xray', name: 'Рентгены портативные', icon_name: 'Camera', sort_order: 6 },
        { id: 'visiographs', name: 'Визиографы', icon_name: 'Monitor', sort_order: 7 },
        { id: 'handpieces', name: 'Наконечники', icon_name: 'Zap', sort_order: 8 },
    ],

    summaries: [
        { id: 1, category_id: 'units', country: 'Китай', price_range: '150 000 – 800 000 ₽', description: 'Бюджетный сегмент, быстрая окупаемость.', sort_order: 1 },
        { id: 2, category_id: 'units', country: 'Россия', price_range: '200 000 – 1 000 000 ₽', description: 'Хорошая ремонтопригодность, доступные запчасти.', sort_order: 2 },
        { id: 3, category_id: 'units', country: 'Италия', price_range: '800 000 – 1 500 000 ₽', description: 'Европейский дизайн, высокая надёжность.', sort_order: 3 },
        { id: 4, category_id: 'units', country: 'Германия', price_range: '1 500 000 – 3 500 000 ₽', description: 'Премиум сегмент, максимальная эргономика и статус.', sort_order: 4 },
        { id: 5, category_id: 'compressors', country: 'Китай', price_range: '30 000 – 120 000 ₽', description: 'Бюджетные решения для 1-2 установок.', sort_order: 1 },
        { id: 6, category_id: 'compressors', country: 'Европа', price_range: '150 000 – 400 000 ₽', description: 'Европейское качество, тихая работа.', sort_order: 2 },
    ],

    // Демо-продукты
    products: [
        {
            id: 'demo-unit-1',
            category_id: 'units',
            brand: 'Ajax',
            model: 'AJ-15 Premium',
            country: 'Китай',
            price_label: '~ 350 000 – 450 000 ₽',
            price_min: 350000, price_avg: 400000, price_max: 450000,
            description: 'Надёжная стоматологическая установка бюджетного сегмента. Отличный выбор для клиник, открывающихся с нуля. Простота обслуживания, доступные запчасти.',
            specs: 'Давление воды: 2-5 бар. Давление воздуха: 5-7 бар. Напряжение: 220V.',
            colors: 'Белый, Бежевый, Синий, Серый (более 12 цветов)',
            upholstery: 'Полиуретановая экокожа — стандарт / натуральная кожа — за доп. плату',
            base_config: 'Кресло пациента, стул врача, LED-светильник, три шланга, плевательница',
            options: 'Фиброоптика на наконечники (+15 000 ₽), скалер (+20 000 ₽), монитор (+25 000 ₽)',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z',
            images: [],
        },
        {
            id: 'demo-unit-2',
            category_id: 'units',
            brand: 'Stern Weber',
            model: 'S200 Trinity',
            country: 'Италия',
            price_label: '~ 1 200 000 – 1 500 000 ₽',
            price_min: 1200000, price_avg: 1350000, price_max: 1500000,
            description: 'Итальянская установка среднего+ класса. Эргономичная конструкция, встроенный скалер, фиброоптика в стандарте. Популярна в частных клиниках среднего и высокого ценового сегмента.',
            specs: 'Скорость турбины: до 350 000 об/мин. Подсветка LED. Сенсорное управление.',
            colors: 'Белый, Антрацит, Слоновая кость',
            upholstery: 'Натуральная кожа (в стандарте)',
            base_config: 'Кресло с массажем, стул врача + ассистента, фиброоптика, скалер встроенный',
            options: 'Интраоральная камера (+35 000 ₽), монитор на кронштейне (+40 000 ₽)',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z',
            images: [],
        },
        {
            id: 'demo-unit-3',
            category_id: 'units',
            brand: 'KaVo',
            model: 'Estetica E70 Vision',
            country: 'Германия',
            price_label: '~ 2 800 000 – 3 200 000 ₽',
            price_min: 2800000, price_avg: 3000000, price_max: 3200000,
            description: 'Флагман немецкого производства. Максимальная эргономика, интеграция с цифровым рабочим потоком, встроенный монитор, автоматическая дезинфекция. Статусный выбор для VIP-клиник.',
            specs: 'Touch-панель управления, встроенная камера, Bluetooth, Wi-Fi. Сертификат CE.',
            colors: 'Белый, Антрацит (2 варианта)',
            upholstery: 'Кожа премиум класса с памятью формы',
            base_config: 'Полная комплектация: фиброоптика, скалер, монитор, камера, массаж',
            options: 'CEREC интеграция, 3D-сенсор, интраоральный сканер',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z',
            images: [],
        },
        {
            id: 'demo-comp-1',
            category_id: 'compressors',
            brand: 'Durr Dental',
            model: 'Tornado 1',
            country: 'Германия',
            price_label: '~ 180 000 – 220 000 ₽',
            price_min: 180000, price_avg: 200000, price_max: 220000,
            description: 'Безмасляный компрессор немецкого производства. Тихая работа (55 dB), встроенный осушитель-мембрана. Рекомендуется для 1-2 установок.',
            specs: 'Производительность: 100 л/мин. Давление: 8 бар. Объём ресивера: 45 л.',
            for_units: 'На 1-2 установки',
            type: 'Безмасляный поршневой',
            dryer: 'Встроенный мембранный осушитель',
            cover: 'Шумозащитный кожух (в комплекте)',
            cylinders: '2 цилиндра',
            dimensions: 'Вес: 47 кг. Габариты: 620×460×720 мм',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z',
            images: [],
        },
        {
            id: 'demo-comp-2',
            category_id: 'compressors',
            brand: 'Ekom',
            model: 'DUO 2V/50',
            country: 'Чехия',
            price_label: '~ 90 000 – 120 000 ₽',
            price_min: 90000, price_avg: 105000, price_max: 120000,
            description: 'Чешский безмасляный компрессор. Хороший выбор по соотношению цена/качество для 2-3 установок. Доступный сервис и запчасти.',
            specs: 'Производительность: 2×100 л/мин. Давление: 8 бар. Объём ресивера: 50 л.',
            for_units: 'На 2-3 установки',
            type: 'Безмасляный',
            dryer: 'Без осушителя (рекомендуется докупить)',
            cover: 'Без кожуха',
            cylinders: '4 цилиндра',
            dimensions: 'Вес: 62 кг. Габариты: 700×480×800 мм',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z',
            images: [],
        },
    ],

    inquiries: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function mapProduct(p) {
    return {
        id: p.id,
        categoryId: p.category_id,
        brand: p.brand,
        model: p.model,
        country: p.country,
        price: p.price_label,
        priceGradation: (p.price_min || p.price_avg || p.price_max)
            ? { min: p.price_min, avg: p.price_avg, max: p.price_max }
            : null,
        description: p.description,
        specs: p.specs ?? null,
        colors: p.colors ?? null,
        upholstery: p.upholstery ?? null,
        baseConfig: p.base_config ?? null,
        options: p.options ?? null,
        forUnits: p.for_units ?? null,
        dryer: p.dryer ?? null,
        cover: p.cover ?? null,
        type: p.type ?? null,
        cylinders: p.cylinders ?? null,
        dimensions: p.dimensions ?? null,
        isActive: Boolean(p.is_active),
        images: p.images ?? [],
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    };
}

function verifyToken(req) {
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(auth.slice(7), JWT_SECRET);
    } catch {
        return null;
    }
}

function requireAdmin(req) {
    const user = verifyToken(req);
    if (!user) throw new Error('401');
    return user;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default async (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname;  // e.g. /api/products
    const method = req.method.toUpperCase();

    // Убираем /api/ префикс
    const path = pathname.replace(/^\/api\/?/, '') || '';
    const segments = path.split('/').filter(Boolean);

    try {
        // ── POST /api/auth/login ──────────────────────────────────────────────────
        if (method === 'POST' && segments[0] === 'auth' && segments[1] === 'login') {
            const body = await req.json();
            const { username, password } = body;
            if (username !== ADMIN_USER || password !== ADMIN_PASS) {
                return json({ error: 'Неверный логин или пароль.' }, 401);
            }
            const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
            return json({ token, expiresIn: '8h' });
        }

        // ── GET /api/categories ───────────────────────────────────────────────────
        if (method === 'GET' && segments[0] === 'categories' && !segments[1]) {
            return json(store.categories);
        }

        // ── GET /api/categories/:id/summary ──────────────────────────────────────
        if (method === 'GET' && segments[0] === 'categories' && segments[2] === 'summary') {
            const catId = segments[1];
            const rows = store.summaries.filter(s => s.category_id === catId)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(({ country, price_range, description }) => ({ country, price_range, description }));
            return json(rows);
        }

        // ── GET /api/products ─────────────────────────────────────────────────────
        if (method === 'GET' && segments[0] === 'products' && !segments[1]) {
            let list = [...store.products];
            const active = url.searchParams.get('active') ?? '1';
            const category = url.searchParams.get('category');
            const search = url.searchParams.get('search');

            if (active !== 'all') list = list.filter(p => p.is_active === (active === '1' ? 1 : 0));
            if (category) list = list.filter(p => p.category_id === category);
            if (search) {
                const s = search.toLowerCase();
                list = list.filter(p =>
                    p.brand.toLowerCase().includes(s) ||
                    p.model.toLowerCase().includes(s) ||
                    p.country.toLowerCase().includes(s)
                );
            }
            return json(list.map(mapProduct));
        }

        // ── GET /api/products/:id ─────────────────────────────────────────────────
        if (method === 'GET' && segments[0] === 'products' && segments[1]) {
            const p = store.products.find(p => p.id === segments[1]);
            if (!p) return json({ error: 'Товар не найден.' }, 404);
            return json(mapProduct(p));
        }

        // ── POST /api/products ────────────────────────────────────────────────────
        if (method === 'POST' && segments[0] === 'products' && !segments[1]) {
            requireAdmin(req);
            const data = await req.json();
            if (!data.categoryId || !data.brand || !data.model || !data.country || !data.priceLabel || !data.description) {
                return json({ error: 'Заполните обязательные поля.' }, 400);
            }
            const newProduct = {
                id: uuidv4(),
                category_id: data.categoryId,
                brand: data.brand,
                model: data.model,
                country: data.country,
                price_label: data.priceLabel,
                price_min: data.priceMin ?? null,
                price_avg: data.priceAvg ?? null,
                price_max: data.priceMax ?? null,
                description: data.description,
                specs: data.specs ?? null,
                colors: data.colors ?? null,
                upholstery: data.upholstery ?? null,
                base_config: data.baseConfig ?? null,
                options: data.options ?? null,
                for_units: data.forUnits ?? null,
                dryer: data.dryer ?? null,
                cover: data.cover ?? null,
                type: data.type ?? null,
                cylinders: data.cylinders ?? null,
                dimensions: data.dimensions ?? null,
                is_active: data.isActive !== false ? 1 : 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                images: [],
            };
            store.products.push(newProduct);
            return json(mapProduct(newProduct), 201);
        }

        // ── PUT /api/products/:id ─────────────────────────────────────────────────
        if (method === 'PUT' && segments[0] === 'products' && segments[1]) {
            requireAdmin(req);
            const idx = store.products.findIndex(p => p.id === segments[1]);
            if (idx === -1) return json({ error: 'Товар не найден.' }, 404);
            const data = await req.json();
            const p = store.products[idx];
            store.products[idx] = {
                ...p,
                category_id: data.categoryId ?? p.category_id,
                brand: data.brand ?? p.brand,
                model: data.model ?? p.model,
                country: data.country ?? p.country,
                price_label: data.priceLabel ?? p.price_label,
                price_min: data.priceMin !== undefined ? data.priceMin : p.price_min,
                price_avg: data.priceAvg !== undefined ? data.priceAvg : p.price_avg,
                price_max: data.priceMax !== undefined ? data.priceMax : p.price_max,
                description: data.description ?? p.description,
                specs: data.specs !== undefined ? data.specs : p.specs,
                colors: data.colors !== undefined ? data.colors : p.colors,
                upholstery: data.upholstery !== undefined ? data.upholstery : p.upholstery,
                base_config: data.baseConfig !== undefined ? data.baseConfig : p.base_config,
                options: data.options !== undefined ? data.options : p.options,
                for_units: data.forUnits !== undefined ? data.forUnits : p.for_units,
                dryer: data.dryer !== undefined ? data.dryer : p.dryer,
                cover: data.cover !== undefined ? data.cover : p.cover,
                type: data.type !== undefined ? data.type : p.type,
                cylinders: data.cylinders !== undefined ? data.cylinders : p.cylinders,
                dimensions: data.dimensions !== undefined ? data.dimensions : p.dimensions,
                is_active: data.isActive !== undefined ? (data.isActive ? 1 : 0) : p.is_active,
                updated_at: new Date().toISOString(),
            };
            return json(mapProduct(store.products[idx]));
        }

        // ── DELETE /api/products/:id ──────────────────────────────────────────────
        if (method === 'DELETE' && segments[0] === 'products' && segments[1]) {
            requireAdmin(req);
            const idx = store.products.findIndex(p => p.id === segments[1]);
            if (idx === -1) return json({ error: 'Товар не найден.' }, 404);
            store.products.splice(idx, 1);
            return json({ success: true });
        }

        // ── POST /api/inquiries ───────────────────────────────────────────────────
        if (method === 'POST' && segments[0] === 'inquiries') {
            const data = await req.json();
            if (!data.productId || !data.type) return json({ error: 'Укажите productId и type.' }, 400);
            const inq = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
            store.inquiries.push(inq);
            return json({ success: true, id: inq.id }, 201);
        }

        // ── GET /api/inquiries ────────────────────────────────────────────────────
        if (method === 'GET' && segments[0] === 'inquiries') {
            requireAdmin(req);
            return json(store.inquiries.slice(-200).reverse());
        }

        // ── Health check ──────────────────────────────────────────────────────────
        if (path === 'health' || path === '') {
            return json({ status: 'ok', mode: 'demo', products: store.products.length });
        }

        return json({ error: 'Маршрут не найден.' }, 404);

    } catch (err) {
        if (err.message === '401') return json({ error: 'Требуется авторизация.' }, 401);
        console.error(err);
        return json({ error: 'Внутренняя ошибка сервера.' }, 500);
    }
};

export const config = {
    path: ['/api/*'],
};
