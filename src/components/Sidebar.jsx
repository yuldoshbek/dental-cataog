/**
 * src/components/Sidebar.jsx
 * Боковая навигация по категориям (desktop) — Фаза 2: primary-* цвета.
 */

import React from 'react';
import { Menu, ChevronRight } from 'lucide-react';
import {
    Stethoscope, Wind, Thermometer, Activity,
    ScanFace, Camera, Monitor, Zap, Package
} from 'lucide-react';

const ICON_MAP = {
    Stethoscope,
    Wind,
    Thermometer,
    Activity,
    ScanFace,
    Camera,
    Monitor,
    Zap,
};

export default function Sidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    categories,
    activeCategory,
    setActiveCategory,
    setSelectedProduct,
    setSearchQuery,
}) {
    return (
        <aside
            className={`${
                isSidebarOpen ? 'w-60' : 'w-16'
            } transition-all duration-300 bg-white border-r border-dental-border flex-col hidden sm:flex shrink-0`}
        >
            {/* Лого + кнопка сворачивания */}
            <div className={`h-14 border-b border-gray-100 flex items-center ${isSidebarOpen ? 'px-4 justify-between' : 'justify-center'}`}>
                {isSidebarOpen && (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xl shrink-0">🦷</span>
                        <span className="font-bold text-primary-800 text-sm truncate">База знаний</span>
                    </div>
                )}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    title={isSidebarOpen ? 'Свернуть' : 'Развернуть'}
                >
                    <Menu size={18} />
                </button>
            </div>

            {/* Навигация */}
            <nav className="flex-1 overflow-y-auto py-2 px-2">
                {categories.map(category => {
                    const isActive   = activeCategory === category.id;
                    const IconComp   = ICON_MAP[category.icon_name] ?? Package;

                    return (
                        <button
                            key={category.id}
                            onClick={() => {
                                setActiveCategory(category.id);
                                setSelectedProduct(null);
                                setSearchQuery('');
                            }}
                            title={!isSidebarOpen ? category.name : undefined}
                            className={[
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all text-left group',
                                isActive
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                            ].join(' ')}
                        >
                            <span className={`shrink-0 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                <IconComp size={18} />
                            </span>
                            {isSidebarOpen && (
                                <span className={`text-sm truncate flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {category.name}
                                </span>
                            )}
                            {isSidebarOpen && isActive && (
                                <ChevronRight size={14} className="text-primary-400 shrink-0" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Футер — ссылка на админку */}
            {isSidebarOpen && (
                <div className="px-4 py-3 border-t border-gray-100">
                    <a
                        href="/admin"
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary-600 transition-colors"
                    >
                        <span>⚙️</span>
                        <span>Админ-панель</span>
                    </a>
                </div>
            )}
        </aside>
    );
}
