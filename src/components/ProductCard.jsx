/**
 * src/components/ProductCard.jsx
 * Карточка товара в каталоге менеджера.
 * Клик на карточку → быстрый просмотр (Modal).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
    Stethoscope, Wind, Thermometer, Activity,
    ScanFace, Camera, Monitor, Zap, Package, ExternalLink
} from 'lucide-react';
import { getImageUrl } from '../api/index.js';

const CATEGORY_ICONS = {
    units:       <Stethoscope size={36} className="text-blue-300" />,
    compressors: <Wind size={36} className="text-slate-300" />,
    autoclaves:  <Thermometer size={36} className="text-orange-300" />,
    physio:      <Activity size={36} className="text-green-300" />,
    scanners:    <ScanFace size={36} className="text-purple-300" />,
    xray:        <Camera size={36} className="text-red-300" />,
    visiographs: <Monitor size={36} className="text-indigo-300" />,
    handpieces:  <Zap size={36} className="text-yellow-300" />,
};

export default function ProductCard({ product, setSelectedProduct }) {
    const primaryImg = product.images?.find(i => i.is_primary) ?? product.images?.[0];
    const shareSlug  = product.slug ?? product.id;
    const categoryId = product.category_id ?? product.categoryId;
    const price      = product.price_label ?? product.price;

    return (
        <div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group flex flex-col overflow-hidden cursor-pointer"
            onClick={() => setSelectedProduct(product)}
        >
            {/* ── Фото ── */}
            <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden shrink-0">
                {primaryImg ? (
                    <img
                        src={getImageUrl(primaryImg.filename)}
                        alt={`${product.brand} ${product.model}`}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        {CATEGORY_ICONS[categoryId] ?? <Package size={36} className="text-gray-200" />}
                    </div>
                )}

                {/* Страна */}
                <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                    {product.country}
                </span>
            </div>

            {/* ── Контент ── */}
            <div className="p-4 flex-1 flex flex-col gap-2">

                {/* Бренд + Модель */}
                <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">
                        {product.brand}
                    </p>
                    <h3 className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-blue-700 transition-colors">
                        {product.model}
                    </h3>
                </div>

                {/* Цена */}
                {price && (
                    <p className="text-base font-bold text-emerald-600 leading-none">
                        {price}
                    </p>
                )}

                {/* Описание */}
                <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed flex-1">
                    {product.description}
                </p>

                {/* Кнопки */}
                <div
                    className="flex gap-2 pt-2 border-t border-gray-50"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                        Кратко
                    </button>
                    <Link
                        to={`/product/${shareSlug}`}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-slate-100 hover:text-gray-700 transition-colors"
                    >
                        <ExternalLink size={14} />
                        Карточка
                    </Link>
                </div>
            </div>
        </div>
    );
}
