/**
 * src/pages/ProductPage.jsx
 * Карточка товара — Фаза 3 редизайн.
 * - TouchGallery: swipe, keyboard, fade, lightbox
 * - Capsule Tabs (компонент Tabs)
 * - primary-* цвета
 * - OpenGraph meta (React 19 native hoisting)
 * Маршрут: /product/:slug
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Copy, Check, CheckCircle2, Package,
    Zap, MessageCircle, Send, ExternalLink, Share2,
    Loader, AlertCircle, Monitor,
} from 'lucide-react';
import { useProduct } from '../hooks/useProducts.js';
import { getImageUrl, buildShareUrl, buildWhatsAppUrl } from '../api/index.js';
import TouchGallery from '../components/TouchGallery.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Badge from '../components/ui/Badge.jsx';
import { ProductPageSkeleton } from '../components/ui/Skeleton.jsx';

const MANAGER_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? '';

function formatPrice(n) {
    if (!n) return '';
    return new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
}

/* ─── Таблица характеристик (grouped) ──────────────────────────── */
function SpecsTable({ specs }) {
    return (
        <div className="space-y-6">
            {specs.map((group, gi) => (
                <div key={gi}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-1 h-4 bg-primary-500 rounded-full block" />
                        <h4 className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                            {group.group}
                        </h4>
                    </div>
                    <SpecsRows rows={group.rows} />
                </div>
            ))}
        </div>
    );
}

/* ─── Таблица характеристик (flat) ─────────────────────────────── */
function SpecsFlat({ product }) {
    const rows = [
        product.specs      && { key: 'Технические характеристики', value: product.specs },
        product.type       && { key: 'Тип',                        value: product.type },
        product.forUnits   && { key: 'Для установок',              value: product.forUnits },
        product.dryer      && { key: 'Осушитель',                  value: product.dryer },
        product.cover      && { key: 'Кожух',                      value: product.cover },
        product.cylinders  && { key: 'Цилиндров',                  value: product.cylinders },
        product.dimensions && { key: 'Габариты и вес',             value: product.dimensions },
        product.upholstery && { key: 'Материал обивки',            value: product.upholstery },
        product.colors     && { key: 'Цветовые решения',           value: product.colors },
    ].filter(Boolean);

    if (rows.length === 0) {
        return <p className="text-sm text-gray-400">Характеристики не указаны.</p>;
    }
    return <SpecsRows rows={rows} />;
}

