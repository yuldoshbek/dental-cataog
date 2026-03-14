/**
 * src/components/TouchGallery.jsx
 * Универсальная галерея изображений — Фаза 3.
 *
 * Возможности:
 * - Touch/swipe (мобильные)
 * - Keyboard navigation (← →, Escape)
 * - Fade-анимация при смене фото
 * - Lightbox (zoom) по клику
 * - Dot-индикаторы + миниатюры
 * - Lazy loading
 *
 * Props:
 *   images        Array<{ url, alt }>  - список изображений
 *   brand         string               - бренд (для alt fallback)
 *   model         string               - модель
 *   showThumbs    bool                 - показывать миниатюры (default: true)
 *   aspectRatio   string               - css class, default 'aspect-[4/3]'
 *   enableZoom    bool                 - lightbox по клику (default: true)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X, Maximize2 } from 'lucide-react';

export default function TouchGallery({
    images = [],
    brand = '',
    model = '',
    showThumbs = true,
    aspectRatio = 'aspect-[4/3]',
    enableZoom = true,
}) {
    const [active, setActive]       = useState(0);
    const [lightbox, setLightbox]   = useState(false);
    const [fadeKey, setFadeKey]     = useState(0);
    const touchStartX = useRef(0);
    const touchEndX   = useRef(0);

    const total = images.length;

    /* ── Навигация ──────────────────────────────────────────────── */
    const goTo = useCallback((i) => {
        const next = ((i % total) + total) % total;
        setActive(next);
        setFadeKey(k => k + 1);
    }, [total]);

    const prev = useCallback(() => goTo(active - 1), [active, goTo]);
    const next = useCallback(() => goTo(active + 1), [active, goTo]);

    /* ── Keyboard navigation ────────────────────────────────────── */
    useEffect(() => {
        if (total <= 1) return;
        function onKey(e) {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft')  prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape')     setLightbox(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [total, prev, next]);

    /* ── Touch / Swipe ──────────────────────────────────────────── */
    function onTouchStart(e) {
        touchStartX.current = e.targetTouches[0].clientX;
    }
    function onTouchEnd(e) {
        touchEndX.current = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            diff > 0 ? next() : prev();
        }
    }

    /* ── Пустое состояние ───────────────────────────────────────── */
    if (total === 0) {
        return (
            <div className={`w-full ${aspectRatio} bg-gradient-to-br from-primary-50 via-slate-50 to-blue-50 rounded-2xl flex flex-col items-center justify-center border border-primary-100`}>
                <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <span className="text-4xl">🦷</span>
                </div>
                <p className="font-semibold text-slate-600 text-sm">{brand}</p>
                <p className="text-slate-400 text-xs mt-1">{model}</p>
                <p className="text-slate-300 text-xs mt-3">Фото добавляются через Админку</p>
            </div>
        );
    }

    const current = images[active];

    return (
        <>
            <div className="space-y-3">
                {/* ── Основное фото ─────────────────────────────── */}
                <div
                    className={`relative ${aspectRatio} rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group`}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <img
                        key={fadeKey}
                        src={current.url}
                        alt={current.alt || `${brand} ${model}`}
                        loading="lazy"
                        className="w-full h-full object-cover animate-fade-in"
                    />

                    {/* Zoom hint overlay */}
                    {enableZoom && (
                        <div
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10"
                            onClick={() => setLightbox(true)}
                        >
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
                                <Maximize2 size={18} className="text-gray-700" />
                            </div>
                        </div>
                    )}

                    {/* Стрелки */}
                    {total > 1 && (
                        <>
                            <button
                                onClick={e => { e.stopPropagation(); prev(); }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 backdrop-blur rounded-full p-2 shadow-md hover:bg-white hover:scale-105 transition-all duration-200 disabled:opacity-30"
                                disabled={active === 0}
                            >
                                <ChevronLeft size={18} className="text-gray-700" />
                            </button>
                            <button
                                onClick={e => { e.stopPropagation(); next(); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 backdrop-blur rounded-full p-2 shadow-md hover:bg-white hover:scale-105 transition-all duration-200 disabled:opacity-30"
                                disabled={active === total - 1}
                            >
                                <ChevronRight size={18} className="text-gray-700" />
                            </button>

                            {/* Dots */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={e => { e.stopPropagation(); goTo(i); }}
                                        className={`rounded-full transition-all duration-300 ${
                                            i === active
                                                ? 'w-5 h-2 bg-white shadow-sm'
                                                : 'w-2 h-2 bg-white/55 hover:bg-white/80'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Счётчик */}
                    {total > 1 && (
                        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
                            {active + 1} / {total}
                        </div>
                    )}
                </div>

                {/* ── Миниатюры ─────────────────────────────────── */}
                {showThumbs && total > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                className={[
                                    'shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200',
                                    i === active
                                        ? 'border-primary-500 shadow-sm scale-105'
                                        : 'border-transparent opacity-50 hover:opacity-80 hover:border-gray-200',
                                ].join(' ')}
                            >
                                <img
                                    src={img.url}
                                    alt=""
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Lightbox ──────────────────────────────────────── */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setLightbox(false)}
                    onTouchStart={onTouchStart}
                    onTouchEnd={e => {
                        touchEndX.current = e.changedTouches[0].clientX;
                        const diff = touchStartX.current - touchEndX.current;
                        if (Math.abs(diff) > 50) {
                            diff > 0 ? next() : prev();
                        }
                    }}
                >
                    {/* Закрыть */}
                    <button
                        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors z-10"
                        onClick={() => setLightbox(false)}
                    >
                        <X size={20} />
                    </button>

                    {/* Стрелки */}
                    {total > 1 && (
                        <>
                            <button
                                onClick={e => { e.stopPropagation(); prev(); }}
                                disabled={active === 0}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-20 z-10"
                            >
                                <ChevronLeft size={22} />
                            </button>
                            <button
                                onClick={e => { e.stopPropagation(); next(); }}
                                disabled={active === total - 1}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-20 z-10"
                            >
                                <ChevronRight size={22} />
                            </button>
                        </>
                    )}

                    {/* Полное изображение */}
                    <img
                        key={`lb-${fadeKey}`}
                        src={current.url}
                        alt={current.alt}
                        className="max-w-full max-h-full object-contain rounded-xl animate-scale-in shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />

                    {/* Счётчик в lightbox */}
                    {total > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
                            {active + 1} / {total}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
