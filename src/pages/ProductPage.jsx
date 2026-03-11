/**
 * src/pages/ProductPage.jsx
 *
 * ★ ЭТАЛОННЫЙ ШАБЛОН карточки товара ★
 * На основе этого компонента создаются все остальные карточки.
 *
 * Сейчас данные захардкожены (Shining 3D Aoralscan 3 Wireless).
 * После подключения Bitrix: заменить DEMO_PRODUCT на fetch из API.
 *
 * Маршрут: /product/:slug
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Copy, Check, ChevronLeft, ChevronRight,
    CheckCircle2, Package, Zap, MessageCircle, Send,
    ExternalLink, Monitor, Share2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ЭТАЛОННЫЕ ДАННЫЕ — Shining 3D Aoralscan 3 Wireless
// Источник: Сканеры.docx (11.03.2026)
// В продакшене заменить на: const product = await api.get(`/api/products/${slug}`)
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_PRODUCT = {
    id: 'scanner-aoralscan3w',
    slug: 'shining3d-aoralscan3-wireless',

    category: { id: 'scanners', name: 'Интраоральные сканеры' },
    brand: 'Shining 3D',
    model: 'Aoralscan 3 Wireless',
    country: 'Китай',
    flag: '🇨🇳',

    short_description:
        'Инновационный беспроводной интраоральный сканер для создания высококачественных трёхмерных моделей. Точность 6.9 мкм, AI-сканирование, беспроводное подключение Wi-Fi 6.',

    full_description: [
        'Aoralscan 3 Wireless – инновационный беспроводной интраоральный сканер, предназначенный для создания высококачественных трёхмерных моделей. Обладает большим спектром интеллектуальных функций, обеспечивая эффективную и комфортную работу.',
        'Беспроводная конструкция создаёт идеальные условия в работе врача, позволяя свободно перемещаться вокруг пациента без ограничения проводом. Высокая точность и скорость сканирования — показатели улучшены на 30% по сравнению со сканерами прошлого поколения.',
        'Функция AI сканирования автоматически улучшает качество данных и отфильтровывает ненужное, позволяя увеличить скорость работы. Сканирование в режиме реального времени делает процесс эффективнее — пользователь сразу оценивает качество и при необходимости возвращается к непросканированным участкам.',
        'Дизайн временной коронки и IBT: сканер позволяет разрабатывать и печатать временные коронки не отходя от кресла, а также моделировать лотки с последующей 3D-печатью для точного позиционирования брекетов.',
    ],

    advantages: [
        'Беспроводная конструкция — свобода движений, Wi-Fi 6 до 5 метров',
        'Точность 6.9 мкм — клинически точные 3D-модели',
        'AI-сканирование — автоматическое улучшение качества данных',
        'Нагрев наконечника за 40 сек — защита от запотевания',
        'Автоклавируемый наконечник до 100 раз (121°C / 134°C)',
        'Три аккумулятора в комплекте — длительная автономная работа',
        'Дизайн временных коронок прямо у кресла пациента',
        'Узкий наконечник — комфорт для пациента при сканировании',
    ],

    applications: [
        'Общие реставрации и коронки',
        'Имплантология (full-arch имплантация)',
        'Ортодонтия и изготовление лотков',
        'Дизайн и печать временных коронок',
        'Периодонтологические измерения',
        'Эстетическая стоматология',
    ],

    // Характеристики сгруппированы по блокам для удобного отображения
    specs: [
        {
            group: 'Параметры сканирования',
            rows: [
                { key: 'Поле сканирования (стандарт)', value: '16 × 12 × 22 мм' },
                { key: 'Поле сканирования (мини)', value: '12 × 9 × 22 мм' },
                { key: 'Глубина сканирования', value: 'от −2 до 20 мм от поверхности наконечника' },
                { key: 'Точность сканирования', value: '6.9 мкм' },
                { key: 'Принцип работы', value: 'Структурированный свет (бесконтактный)' },
                { key: 'Форматы файлов', value: 'STL, OBJ, PLY' },
                { key: 'Искусственный интеллект', value: 'Да' },
                { key: 'Технология без запотевания', value: 'Да' },
            ],
        },
        {
            group: 'Подключение и питание',
            rows: [
                { key: 'Проводной интерфейс', value: 'USB 3.0' },
                { key: 'Беспроводное подключение', value: 'Wi-Fi 6 (802.11a/n/ac/ax)' },
                { key: 'Радиус Wi-Fi', value: 'до 5 метров' },
                { key: 'Аккумуляторные батареи', value: '3 штуки в комплекте' },
            ],
        },
        {
            group: 'Конструкция',
            rows: [
                { key: 'Вес', value: '330 ± 20 грамм' },
                { key: 'Нагрев наконечника', value: '40 секунд (антизапотевание)' },
                { key: 'Стерилизация наконечника', value: 'Автоклав до 100 раз (121°C — 30 мин / 134°C — 4 мин)' },
            ],
        },
    ],

    // Требования к ПК — отдельный блок
    pc_requirements: [
        { key: 'Процессор', value: 'Intel Core i7-8700 или выше' },
        { key: 'Видеокарта', value: 'NVIDIA RTX 2060 6GB или выше' },
        { key: 'Оперативная память', value: '16 ГБ или больше' },
        { key: 'Накопитель', value: '256 GB SSD или больше' },
        { key: 'Монитор', value: '1920 × 1080, 60 Гц или выше' },
        { key: 'USB-порты', value: '2+ порта USB 3.0 Type-A' },
        { key: 'Операционная система', value: 'Windows 10 Pro (64-bit) или новее' },
    ],

    kit_items: [
        'Aoralscan 3 Wireless — 1 шт.',
        'Калибратор — 1 шт.',
        'Держатель для сканера — 1 шт.',
        'Подставка с функцией зарядки — 1 шт.',
        'Аккумуляторные батареи — 3 шт.',
        'Зарядное устройство для батарей — 1 шт.',
        'Кабель питания — 1 шт.',
        'Автоклавируемая насадка для взрослых — 4 шт.',
        'Автоклавируемая насадка для детей — 1 шт.',
        'Блок питания — 1 шт.',
        'Модель в прикусе для сканирования — 1 шт.',
    ],

    price_label: '~ 850 000 – 1 200 000 ₽',
    price_min: 850000,
    price_max: 1200000,

    // Фото — пока пусто, отображается плейсхолдер
    // После загрузки через Админку: [{ url, alt_text, is_primary }, ...]
    images: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ─────────────────────────────────────────────────────────────────────────────
function formatPrice(n) {
    return new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: Галерея фотографий
// ─────────────────────────────────────────────────────────────────────────────
function Gallery({ images, brand, model }) {
    const [active, setActive] = useState(0);

    // Плейсхолдер если нет фото
    if (!images || images.length === 0) {
        return (
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-blue-100">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <span className="text-4xl">🦷</span>
                </div>
                <p className="font-semibold text-slate-600 text-sm">{brand}</p>
                <p className="text-slate-400 text-xs mt-1">{model}</p>
                <p className="text-slate-300 text-xs mt-3">Фото будут добавлены через Админку</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Главное фото */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
                <img
                    src={images[active].url}
                    alt={images[active].alt_text || `${brand} ${model}`}
                    className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                    <>
                        <button
                            onClick={() => setActive(a => Math.max(0, a - 1))}
                            disabled={active === 0}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full p-2 shadow hover:bg-white transition disabled:opacity-30"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setActive(a => Math.min(images.length - 1, a + 1))}
                            disabled={active === images.length - 1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full p-2 shadow hover:bg-white transition disabled:opacity-30"
                        >
                            <ChevronRight size={18} />
                        </button>
                        {/* Точки */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActive(i)}
                                    className={`rounded-full transition-all duration-200 ${i === active ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/70'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Миниатюры */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                                i === active
                                    ? 'border-blue-500 opacity-100 shadow-sm'
                                    : 'border-transparent opacity-50 hover:opacity-75'
                            }`}
                        >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: Таблица характеристик
// ─────────────────────────────────────────────────────────────────────────────
function SpecsTable({ specs }) {
    return (
        <div className="space-y-6">
            {specs.map((group, gi) => (
                <div key={gi}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-1 h-4 bg-blue-500 rounded-full block" />
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                            {group.group}
                        </h4>
                    </div>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                        {group.rows.map((row, ri) => (
                            <div
                                key={ri}
                                className={`flex text-sm border-b border-gray-100 last:border-0 ${
                                    ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                                }`}
                            >
                                <div className="w-2/5 px-4 py-3 text-gray-500 font-medium shrink-0 leading-snug">
                                    {row.key}
                                </div>
                                <div className="flex-1 px-4 py-3 text-gray-900 font-semibold leading-snug">
                                    {row.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ГЛАВНЫЙ КОМПОНЕНТ
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'description',  label: 'Описание' },
    { id: 'specs',        label: 'Характеристики' },
    { id: 'applications', label: 'Применение' },
    { id: 'kit',          label: 'Комплектация' },
];

export default function ProductPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('description');
    const [copied, setCopied] = useState(false);

    // TODO: заменить на реальный fetch после подключения API
    // const { product, loading, error } = useProduct(slug);
    const product = DEMO_PRODUCT;

    const shareUrl = `${window.location.origin}/share/${product.slug}`;

    function handleCopy() {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }

    function handleWhatsApp() {
        const text = encodeURIComponent(
            `*${product.brand} ${product.model}*\n${product.short_description}\n\nЦена: ${product.price_label}\n\n${shareUrl}`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }

    function handleTelegram() {
        const text = encodeURIComponent(`${product.brand} ${product.model} — ${product.price_label}`);
        const url = encodeURIComponent(shareUrl);
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── НАВБАР ─────────────────────────────────────────────────────── */}
            <nav className="bg-white border-b sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm transition-colors shrink-0"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Каталог</span>
                    </button>
                    <span className="text-gray-200">/</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium shrink-0">
                        {product.category.name}
                    </span>
                    <span className="text-gray-200 hidden sm:block">/</span>
                    <span className="text-sm text-gray-700 font-medium truncate hidden sm:block">
                        {product.brand} {product.model}
                    </span>
                    {/* Share кнопка справа */}
                    <div className="ml-auto">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1.5 transition-all hover:border-blue-200 hover:bg-blue-50"
                        >
                            {copied
                                ? <><Check size={14} className="text-green-500" /> Скопировано</>
                                : <><Share2 size={14} /> Поделиться</>
                            }
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

                {/* ── ГЕРОЙ: ГАЛЕРЕЯ + ИНФОРМАЦИЯ ────────────────────────────── */}
                <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-10">

                    {/* Левая колонка — Галерея */}
                    <div>
                        <Gallery images={product.images} brand={product.brand} model={product.model} />
                    </div>

                    {/* Правая колонка — Информация */}
                    <div className="flex flex-col gap-5">

                        {/* Бренд + категория */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black uppercase tracking-widest text-blue-600">
                                {product.brand}
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                                {product.category.name}
                            </span>
                        </div>

                        {/* Название */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                            {product.model}
                        </h1>

                        {/* Страна */}
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{product.flag}</span>
                            <span className="text-sm text-gray-500">
                                Производство: <span className="font-semibold text-gray-700">{product.country}</span>
                            </span>
                        </div>

                        {/* Цена */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                            <p className="text-2xl font-bold text-gray-900">{product.price_label}</p>
                            {product.price_min && product.price_max && (
                                <p className="text-sm text-gray-500 mt-1">
                                    от {formatPrice(product.price_min)} &nbsp;—&nbsp; до {formatPrice(product.price_max)}
                                </p>
                            )}
                        </div>

                        {/* Топ-4 преимущества */}
                        <div className="space-y-2.5">
                            {product.advantages.slice(0, 4).map((adv, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-gray-700 leading-snug">{adv}</span>
                                </div>
                            ))}
                            {product.advantages.length > 4 && (
                                <button
                                    onClick={() => setActiveTab('description')}
                                    className="text-xs text-blue-500 hover:underline ml-[26px]"
                                >
                                    + ещё {product.advantages.length - 4} преимуществ →
                                </button>
                            )}
                        </div>

                        {/* ── КНОПКИ SHARE ─── */}
                        <div className="pt-1 space-y-3">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                Отправить клиенту
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all shadow-sm hover:shadow"
                                >
                                    {copied
                                        ? <Check size={15} className="text-green-500" />
                                        : <Copy size={15} />
                                    }
                                    {copied ? 'Скопировано!' : 'Копировать ссылку'}
                                </button>
                                <button
                                    onClick={handleWhatsApp}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fbd5a] text-white text-sm font-medium transition-all shadow-sm hover:shadow"
                                >
                                    <MessageCircle size={15} />
                                    WhatsApp
                                </button>
                                <button
                                    onClick={handleTelegram}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2AABEE] hover:bg-[#1f9bd6] text-white text-sm font-medium transition-all shadow-sm hover:shadow"
                                >
                                    <Send size={15} />
                                    Telegram
                                </button>
                            </div>

                            {/* Превью ссылки */}
                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                                <ExternalLink size={12} className="text-gray-300 shrink-0" />
                                <span className="text-xs text-gray-400 truncate font-mono">{shareUrl}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── ВКЛАДКИ ────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Навигация вкладок */}
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 sm:px-6 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/60'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Содержимое вкладок */}
                    <div className="p-5 sm:p-7">

                        {/* ─── ОПИСАНИЕ ─── */}
                        {activeTab === 'description' && (
                            <div className="space-y-8">

                                {/* Текст */}
                                <div>
                                    <SectionTitle>О товаре</SectionTitle>
                                    <div className="space-y-4 mt-4">
                                        {product.full_description.map((para, i) => (
                                            <p key={i} className="text-gray-700 leading-relaxed">{para}</p>
                                        ))}
                                    </div>
                                </div>

                                {/* Все преимущества */}
                                <div>
                                    <SectionTitle>Преимущества</SectionTitle>
                                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                                        {product.advantages.map((adv, i) => (
                                            <div key={i} className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                                                <CheckCircle2 size={15} className="text-green-500 mt-0.5 shrink-0" />
                                                <span className="text-sm text-gray-700 leading-snug">{adv}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── ХАРАКТЕРИСТИКИ ─── */}
                        {activeTab === 'specs' && (
                            <div className="space-y-8">
                                <SpecsTable specs={product.specs} />

                                {/* Требования к ПК */}
                                {product.pc_requirements?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Monitor size={14} className="text-blue-500" />
                                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                                Рекомендуемые требования к ПК
                                            </h4>
                                        </div>
                                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                                            {product.pc_requirements.map((row, ri) => (
                                                <div
                                                    key={ri}
                                                    className={`flex text-sm border-b border-gray-100 last:border-0 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                                                >
                                                    <div className="w-2/5 px-4 py-3 text-gray-500 font-medium shrink-0">{row.key}</div>
                                                    <div className="flex-1 px-4 py-3 text-gray-900 font-semibold">{row.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── ПРИМЕНЕНИЕ ─── */}
                        {activeTab === 'applications' && (
                            <div>
                                <SectionTitle>Области применения</SectionTitle>
                                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                                    {product.applications.map((app, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                            <Zap size={14} className="text-blue-500 shrink-0" />
                                            <span className="text-sm text-gray-700 font-medium">{app}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ─── КОМПЛЕКТАЦИЯ ─── */}
                        {activeTab === 'kit' && (
                            <div>
                                <SectionTitle>Комплектация поставки</SectionTitle>
                                <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
                                    {product.kit_items.map((item, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                                        >
                                            <span className="text-xs font-bold text-gray-300 w-5 text-right shrink-0">
                                                {i + 1}
                                            </span>
                                            <Package size={13} className="text-gray-400 shrink-0" />
                                            <span className="text-sm text-gray-700">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── БЛОК "ОТПРАВИТЬ КЛИЕНТУ" ───────────────────────────────── */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-lg">Отправить клиенту</h3>
                            <p className="text-blue-200 text-sm mt-1">
                                Клиент увидит красивую карточку — без лишней информации
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all backdrop-blur"
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Скопировано' : 'Копировать'}
                            </button>
                            <button
                                onClick={handleWhatsApp}
                                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1fbd5a] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                            >
                                <MessageCircle size={14} />
                                WhatsApp
                            </button>
                            <button
                                onClick={handleTelegram}
                                className="flex items-center gap-2 bg-[#2AABEE] hover:bg-[#1f9bd6] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                            >
                                <Send size={14} />
                                Telegram
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 bg-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
                        <ExternalLink size={13} className="opacity-50 shrink-0" />
                        <span className="text-sm font-mono opacity-70 break-all">{shareUrl}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ─── Вспомогательный компонент заголовка раздела ──────────────────────────────
function SectionTitle({ children }) {
    return (
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {children}
        </h3>
    );
}