function SpecsRows({ rows }) {
    if (!rows?.length) return null;
    return (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
            {rows.map((row, ri) => (
                <div
                    key={ri}
                    className={`flex text-sm border-b border-gray-100 last:border-0 hover:bg-primary-50/30 transition-colors ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                >
                    <div className="w-2/5 px-4 py-3 text-gray-500 font-medium shrink-0 leading-snug">{row.key}</div>
                    <div className="flex-1 px-4 py-3 text-gray-900 font-semibold leading-snug">{row.value}</div>
                </div>
            ))}
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {children}
        </h3>
    );
}

/* ─── TABS config ───────────────────────────────────────────────── */
const TAB_LIST = [
    { id: 'description',  label: 'Описание'        },
    { id: 'specs',        label: 'Характеристики'  },
    { id: 'applications', label: 'Применение'      },
    { id: 'kit',          label: 'Комплектация'    },
];

/* ─── Главный компонент ─────────────────────────────────────────── */
export default function ProductPage() {
    const { slug }   = useParams();
    const navigate   = useNavigate();
    const [activeTab, setActiveTab] = useState('description');
    const [copied, setCopied]       = useState(false);

    const { product, loading, error } = useProduct(slug);

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="min-h-screen bg-dental-bg">
                <nav className="bg-white border-b h-14" />
                <ProductPageSkeleton />
            </div>
        );
    }

    /* ── Error ── */
    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dental-bg p-6">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-gray-800 mb-1">Товар не найден</h2>
                    <p className="text-sm text-gray-500 mb-4">{error ?? 'Проверьте ссылку или вернитесь в каталог.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
                    >
                        В каталог
                    </button>
                </div>
            </div>
        );
    }

    /* ── Данные ── */
    const isRich   = Array.isArray(product.full_description) || Array.isArray(product.advantages);
    const shareUrl = buildShareUrl(product.shareSlug ?? product.id);

    const priceLabel = product.price_label ?? product.price ?? '';
    const priceMin   = product.price_min ?? product.priceGradation?.min;
    const priceMax   = product.price_max ?? product.priceGradation?.max;
    const catName    = product.category?.name ?? product.categoryId ?? '';
    const flag       = product.flag ?? '';

    // Нормализуем images для TouchGallery
    const galleryImages = (product.images ?? []).map(img => ({
        url: img.url ?? getImageUrl(img.filename),
        alt: img.alt_text ?? `${product.brand} ${product.model}`,
    }));

    // Основное фото для OG
    const ogImage = galleryImages[0]?.url ?? '';
    const ogDesc  = product.short_description ?? product.description ?? `${product.brand} ${product.model}`;

    /* ── Handlers ── */
    function handleCopy() {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }

    function handleWhatsApp() {
        const name  = `${product.brand} ${product.model}`;
        const price = priceLabel;
        const text  = `*${name}*\n${ogDesc}\n\nЦена: ${price}\n\n${shareUrl}`;
        if (MANAGER_PHONE) {
            window.open(buildWhatsAppUrl(MANAGER_PHONE, text), '_blank');
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }
    }

    function handleTelegram() {
        const name  = `${product.brand} ${product.model}`;
        const price = priceLabel;
        const text  = encodeURIComponent(`${name} — ${price}`);
        const url   = encodeURIComponent(shareUrl);
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    }

    return (
        <div className="min-h-screen bg-dental-bg">

            {/* ── OpenGraph meta (React 19 native hoisting) ─── */}
            <title>{`${product.brand} ${product.model} — Dental Catalog`}</title>
            <meta name="description" content={ogDesc} />
            <meta property="og:title"       content={`${product.brand} ${product.model}`} />
            <meta property="og:description" content={ogDesc} />
            <meta property="og:image"       content={ogImage} />
            <meta property="og:url"         content={shareUrl} />
            <meta property="og:type"        content="product" />
            <meta name="twitter:card"       content="summary_large_image" />
            <meta name="twitter:title"      content={`${product.brand} ${product.model}`} />
            <meta name="twitter:image"      content={ogImage} />

            {/* ── НАВБАР ───────────────────────────────────────── */}
            <nav className="bg-white border-b border-dental-border sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 text-sm font-medium transition-colors shrink-0"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Каталог</span>
                    </button>

                    <span className="text-gray-200">/</span>

                    {catName && (
                        <>
                            <Badge variant="primary" size="sm" className="shrink-0">{catName}</Badge>
                            <span className="text-gray-200 hidden sm:block">/</span>
                        </>
                    )}

                    <span className="text-sm text-gray-700 font-medium truncate hidden sm:block">
                        {product.brand} {product.model}
                    </span>

                    <button
                        onClick={handleCopy}
                        className={[
                            'ml-auto flex items-center gap-1.5 text-sm font-medium border rounded-xl px-3 py-1.5 transition-all',
                            copied
                                ? 'border-green-200 bg-green-50 text-green-600'
                                : 'border-gray-200 hover:border-primary-200 hover:bg-primary-50 text-gray-500 hover:text-primary-600',
                        ].join(' ')}
                    >
                        {copied
                            ? <><Check size={14} /> Скопировано</>
                            : <><Share2 size={14} /> Поделиться</>
                        }
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

                {/* ── ГЕРОЙ: ГАЛЕРЕЯ + ИНФОРМАЦИЯ ──────────────── */}
                <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-10">

                    {/* Галерея */}
                    <div>
                        <TouchGallery
                            images={galleryImages}
                            brand={product.brand}
                            model={product.model}
                            showThumbs
                            enableZoom
                        />
                    </div>

                    {/* Информация */}
                    <div className="flex flex-col gap-5">

                        {/* Бренд + категория */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black uppercase tracking-widest text-primary-600">
                                {product.brand}
                            </span>
                            {catName && (
                                <>
                                    <span className="text-gray-300">·</span>
                                    <Badge variant="default" size="sm">{catName}</Badge>
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
                                Производство:{' '}
                                <span className="font-semibold text-gray-700">{product.country}</span>
                            </span>
                        </div>

                        {/* Цена */}
                        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-5 border border-primary-100">
                            <p className="text-2xl font-bold text-gray-900">{priceLabel}</p>
                            {priceMin && priceMax && (
                                <p className="text-sm text-gray-500 mt-1">
                                    от {formatPrice(priceMin)}&nbsp;—&nbsp;до {formatPrice(priceMax)}
                                </p>
                            )}
                        </div>

                        {/* Преимущества (rich) */}
                        {isRich && Array.isArray(product.advantages) && product.advantages.length > 0 && (
                            <div className="space-y-2.5">
                                {product.advantages.slice(0, 4).map((adv, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <CheckCircle2 size={16} className="text-primary-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-700 leading-snug">{adv}</span>
                                    </div>
                                ))}
                                {product.advantages.length > 4 && (
                                    <button
                                        onClick={() => setActiveTab('description')}
                                        className="text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors ml-[26px]"
                                    >
                                        + ещё {product.advantages.length - 4} преимуществ →
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Краткое описание (flat) */}
                        {!isRich && product.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                        )}

                        {/* Share-кнопки */}
                        <div className="pt-1 space-y-3">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                Отправить клиенту
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all shadow-card hover:shadow"
                                >
                                    {copied
                                        ? <Check size={15} className="text-green-500" />
                                        : <Copy size={15} />
                                    }
                                    {copied ? 'Скопировано!' : 'Копировать ссылку'}
                                </button>
                                <button
                                    onClick={handleWhatsApp}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fbd5a] text-white text-sm font-medium transition-all shadow-card"
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

                {/* ── ВКЛАДКИ ──────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
                    {/* Capsule tabs */}
                    <div className="px-5 pt-4 pb-0 overflow-x-auto scrollbar-hide">
                        <Tabs
                            tabs={TAB_LIST}
                            active={activeTab}
                            onChange={setActiveTab}
                            variant="underline"
                        />
                    </div>

                    <div className="p-5 sm:p-7 animate-fade-in" key={activeTab}>

                        {/* ОПИСАНИЕ */}
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
                                                {product.clientDescription ?? product.description ?? 'Описание не указано.'}
                                              </p>
                                        }
                                    </div>
                                </div>

                                {isRich && Array.isArray(product.advantages) && product.advantages.length > 0 && (
                                    <div>
                                        <SectionTitle>Преимущества</SectionTitle>
                                        <div className="grid sm:grid-cols-2 gap-3 mt-4">
                                            {product.advantages.map((adv, i) => (
                                                <div key={i} className="flex items-start gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
                                                    <CheckCircle2 size={15} className="text-primary-500 mt-0.5 shrink-0" />
                                                    <span className="text-sm text-gray-700 leading-snug">{adv}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ХАРАКТЕРИСТИКИ */}
                        {activeTab === 'specs' && (
                            <div className="space-y-8">
                                {isRich && Array.isArray(product.specs)
                                    ? <SpecsTable specs={product.specs} />
                                    : <SpecsFlat product={product} />
                                }

                                {isRich && Array.isArray(product.pc_requirements) && product.pc_requirements.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Monitor size={14} className="text-primary-500" />
                                            <h4 className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                                                Рекомендуемые требования к ПК
                                            </h4>
                                        </div>
                                        <SpecsRows rows={product.pc_requirements} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ПРИМЕНЕНИЕ */}
                        {activeTab === 'applications' && (
                            <div>
                                <SectionTitle>Области применения</SectionTitle>
                                {isRich && Array.isArray(product.applications) && product.applications.length > 0
                                    ? (
                                        <div className="grid sm:grid-cols-2 gap-3 mt-4">
                                            {product.applications.map((app, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
                                                    <Zap size={14} className="text-primary-500 shrink-0" />
                                                    <span className="text-sm text-gray-700 font-medium">{app}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                    : <p className="text-sm text-gray-400 mt-3">Области применения не указаны.</p>
                                }
                            </div>
                        )}

                        {/* КОМПЛЕКТАЦИЯ */}
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

                {/* ── БЛОК "ОТПРАВИТЬ КЛИЕНТУ" ─────────────────── */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-lg">Отправить клиенту</h3>
                            <p className="text-primary-200 text-sm mt-1">
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
