/**
 * src/pages/ProductPage.jsx
 *
 * ★ Карточка товара — загружает данные из API по slug/id
 *
 * Для специального эталонного товара (aoralscan3-wireless) используется
 * детальный формат с группированными характеристиками, преимуществами и т.д.
 * Остальные товары из каталога отображаются с имеющимися полями.
 *
 * Маршрут: /product/:slug
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Copy, Check, ChevronLeft, ChevronRight,
    CheckCircle2, Package, Zap, MessageCircle, Send,
    ExternalLink, Monitor, Share2, Loader, AlertCircle,
} from 'lucide-react';
import { useProduct } from '../hooks/useProducts.js';
import { getImageUrl, buildShareUrl, buildWhatsAppUrl } from '../api/index.js';

const MANAGER_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? '';

// ─────────────────────────────────────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ─────────────────────────────────────────────────────────────────────────────
function formatPrice(n) {
    if (!n) return '';
    return new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: Галерея фотографий (работает с форматом API)
// ─────────────────────────────────────────────────────────────────────────────
function Gallery({ images, brand, model }) {
    const [active, setActive] = useState(0);

    const normalizedImages = (images ?? []).map(img => ({
        url: img.url ?? getImageUrl(img.filename),
        alt: img.alt_text ?? `${brand} ${model}`,
    }));

    if (normalizedImages.length === 0) {
        return (
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-blue-100">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <span className="text-4xl">🦷</span>
                </div>
                <p className="font-semibold text-slate-600 text-sm">{brand}</p>
                <p className="text-slate-400 text-xs mt-1">{model}</p>
                <p className="text-slate-300 text-xs mt-3">Фото добавляются через Админку</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
                <img
                    src={normalizedImages[active].url}
                    alt={normalizedImages[active].alt}
                    className="w-full h-full object-cover"
                />
                {normalizedImages.length > 1 && (
                    <>
                        <button
                            onClick={() => setActive(a => Math.max(0, a - 1))}
                            disabled={active === 0}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full p-2 shadow hover:bg-white transition disabled:opacity-30"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setActive(a => Math.min(normalizedImages.length - 1, a + 1))}
                            disabled={active === normalizedImages.length - 1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full p-2 shadow hover:bg-white transition disabled:opacity-30"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {normalizedImages.map((_, i) => (
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
            {normalizedImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {normalizedImages.map((img, i) => (
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
// КОМПОНЕНТ: Таблица характеристик (grouped format)
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
                                className={`flex text-sm border-b border-gray-100 last:border-0 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                            >
                                <div className="w-2/5 px-4 py-3 text-gray-500 font-medium shrink-0 leading-snug">{row.key}</div>
                                <div className="flex-1 px-4 py-3 text-gray-900 font-semibold leading-snug">{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: Текстовые характеристики (flat format из API)
// ─────────────────────────────────────────────────────────────────────────────
function SpecsFlat({ product }) {
    const rows = [
        product.specs && { key: 'Технические характеристики', value: product.specs },
        product.type && { key: 'Тип', value: product.type },
        product.forUnits && { key: 'Для установок', value: product.forUnits },
        product.dryer && { key: 'Осушитель', value: product.dryer },
        product.cover && { key: 'Кожух', value: product.cover },
        product.cylinders && { key: 'Цилиндров', value: product.cylinders },
        product.dimensions && { key: 'Габариты и вес', value: product.dimensions },
        product.upholstery && { key: 'Материал обивки', value: product.upholstery },
        product.colors && { key: 'Цветовые решения', value: product.colors },
    ].filter(Boolean);

    if (rows.length === 0) {
        return <p className="text-sm text-gray-400">Характеристики не указаны.</p>;
    }

    return (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
            {rows.map((row, ri) => (
                <div key={ri} className={`flex text-sm border-b border-gray-100 last:border-0 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                    <div className="w-2/5 px-4 py-3 text-gray-500 font-medium shrink-0 leading-snug">{row.key}</div>
                    <div className="flex-1 px-4 py-3 text-gray-900 font-semibold leading-snug">{row.value}</div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Вспомогательный компонент заголовка раздела
// ─────────────────────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
    return (
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {children}
        </h3>
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

    const { product, loading, error } = useProduct(slug);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader size={36} className="animate-spin text-blue-500" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-gray-800 mb-1">Товар не найден</h2>
                    <p className="text-sm text-gray-500 mb-4">{error ?? 'Проверьте ссылку или вернитесь в каталог.'}</p>
                    <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                        В каталог
                    </button>
                </div>
            </div>
        );
    }

    // Определяем формат данных: rich (DEMO) или flat (API)
    const isRich = Array.isArray(product.full_description) || Array.isArray(product.advantages);
    const shareUrl = buildShareUrl(product.shareSlug ?? product.id);

    function handleCopy() {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }

    function handleWhatsApp() {
        const name = `${product.brand} ${product.model}`;
        const price = product.price_label ?? product.price ?? '';
        const text = `*${name}*\n${product.short_description ?? product.description ?? ''}\n\nЦена: ${price}\n\n${shareUrl}`;
        if (MANAGER_PHONE) {
            window.open(buildWhatsAppUrl(MANAGER_PHONE, text), '_blank');
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }
    }

    function handleTelegram() {
        const name = `${product.brand} ${product.model}`;
        const price = product.price_label ?? product.price ?? '';
        const text = encodeURIComponent(`${name} — ${price}`);
        const url = encodeURIComponent(shareUrl);
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    }

    const priceLabel = product.price_label ?? product.price ?? '';
    const priceMin = product.price_min ?? product.priceGradation?.min;
    const priceMax = product.price_max ?? product.priceGradation?.max;
    const categoryName = product.category?.name ?? product.categoryId ?? '';
    const flag = product.flag ?? '';

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
                    {categoryName && (
                        <>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium shrink-0">
                                {categoryName}
                            </span>
                            <span className="text-gray-200 hidden sm:block">/</span>
                        </>
                    )}
                    <span className="text-sm text-gray-700 font-medium truncate hidden sm:block">
                        {product.brand} {product.model}
                    </span>
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
                            {categoryName && (
                                <>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                                        {categoryName}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Название */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                            {product.model}
                        </h1>

                        {/* Страна */}
                        <div className="flex items-center gap-2">
                            {flag && <span className="text-xl">{flag}</span>}
                            <span className="text-sm text-gray-500">
                                Производство: <span className="font-semibold text-gray-700">{product.country}</span>
                            </span>
                        </div>

                        {/* Цена */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                            <p className="text-2xl font-bold text-gray-900">{priceLabel}</p>
                            {priceMin && priceMax && (
                                <p className="text-sm text-gray-500 mt-1">
                                    от {formatPrice(priceMin)} &nbsp;—&nbsp; до {formatPrice(priceMax)}
                                </p>
                            )}
                        </div>

                        {/* Преимущества (rich format) */}
                        {isRich && Array.isArray(product.advantages) && product.advantages.length > 0 && (
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
                        )}

                        {/* Краткое описание (flat format) */}
                        {!isRich && product.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                        )}

                        {/* Кнопки Share */}
                        <div className="pt-1 space-y-3">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                Отправить клиенту
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all shadow-sm hover:shadow"
                                >
                                    {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
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
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2AABEE] hover:bg-[#1f9bd6] text-white text-sm font-medium transition-all"
                                >
                                    <Send size={15} />
                                    Telegram
                                </button>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                                <ExternalLink size={12} className="text-gray-300 shrink-0" />
                                <span className="text-xs text-gray-400 truncate font-mono">{shareUrl}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── ВКЛАДКИ ────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

                    <div className="p-5 sm:p-7">

                        {/* ─── ОПИСАНИЕ ─── */}
                        {activeTab === 'description' && (
                            <div className="space-y-8">
                                <div>
                                    <SectionTitle>О товаре</SectionTitle>
                                    <div className="space-y-4 mt-4">
                                        {isRich && Array.isArray(product.full_description)
                                            ? product.full_description.map((para, i) => (
                                                <p key={i} className="text-gray-700 leading-relaxed">{para}</p>
                                              ))
                                            : <p className="text-gray-700 leading-relaxed">
                                                {product.clientDescription || product.description || 'Описание не указано.'}
                                              </p>
                                        }
                                    </div>
                                </div>

                                {isRich && Array.isArray(product.advantages) && product.advantages.length > 0 && (
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
                                )}
                            </div>
                        )}

                        {/* ─── ХАРАКТЕРИСТИКИ ─── */}
                        {activeTab === 'specs' && (
                            <div className="space-y-8">
                                {isRich && Array.isArray(product.specs)
                                    ? <SpecsTable specs={product.specs} />
                                    : <SpecsFlat product={product} />
                                }

                                {isRich && Array.isArray(product.pc_requirements) && product.pc_requirements.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Monitor size={14} className="text-blue-500" />
                                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                                Рекомендуемые требования к ПК
                                            </h4>
                                        </div>
                                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                                            {product.pc_requirements.map((row, ri) => (
                                                <div key={ri} className={`flex text-sm border-b border-gray-100 last:border-0 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
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
                                {isRich && Array.isArray(product.applications) && product.applications.length > 0
                                    ? (
                                        <div className="grid sm:grid-cols-2 gap-3 mt-4">
                                            {product.applications.map((app, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                                    <Zap size={14} className="text-blue-500 shrink-0" />
                                                    <span className="text-sm text-gray-700 font-medium">{app}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                    : <p className="text-sm text-gray-400 mt-3">Области применения не указаны.</p>
                                }
                            </div>
                        )}

                        {/* ─── КОМПЛЕКТАЦИЯ ─── */}
                        {activeTab === 'kit' && (
                            <div>
                                <SectionTitle>Комплектация поставки</SectionTitle>
                                {product.baseConfig && (
                                    <p className="text-sm text-gray-700 mt-3 leading-relaxed">{product.baseConfig}</p>
                                )}
                                {product.options && (
                                    <div className="mt-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Дополнительные опции</p>
                                        <p className="text-sm text-gray-700">{product.options}</p>
                                    </div>
                                )}
                                {isRich && Array.isArray(product.kit_items) && product.kit_items.length > 0 && (
                                    <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
                                        {product.kit_items.map((item, i) => (
                                            <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                                                <span className="text-xs font-bold text-gray-300 w-5 text-right shrink-0">{i + 1}</span>
                                                <Package size={13} className="text-gray-400 shrink-0" />
                                                <span className="text-sm text-gray-700">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!product.baseConfig && !product.options && !(isRich && product.kit_items?.length > 0) && (
                                    <p className="text-sm text-gray-400 mt-3">Комплектация не указана.</p>
                                )}
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
