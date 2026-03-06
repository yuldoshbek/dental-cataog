import React from 'react';
import { Globe } from 'lucide-react';

export default function CategorySummary({ currentSummary }) {
  if (!currentSummary) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
        <Globe size={16} className="mr-2" /> Шпаргалка: Рынок и цены
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentSummary.map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <div className="font-bold text-lg text-gray-800 mb-1">{item.country}</div>
            <div className="text-blue-600 font-semibold mb-2">{item.range}</div>
            <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
