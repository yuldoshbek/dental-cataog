/**
 * src/pages/CatalogPage.jsx
 * Главный каталог для менеджера (рефакторированная версия App.jsx).
 * Данные загружаются из API вместо статических файлов.
 */

import React, { useState, useEffect } from 'react';
import { Search, Info } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import CategorySummary from '../components/CategorySummary.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Modal from '../components/Modal.jsx';
import { categoriesApi } from '../api/index.js';
import { useProducts } from '../hooks/useProducts.js';

export default function CatalogPage() {
    const [activeCategory, setActiveCategory] = useState('units');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [categories, setCategories] = useState([]);
    const [summary, setSummary] = useState([]);

    // Загрузка категорий при монтировании
    useEffect(() => {
        categoriesApi.getAll()
            .then(setCategories)
            .catch(() => { });
    }, []);

    // Загрузка шпаргалки при смене категории
    useEffect(() => {
        setSummary([]);
        categoriesApi.getSummary(activeCategory)
            .then(setSummary)
            .catch(() => { });
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
        <div className="flex h-screen bg-gray-100 text-gray-800">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={handleCategoryChange}
                setSelectedProduct={setSelectedProduct}
                setSearchQuery={setSearchQuery}
            />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-semibold">{activeCategoryData?.name ?? 'Каталог'}</span>
                        <span className="text-sm bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                            {loading ? '...' : `${products.length} моделей`}
                        </span>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Поиск по бренду/модели..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </header>

                {/* Scrollable content */}
                <div className="flex-1 overflow-auto p-6">
                    {!searchQuery && summary.length > 0 && (
                        <CategorySummary currentSummary={summary} />
                    )}

                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                            Каталог моделей
                        </h2>

                        {loading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                                <Info size={48} className="mb-3 text-gray-300" />
                                <p className="font-medium">В этой категории пока нет оборудования</p>
                                <p className="text-sm mt-1">Добавьте товары в <a href="/admin" className="text-blue-500 underline">Админ-панели</a></p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
