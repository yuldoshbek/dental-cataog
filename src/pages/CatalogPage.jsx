/**
 * src/pages/CatalogPage.jsx
 * Главный каталог для менеджера.
 * Desktop: sidebar + grid. Mobile: sticky header + category pills + grid.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Info, X } from 'lucide-react';
import {
  Stethoscope, Wind, Thermometer, Activity,
  ScanFace, Camera, Monitor, Zap, Package
} from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import CategorySummary from '../components/CategorySummary.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Modal from '../components/Modal.jsx';
import { categoriesApi } from '../api/index.js';
import { useProducts } from '../hooks/useProducts.js';

// Иконки для мобильных пиллов категорий
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

export default function CatalogPage() {
  const [activeCategory, setActiveCategory] = useState('units');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState([]);
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

  const { products, loading } = useProducts({
    category: activeCategory,
    search: searchQuery || undefined,
    active: '1',
  });

  const activeCategoryData = categories.find(c => c.id === activeCategory);

  function handleCategoryChange(id) {
    setActiveCategory(id);
    setSelectedProduct(null);
    setSearchQuery('');
  }

  return (
    <div className="flex h-screen bg-slate-50 text-gray-800">

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
        <header className="bg-white border-b border-gray-200 shrink-0 z-10">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-3">

            {/* Мобильный логотип */}
            <div className="sm:hidden flex items-center gap-2 shrink-0">
              <span className="text-xl">🦷</span>
              <span className="font-bold text-blue-800 text-base">Каталог</span>
            </div>

            {/* Desktop заголовок категории */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <h1 className="text-lg font-semibold text-gray-900">
                {activeCategoryData?.name ?? 'Каталог'}
              </h1>
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
                {loading ? '…' : `${products.length} моделей`}
              </span>
            </div>

            {/* Поиск */}
            <div className="relative flex-1 sm:max-w-xs ml-auto sm:ml-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
              <input
                ref={searchRef}
                type="search"
                placeholder="Поиск по бренду или модели..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Счётчик моделей — мобайл */}
            <span className="sm:hidden text-xs bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-full font-medium shrink-0">
              {loading ? '…' : products.length}
            </span>
          </div>

          {/* ── КАТЕГОРИИ (только mobile) ── */}
          {categories.length > 0 && (
            <div className="sm:hidden overflow-x-auto border-t border-gray-100">
              <div className="flex gap-2 px-4 py-2.5 w-max">
                {categories.map(cat => {
                  const isActive = activeCategory === cat.id;
                  const icon = ICON_MAP[cat.icon_name];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-95 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                      }`}
                    >
                      {icon && <span className={isActive ? 'opacity-80' : 'opacity-60'}>{icon}</span>}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* ── КОНТЕНТ ── */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 space-y-5">

            {/* Мобайл: заголовок активной категории */}
            {!searchQuery && (
              <div className="sm:hidden flex items-baseline gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  {activeCategoryData?.name ?? 'Каталог'}
                </h2>
              </div>
            )}

            {/* Шпаргалка */}
            {!searchQuery && summary.length > 0 && (
              <CategorySummary currentSummary={summary} />
            )}

            {/* Результаты поиска */}
            {searchQuery && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Search size={14} />
                <span>Результаты по «<span className="font-medium text-gray-800">{searchQuery}</span>»</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {loading ? '…' : `${products.length} шт.`}
                </span>
              </div>
            )}

            {/* Сетка товаров */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-[16/10] bg-slate-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-4 bg-slate-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                <Info size={40} className="mb-3 text-gray-200" />
                {searchQuery ? (
                  <>
                    <p className="font-semibold text-gray-600">Ничего не найдено</p>
                    <p className="text-sm text-gray-400 mt-1">Попробуйте другой запрос</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-sm text-blue-600 hover:underline"
                    >
                      Сбросить поиск
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-600">В этой категории пока нет оборудования</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Добавьте товары в{' '}
                      <a href="/admin" className="text-blue-500 hover:underline">Админ-панели</a>
                    </p>
                  </>
                )}
              </div>
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

        {selectedProduct && (
          <Modal product={selectedProduct} setSelectedProduct={setSelectedProduct} />
        )}
      </main>
    </div>
  );
}
