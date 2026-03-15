/**
 * src/components/Modal.jsx
 * Модальное окно быстрого просмотра товара — Фаза 2 редизайн.
 * Цвета: primary blue вместо green.
 */

import React from 'react';
import { X, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ShareButton from './ShareButton.jsx';
import Badge from './ui/Badge.jsx';

export default function Modal({ product, setSelectedProduct }) {
    if (!product) return null;

    const categoryId = product.categoryId;
    const shareSlug  = product.shareSlug ?? product.id;

    const hasPriceGradation = product.priceGradation?.min || product.priceGradation?.avg || product.priceGradation?.max;
    const priceLabel = product.price;

    return (
        <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={e => { if (e.target === e.currentTarget) setSelectedProduct(null); }}
        >
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-modal animate-scale-in">

                {/* ── Шапка ── */}
                <div className="flex items-start justify-between p-5 border-b border-gray-100 shrink-0">
                    <div className="flex-1 min-w-0 pr-3">
                        <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
                            {product.brand}
                        </p>
                        <h2 className="text-xl font-bold text-gray-900 leading-snug">
                            {product.model}
                        </h2>
                        {product.country && (
                            <p className="flex items-center gap-1 text-sm text-gray-400 mt-1.5">
                                <MapPin size={12} />
                                {product.country}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setSelectedProduct(null)}
                        className="shrink-0 w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Тело ── */}
                <div className="overflow-y-auto flex-1 p-5 space-y-4">

                    {/* Цена — primary blue */}
                    {hasPriceGradation ? (
                        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-3">
                                Ценовое позиционирование
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {[
                                    { label: 'Мин.',    value: product.priceGradation?.min, accent: false },
                                    { label: 'Средняя', value: product.priceGradation?.avg, accent: true  },
                                    { label: 'Макс.',   value: product.priceGradation?.max, accent: false },
                                ].map(({ label, value, accent }) => (
                                    <div
                                        key={label}
                                        className={`rounded-xl p-3 ${accent ? 'bg-white ring-1 ring-primary-200 shadow-sm' : 'bg-white/70'}`}
                                    >
                                        <span className={`block text-[10px] font-semibold uppercase mb-1 ${accent ? 'text-primary-600' : 'text-gray-400'}`}>
                                            {label}
                                        </span>
                                        <span className={`font-bold text-sm ${accent ? 'text-primary-700' : 'text-gray-700'}`}>
                                            {value ? Number(value).toLocaleString('ru-RU') + ' ₽' : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : priceLabel ? (
                        <div className="bg-primary-50 rounded-xl px-4 py-3 border border-primary-100">
                            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mb-1">Цена</p>
                            <p className="text-xl font-bold text-primary-700">{priceLabel}</p>
                        </div>
                    ) : null}

                    {/* Описание */}
                    {product.description && (
                        <div>
                            <SectionLabel>Описание</SectionLabel>
                            <p className="text-sm text-gray-700 leading-relaxed mt-2">{product.description}</p>
                        </div>
                    )}

                    {/* Установки */}
                    {categoryId === 'units' && (product.colors || product.upholstery || product.baseConfig || product.options) && (
                        <div className="space-y-1.5">
                            <SectionLabel>Комплектация</SectionLabel>
                            {product.colors     && <Row label="Цвета"             value={product.colors} />}
                            {product.upholstery && <Row label="Обивка"            value={product.upholstery} />}
                            {product.baseConfig && <Row label="Базовая комплект." value={product.baseConfig} />}
                            {product.options    && <Row label="Доп. опции"        value={product.options} accent />}
                        </div>
                    )}

                    {/* Компрессоры */}
                    {categoryId === 'compressors' && (product.forUnits || product.type || product.dryer || product.cover || product.cylinders) && (
                        <div className="space-y-1.5">
                            <SectionLabel>Характеристики</SectionLabel>
                            {product.forUnits  && <Row label="Для установок" value={product.forUnits} />}
                            {product.type      && <Row label="Тип"           value={product.type} />}
                            {product.dryer     && <Row label="Осушитель"     value={product.dryer} />}
                            {product.cover     && <Row label="Кожух"         value={product.cover} />}
                            {product.cylinders && <Row label="Цилиндров"     value={product.cylinders} />}
                        </div>
                    )}

                    {/* Тех. характеристики */}
                    {product.specs && typeof product.specs === 'string' && (
                        <div>
                            <SectionLabel>Тех. характеристики</SectionLabel>
                            <p className="text-sm text-gray-700 leading-relaxed mt-2">{product.specs}</p>
                        </div>
                    )}

                    {product.dimensions && <Row label="Габариты и вес" value={product.dimensions} />}
                </div>

                {/* ── Подвал ── */}
                <div className="p-4 border-t border-gray-100 flex items-center gap-2 shrink-0">
                    <ShareButton productId={product.id} shareSlug={shareSlug} />
                    <Link
                        to={`/product/${shareSlug}`}
                        onClick={() => setSelectedProduct(null)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:bg-primary-700 transition-colors"
                    >
                        Полная карточка <ChevronRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ children }) {
    return (
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {children}
        </p>
    );
}

function Row({ label, value, accent }) {
    if (!value) return null;
    return (
        <div className={`flex gap-2 text-sm rounded-xl px-3 py-2.5 ${accent ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <span className={`shrink-0 font-semibold w-36 ${accent ? 'text-amber-700' : 'text-gray-500'}`}>
                {label}:
            </span>
            <span className="text-gray-800">{value}</span>
        </div>
    );
}
