import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function ProductCard({ product, setSelectedProduct }) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col group"
      onClick={() => setSelectedProduct(product)}
    >
      <div className="h-40 bg-gray-50 flex items-center justify-center border-b border-gray-100 group-hover:bg-blue-50 transition-colors">
        {product.imageIcon}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">{product.brand} {product.model}</h3>
          <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded font-medium">{product.country}</span>
        </div>
        <p className="text-xl font-bold text-green-600 mb-4">{product.price}</p>

        <div className="mt-auto space-y-2">
          <p className="text-sm text-gray-600 line-clamp-2">{product.desc}</p>
          <button className="text-blue-600 text-sm font-medium flex items-center group-hover:text-blue-800 mt-2">
            Все характеристики <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
