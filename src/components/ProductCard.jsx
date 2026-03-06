import React from 'react';
import {
  ChevronRight, Stethoscope, Wind, Thermometer, Activity,
  ScanFace, Camera, Monitor, Zap, Package
} from 'lucide-react';
import { getImageUrl } from '../api/index.js';

// Иконки по категории (если нет фото)
const CATEGORY_ICONS = {
  units:       <Stethoscope size={48} className="text-blue-400" />,
  compressors: <Wind size={48} className="text-gray-400" />,
  autoclaves:  <Thermometer size={48} className="text-orange-400" />,
  physio:      <Activity size={48} className="text-green-400" />,
  scanners:    <ScanFace size={48} className="text-purple-400" />,
  xray:        <Camera size={48} className="text-red-400" />,
  visiographs: <Monitor size={48} className="text-indigo-400" />,
  handpieces:  <Zap size={48} className="text-yellow-400" />,
};

export default function ProductCard({ product, setSelectedProduct }) {
  const primaryImg = product.images?.find(i => i.is_primary) ?? product.images?.[0];

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col group"
      onClick={() => setSelectedProduct(product)}
    >
      {/* Превью */}
      <div className="h-40 bg-gray-50 flex items-center justify-center border-b border-gray-100 group-hover:bg-blue-50 transition-colors overflow-hidden">
        {primaryImg
          ? <img src={getImageUrl(primaryImg.filename)} alt={product.brand} className="w-full h-full object-cover" />
          : (CATEGORY_ICONS[product.categoryId] ?? <Package size={48} className="text-gray-300" />)
        }
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
            {product.brand} {product.model}
          </h3>
          <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded font-medium shrink-0 ml-2">
            {product.country}
          </span>
        </div>
        <p className="text-xl font-bold text-green-600 mb-4">{product.price}</p>

        <div className="mt-auto space-y-2">
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          <button className="text-blue-600 text-sm font-medium flex items-center group-hover:text-blue-800 mt-2">
            Все характеристики <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
