/**
 * src/pages/CatalogPage.jsx
 * Главный каталог для менеджера — Фаза 2 редизайн.
 * Desktop: sidebar + filter bar + grid.
 * Mobile: sticky header + category pills + filter bar + grid.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Info, X, Package, SlidersHorizontal } from 'lucide-react';
import useDebounce from '../hooks/useDebounce.js';
import {
    Stethoscope, Wind, Thermometer, Activity,
    ScanFace, Camera, Monitor, Zap
} from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import CategorySummary from '../components/CategorySummary.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Modal from '../components/Modal.jsx';
import FilterBar, { applyFilters } from '../components/FilterBar.jsx';
import { CatalogSkeleton } from '../components/ui/Skeleton.jsx';
import { categoriesApi } from '../api/index.js';
import { useProducts } from '../hooks/useProducts.js';

const ICON_MAP = {
    Stethoscope: <Stethoscope size={16} />,
    Wind:        <Wind size={16} />,
    Thermometer: <Thermometer size={16} />,
    Activity:    <Activity size={16} />,
    ScanFace:    <ScanFace size={16} />,
    Camera:      <Camera size={16} />,
    Monitor:     <Monitor size={16} />,
    Zap:         <Zap size={16} />,
};

const EMPTY_FILTERS = { countries: [], sortBy: 'default' };

export default function CatalogPage() {
    const [activeCategory, setActiveCategory]   = useState('units');
    const [searchQuery, setSearchQuery]         = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen]     = useState(true);
    const [categories, setCategories]           = useState([]);
    const [summary, setSummary]                 = useState([]);
    const [filters, setFilters]                 = useState(EMPTY_FILTERS);
    const searchRef = useRef(null);

    // Загрузка категорий
    useEffect(() => {
        categoriesApi.getAll()
            .then(setCategories)
            .catch(() => {});
    }, []);

    // Шпаргалка при смене категории
    useEffect(() => {
        setSummary([]);
        categoriesApi.getSummary(activeCategory)
            .then(setSummary)
            .catch(() => {});
    }, [activeCategory]);

    // Горячая клавиша "/" → фокус на поиск, Esc → сброс
    useEffect(() => {
        function handleKey(e) {
            const tag = document.activeElement?.tagName;
            if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (e.key === 'Escape' && searchQuery) {
                setSearchQuery('');
                searchRef.current?.blur();
            }
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [searchQuery]);

    // Сбрасываем фильтры при смене категории
    function handleCategoryChange(id) {
        setActiveCategory(id);
        setSelectedProduct(null);
        setSearchQuery('');
        setFilters(EMPTY_FILTERS);
    }

    // Debounce 300ms — API запрос только после паузы в наборе
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { products: rawProducts, loading } = useProducts({
        category: activeCategory,
        search: debouncedSearch || undefined,
        active: '1',
    });

    // Применяем клиентские фильтры поверх API-ответа
    const products = useMemo(
        () => applyFilters(rawProducts, filters),
        [rawProducts, filters]
    );

    const activeCategoryData = categories.find(c => c.id === activeCategory);
    const hasActiveFilters   = filters.countries.length > 0 || filters.sortBy !== 'default';

    return (
        <div className="flex h-screen bg-dental-bg text-gray-800">

            {/* ── SIDEBAR (только desktop) ── */}
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={handleCategoryChange}
                setSelectedProduct={setSelectedProduct}
                setSearchQuery={setSearchQuery}
            />

            <main className="flex-1 flex flex-col overflow-hidden min-w-0 relative">

                {/* ── HEADER ── */}
                <header className="bg-white border-b border-dental-border shrink-0 z-10">
                    <div className="px-4 sm:px-5 py-3 flex items-center gap-3">

                        {/* Мобильный логотип */}
                        <div className="sm:hidden flex items-center gap-2 shrink-0">
                            <span className="text-xl">🦷</span>
                            <span className="font-bold text-primary-700 text-sm">Каталог</span>
                        </div>

                        {/* Desktop: название категории + счётчик */}
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <h1 className="text-base font-semibold text-gray-900">
                                {activeCategoryData?.name ?? 'Каталог'}
                            </h1>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                {loading ? '…' : products.length}
                            </span>
                        </div>

                        {/* Поиск */}
                        <div className="relative flex-1 sm:max-w-sm">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                size={14}
                            />
                            <input
                                ref={searchRef}
                                type="search"
                                placeholder="Поиск... (нажмите /)"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all placeholder:text-gray-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Счётчик — мобайл */}
                        <span className="sm:hidden text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium shrink-0">
                            {loading ? '…' : products.length}
                        </span>
                    </div>

                    {/* ── КАТЕГОРИИ (только mobile) ── */}
                    {categories.length > 0 && (
                        <div className="sm:hidden overflow-x-auto border-t border-gray-100 scrollbar-hide">
                            <div className="flex gap-2 px-4 py-2.5 w-max">
                                {categories.map(cat => {
                                    const isActive = activeCategory === cat.id;
                                    const icon = ICON_MAP[cat.icon_name];
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategoryChange(cat.id)}
                                            className={[
                                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all active:scale-95',
                                                isActive
                                                    ? 'bg-primary-500 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                                            ].join(' ')}
                                        >
                                            {icon && (
                                                <span className={isActive ? 'opacity-90' : 'opacity-60'}>
                                                    {icon}
                                                </span>
                                            )}
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </header>

                {/* ── КОНТЕНТ ── */}
                <div className="flex-1 overflow-auto">
                    <div className="p-4 sm:p-5 space-y-3">

                        {/* Мобайл: заголовок категории */}
                        {!searchQuery && (
                            <div className="sm:hidden">
                                <h2 className="text-base font-bold text-gray-900">
                                    {activeCategoryData?.name ?? 'Каталог'}
                                </h2>
                            </div>
                        )}

                        {/* Шпаргалка */}
                        {!searchQuery && summary.length > 0 && (
                            <CategorySummary currentSummary={summary} />
                        )}

                        {/* ── FILTER BAR ── */}
                        {!loading && rawProducts.length > 0 && (
                            <FilterBar
                                products={rawProducts}
                                filters={filters}
                                onFiltersChange={setFilters}
                            />
                        )}

                        {/* Поиск: статус */}
                        {searchQuery && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 animate-fade-in">
                                <Search size={13} />
                                <span>По «<span className="font-semibold text-gray-800">{searchQuery}</span>»</span>
                                {!loading && (
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                        {products.length} шт.
                                    </span>
                                )}
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="ml-auto text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors"
                                >
                                    Сбросить
                                </button>
                            </div>
                        )}

                        {/* ── СЕТКА ТОВАРОВ ── */}
                        {loading ? (
                            <CatalogSkeleton count={6} />
                        ) : products.length === 0 ? (
                            <EmptyState
                                searchQuery={searchQuery}
                                hasActiveFilters={hasActiveFilters}
                                onResetSearch={() => setSearchQuery('')}
                                onResetFilters={() => setFilters(EMPTY_FILTERS)}
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {products.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        setSelectedProduct={setSelectedProduct}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Модал быстрого просмотра */}
                {selectedProduct && (
                    <Modal
                        product={selectedProduct}
                        setSelectedProduct={setSelectedProduct}
                    />
                )}
            </main>
        </div>
    );
}

/* ─── Пустое состояние ──────────────────────────────────────────── */
function EmptyState({ searchQuery, hasActiveFilters, onResetSearch, onResetFilters }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center animate-fade-in">
            {searchQuery ? (
                <>
                    <Search size={36} className="mb-3 text-gray-200" />
                    <p className="font-semibold text-gray-600">Ничего не найдено</p>
                    <p className="text-sm text-gray-400 mt-1">Попробуйте изменить запрос</p>
                    <button
                        onClick={onResetSearch}
                        className="mt-4 text-sm text-primary-500 hover:text-primary-700 font-medium transition-colors"
                    >
                        Сбросить поиск
                    </button>
                </>
            ) : hasActiveFilters ? (
                <>
                    <Info size={36} className="mb-3 text-gray-200" />
                    <p className="font-semibold text-gray-600">Нет товаров с такими фильтрами</p>
                    <p className="text-sm text-gray-400 mt-1">Попробуйте изменить условия фильтрации</p>
                    <button
                        onClick={onResetFilters}
                        className="mt-4 text-sm text-primary-500 hover:text-primary-700 font-medium transition-colors"
                    >
                        Сбросить фильтры
                    </button>
                </>
            ) : (
                <>
                    <Package size={36} className="mb-3 text-gray-200" />
                    <p className="font-semibold text-gray-600">Нет оборудования в этой категории</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Добавьте товары в{' '}
                        <a href="/admin" className="text-primary-500 hover:underline">Админ-панели</a>
                    </p>
                </>
            )}
        </div>
    );
}

