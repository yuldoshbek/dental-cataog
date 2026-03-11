/**
 * src/components/Modal.jsx (updated)
 * Модальное окно товара с интегрированной кнопкой ShareButton.
 */

import React from 'react';
import { X } from 'lucide-react';
import DetailRow from './DetailRow.jsx';
import ShareButton from './ShareButton.jsx';
import ImageGallery from './ImageGallery.jsx';

export default function Modal({ product, setSelectedProduct }) {
    if (!product) return null;

    return (
        <div
            className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}
        >
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gray-50 rounded-t-2xl shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{product.brand} {product.model}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Страна: <span className="font-medium text-gray-700">{product.country}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShareButton productId={product.id} shareSlug={product.shareSlug} />
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition-colors shadow-sm ml-1"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 p-6">
                    {/* Галерея */}
                    {product.images?.length > 0 && (
                        <div className="mb-6 rounded-xl overflow-hidden">
                            <ImageGallery images={product.images} className="h-56" />
                        </div>
                    )}

                    {/* Цены */}
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
                        <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">
                            Ценовое позиционирование
                        </h3>
                        {product.priceGradation ? (
                            <div className="grid grid-cols-3 gap-3 text-center">
                                {[
                                    { label: 'Минимальная', value: product.priceGradation.min, color: 'text-gray-800' },
                                    { label: 'Средняя', value: product.priceGradation.avg, color: 'text-green-600' },
                                    { label: 'Максимальная', value: product.priceGradation.max, color: 'text-gray-800' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                                        <span className="block text-xs text-gray-400 mb-1">{label}</span>
                                        <span className={`font-bold text-sm ${color}`}>
                                            {value ? Number(value).toLocaleString('ru-RU') + ' ₽' : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-2xl font-bold text-green-600">{product.price}</p>
                        )}
                    </div>

                    {/* Характеристики */}
                    <div className="space-y-3">
                        {product.categoryId === 'units' && (
                            <>
                                <DetailRow label="Цветовые решения" value={product.colors} />
                                <DetailRow label="Материал обивки" value={product.upholstery} />
                                <DetailRow label="Базовая комплектация" value={product.baseConfig} />
                                <DetailRow label="Доп. опции (за дополн.)" value={product.options} highlight />
                            </>
                        )}
                        {product.categoryId === 'compressors' && (
                            <>
                                <DetailRow label="Для скольки установок" value={product.forUnits} />
                                <DetailRow label="Тип компрессора" value={product.type} />
                                <DetailRow label="Осушитель" value={product.dryer} />
                                <DetailRow label="Шумозащитный кожух" value={product.cover} />
                                <DetailRow label="Кол-во цилиндров" value={product.cylinders} />
                            </>
                        )}
                        <DetailRow label="Описание" value={product.description} />
                        <DetailRow label="Тех. характеристики" value={product.specs} />
                        {product.dimensions && <DetailRow label="Габариты и вес" value={product.dimensions} />}
                    </div>

                    <div className="mt-6 pt-5 border-t flex items-center justify-between">
                        <p className="text-xs text-gray-400">ID: {product.id}</p>
                        <ShareButton productId={product.id} shareSlug={product.shareSlug} />
                    </div>
                </div>
            </div>
        </div>
    );
}
