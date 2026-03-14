import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope, Wind, Thermometer, Activity,
  ScanFace, Camera, Monitor, Zap, Package, ChevronRight
} from 'lucide-react';
import { getImageUrl } from '../api/index.js';

const CATEGORY_ICONS = {
  units:       <Stethoscope size={40} className="text-blue-300" />,
  compressors: <Wind size={40} className="text-slate-300" />,
  autoclaves:  <Thermometer size={40} className="text-orange-300" />,
  physio:      <Activity size={40} className="text-green-300" />,
  scanners:    <ScanFace size={40} className="text-purple-300" />,
  xray:        <Camera size={40} className="text-red-300" />,
  visiographs: <Monitor size={40} className="text-indigo-300" />,
  handpieces:  <Zap size={40} className="text-yellow-300" />,
};

export default function ProductCard({ product, setSelectedProduct }) {
  const primaryImg = product.images?.find(i => i.is_primary) ?? product.images?.[0];
  const shareSlug = product.slug ?? product.id;
  const categoryId = product.categoryId ?? product.category_id;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200 group flex flex-col">

      {/* Изображение */}
      <div
        className="relative aspect-[16/10] bg-gradient-to-br from-slate-50 to-blue-50/40 overflow-hidden cursor-pointer"
        onClick={() => setSelectedProduct(product)}
      >
        {primaryImg ? (
          <img
            src={getImageUrl(primaryImg.filename)}
            alt={`${product.brand} ${product.model}`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {CATEGORY_ICONS[categoryId] ?? <Package size={40} className="text-gray-200" />}
          </div>
        )}

        {/* Страна — бейдж на изображении */}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          {product.country}
        </span>
      </div>

      {/* Контент */}
      <div className="p-4 flex-1 flex flex-col">

        {/* Бренд + модель */}
        <div className="mb-2 cursor-pointer" onClick={() => setSelectedProduct(product)}>
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">
            {product.brand}
          </p>
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-blue-700 transition-colors">
            {product.model}
          </h3>
        </div>

        {/* Цена */}
        <p className="text-base font-bold text-green-600 mb-2">
          {product.price_label ?? product.price}
        </p>

        {/* Описание */}
        <p className="text-sm text-gray-500 line-clamp-2 flex-1 leading-relaxed mb-3">
          {product.description}
        </p>

        {/* Кнопки действий */}
        <div className="flex items-stretch gap-1.5 border-t border-gray-50 pt-3">
          <button
            onClick={() => setSelectedProduct(product)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            Кратко <ChevronRight size={14} />
          </button>
          <div className="w-px bg-gray-100" />
          <Link
            to={`/product/${shareSlug}`}
            onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            Полная карточка <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
