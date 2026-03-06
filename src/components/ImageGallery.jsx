/**
 * src/components/ImageGallery.jsx
 * Слайдер изображений с точками-индикаторами.
 * Если изображений нет — показывает заглушку.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { getImageUrl } from '../api/index.js';

export default function ImageGallery({ images = [], className = 'h-64' }) {
    const [current, setCurrent] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className={`${className} bg-gray-100 flex flex-col items-center justify-center text-gray-300`}>
                <ImageOff size={48} />
                <p className="text-sm mt-2">Фото не добавлено</p>
            </div>
        );
    }

    const prev = () => setCurrent(i => (i === 0 ? images.length - 1 : i - 1));
    const next = () => setCurrent(i => (i === images.length - 1 ? 0 : i + 1));

    return (
        <div className={`relative ${className} overflow-hidden select-none bg-gray-100`}>
            {/* Изображения */}
            <div className="relative w-full h-full">
                {images.map((img, idx) => (
                    <div
                        key={img.id}
                        className={`absolute inset-0 transition-opacity duration-300 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <img
                            src={getImageUrl(img.filename)}
                            alt={`Фото ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading={idx === 0 ? 'eager' : 'lazy'}
                        />
                    </div>
                ))}
            </div>

            {/* Навигация (только если больше 1 фото) */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors z-10"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors z-10"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {/* Точки-индикаторы */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrent(idx)}
                                className={`rounded-full transition-all ${idx === current
                                        ? 'w-5 h-2 bg-white'
                                        : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Счётчик */}
            {images.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full z-10">
                    {current + 1} / {images.length}
                </div>
            )}
        </div>
    );
}
