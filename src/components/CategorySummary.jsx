import React from 'react';
import { Globe } from 'lucide-react';

export default function CategorySummary({ currentSummary }) {
    if (!currentSummary?.length) return null;

    return (
        <div className="mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Globe size={13} /> Шпаргалка: Рынок и цены
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {currentSummary.map((item, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-primary-100 shadow-sm">
                        <div className="font-bold text-sm text-gray-800 mb-0.5">{item.country}</div>
                        <div className="text-primary-600 font-semibold text-sm mb-1.5">{item.range}</div>
                        <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
