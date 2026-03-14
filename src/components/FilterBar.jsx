/**
 * src/components/FilterBar.jsx
 * Панель фильтров и сортировки каталога.
 * Desktop: горизонтальная полоса под header.
 * Mobile: кнопка "Фильтры" → bottom-sheet drawer.
 */

import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, X, ChevronDown, Check, ArrowUpDown } from 'lucide-react';
import Badge from './ui/Badge.jsx';

const SORT_OPTIONS = [
    { value: 'default',    label: 'По умолчанию' },
    { value: 'name_asc',   label: 'По названию А → Я' },
    { value: 'price_asc',  label: 'Цена: сначала дешевле' },
    { value: 'price_desc', label: 'Цена: сначала дороже' },
];

/* ─── Утилита: извлечь уникальные страны из списка продуктов ─── */
export function extractCountries(products) {
    const set = new Set();
    products.forEach(p => { if (p.country) set.add(p.country); });
    return [...set].sort();
}

/* ─── Утилита: применить фильтры и сортировку ──────────────────── */
export function applyFilters(products, { countries, sortBy }) {
    let result = [...products];

    if (countries.length > 0) {
        result = result.filter(p => countries.includes(p.country));
    }

    switch (sortBy) {
        case 'name_asc':
            result.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, 'ru'));
            break;
        case 'price_asc':
            result.sort((a, b) => {
                const pa = parsePrice(a.price_min ?? a.price_label ?? a.price);
                const pb = parsePrice(b.price_min ?? b.price_label ?? b.price);
                return pa - pb;
            });
            break;
        case 'price_desc':
            result.sort((a, b) => {
                const pa = parsePrice(a.price_min ?? a.price_label ?? a.price);
                const pb = parsePrice(b.price_min ?? b.price_label ?? b.price);
                return pb - pa;
            });
            break;
        default:
            break;
    }

    return result;
}

function parsePrice(val) {
    if (!val) return 0;
    return Number(String(val).replace(/\D/g, '')) || 0;
}

/* ─── Основной компонент ────────────────────────────────────────── */
export default function FilterBar({ products, filters, onFiltersChange }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [sortOpen, setSortOpen]     = useState(false);

    const countries   = useMemo(() => extractCountries(products), [products]);
    const activeCount = filters.countries.length + (filters.sortBy !== 'default' ? 1 : 0);
    const sortLabel   = SORT_OPTIONS.find(o => o.value === filters.sortBy)?.label ?? 'По умолчанию';

    function toggleCountry(country) {
        const next = filters.countries.includes(country)
            ? filters.countries.filter(c => c !== country)
            : [...filters.countries, country];
        onFiltersChange({ ...filters, countries: next });
    }

    function setSort(value) {
        onFiltersChange({ ...filters, sortBy: value });
        setSortOpen(false);
    }

    function reset() {
        onFiltersChange({ countries: [], sortBy: 'default' });
        setDrawerOpen(false);
    }

    return (
        <>
            {/* ── Desktop & Mobile: Filter bar ─────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">

                {/* Кнопка "Фильтры" — всегда видна */}
                <button
                    onClick={() => setDrawerOpen(true)}
                    className={[
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all duration-200',
                        activeCount > 0
                            ? 'bg-primary-50 border-primary-200 text-primary-600'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                    ].join(' ')}
                >
                    <SlidersHorizontal size={14} />
                    Фильтры
                    {activeCount > 0 && (
                        <span className="bg-primary-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                            {activeCount}
                        </span>
                    )}
                </button>

                {/* Sort dropdown — Desktop */}
                <div className="hidden sm:block relative">
                    <button
                        onClick={() => setSortOpen(v => !v)}
                        className={[
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all duration-200',
                            filters.sortBy !== 'default'
                                ? 'bg-primary-50 border-primary-200 text-primary-600'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                        ].join(' ')}
                    >
                        <ArrowUpDown size={13} />
                        {filters.sortBy !== 'default' ? sortLabel : 'Сортировка'}
                        <ChevronDown size={12} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {sortOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                            <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-modal z-20 py-1 min-w-[220px] animate-scale-in">
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSort(opt.value)}
                                        className={[
                                            'w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left',
                                            filters.sortBy === opt.value
                                                ? 'text-primary-600 bg-primary-50'
                                                : 'text-gray-700 hover:bg-gray-50',
                                        ].join(' ')}
                                    >
                                        <Check
                                            size={14}
                                            className={filters.sortBy === opt.value ? 'opacity-100 text-primary-500' : 'opacity-0'}
                                        />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Активные фильтры — chips */}
                {filters.countries.map(c => (
                    <button
                        key={c}
                        onClick={() => toggleCountry(c)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                    >
                        {c}
                        <X size={11} />
                    </button>
                ))}

                {/* Сбросить всё */}
                {activeCount > 0 && (
                    <button
                        onClick={reset}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                    >
                        Сбросить всё
                    </button>
                )}
            </div>

            {/* ── Drawer (Bottom Sheet) ────────────────────────── */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center"
                    onClick={e => { if (e.target === e.currentTarget) setDrawerOpen(false); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

                    {/* Panel */}
                    <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-modal animate-slide-up sm:animate-scale-in flex flex-col max-h-[85vh]">

                        {/* Drag handle — mobile */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-gray-200" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 text-base">Фильтры и сортировка</h3>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

                            {/* Сортировка */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                                    Сортировка
                                </p>
                                <div className="flex flex-col gap-1">
                                    {SORT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => onFiltersChange({ ...filters, sortBy: opt.value })}
                                            className={[
                                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                                                filters.sortBy === opt.value
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-gray-700 hover:bg-gray-50',
                                            ].join(' ')}
                                        >
                                            <div className={[
                                                'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                                                filters.sortBy === opt.value
                                                    ? 'border-primary-500 bg-primary-500'
                                                    : 'border-gray-300',
                                            ].join(' ')}>
                                                {filters.sortBy === opt.value && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                )}
                                            </div>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Страна */}
                            {countries.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                                        Страна производства
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {countries.map(c => {
                                            const active = filters.countries.includes(c);
                                            return (
                                                <button
                                                    key={c}
                                                    onClick={() => toggleCountry(c)}
                                                    className={[
                                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all',
                                                        active
                                                            ? 'bg-primary-500 border-primary-500 text-white'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300',
                                                    ].join(' ')}
                                                >
                                                    {active && <Check size={13} />}
                                                    {c}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={reset}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Сбросить
                            </button>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                            >
                                Применить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
