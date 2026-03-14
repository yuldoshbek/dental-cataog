/**
 * netlify/functions/api.js
 * Обычная Netlify Function (Node.js runtime).
 * Обрабатывает все /api/* запросы. In-memory хранилище с демо-данными.
 *
 * ВАЖНО: Использует process.env (не Netlify.env.get — это только для Edge Functions).
 */

import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { createBitrixCatalogRepository } from '../../catalog/bitrixCatalogRepository.js';
import { getCatalogProviderFromEnv } from '../../catalog/bitrixConfig.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'demo-secret-key-change-in-production';
const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'admin123';
const CATALOG_PROVIDER = getCatalogProviderFromEnv();

// ─── CORS headers ─────────────────────────────────────────────────────────────
const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// (сбрасывается при cold start — норма для демо-режима)
const store = {
    categories: [
        { id: 'units',       name: 'Установки',               icon_name: 'Stethoscope', sort_order: 1 },
        { id: 'compressors', name: 'Компрессоры',              icon_name: 'Wind',        sort_order: 2 },
        { id: 'autoclaves',  name: 'Автоклавы',                icon_name: 'Thermometer', sort_order: 3 },
        { id: 'physio',      name: 'Физиодиспенсеры',          icon_name: 'Activity',    sort_order: 4 },
        { id: 'scanners',    name: 'Интраоральные сканеры',    icon_name: 'ScanFace',    sort_order: 5 },
        { id: 'xray',        name: 'Рентгены портативные',     icon_name: 'Camera',      sort_order: 6 },
        { id: 'visiographs', name: 'Визиографы',               icon_name: 'Monitor',     sort_order: 7 },
        { id: 'handpieces',  name: 'Наконечники',              icon_name: 'Zap',         sort_order: 8 },
    ],

    summaries: [
        { id: 1, category_id: 'units',       country: 'Китай',    price_range: '150 000 – 800 000 ₽',       description: 'Бюджетный сегмент, быстрая окупаемость. Широкий выбор моделей.',     sort_order: 1 },
        { id: 2, category_id: 'units',       country: 'Россия',   price_range: '200 000 – 1 000 000 ₽',     description: 'Хорошая ремонтопригодность, доступные запчасти на складе.',         sort_order: 2 },
        { id: 3, category_id: 'units',       country: 'Италия',   price_range: '800 000 – 1 500 000 ₽',     description: 'Европейский дизайн, высокая надёжность. Популярен у частных клиник.', sort_order: 3 },
        { id: 4, category_id: 'units',       country: 'Германия', price_range: '1 500 000 – 3 500 000 ₽',   description: 'Премиум сегмент, максимальная эргономика и статус.',                 sort_order: 4 },
        { id: 5, category_id: 'compressors', country: 'Китай',    price_range: '30 000 – 120 000 ₽',        description: 'Бюджетные решения для 1–2 установок.',                              sort_order: 1 },
        { id: 6, category_id: 'compressors', country: 'Европа',   price_range: '150 000 – 400 000 ₽',       description: 'Европейское качество, тихая работа, долгий ресурс.',                sort_order: 2 },
        { id: 7, category_id: 'autoclaves',  country: 'Европа',   price_range: '150 000 – 600 000 ₽',       description: 'Класс B — стерилизация инструментов, наконечников, кассет.',        sort_order: 1 },
        { id: 8, category_id: 'physio',      country: 'Италия',   price_range: '80 000 – 250 000 ₽',        description: 'Имплантологические физиодиспенсеры с широким диапазоном оборотов.', sort_order: 1 },
        { id: 9, category_id: 'scanners',    country: 'Европа/США', price_range: '600 000 – 2 500 000 ₽',   description: 'Цифровой слепок вместо альгинатного. Точность 5–20 мкм.',           sort_order: 1 },
    ],

    products: [
        // ── Установки ────────────────────────────────────────────────────────
        {
            id: 'unit-1',
            category_id: 'units',
            brand: 'Ajax',
            model: 'AJ-15 Premium',
            country: 'Китай',
            price_label: '~ 350 000 – 450 000 ₽',
            price_min: 350000, price_avg: 400000, price_max: 450000,
            description: 'Надёжная «рабочая лошадка» бюджетного сегмента. Идеальна для клиник, открывающихся с нуля. Простота обслуживания, запчасти всегда в наличии.',
            specs: 'Давление воды: 2–5 бар. Давление воздуха: 5–7 бар. Напряжение: 220V/50Hz. Грузоподъёмность кресла: до 135 кг.',
            colors: 'Белый, Бежевый, Синий, Серый, Зелёный (более 12 цветов)',
            upholstery: 'Полиуретановая экокожа (стандарт) / натуральная кожа (доп.)',
            base_config: 'Кресло пациента, стул врача, LED-светильник, 3 шланга, плевательница из стекла',
            options: 'Фиброоптика на наконечники (+15 000 ₽), ультразвуковой скалер (+20 000 ₽), монитор 15" (+25 000 ₽)',
            for_units: null, dryer: null, cover: null, type: null, cylinders: null, dimensions: null,
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        {
            id: 'unit-2',
            category_id: 'units',
            brand: 'Stern Weber',
            model: 'S200 Trinity',
            country: 'Италия',
            price_label: '~ 1 200 000 – 1 500 000 ₽',
            price_min: 1200000, price_avg: 1350000, price_max: 1500000,
            description: 'Итальянская установка среднего+ класса. Встроенный скалер и фиброоптика в стандарте. Популярна в частных клиниках среднего и высокого сегмента.',
            specs: 'Скорость турбины: до 350 000 об/мин. LED-подсветка. Сенсорное управление. Сертификат CE.',
            colors: 'Белый, Антрацит, Слоновая кость',
            upholstery: 'Натуральная кожа (в стандарте)',
            base_config: 'Кресло с массажем, стул врача + ассистента, фиброоптика, встроенный скалер',
            options: 'Интраоральная камера (+35 000 ₽), монитор на кронштейне (+40 000 ₽)',
            for_units: null, dryer: null, cover: null, type: null, cylinders: null, dimensions: null,
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        {
            id: 'unit-3',
            category_id: 'units',
            brand: 'KaVo',
            model: 'Estetica E70 Vision',
            country: 'Германия',
            price_label: '~ 2 800 000 – 3 200 000 ₽',
            price_min: 2800000, price_avg: 3000000, price_max: 3200000,
            description: 'Флагман немецкого производства. Максимальная эргономика, интеграция с цифровым рабочим потоком, встроенный монитор, автоматическая дезинфекция. Статусный выбор для VIP-клиник.',
            specs: 'Touch-панель управления, встроенная камера, Bluetooth, Wi-Fi. Сертификат CE. Немецкая сборка.',
            colors: 'Белый, Антрацит',
            upholstery: 'Кожа премиум-класса с памятью формы',
            base_config: 'Полная комплектация: фиброоптика, скалер, монитор, камера, функция массажа',
            options: 'CEREC-интеграция (+350 000 ₽), интраоральный сканер (+400 000 ₽)',
            for_units: null, dryer: null, cover: null, type: null, cylinders: null, dimensions: null,
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // ── Компрессоры ───────────────────────────────────────────────────────
        {
            id: 'comp-1',
            category_id: 'compressors',
            brand: 'Durr Dental',
            model: 'Tornado 1',
            country: 'Германия',
            price_label: '~ 180 000 – 220 000 ₽',
            price_min: 180000, price_avg: 200000, price_max: 220000,
            description: 'Безмасляный компрессор немецкого производства. Тихая работа (55 dB), встроенный мембранный осушитель. Рекомендуется для 1–2 установок.',
            specs: 'Производительность: 100 л/мин. Рабочее давление: 8 бар. Объём ресивера: 45 л. Уровень шума: 55 dB.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: 'На 1–2 установки',
            type: 'Безмасляный поршневой',
            dryer: 'Встроенный мембранный осушитель',
            cover: 'Шумозащитный кожух (в комплекте)',
            cylinders: '2 цилиндра',
            dimensions: 'Вес: 47 кг. Габариты: 620×460×720 мм',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        {
            id: 'comp-2',
            category_id: 'compressors',
            brand: 'Ekom',
            model: 'DUO 2V/50',
            country: 'Чехия',
            price_label: '~ 90 000 – 120 000 ₽',
            price_min: 90000, price_avg: 105000, price_max: 120000,
            description: 'Чешский безмасляный компрессор. Хорошее соотношение цена/качество для 2–3 установок. Доступный сервис и запчасти в России.',
            specs: 'Производительность: 2×100 л/мин. Давление: 8 бар. Объём ресивера: 50 л.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: 'На 2–3 установки',
            type: 'Безмасляный',
            dryer: 'Без осушителя (рекомендуется докупить отдельно)',
            cover: 'Без кожуха',
            cylinders: '4 цилиндра',
            dimensions: 'Вес: 62 кг. Габариты: 700×480×800 мм',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // ── Автоклав ─────────────────────────────────────────────────────────
        {
            id: 'auto-1',
            category_id: 'autoclaves',
            brand: 'Euronda',
            model: 'E9 Next',
            country: 'Италия',
            price_label: '~ 220 000 – 280 000 ₽',
            price_min: 220000, price_avg: 250000, price_max: 280000,
            description: 'Итальянский паровой автоклав класса B. Стерилизует инструменты, наконечники, бормашины и пористые материалы. Встроенный принтер и SD-карта для документации.',
            specs: 'Объём камеры: 17 л. Рабочая температура: 121–134°C. Класс B (EN 13060). Встроенный принтер протоколов.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: null, cylinders: null,
            dimensions: 'Вес: 38 кг. Габариты: 530×440×380 мм',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // ── Физиодиспенсер ────────────────────────────────────────────────────
        {
            id: 'physio-1',
            category_id: 'physio',
            brand: 'W&H',
            model: 'Elcomed SA-310',
            country: 'Австрия',
            price_label: '~ 130 000 – 160 000 ₽',
            price_min: 130000, price_avg: 145000, price_max: 160000,
            description: 'Австрийский физиодиспенсер для имплантологии. Точный контроль крутящего момента и скорости, автоматический реверс. Интуитивное управление через педаль.',
            specs: 'Скорость: 150–40 000 об/мин. Крутящий момент: до 3,5 Нсм. Подсветка LED. Противоугонная педаль.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: null, cylinders: null,
            dimensions: 'Вес: 2,1 кг. Габариты блока: 220×170×115 мм',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // ── Интраоральный сканер ──────────────────────────────────────────────
        {
            id: 'scan-1',
            category_id: 'scanners',
            brand: 'Medit',
            model: 'i700',
            country: 'Южная Корея',
            price_label: '~ 900 000 – 1 100 000 ₽',
            price_min: 900000, price_avg: 1000000, price_max: 1100000,
            description: 'Один из лучших сканеров по соотношению цена/точность. Открытый формат STL, совместим с любым CAD/CAM-программным обеспечением. Быстрое сканирование — полная дуга за 60 сек.',
            specs: 'Точность: <7 мкм. Формат: STL, OBJ, PLY. USB-соединение. Вес наконечника: 330 г. Гарантия 3 года.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: null, cylinders: null,
            dimensions: 'Вес наконечника: 330 г. Длина: 310 мм',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // ── Рентген портативный ───────────────────────────────────────────────
        {
            id: 'xray-1',
            category_id: 'xray',
            brand: 'Vatech',
            model: 'EzRay Air W',
            country: 'Южная Корея',
            price_label: '~ 85 000 – 110 000 ₽',
            price_min: 85000, price_avg: 97000, price_max: 110000,
            description: 'Беспроводной портативный рентген. Аккумулятор на 200 снимков. Лёгкий (1,5 кг), удобен при работе в операционной или при выездах. DC-технология снижает дозу облучения.',
            specs: 'Напряжение: 60–70 кВ. Ток: 2 мА. Вес: 1,5 кг. Батарея: до 200 снимков. Стандарт: RoHS/CE/FDA.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: 'Беспроводной DC', cylinders: null,
            dimensions: 'Вес: 1,5 кг. Размер: 290×90×55 мм',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // ── Визиограф ─────────────────────────────────────────────────────────
        {
            id: 'visio-1',
            category_id: 'visiographs',
            brand: 'Dentsply Sirona',
            model: 'Schick 33',
            country: 'США',
            price_label: '~ 180 000 – 240 000 ₽',
            price_min: 180000, price_avg: 210000, price_max: 240000,
            description: 'Американский визиограф с максимальным разрешением сенсора. Тонкий и гибкий датчик, минимальный дискомфорт для пациента. Совместим со всеми рентгеновскими аппаратами.',
            specs: 'Сенсор: 1500×1000 пикс. Размер: 33×26 мм. Кабель: 2,7 м. Интерфейс: USB 2.0. Разрешение: 25 LP/mm.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: null, cylinders: null,
            dimensions: 'Размер датчика: 33×26 мм. Толщина: 5 мм',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // ── Наконечники ───────────────────────────────────────────────────────
        {
            id: 'hand-1',
            category_id: 'handpieces',
            brand: 'NSK',
            model: 'Ti-Max X600L',
            country: 'Япония',
            price_label: '~ 35 000 – 50 000 ₽',
            price_min: 35000, price_avg: 42000, price_max: 50000,
            description: 'Японская турбина с фиброоптикой. Высокая скорость, тихая работа, сбалансированный ротор. Широко применяется в имплантологии и ортопедии.',
            specs: 'Скорость: до 450 000 об/мин. Фиброоптика: 3 LED-точки. Патрон: Borden/Midwest. Давление воздуха: 2–3 кг/см².',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: 'Турбинный с фиброоптикой', cylinders: null,
            dimensions: 'Длина: 90 мм. Вес: 65 г',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
    ],

    inquiries: [],
};

const bitrixInquiries = [];
const bitrixCatalog = CATALOG_PROVIDER === 'bitrix'
    ? createBitrixCatalogRepository({
        inquiryStore: {
            createExternalInquiry({ product, type, clientName, clientPhone, message, ipAddress, source }) {
                const inquiry = {
                    id: uuidv4(),
                    product_id: product.id,
                    type,
                    client_name: clientName ?? null,
                    client_phone: clientPhone ?? null,
                    message: message ?? null,
                    ip_address: ipAddress ?? null,
                    created_at: new Date().toISOString(),
                    brand: product.brand ?? null,
                    model: product.model ?? null,
                    source,
                };
                bitrixInquiries.unshift(inquiry);
                return { success: true, id: inquiry.id };
            },
            listAll() {
                return [...bitrixInquiries, ...store.inquiries].slice(0, 200);
            },
        },
    })
    : null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function respond(data, statusCode = 200) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', ...CORS },
        body: JSON.stringify(data),
    };
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
        clientDescription: p.client_description ?? p.description,
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
        shareSlug: p.share_slug ?? p.id,
        publishWeb: p.publish_web ?? Boolean(p.is_active),
        publishShare: p.publish_share ?? Boolean(p.is_active),
        publishTelegram: p.publish_telegram ?? Boolean(p.is_active),
        status: p.status ?? (p.is_active ? 'published' : 'draft'),
        source: p.source ?? 'netlify-demo',
    };
}

function findLocalSharedProduct(identifier) {
    return store.products.find((product) => [
        product.id,
        product.share_slug,
        product.external_code,
    ].filter(Boolean).includes(identifier));
}

function verifyToken(event) {
    const auth = (event.headers.authorization ?? event.headers.Authorization ?? '');
    if (!auth.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(auth.slice(7), JWT_SECRET);
    } catch {
        return null;
    }
}

function requireAdmin(event) {
    const user = verifyToken(event);
    if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    return user;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event) => {
    const method = event.httpMethod.toUpperCase();

    // CORS preflight
    if (method === 'OPTIONS') {
        return { statusCode: 204, headers: CORS, body: '' };
    }

    // Путь: event.path = "/api/products" или "/.netlify/functions/api"
    // Нормализуем до части после /api/
    const rawPath = event.path ?? '';
    const path = rawPath.replace(/^\/(\.netlify\/functions\/api|api)\/?/, '');
    const segments = path.split('/').filter(Boolean);
    const qs = event.queryStringParameters ?? {};

    // Netlify Functions иногда кодируют тело в base64 (isBase64Encoded)
    let body = {};
    if (event.body) {
        try {
            const raw = event.isBase64Encoded
                ? Buffer.from(event.body, 'base64').toString('utf-8')
                : event.body;
            body = JSON.parse(raw);
        } catch { /* ignore */ }
    }

    try {
        // ── POST /api/auth/login ──────────────────────────────────────────────
        if (method === 'POST' && segments[0] === 'auth' && segments[1] === 'login') {
            const { username, password } = body;
            if (!username || !password || username !== ADMIN_USER || password !== ADMIN_PASS) {
                return respond({ error: 'Неверный логин или пароль.' }, 401);
            }
            const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
            return respond({ token, expiresIn: '8h' });
        }
        if (CATALOG_PROVIDER === 'bitrix') {
            const ipAddress = event.headers['x-forwarded-for'] ?? null;

            if (method === 'GET' && segments[0] === 'categories' && !segments[1]) {
                return respond(await bitrixCatalog.listCategories());
            }

            if (method === 'GET' && segments[0] === 'categories' && segments[2] === 'summary') {
                return respond(await bitrixCatalog.getCategorySummary(segments[1]));
            }

            if (method === 'GET' && segments[0] === 'products' && !segments[1]) {
                return respond(await bitrixCatalog.listProducts(qs));
            }

            if (method === 'GET' && segments[0] === 'products' && segments[1]) {
                return respond(await bitrixCatalog.getProduct(segments[1]));
            }

            if (method === 'GET' && segments[0] === 'share' && segments[1]) {
                return respond(await bitrixCatalog.getSharedProduct(segments[1]));
            }

            if (method === 'POST' && segments[0] === 'products' && !segments[1]) {
                requireAdmin(event);
                return respond(await bitrixCatalog.createProduct(body), 201);
            }

            if (method === 'PUT' && segments[0] === 'products' && segments[1]) {
                requireAdmin(event);
                return respond(await bitrixCatalog.updateProduct(segments[1], body));
            }

            if (method === 'DELETE' && segments[0] === 'products' && segments[1]) {
                requireAdmin(event);
                return respond(await bitrixCatalog.deleteProduct(segments[1]));
            }

            if (method === 'POST' && segments[0] === 'inquiries') {
                return respond(await bitrixCatalog.submitInquiry(body, { ipAddress }), 201);
            }

            if (method === 'GET' && segments[0] === 'inquiries') {
                requireAdmin(event);
                return respond(await bitrixCatalog.listInquiries());
            }

            if (!segments[0] || segments[0] === 'health') {
                return respond({ status: 'ok', mode: 'netlify', catalog: bitrixCatalog.getProviderInfo() });
            }

            return respond({ error: 'Маршрут не найден.' }, 404);
        }

        // ── GET /api/categories ───────────────────────────────────────────────
        if (method === 'GET' && segments[0] === 'categories' && !segments[1]) {
            return respond(store.categories);
        }

        // ── GET /api/categories/:id/summary ──────────────────────────────────
        if (method === 'GET' && segments[0] === 'categories' && segments[2] === 'summary') {
            const catId = segments[1];
            const rows = store.summaries
                .filter(s => s.category_id === catId)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(({ country, price_range, description }) => ({ country, range: price_range, desc: description }));
            return respond(rows);
        }

        // ── GET /api/products ─────────────────────────────────────────────────
        if (method === 'GET' && segments[0] === 'products' && !segments[1]) {
            let list = [...store.products];
            const active = qs.active ?? '1';
            const category = qs.category;
            const search = qs.search;

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
            return respond(list.map(mapProduct));
        }

        // ── GET /api/products/:id ─────────────────────────────────────────────
        if (method === 'GET' && segments[0] === 'products' && segments[1]) {
            const p = store.products.find(p => p.id === segments[1]);
            if (!p) return respond({ error: 'Товар не найден.' }, 404);
            return respond(mapProduct(p));
        }
        // -- GET /api/share/:slug ---------------------------------------
        if (method === 'GET' && segments[0] === 'share' && segments[1]) {
            const product = findLocalSharedProduct(segments[1]);
            if (!product || !product.is_active) {
                return respond({ error: 'Карточка не опубликована.' }, 404);
            }
            return respond(mapProduct(product));
        }

        // ── POST /api/products ────────────────────────────────────────────────
        if (method === 'POST' && segments[0] === 'products' && !segments[1]) {
            requireAdmin(event);
            if (!body.categoryId || !body.brand || !body.model || !body.country || !body.priceLabel || !body.description) {
                return respond({ error: 'Заполните обязательные поля (категория, бренд, модель, страна, цена, описание).' }, 400);
            }
            const newProduct = {
                id: uuidv4(),
                category_id: body.categoryId,
                brand: body.brand,
                model: body.model,
                country: body.country,
                price_label: body.priceLabel,
                price_min: body.priceMin ?? null,
                price_avg: body.priceAvg ?? null,
                price_max: body.priceMax ?? null,
                description: body.description,
                specs: body.specs ?? null,
                colors: body.colors ?? null,
                upholstery: body.upholstery ?? null,
                base_config: body.baseConfig ?? null,
                options: body.options ?? null,
                for_units: body.forUnits ?? null,
                dryer: body.dryer ?? null,
                cover: body.cover ?? null,
                type: body.type ?? null,
                cylinders: body.cylinders ?? null,
                dimensions: body.dimensions ?? null,
                is_active: body.isActive !== false ? 1 : 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                images: [],
            };
            store.products.push(newProduct);
            return respond(mapProduct(newProduct), 201);
        }

        // ── PUT /api/products/:id ─────────────────────────────────────────────
        if (method === 'PUT' && segments[0] === 'products' && segments[1]) {
            requireAdmin(event);
            const idx = store.products.findIndex(p => p.id === segments[1]);
            if (idx === -1) return respond({ error: 'Товар не найден.' }, 404);
            const p = store.products[idx];
            store.products[idx] = {
                ...p,
                category_id: body.categoryId ?? p.category_id,
                brand: body.brand ?? p.brand,
                model: body.model ?? p.model,
                country: body.country ?? p.country,
                price_label: body.priceLabel ?? p.price_label,
                price_min: body.priceMin !== undefined ? body.priceMin : p.price_min,
                price_avg: body.priceAvg !== undefined ? body.priceAvg : p.price_avg,
                price_max: body.priceMax !== undefined ? body.priceMax : p.price_max,
                description: body.description ?? p.description,
                specs: body.specs !== undefined ? body.specs : p.specs,
                colors: body.colors !== undefined ? body.colors : p.colors,
                upholstery: body.upholstery !== undefined ? body.upholstery : p.upholstery,
                base_config: body.baseConfig !== undefined ? body.baseConfig : p.base_config,
                options: body.options !== undefined ? body.options : p.options,
                for_units: body.forUnits !== undefined ? body.forUnits : p.for_units,
                dryer: body.dryer !== undefined ? body.dryer : p.dryer,
                cover: body.cover !== undefined ? body.cover : p.cover,
                type: body.type !== undefined ? body.type : p.type,
                cylinders: body.cylinders !== undefined ? body.cylinders : p.cylinders,
                dimensions: body.dimensions !== undefined ? body.dimensions : p.dimensions,
                is_active: body.isActive !== undefined ? (body.isActive ? 1 : 0) : p.is_active,
                updated_at: new Date().toISOString(),
            };
            return respond(mapProduct(store.products[idx]));
        }

        // ── DELETE /api/products/:id ──────────────────────────────────────────
        if (method === 'DELETE' && segments[0] === 'products' && segments[1]) {
            requireAdmin(event);
            const idx = store.products.findIndex(p => p.id === segments[1]);
            if (idx === -1) return respond({ error: 'Товар не найден.' }, 404);
            store.products.splice(idx, 1);
            return respond({ success: true });
        }

        // ── POST /api/inquiries ───────────────────────────────────────────────
        if (method === 'POST' && segments[0] === 'inquiries') {
            if (!body.productId || !body.type) {
                return respond({ error: 'Укажите productId и type.' }, 400);
            }
            const inq = {
                id: uuidv4(),
                product_id: body.productId,
                type: body.type,
                client_name: body.clientName ?? null,
                client_phone: body.clientPhone ?? null,
                message: body.message ?? null,
                created_at: new Date().toISOString(),
            };
            // Найдём товар для отображения в admin
            const prod = store.products.find(p => p.id === body.productId);
            if (prod) { inq.brand = prod.brand; inq.model = prod.model; }
            store.inquiries.unshift(inq);
            return respond({ success: true, id: inq.id }, 201);
        }

        // ── GET /api/inquiries ────────────────────────────────────────────────
        if (method === 'GET' && segments[0] === 'inquiries') {
            requireAdmin(event);
            return respond(store.inquiries.slice(0, 200));
        }

        // ── Health ────────────────────────────────────────────────────────────
        if (!segments[0] || segments[0] === 'health') {
            return respond({ status: 'ok', mode: 'netlify-demo', products: store.products.length, catalog: { provider: 'local', source: 'netlify-demo', readOnly: false } });
        }

        return respond({ error: 'Маршрут не найден.' }, 404);

    } catch (err) {
        if (err.status === 401) return respond({ error: 'Требуется авторизация.' }, 401);
        console.error('[api]', err.message);
        return respond({ error: 'Внутренняя ошибка сервера.' }, 500);
    }
};

