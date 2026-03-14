/**
 * src/components/ProductCard.jsx
 * Карточка товара в каталоге менеджера — редизайн Фаза 1
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
    Stethoscope, Wind, Thermometer, Activity,
    ScanFace, Camera, Monitor, Zap, Package, ExternalLink, Eye
} from 'lucide-react';
import { getImageUrl } from '../api/index.js';
import Badge from './ui/Badge.jsx';

const CATEGORY_ICONS = {
    units:       { icon: Stethoscope, color: 'text-blue-400',   bg: 'bg-blue-50'   },
    compressors: { icon: Wind,        color: 'text-slate-400',  bg: 'bg-slate-50'  },
    autoclaves:  { icon: Thermometer, color: 'text-orange-400', bg: 'bg-orange-50' },
    physio:      { icon: Activity,    color: 'text-green-400',  bg: 'bg-green-50'  },
    scanners:    { icon: ScanFace,    color: 'text-purple-400', bg: 'bg-purple-50' },
    xray:        { icon: Camera,      color: 'text-red-400',    bg: 'bg-red-50'    },
    visiographs: { icon: Monitor,     color: 'text-indigo-400', bg: 'bg-indigo-50' },
    handpieces:  { icon: Zap,         color: 'text-amber-400',  bg: 'bg-amber-50'  },
};

export default function ProductCard({ product, setSelectedProduct }) {
    const primaryImg  = product.images?.find(i => i.is_primary) ?? product.images?.[0];
    const shareSlug   = product.slug ?? product.id;
    const categoryId  = product.category_id ?? product.categoryId;
    const price       = product.price_label ?? product.price;
    const catMeta     = CATEGORY_ICONS[categoryId] ?? { icon: Package, color: 'text-gray-300', bg: 'bg-gray-50' };
    const CatIcon     = catMeta.icon;

    return (
        <div
            className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer animate-fade-in"
            onClick={() => setSelectedProduct(product)}
        >
            {/* ── Фото ─────────────────────────────────── */}
            <div className={`relative aspect-[4/3] overflow-hidden shrink-0 ${!primaryImg ? catMeta.bg : 'bg-gray-50'}`}>
                {primaryImg ? (
                    <img
                        src={getImageUrl(primaryImg.filename)}
                        alt={`${product.brand} ${product.model}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <CatIcon size={48} className={`${catMeta.color} opacity-60`} />
                    </div>
                )}

                {/* Страна — верхний правый угол */}
                {product.country && (
                    <div className="absolute top-2.5 right-2.5">
                        <Badge variant="outline" size="xs" className="backdrop-blur-sm bg-white/90 shadow-sm">
                            {product.country}
                        </Badge>
                    </div>
                )}

                {/* Hover overlay с иконкой просмотра */}
                <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/8 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 bg-white/95 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
                        <Eye size={18} className="text-primary-600" />
                    </div>
                </div>
            </div>

            {/* ── Контент ──────────────────────────────── */}
            <div className="p-4 flex-1 flex flex-col gap-2.5">

                {/* Бренд */}
                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest leading-none">
                    {product.brand}
                </p>

                {/* Модель */}
                <h3 className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-primary-700 transition-colors duration-200">
                    {product.model}
                </h3>

                {/* Цена */}
                {price && (
                    <p className="text-sm font-bold text-primary-600 leading-none">
                        {price}
                    </p>
                )}

                {/* Описание */}
                <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed flex-1">
                    {product.description}
                </p>

                {/* Кнопки */}
                <div
                    className="flex gap-2 pt-2.5 border-t border-gray-100 mt-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 active:bg-primary-200 transition-colors duration-200"
                    >
                        Кратко
                    </button>
                    <Link
                        to={`/product/${shareSlug}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800 active:bg-gray-200 transition-colors duration-200"
                    >
                        <ExternalLink size={14} />
                        Карточка
                    </Link>
                </div>
            </div>
        </div>
    );
}
